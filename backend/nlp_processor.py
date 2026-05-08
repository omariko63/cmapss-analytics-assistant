from __future__ import annotations
import os
import re

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

try:
    import nltk
    from nltk import pos_tag
    from nltk.corpus import stopwords
    from nltk.stem import WordNetLemmatizer
    from nltk.tokenize import word_tokenize

    NLTK_AVAILABLE = True
except Exception:
    nltk = None
    pos_tag = None
    stopwords = None
    WordNetLemmatizer = None
    word_tokenize = None
    NLTK_AVAILABLE = False

if NLTK_AVAILABLE:
    for pkg in ("punkt", "stopwords", "wordnet", "averaged_perceptron_tagger", "punkt_tab"):
        try:
            nltk.download(pkg, quiet=True)
        except Exception:
            pass


def _get_wordnet_pos(treebank_tag: str) -> str:
    """Convert Treebank POS tag to WordNet POS tag for better lemmatization"""
    from nltk.corpus import wordnet

    if treebank_tag.startswith("J"):
        return wordnet.ADJ
    elif treebank_tag.startswith("V"):
        return wordnet.VERB
    elif treebank_tag.startswith("N"):
        return wordnet.NOUN
    elif treebank_tag.startswith("R"):
        return wordnet.ADV
    else:
        return wordnet.NOUN  # Default to noun if unknown


LEMMATIZER = WordNetLemmatizer() if NLTK_AVAILABLE else None
STOP_WORDS = (
    set(stopwords.words("english")) - {"which", "what", "how", "when", "no"}
    if NLTK_AVAILABLE
    else {
        "the",
        "a",
        "an",
        "is",
        "are",
        "and",
        "or",
        "to",
        "of",
        "in",
        "for",
        "on",
        "me",
        "tell",
        "about",
    }
)

# Intent keyword maps
INTENT_KEYWORDS = {
    "engine_detail": ["engine", "unit", "motor", "turbine"],
    "worst_engines": ["worst", "early", "short", "fail", "least"],
    "fleet_summary": ["fleet", "overall", "all", "summary", "dataset", "total"],
    "sensor_ranking": [
        "sensor",
        "feature",
        "signal",
        "predict",
        "informative",
        "important",
    ],
}

SPLIT_KEYWORDS = {
    "test": ["test", "remaining", "rul", "left", "future"],
    "train": ["train", "history", "full", "failure", "failed"],
}

SYSTEM_PROMPT = """You are an NLP assistant for a NASA CMAPSS backend.

Your job is to:
- interpret user questions about CMAPSS datasets, engines, sensors, degradation, and RUL
- use the parsed NLP output provided to you
- answer concisely and technically
- avoid fabricating measurements or claiming backend facts you were not given

If structured backend context is provided, rely on it.
If no structured backend context is provided, answer only at a general interpretation level."""


def process_prompt(user_message: str) -> dict:
    """
    Full NLP pipeline:
    1. Lowercase + tokenize
    2. Remove stopwords
    3. Lemmatize
    4. Extract engine IDs
    5. Classify intent
    6. Determine dataset split
    """

    raw = user_message.strip()

    # Lowercasing and tokenization
    lowered = raw.lower()
    if NLTK_AVAILABLE and word_tokenize is not None:
        tokens = word_tokenize(lowered)
    else:
        tokens = re.findall(r"[a-zA-Z0-9_]+", lowered)

    # Remove stopwords
    filtered = [t for t in tokens if t.isalpha() and t not in STOP_WORDS]

    # Lemmatize with POS tagging
    if NLTK_AVAILABLE and pos_tag is not None and LEMMATIZER is not None:
        tagged = pos_tag(filtered)
        lemmas = [LEMMATIZER.lemmatize(word, _get_wordnet_pos(tag)) for word, tag in tagged]
    else:
        lemmas = filtered[:]

    # Extract engine IDs using regex on original message
    unit_ids = []
    for pattern in [
        r"engine\s*#?\s*(\d+)",
        r"unit\s*#?\s*(\d+)",
        r"motor\s*#?\s*(\d+)",
    ]:
        for match in re.findall(pattern, lowered):
            unit_ids.append(int(match))

    unit_ids = sorted(set(unit_ids))  # Remove duplicates and sort

    dataset_ids = sorted({match.upper() for match in re.findall(r"\bfd00[1-4]\b", lowered, flags=re.I)})

    # Classify intent by matching lemmas against keyword sets
    intent = "general"
    best_score = 0
    for intent_label, keywords in INTENT_KEYWORDS.items():
        score = sum(1 for lemma in lemmas if lemma in keywords)
        if score > best_score:
            best_score = score
            intent = intent_label

    # Engine IDs found -> always override to engine_detail
    if unit_ids and intent == "general":
        intent = "engine_detail"

    # Determine dataset split
    split = "train"  # Default to train
    for token in tokens:
        if token in SPLIT_KEYWORDS["test"]:
            split = "test"
            break

    return {
        "original": raw,
        "tokens": tokens,
        "filtered": filtered,
        "lemmas": lemmas,
        "unit_ids": unit_ids,
        "dataset_ids": dataset_ids,
        "intent": intent,
        "split": split,
    }


class LLMProcessor:
    """Thin Groq-backed LLM wrapper for NLP interpretation."""

    def __init__(self) -> None:
        self.model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        self.api_key = os.getenv("GROQ_API_KEY", "").strip()
        self.client = None
        if self.api_key:
            self.client = OpenAI(
                api_key=self.api_key,
                base_url="https://api.groq.com/openai/v1",
            )

    @property
    def available(self) -> bool:
        return self.client is not None

    def build_prompt(self, user_message: str, parsed: dict, context: str | None = None) -> str:
        prompt_parts = [
            f"User message: {user_message}",
            f"Parsed NLP output: {parsed}",
        ]
        if context:
            prompt_parts.append(f"Structured backend context: {context}")
        prompt_parts.append(
            "Respond with a concise answer. If context is insufficient for exact facts, say so clearly."
        )
        return "\n\n".join(prompt_parts)

    def generate(self, user_message: str, parsed: dict, context: str | None = None) -> str:
        if not self.client:
            raise RuntimeError("GROQ_API_KEY is not configured.")

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": self.build_prompt(user_message=user_message, parsed=parsed, context=context),
                },
            ],
            temperature=0.2,
            max_tokens=700,
        )
        return response.choices[0].message.content or ""


def process_and_generate(user_message: str, context: str | None = None) -> dict:
    parsed = process_prompt(user_message)
    llm = LLMProcessor()
    answer = None
    if llm.available:
        answer = llm.generate(user_message=user_message, parsed=parsed, context=context)

    return {
        "parsed": parsed,
        "llm_available": llm.available,
        "answer": answer,
    }


# Simple test cases to verify the NLP processing logic
# if __name__ == "__main__":
#     test_queries = [
#         "Tell me about engine 12 failure metrics",
#         "What is the RUL for engine 77 in the test set?",
#         "Which engines failed earliest?",
#         "Give me a fleet summary",
#         "Which sensors predict failure best?",
#         "Compare engine 5 and engine 50",
#     ]

#     for q in test_queries:
#         result = process_prompt(q)
#         print(f"Q: {q}")
#         print(f"  tokens:   {result['tokens']}")
#         print(f"  filtered: {result['filtered']}")
#         print(f"  lemmas:   {result['lemmas']}")
#         print(f"  intent:   {result['intent']}")
#         print(f"  unit_ids: {result['unit_ids']}")
#         print(f"  split:    {result['split']}")
#         print()
