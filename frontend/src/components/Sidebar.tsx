import { MessageSquare, Plus, Trash2 } from "lucide-react";
import type { ChatMessage } from "@/app/page";

export type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
};

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
}

export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
}: SidebarProps) {
  return (
    <div className="w-64 border-r border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-900 flex flex-col h-screen shrink-0">
      <div className="p-4 border-b border-black/10 dark:border-white/10">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide">
        {sessions.sort((a, b) => b.updatedAt - a.updatedAt).map((session) => (
          <div
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
              activeSessionId === session.id
                ? "bg-black/10 dark:bg-white/10 text-black dark:text-white"
                : "text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <MessageSquare size={16} className="shrink-0" />
              <span className="text-sm font-medium truncate">
                {session.title || "New Chat"}
              </span>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSession(session.id);
              }}
              className="p-1.5 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all rounded hover:bg-black/5 dark:hover:bg-white/5"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {sessions.length === 0 && (
          <div className="text-center text-xs text-black/40 dark:text-white/40 mt-10">
            No past chats
          </div>
        )}
      </div>
    </div>
  );
}
