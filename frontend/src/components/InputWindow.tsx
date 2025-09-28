"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useRef } from "react";

interface InputWindowProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  isSending: boolean;
  canSend: boolean;
}

export default function InputWindow({ input, setInput, onSend, isSending, canSend }: InputWindowProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      
      // Calculate the number of lines
      const lineHeight = 24; // Approximate line height in pixels
      const minHeight = lineHeight * 2; // 2 lines minimum
      const maxHeight = lineHeight * 10; // 10 lines maximum
      const scrollHeight = textarea.scrollHeight;
      
      // Set height based on content, but within limits
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${newHeight}px`;
    }
  }, [input]);

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-3xl bg-black dark:bg-black backdrop-blur-md border border-white/20 rounded-2xl shadow-[0_0_20px_rgba(0,255,0,0.3)] dark:shadow-[0_0_20px_rgba(0,255,0,0.3)] p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSend();
          }}
          className="relative"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}  
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="Type your message"
            rows={2}
            className="w-full resize-none rounded-none border-none bg-transparent pr-12 pl-4 py-3 text-sm text-white placeholder-white/60 focus:outline-none overflow-hidden"
          />
          <button
            type="submit"
            disabled={!canSend}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white p-2 text-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/80 transition-colors"
          >
            <ArrowUp size={16} />
          </button>
        </form>
    </div>
  );
}
