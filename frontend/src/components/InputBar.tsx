import { useEffect, useRef, useState } from "react";
import { fetchSuggestions, type Suggestion } from "../api";

interface InputBarProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  dataset: "Dataset",
  sensor: "Sensor",
  engine: "Engine",
  comparison: "Compare",
  fleet: "Fleet",
  general: "General",
};

export default function InputBar({ onSend, disabled }: InputBarProps) {
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value.trim())
        .then((results) => {
          setSuggestions(results);
          setSelectedIndex(-1);
          setShowDropdown(results.length > 0);
        })
        .catch(() => {
          setSuggestions([]);
          setShowDropdown(false);
        });
    }, 150);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  function selectSuggestion(text: string) {
    setValue("");
    setSuggestions([]);
    setShowDropdown(false);
    if (ref.current) ref.current.style.height = "auto";
    onSend(text);
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (showDropdown && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        return;
      }
      if (e.key === "Tab" && selectedIndex >= 0) {
        e.preventDefault();
        setValue(suggestions[selectedIndex].text);
        setShowDropdown(false);
        return;
      }
      if (e.key === "Enter" && !e.shiftKey && selectedIndex >= 0) {
        e.preventDefault();
        selectSuggestion(suggestions[selectedIndex].text);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowDropdown(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const msg = value.trim();
    if (!msg || disabled) return;
    setValue("");
    setSuggestions([]);
    setShowDropdown(false);
    if (ref.current) ref.current.style.height = "auto";
    onSend(msg);
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  }

  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const item = dropdownRef.current.children[selectedIndex] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  return (
    <div
      style={{
        padding: "16px 24px 20px",
        background: "var(--bg)",
        borderTop: "1px solid var(--border)",
        position: "relative",
      }}
    >
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          style={{
            position: "absolute",
            bottom: "100%",
            left: 24,
            right: 24,
            maxWidth: 720,
            margin: "0 auto",
            background: "var(--input-bg)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            boxShadow: "0 -4px 16px rgba(0,0,0,0.12)",
            maxHeight: 320,
            overflowY: "auto",
            zIndex: 50,
            padding: "4px 0",
          }}
        >
          {suggestions.map((s, i) => (
            <div
              key={s.text}
              onMouseDown={(e) => {
                e.preventDefault();
                selectSuggestion(s.text);
              }}
              onMouseEnter={() => setSelectedIndex(i)}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
                background:
                  i === selectedIndex ? "var(--bg-hover)" : "transparent",
                transition: "background 0.1s",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--accent)",
                  background: "var(--accent-bg)",
                  padding: "2px 6px",
                  borderRadius: 4,
                  flexShrink: 0,
                }}
              >
                {CATEGORY_LABELS[s.category] ?? s.category}
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: "var(--text)",
                  lineHeight: 1.4,
                }}
              >
                {highlightMatch(s.text, value)}
              </span>
            </div>
          ))}
        </div>
      )}

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
        onBlurCapture={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
          setTimeout(() => setShowDropdown(false), 150);
        }}
      >
        <textarea
          ref={ref}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKey}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
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
        Enter to send · Tab to fill · ↑↓ to navigate
      </p>
    </div>
  );
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 2);
  if (words.length === 0) return text;

  const pattern = new RegExp(`(${words.map(escapeRegex).join("|")})`, "gi");
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, i) =>
        words.some((w) => part.toLowerCase() === w) ? (
          <strong key={i} style={{ color: "var(--accent)" }}>
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
