import { useState, useEffect } from "react";
import { fetchMetadata, sendMessage, type DatasetMetadata, type NlpParsed } from "./api";
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
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [sidebarOpen, setSidebar] = useState(true);
  const [metadata, setMetadata] = useState<DatasetMetadata | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

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
    return session;
  }

  function updateSession(id: string, updater: (s: ChatSession) => ChatSession) {
    setSessions((prev) => prev.map((s) => (s.id === id ? updater(s) : s)));
  }

  async function handleSend(text: string) {
    // Create session if none active
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

    setLoading(true);
    try {
      const data = await sendMessage(text);
      const botMsg: Message = {
        role: "bot",
        text: data.answer ?? "_(No answer returned — check your GROQ_API_KEY)_",
        parsed: data.parsed,
        llm_available: data.llm_available,
      };
      updateSession(id, (s) => ({ ...s, messages: [...s.messages, botMsg] }));
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
        onSelectSession={setActiveId}
        onNewChat={() => {
          newSession();
        }}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
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
        <InputBar onSend={handleSend} disabled={loading} />
      </div>
    </div>
  );
}
