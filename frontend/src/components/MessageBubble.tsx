import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { NlpParsed } from "../api";

interface MessageBubbleProps {
  role: "user" | "bot";
  text: string;
  parsed?: NlpParsed;
  animate?: boolean;
}

// Converts plain prose into readable structured text
function formatBotText(text: string): string {
  let out = text.trim();

  // Turn "1. sentence. 2. sentence." inline numbering into real newlines
  out = out.replace(/(\d+)\.\s+/g, "\n\n**$1.** ");

  // Turn transition words into paragraph breaks
  out = out.replace(
    /\.\s+(However|Therefore|Additionally|Furthermore|Moreover|In addition|As a result|For example|Note that|These|This|The top|The most|Overall)/g,
    ".\n\n$1",
  );

  // Turn sentences ending with a colon into bold headers
  out = out.replace(/([A-Z][^.!?]{10,60}):\s+/g, "\n\n**$1:**\n\n");

  // Break long comma-separated lists into bullet points
  // e.g. "are sensor_11, sensor_4, sensor_12, sensor_7, and sensor_15, with scores of..."
  out = out.replace(
    /(are|include|:)\s+((?:[a-zA-Z0-9_]+(?:,\s*|\s+and\s+)){3,})/g,
    (_, prefix, list) => {
      const items = list
        .split(/,\s*|\s+and\s+/)
        .map((s: string) => s.trim())
        .filter(Boolean);
      return `${prefix}\n\n${items.map((i: string) => `- ${i}`).join("\n")}\n\n`;
    },
  );

  // Collapse 3+ newlines
  out = out.replace(/\n{3,}/g, "\n\n");

  return out.trim();
}

interface MessageBubbleProps {
  role: "user" | "bot";
  text: string;
  parsed?: NlpParsed;
  animate?: boolean;
}

export default function MessageBubble({
  role,
  text,
  parsed,
  animate = false,
}: MessageBubbleProps) {
  const isUser = role === "user";
  const shouldAnimate = animate && !isUser;

  const [displayed, setDisplayed] = useState(() => (shouldAnimate ? "" : text));
  const [done, setDone] = useState(() => !shouldAnimate);
  const frameRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!shouldAnimate) return;

    const words = text.split(" ");
    let index = 0;
    let cancelled = false;

    const step = () => {
      if (cancelled) return;
      index += 1;
      setDisplayed(words.slice(0, index).join(" "));
      if (index < words.length) {
        const word = words[index - 1];
        const delay = /[.!?]$/.test(word) ? 60 : /[,;:]$/.test(word) ? 30 : 18;
        frameRef.current = setTimeout(step, delay);
      } else {
        setDone(true);
      }
    };

    frameRef.current = setTimeout(step, 80);
    return () => {
      cancelled = true;
      if (frameRef.current) clearTimeout(frameRef.current);
    };
  }, [shouldAnimate, text]);
  const formattedText = isUser ? text : formatBotText(displayed);

  return (
    <div
      style={{
        padding: "8px 24px",
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
      }}
    >
      <div style={{ maxWidth: 680, width: isUser ? "auto" : "100%" }}>
        {isUser ? (
          <div
            style={{
              background: "var(--user-bg)",
              color: "var(--user-text)",
              padding: "10px 16px",
              borderRadius: "18px 18px 4px 18px",
              fontSize: 14,
              lineHeight: 1.6,
              display: "inline-block",
              maxWidth: 480,
            }}
          >
            {text}
          </div>
        ) : (
          <div>
            <style>{`
              .md p { margin: 0 0 12px; font-size: 15px; line-height: 1.8; color: var(--text); }
              .md p:last-child { margin-bottom: 0; }
              .md ul { padding-left: 20px; margin: 0 0 12px; }
              .md ol { padding-left: 20px; margin: 0 0 12px; }
              .md li { margin-bottom: 6px; font-size: 15px; line-height: 1.7; color: var(--text); }
              .md strong { font-weight: 500; color: var(--text); }
              .md em { font-style: italic; color: var(--text-muted); }
              .md code {
                font-family: var(--font-mono);
                font-size: 12px;
                background: var(--bg-secondary);
                color: var(--accent);
                padding: 2px 6px;
                border-radius: 4px;
              }
              .md pre {
                background: var(--bg-secondary);
                border: 1px solid var(--border);
                border-radius: 8px;
                padding: 12px 16px;
                overflow-x: auto;
                margin: 12px 0;
              }
              .md pre code { background: none; padding: 0; color: var(--text); font-size: 13px; }
              .md h1, .md h2, .md h3 { font-weight: 500; color: var(--text); margin: 16px 0 6px; }
              .md h1 { font-size: 17px; }
              .md h2 { font-size: 15px; }
              .md h3 { font-size: 14px; }
              .md blockquote {
                border-left: 3px solid var(--border);
                padding-left: 14px;
                margin: 12px 0;
                color: var(--text-muted);
              }
              .md table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 12px 0; }
              .md th, .md td { padding: 8px 12px; border: 1px solid var(--border); text-align: left; }
              .md th { background: var(--bg-secondary); font-weight: 500; }
              .cursor {
                display: inline-block;
                width: 2px;
                height: 1em;
                background: var(--accent);
                margin-left: 2px;
                vertical-align: text-bottom;
                animation: blink-cursor 0.7s ease infinite;
              }
              @keyframes blink-cursor { 0%,100%{opacity:1} 50%{opacity:0} }
            `}</style>
            <div className="md">
              <ReactMarkdown>{formattedText}</ReactMarkdown>
              {!done && <span className="cursor" />}
            </div>
            {done && parsed && <DebugBar parsed={parsed} />}
          </div>
        )}
      </div>
    </div>
  );
}

function DebugBar({ parsed }: { parsed: NlpParsed }) {
  return (
    <div
      style={{
        marginTop: 10,
        padding: "7px 12px",
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        display: "flex",
        gap: 16,
        flexWrap: "wrap",
        fontSize: 11,
        fontFamily: "var(--font-mono)",
        color: "var(--text-muted)",
      }}
    >
      <span>
        intent: <b style={{ color: "var(--accent)" }}>{parsed.intent}</b>
      </span>
      <span>
        units:{" "}
        <b style={{ color: "var(--accent)" }}>
          {parsed.unit_ids.length ? parsed.unit_ids.join(", ") : "—"}
        </b>
      </span>
      <span>
        datasets:{" "}
        <b style={{ color: "var(--accent)" }}>
          {parsed.dataset_ids.length ? parsed.dataset_ids.join(", ") : "fd001"}
        </b>
      </span>
      <span>
        split: <b style={{ color: "var(--accent)" }}>{parsed.split}</b>
      </span>
      <span>
        lemmas:{" "}
        <b style={{ color: "var(--accent)" }}>
          {parsed.lemmas.slice(0, 6).join(" · ")}
        </b>
      </span>
    </div>
  );
}
