import { useEffect, useRef } from "react";
import type { Message } from "../App";
import MessageBubble from "./MessageBubble";

const SUGGESTIONS = [
  "Engine 12 failure metrics",
  "Which engines failed earliest?",
  "Fleet summary",
  "Which sensors predict failure?",
  "Engine 77 test RUL",
  "Compare engine 5 and engine 50",
];

interface ChatWindowProps {
  messages: Message[];
  loading: boolean;
  onSuggestion: (text: string) => void;
}

export default function ChatWindow({
  messages,
  loading,
  onSuggestion,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {messages.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 24px",
            gap: 32,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                fontSize: 22,
                fontWeight: 500,
                color: "var(--text)",
                marginBottom: 6,
                letterSpacing: "-0.02em",
              }}
            >
              NASA Engine Diagnostics
            </p>
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
              Query the CMAPSS turbofan engine dataset
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 8,
              width: "100%",
              maxWidth: 560,
            }}
          >
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => onSuggestion(s)}
                style={{
                  padding: "12px 14px",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  color: "var(--text)",
                  fontSize: 13,
                  textAlign: "left",
                  cursor: "pointer",
                  lineHeight: 1.4,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--bg-hover)";
                  e.currentTarget.style.borderColor = "var(--text-muted)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--bg-secondary)";
                  e.currentTarget.style.borderColor = "var(--border)";
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            padding: "24px 0",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {messages.map((m, i) => (
            <MessageBubble
              key={i}
              role={m.role}
              text={m.text}
              parsed={m.parsed}
            />
          ))}
          {loading && <ThinkingIndicator />}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div
      style={{
        padding: "16px 24px",
        display: "flex",
        gap: 6,
        alignItems: "center",
      }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--text-muted)",
            display: "inline-block",
            animation: `bounce 1.2s ease infinite ${i * 0.15}s`,
          }}
        />
      ))}
      <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0.7);opacity:0.4}40%{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}
