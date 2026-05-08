import ReactMarkdown from "react-markdown";
import type { NlpParsed } from "../api";

interface MessageBubbleProps {
  role: "user" | "bot";
  text: string;
  parsed?: NlpParsed;
}

export default function MessageBubble({
  role,
  text,
  parsed,
}: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div
      style={{
        padding: "8px 24px",
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
      }}
    >
      <div
        style={{
          maxWidth: 680,
          width: isUser ? "auto" : "100%",
        }}
      >
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
            <div
              className="prose-content"
              style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.75 }}
            >
              <ReactMarkdown>{text}</ReactMarkdown>
            </div>
            {parsed && <DebugBar parsed={parsed} />}
          </div>
        )}
      </div>
      <style>{`
        .prose-content p { margin-bottom: 8px; }
        .prose-content p:last-child { margin-bottom: 0; }
        .prose-content code {
          font-family: var(--font-mono); font-size: 13px;
          background: var(--bg-secondary); color: var(--accent);
          padding: 1px 6px; border-radius: 4px;
        }
        .prose-content pre {
          background: var(--bg-secondary); border: 1px solid var(--border);
          border-radius: 8px; padding: 12px 16px;
          overflow-x: auto; margin: 8px 0;
        }
        .prose-content ul, .prose-content ol { padding-left: 20px; margin-bottom: 8px; }
        .prose-content li { margin-bottom: 4px; }
        .prose-content strong { font-weight: 500; }
      `}</style>
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
