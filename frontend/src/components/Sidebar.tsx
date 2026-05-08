import { useState, useRef } from "react";
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

type Tab = "history" | "engines" | "dataset";

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
  const [tab, setTab] = useState<Tab>("history");
  const [hovered, setHovered] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleMouseEnter() {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setHovered(true);
  }

  function handleMouseLeave() {
    // Close instantly when not pinned
    if (!open) setHovered(false);
  }

  return (
    <>
      {/* Toggle button — always visible top-left when sidebar is closed */}
      {!open && !hovered && (
        <button
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={onToggle}
          title="Open sidebar"
          style={{
            position: "fixed",
            top: 14,
            left: 14,
            zIndex: 60,
            width: 32,
            height: 32,
            border: "1px solid var(--border)",
            borderRadius: 8,
            background: "var(--bg-secondary)",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: 15,
          }}
        >
          ☰
        </button>
      )}

      {/* Sidebar — relative when pinned, fixed overlay when hovered */}
      {open ? (
        // Pinned: part of normal flow, pushes content
        <div
          style={{
            width: 260,
            flexShrink: 0,
            height: "100vh",
            background: "var(--sidebar-bg)",
            borderRight: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <SidebarContent
            tab={tab}
            setTab={setTab}
            metadata={metadata}
            sessions={sessions}
            activeId={activeId}
            onSelectSession={onSelectSession}
            onNewChat={onNewChat}
            theme={theme}
            onToggleTheme={onToggleTheme}
            onToggle={onToggle}
            isPinned={true}
          />
        </div>
      ) : (
        // Hover overlay: fixed, floats over content
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            height: "100vh",
            width: hovered ? 260 : 0,
            overflow: "hidden",
            transition: "width 0.18s ease",
            background: "var(--sidebar-bg)",
            borderRight: hovered ? "1px solid var(--border)" : "none",
            boxShadow: hovered ? "4px 0 20px rgba(0,0,0,0.18)" : "none",
            zIndex: 55,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {hovered && (
            <SidebarContent
              tab={tab}
              setTab={setTab}
              metadata={metadata}
              sessions={sessions}
              activeId={activeId}
              onSelectSession={(id) => {
                onSelectSession(id);
                setHovered(false);
              }}
              onNewChat={() => {
                onNewChat();
                setHovered(false);
              }}
              theme={theme}
              onToggleTheme={onToggleTheme}
              onToggle={onToggle}
              isPinned={false}
            />
          )}
        </div>
      )}
    </>
  );
}

// ── Inner content (shared between pinned and hover modes) ────

interface ContentProps {
  tab: "history" | "engines" | "dataset";
  setTab: (t: "history" | "engines" | "dataset") => void;
  metadata: DatasetMetadata | null;
  sessions: ChatSession[];
  activeId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onToggle: () => void;
  isPinned: boolean;
}

function SidebarContent({
  tab,
  setTab,
  metadata,
  sessions,
  activeId,
  onSelectSession,
  onNewChat,
  theme,
  onToggleTheme,
  onToggle,
  isPinned,
}: ContentProps) {
  return (
    <div
      style={{
        width: 260,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
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
          <IconBtn
            onClick={onToggle}
            title={isPinned ? "Close sidebar" : "Pin sidebar"}
          >
            {isPinned ? "✕" : "⊞"}
          </IconBtn>
        </div>
      </div>

      {/* New chat */}
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
            fontFamily: "var(--font-sans)",
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
        {(["history", "engines", "dataset"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: "8px 4px",
              border: "none",
              borderBottom:
                tab === t ? "2px solid var(--accent)" : "2px solid transparent",
              background: "transparent",
              color: tab === t ? "var(--accent)" : "var(--text-muted)",
              fontSize: 11,
              fontFamily: "var(--font-sans)",
              cursor: "pointer",
              fontWeight: tab === t ? 500 : 400,
              textTransform: "capitalize",
              letterSpacing: "0.02em",
              transition: "color 0.15s",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
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
  );
}

// ── History Tab ──────────────────────────────────────────────

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
            fontFamily: "var(--font-sans)",
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

// ── Engines Tab ──────────────────────────────────────────────

function EnginesTab({ metadata }: { metadata: DatasetMetadata | null }) {
  if (!metadata)
    return (
      <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Loading...</p>
    );
  const engines = Array.from(
    { length: metadata.train_engines },
    (_, i) => i + 1,
  );
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
        {metadata.train_engines} engines · FD001
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
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={`Engine ${id}`}
      style={{
        padding: "5px 2px",
        borderRadius: 6,
        border: "1px solid var(--border)",
        background: hov ? "var(--accent-bg)" : "var(--bg-secondary)",
        color: hov ? "var(--accent-text)" : "var(--text-muted)",
        fontSize: 11,
        fontFamily: "var(--font-mono)",
        textAlign: "center",
        cursor: "default",
        transition: "all 0.15s",
        userSelect: "none",
      }}
    >
      {id}
    </div>
  );
}

// ── Dataset Tab ──────────────────────────────────────────────

function DatasetTab({ metadata }: { metadata: DatasetMetadata | null }) {
  if (!metadata)
    return (
      <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Loading...</p>
    );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Section title="Overview">
        <Stat label="Fault" value={metadata.fault_mode} />
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

// ── Shared primitives ────────────────────────────────────────

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
        fontFamily: "var(--font-sans)",
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
