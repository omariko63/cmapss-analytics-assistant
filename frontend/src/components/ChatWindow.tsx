import { useEffect, useRef, useState } from "react";
import type { Message } from "../App";
import { fetchSuggestions, type Suggestion } from "../api";
import MessageBubble from "./MessageBubble";

const FALLBACK_SUGGESTIONS = [
  "Give me a fleet summary",
  "Which sensors predict failure best in FD001?",
  "Tell me about engine 25 in FD001",
  "Which datasets model fan degradation?",
  "Which sensors are stable in FD001?",
  "Which engines failed earliest in FD001?",
];

const CATEGORY_COLORS: Record<string, string> = {
  dataset: "#2563eb",
  sensor: "#059669",
  engine: "#d97706",
  comparison: "#7c3aed",
  fleet: "#0891b2",
  general: "#6b7280",
};

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
  const [starterSuggestions, setStarterSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const categories = ["sensor", "engine", "dataset", "comparison", "fleet", "general"];
    const picks: Suggestion[] = [];
    Promise.all(
      categories.map((cat) =>
        fetchSuggestions(cat, 3).catch(() => [] as Suggestion[])
      )
    ).then((results) => {
      for (const group of results) {
        for (const s of group) {
          if (picks.length < 6 && !picks.some((p) => p.text === s.text)) {
            picks.push(s);
          }
        }
      }
      if (picks.length > 0) setStarterSuggestions(picks);
    });
  }, []);

  const displaySuggestions =
    starterSuggestions.length > 0
      ? starterSuggestions
      : FALLBACK_SUGGESTIONS.map((t) => ({ text: t, category: "general" }));

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
            {displaySuggestions.map((s) => (
              <button
                key={s.text}
                onClick={() => onSuggestion(s.text)}
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
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  fontFamily: "var(--font-sans)",
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
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: CATEGORY_COLORS[s.category] ?? "var(--text-muted)",
                  }}
                >
                  {s.category}
                </span>
                {s.text}
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
          {messages.map((m, i) => {
            const isLastBot = m.role === "bot" && i === messages.length - 1;
            return (
              <MessageBubble
                key={i}
                role={m.role}
                text={m.text}
                parsed={m.parsed}
                animate={isLastBot}
              />
            );
          })}
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
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
