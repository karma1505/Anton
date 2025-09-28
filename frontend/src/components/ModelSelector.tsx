"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

const AVAILABLE_MODELS = [
  { id: "deepseek-coder:latest", label: "deepseek-coder" },
  { id: "llama3.2:1b", label: "llama3.2:1b" },
] as const;

type ModelId = typeof AVAILABLE_MODELS[number]["id"];

interface ModelSelectorProps {
  value: ModelId;
  onChange: (value: ModelId) => void;
}

export default function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedModel = AVAILABLE_MODELS.find(model => model.id === value);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-black/10 dark:border-white/15 bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 transition-colors text-sm font-medium"
      >
        <span className="text-xs text-black/60 dark:text-white/60">Model</span>
        <span className="text-black dark:text-white">{selectedModel?.label}</span>
        <ChevronDown 
          size={14} 
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-black/10 dark:border-white/15 rounded-lg shadow-lg z-50">
          {AVAILABLE_MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                onChange(model.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                value === model.id 
                  ? 'bg-black/10 dark:bg-white/10 text-black dark:text-white font-medium' 
                  : 'text-black dark:text-white'
              }`}
            >
              {model.label}
            </button>
          ))}
        </div>
      )}
      
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
