import { useState } from "react";
import type { DatasetMetadata } from "../api";
import type { ChatSession } from "../App";

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  metadata: DatasetMetadata | null;
  sessions: ChatSession[];
  activeId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

type Tab = "dataset" | "engines" | "history";

export default function Sidebar({
  open,
  onToggle,
  metadata,
  sessions,
  activeId,
  onSelectSession,
  onNewChat,
  theme,
  onToggleTheme,
}: SidebarProps) {
  const [tab, setTab] = useState<Tab>("dataset");

  return (
    <>
      {/* Collapsed toggle button */}
      {!open && (
        <button
          onClick={onToggle}
          title="Open sidebar"
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            zIndex: 50,
            width: 32,
            height: 32,
            border: "1px solid var(--border)",
            borderRadius: "8px",
            background: "var(--bg-secondary)",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: 16,
          }}
        >
          ☰
        </button>
      )}

      {/* Sidebar panel */}
      <div
        style={{
          width: open ? "260px" : "0px",
          flexShrink: 0,
          overflow: "hidden",
          transition: "width 0.22s ease",
          background: "var(--sidebar-bg)",
          borderRight: open ? "1px solid var(--border)" : "none",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            width: 260,
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: "var(--text)",
                  letterSpacing: "-0.01em",
                }}
              >
                ARIA
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                  marginTop: 1,
                }}
              >
                NASA CMAPSS
              </p>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <IconBtn onClick={onToggleTheme} title="Toggle theme">
                {theme === "dark" ? "☀" : "☾"}
              </IconBtn>
              <IconBtn onClick={onToggle} title="Close sidebar">
                ✕
              </IconBtn>
            </div>
          </div>

          {/* New chat button */}
          <div
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid var(--border)",
              flexShrink: 0,
            }}
          >
            <button
              onClick={onNewChat}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text)",
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--bg-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
              New chat
            </button>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid var(--border)",
              flexShrink: 0,
            }}
          >
            {(["history", "engines", "dataset"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1,
                  padding: "8px 4px",
                  border: "none",
                  borderBottom:
                    tab === t
                      ? "2px solid var(--accent)"
                      : "2px solid transparent",
                  background: "transparent",
                  color: tab === t ? "var(--accent)" : "var(--text-muted)",
                  fontSize: 11,
                  fontFamily: "var(--font-sans)",
                  cursor: "pointer",
                  fontWeight: tab === t ? 500 : 400,
                  textTransform: "capitalize",
                  transition: "color 0.15s",
                  letterSpacing: "0.02em",
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
            {tab === "history" && (
              <HistoryTab
                sessions={sessions}
                activeId={activeId}
                onSelect={onSelectSession}
              />
            )}
            {tab === "engines" && <EnginesTab metadata={metadata} />}
            {tab === "dataset" && <DatasetTab metadata={metadata} />}
          </div>
        </div>
      </div>
    </>
  );
}

// History Tab
function HistoryTab({
  sessions,
  activeId,
  onSelect,
}: {
  sessions: ChatSession[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  if (sessions.length === 0) {
    return (
      <p
        style={{ fontSize: 12, color: "var(--text-muted)", padding: "8px 4px" }}
      >
        No chats yet. Start a conversation.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {sessions.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: 8,
            border: "none",
            background: s.id === activeId ? "var(--bg-hover)" : "transparent",
            color: "var(--text)",
            fontSize: 13,
            textAlign: "left",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => {
            if (s.id !== activeId)
              e.currentTarget.style.background = "var(--bg-secondary)";
          }}
          onMouseLeave={(e) => {
            if (s.id !== activeId)
              e.currentTarget.style.background = "transparent";
          }}
        >
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "block",
              maxWidth: "100%",
            }}
          >
            {s.title || "Untitled"}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {s.messages.length} message{s.messages.length !== 1 ? "s" : ""} ·{" "}
            {s.createdAt.toLocaleDateString()}
          </span>
        </button>
      ))}
    </div>
  );
}

// Engines Tab
function EnginesTab({ metadata }: { metadata: DatasetMetadata | null }) {
  if (!metadata) {
    return (
      <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
        Loading engines...
      </p>
    );
  }

  const total = metadata.train_engines;
  const engines = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <div>
      <p
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 8,
        }}
      >
        {total} engines · FD001
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 4,
        }}
      >
        {engines.map((id) => (
          <EngineChip key={id} id={id} />
        ))}
      </div>
    </div>
  );
}

function EngineChip({ id }: { id: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "5px 2px",
        borderRadius: 6,
        border: "1px solid var(--border)",
        background: hovered ? "var(--accent-bg)" : "var(--bg-secondary)",
        color: hovered ? "var(--accent-text)" : "var(--text-muted)",
        fontSize: 11,
        fontFamily: "var(--font-mono)",
        textAlign: "center",
        cursor: "default",
        transition: "all 0.15s",
        userSelect: "none",
      }}
      title={`Engine ${id}`}
    >
      {id}
    </div>
  );
}

// Dataset Tab
function DatasetTab({ metadata }: { metadata: DatasetMetadata | null }) {
  if (!metadata) {
    return (
      <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Loading...</p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Section title="Overview">
        <Stat label="Fault mode" value={metadata.fault_mode} />
        <Stat label="Conditions" value={metadata.operating_conditions} />
        <Stat label="Train" value={`${metadata.train_engines} engines`} />
        <Stat label="Test" value={`${metadata.test_engines} engines`} />
      </Section>

      <Section title="Train cycles">
        <Stat label="Min" value={String(metadata.train_cycle_length.min)} />
        <Stat
          label="Median"
          value={String(metadata.train_cycle_length.median)}
        />
        <Stat label="Max" value={String(metadata.train_cycle_length.max)} />
      </Section>

      <Section title="Test RUL">
        <Stat label="Min" value={String(metadata.test_rul.min)} />
        <Stat label="Median" value={String(metadata.test_rul.median)} />
        <Stat label="Max" value={String(metadata.test_rul.max)} />
      </Section>

      <Section title="Top sensors">
        {metadata.top_informative_sensors.map((s) => (
          <Stat
            key={s.feature}
            label={s.feature}
            value={s.informativeness_score.toFixed(2)}
          />
        ))}
      </Section>

      <Section title="Stable sensors">
        <p
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            lineHeight: 1.7,
            fontFamily: "var(--font-mono)",
          }}
        >
          {metadata.stable_sensors.join(", ")}
        </p>
      </Section>
    </div>
  );
}

// Shared Primitives
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 8,
        }}
      >
        {title}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {children}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
      <span style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 12,
          color: "var(--text)",
          fontFamily: "var(--font-mono)",
          textAlign: "right",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function IconBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 28,
        height: 28,
        borderRadius: 6,
        border: "1px solid var(--border)",
        background: "transparent",
        color: "var(--text-muted)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontSize: 13,
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "var(--bg-hover)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {children}
    </button>
  );
}
