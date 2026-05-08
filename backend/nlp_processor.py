from __future__ import annotations
import re
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk import pos_tag

# Download required NLTK data
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


LEMMATIZER = WordNetLemmatizer()
STOP_WORDS = set(stopwords.words("english")) - {"which", "what", "how", "when", "no"}

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
    tokens = word_tokenize(lowered)

    # Remove stopwords
    filtered = [t for t in tokens if t.isalpha() and t not in STOP_WORDS]

    # Lemmatize with POS tagging
    tagged = pos_tag(filtered)
    lemmas = [LEMMATIZER.lemmatize(word, _get_wordnet_pos(tag)) for word, tag in tagged]

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
        "intent": intent,
        "split": split,
    }


if __name__ == "__main__":
    test_queries = [
        "Tell me about engine 12 failure metrics",
        "What is the RUL for engine 77 in the test set?",
        "Which engines failed earliest?",
        "Give me a fleet summary",
        "Which sensors predict failure best?",
        "Compare engine 5 and engine 50",
    ]

    for q in test_queries:
        result = process_prompt(q)
        print(f"Q: {q}")
        print(f"  tokens:   {result['tokens']}")
        print(f"  filtered: {result['filtered']}")
        print(f"  lemmas:   {result['lemmas']}")
        print(f"  intent:   {result['intent']}")
        print(f"  unit_ids: {result['unit_ids']}")
        print(f"  split:    {result['split']}")
        print()
