"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Copy, ThumbsUp, ThumbsDown, Globe } from "lucide-react";
import ModelSelector from "@/components/ModelSelector";
import InputWindow from "@/components/InputWindow";
import Sidebar, { ChatSession } from "@/components/Sidebar";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  const [model, setModel] = useState<"deepseek-coder:latest" | "llama3.2:1b" | "llama3.1:8b">(
    "llama3.1:8b"
  );
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize from local storage
  useEffect(() => {
    const saved = localStorage.getItem("anton_chats");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) {
          setSessions(parsed);
          setActiveSessionId(parsed[0].id);
        } else {
          startNewChat();
        }
      } catch (e) {
        startNewChat();
      }
    } else {
      startNewChat();
    }
  }, []);

  // Sync to local storage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("anton_chats", JSON.stringify(sessions));
    }
  }, [sessions]);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const messages = activeSession?.messages || [];

  const updateMessages = (newMessages: ChatMessage[]) => {
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          title: s.title || (newMessages.length > 0 ? newMessages[0].content.slice(0, 30) + "..." : ""),
          messages: newMessages,
          updatedAt: Date.now()
        };
      }
      return s;
    }));
  };

  const startNewChat = () => {
    const newId = crypto.randomUUID();
    setSessions(prev => [
      { id: newId, title: "", messages: [], updatedAt: Date.now() },
      ...prev
    ]);
    setActiveSessionId(newId);
  };

  const deleteChat = (id: string) => {
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== id);
      if (activeSessionId === id) {
        if (updated.length > 0) {
          setActiveSessionId(updated[0].id);
        } else {
          // If we deleted the last one, schedule a new chat creation
          setTimeout(startNewChat, 0);
          return updated;
        }
      }
      return updated;
    });
  };

  const canSend = useMemo(() => input.trim().length > 0 && !isSending, [input, isSending]);

  async function handleSend() {
    if (!canSend) return;
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
    };
    setInput("");

    const updatedMessages = [...messages, userMessage];
    updateMessages(updatedMessages);
    setIsSending(true);

    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          model
        }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");

      const assistantMessageId = crypto.randomUUID();
      
      let currentStreamedMessages = [
        ...updatedMessages,
        { id: assistantMessageId, role: "assistant", content: "" }
      ] as ChatMessage[];
      
      updateMessages(currentStreamedMessages);

      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.trim()) {
              try {
                const parsed = JSON.parse(line);
                if (parsed.message?.content) {
                  currentStreamedMessages = currentStreamedMessages.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: msg.content + parsed.message.content }
                      : msg
                  );
                  updateMessages(currentStreamedMessages);
                } else if (parsed.error) {
                  currentStreamedMessages = currentStreamedMessages.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: msg.content + "\nError: " + parsed.error }
                      : msg
                  );
                  updateMessages(currentStreamedMessages);
                }
              } catch (e) {
                console.error("Error parsing NDJSON chunk", e);
              }
            }
          }
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }
      }
    } catch (err) {
      updateMessages([...messages, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Error connecting to backend.",
      }]);
    }
    setIsSending(false);
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }

  const userName = "Karmanya";
  const [greetingText, setGreetingText] = useState<string>("");
  useEffect(() => {
    const hour = new Date().getHours();
    let greetings;
    if (hour < 12) {
      greetings = ["Top of the mornin'", "Morning", "Good Morning"];
    } else if (hour < 18) {
      greetings = ["What's up", "Yo Yo Yo", "Afternoon Master"];
    } else {
      greetings = ["Evening", "Good Evening", "Greetings", "What's up", "Yo Yo Yo"];
    }
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    setGreetingText(`${greeting}, ${userName}!\nAnton Is Alive.`);
  }, []);

  return (
    <div className="h-screen flex overflow-hidden bg-background text-foreground font-fira">
      <Sidebar 
        sessions={sessions} 
        activeSessionId={activeSessionId} 
        onSelectSession={setActiveSessionId} 
        onNewChat={startNewChat} 
        onDeleteSession={deleteChat} 
      />
      
      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="w-full border-b border-black/10 dark:border-white/10 shrink-0">
          <div className="w-full px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-green-500">Anton</h1>
            <ModelSelector value={model} onChange={setModel} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 pb-24 overflow-y-auto scrollbar-hide" ref={scrollRef}>
          {messages.length === 0 ? (
            (() => {
              const [greeting, antonMsg] = greetingText.split("\n");
              return greetingText ? (
                <div className="flex flex-col items-start mt-10">
                  <span className="text-4xl font-bold text-green-500 mb-2">{greeting}</span>
                  <span className="text-6xl font-extrabold text-white">{antonMsg}</span>
                </div>
              ) : null;
            })()
          ) : (
            <div className="space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className="flex gap-4 items-start group">
                  <div className="flex-1">
                    <div className="flex items-center text-xs text-black/60 dark:text-white/60 mb-2 font-medium gap-2">
                       <span className="relative text-base">{msg.role === "user" ? "You" : "Anton"}
                        <span className="flex gap-2 absolute left-full top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                          <button
                            title="Copy"
                            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
                            onClick={() => navigator.clipboard.writeText(msg.content)}
                          >
                            <Copy size={16} />
                          </button>
                          {msg.role === "assistant" && (
                            <>
                              <button title="Thumbs Up" className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10">
                                <ThumbsUp size={16} />
                              </button>
                              <button title="Thumbs Down" className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10">
                                <ThumbsDown size={16} />
                              </button>
                            </>
                          )}
                        </span>
                      </span>
                    </div>
                    <div className={msg.role === "user" ? "inline-block bg-neutral-800 text-white text-sm leading-6 whitespace-pre-wrap rounded-lg px-4 py-2 mb-2 group-hover:shadow-lg" : "text-sm leading-6 whitespace-pre-wrap text-black dark:text-white group-hover:shadow-lg"}>
                      {msg.content.includes("[SYSTEM_EVENT: WEB_SEARCH]") ? (
                        msg.content.split("[SYSTEM_EVENT: WEB_SEARCH]").map((part, index, arr) => {
                          const isSearching = part.trim().length === 0 && isSending && index === arr.length - 1;
                          return (
                            <div key={index} className="w-full">
                              {index > 0 && (
                                <div className="flex items-center gap-2 text-green-500 dark:text-green-500 font-mono bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full inline-flex text-xs mt-1 mb-3 shadow-sm">
                                  <Globe size={14} className={isSearching ? "animate-spin" : ""} /> {isSearching ? "Searching the depths of the Internet..." : "Web Source"}
                                </div>
                              )}
                              {part && <div className="whitespace-pre-wrap">{part}</div>}
                            </div>
                          )
                        })
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        <InputWindow
          input={input}
          setInput={setInput}
          onSend={handleSend}
          isSending={isSending}
          canSend={canSend}
        />
      </div>
    </div>
  );
}
