"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { useVoiceInput } from "@/hooks/useVoiceInput";

interface ChatInputProps {
  onSubmit: (message: string) => void;
  isLoading: boolean;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
}

export default function ChatInput({ onSubmit, isLoading, inputRef }: ChatInputProps) {
  const [input, setInput] = useState("");
  const localRef = useRef<HTMLTextAreaElement>(null);
  const ref = inputRef || localRef;
  const { isListening, isSupported, transcript, startListening, stopListening } =
    useVoiceInput();

  useEffect(() => {
    if (!isLoading && ref.current) {
      ref.current.focus();
    }
  }, [isLoading, ref]);

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-3"
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      <div className="max-w-3xl mx-auto flex items-end gap-2">
        {/* Voice input button */}
        {isSupported && (
          <button
            type="button"
            onClick={handleVoice}
            className={`touch-target flex items-center justify-center w-11 h-11 rounded-full
              border transition-colors ${
                isListening
                  ? "bg-red-500 border-red-500 text-white animate-pulse"
                  : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            aria-label={isListening ? "Stop voice input" : "Start voice input"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
              <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
            </svg>
          </button>
        )}

        <textarea
          ref={ref}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Kapri anything..."
          className="chat-input flex-1 resize-none rounded-2xl border border-gray-300 dark:border-gray-600
            bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100
            px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            placeholder-gray-400 dark:placeholder-gray-500
            max-h-32 overflow-y-auto"
          rows={1}
          disabled={isLoading}
          aria-label="Type your message"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="touch-target flex items-center justify-center w-11 h-11 rounded-full
            bg-primary-500 hover:bg-primary-600 text-white
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors"
          aria-label="Send message"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </button>
      </div>
    </form>
  );
}
