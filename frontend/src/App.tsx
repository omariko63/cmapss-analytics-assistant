import { useState, useEffect } from "react";
import {
  sendMessage,
  fetchMetadata,
  type DatasetMetadata,
  type NlpParsed,
} from "./api";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import InputBar from "./components/InputBar";

export interface Message {
  role: "user" | "bot";
  text: string;
  parsed?: NlpParsed;
  llm_available?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (localStorage.getItem("theme") as "light" | "dark") ?? "dark",
  );
  const [sidebarOpen, setSidebar] = useState<boolean>(
    () => localStorage.getItem("sidebarOpen") !== "false",
  );
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [metadata, setMetadata] = useState<DatasetMetadata | null>(null);
  const [prefill, setPrefill] = useState<string>("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<
    { role: "user" | "bot"; text: string }[]
  >([]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("sidebarOpen", String(sidebarOpen));
  }, [sidebarOpen]);

  useEffect(() => {
    fetchMetadata("fd001").then(setMetadata).catch(console.error);
  }, []);

  // Active session messages
  const activeSession = sessions.find((s) => s.id === activeId) ?? null;
  const messages = activeSession?.messages ?? [];

  function newSession(): ChatSession {
    const id = crypto.randomUUID();
    const session: ChatSession = {
      id,
      title: "New chat",
      messages: [],
      createdAt: new Date(),
    };
    setSessions((prev) => [session, ...prev]);
    setActiveId(id);
    setHistory([]);
    return session;
  }

  function handleSelectSession(id: string) {
    setActiveId(id);
    setHistory([]); // history is per-session; rebuild isn't worth the complexity
  }

  function updateSession(id: string, updater: (s: ChatSession) => ChatSession) {
    setSessions((prev) => prev.map((s) => (s.id === id ? updater(s) : s)));
  }

  async function handleSend(text: string) {
    let id = activeId;
    if (!id) {
      const session = newSession();
      id = session.id;
    }

    const userMsg: Message = { role: "user", text };
    updateSession(id, (s) => ({
      ...s,
      title: s.messages.length === 0 ? text.slice(0, 40) : s.title,
      messages: [...s.messages, userMsg],
    }));

    // Build context string from last 6 exchanges (3 turns)
    const contextString =
      history.length > 0
        ? history
            .slice(-6)
            .map(
              (h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.text}`,
            )
            .join("\n")
        : undefined;

    setLoading(true);
    try {
      const data = await sendMessage(text, contextString);
      const botMsg: Message = {
        role: "bot",
        text: data.answer ?? "_(No answer returned)_",
        parsed: data.parsed,
        llm_available: data.llm_available,
      };
      updateSession(id, (s) => ({ ...s, messages: [...s.messages, botMsg] }));

      // Append this exchange to history
      setHistory((prev) => [
        ...prev,
        { role: "user", text },
        { role: "bot", text: botMsg.text },
      ]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      updateSession(id, (s) => ({
        ...s,
        messages: [...s.messages, { role: "bot", text: `Error: ${msg}` }],
      }));
    }
    setLoading(false);
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "var(--bg)",
      }}
    >
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebar((o) => !o)}
        metadata={metadata}
        sessions={sessions}
        activeId={activeId}
        onSelectSession={handleSelectSession}
        onNewChat={() => {
          newSession();
        }}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        onEngineClick={(text) => setPrefill(text)}
      />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        <ChatWindow
          messages={messages}
          loading={loading}
          onSuggestion={handleSend}
        />
        <InputBar onSend={handleSend} disabled={loading} prefill={prefill} />
      </div>
    </div>
  );
}
