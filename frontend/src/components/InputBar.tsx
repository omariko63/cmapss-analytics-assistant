import { useRef, useState } from "react";

interface InputBarProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

export default function InputBar({ onSend, disabled }: InputBarProps) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const msg = value.trim();
    if (!msg || disabled) return;
    setValue("");
    if (ref.current) {
      ref.current.style.height = "auto";
    }
    onSend(msg);
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  }

  return (
    <div
      style={{
        padding: "16px 24px 20px",
        background: "var(--bg)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          background: "var(--input-bg)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          display: "flex",
          alignItems: "flex-end",
          gap: "8px",
          padding: "10px 12px",
          boxShadow: "var(--shadow)",
          transition: "border-color 0.15s",
        }}
        onFocusCapture={(e) =>
          (e.currentTarget.style.borderColor = "var(--accent)")
        }
        onBlurCapture={(e) =>
          (e.currentTarget.style.borderColor = "var(--border)")
        }
      >
        <textarea
          ref={ref}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKey}
          disabled={disabled}
          placeholder="Ask about an engine, sensor, or fleet health..."
          rows={1}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--text)",
            fontSize: "14px",
            lineHeight: 1.6,
            resize: "none",
            minHeight: "24px",
            maxHeight: "160px",
            padding: "0",
          }}
        />
        <button
          onClick={submit}
          disabled={disabled || !value.trim()}
          style={{
            width: 32,
            height: 32,
            borderRadius: "8px",
            border: "none",
            background:
              value.trim() && !disabled
                ? "var(--accent)"
                : "var(--bg-secondary)",
            color: value.trim() && !disabled ? "#fff" : "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "all 0.15s",
            cursor: value.trim() && !disabled ? "pointer" : "default",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </button>
      </div>
      <p
        style={{
          textAlign: "center",
          fontSize: "11px",
          color: "var(--text-muted)",
          marginTop: "8px",
          fontFamily: "var(--font-mono)",
        }}
      >
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
