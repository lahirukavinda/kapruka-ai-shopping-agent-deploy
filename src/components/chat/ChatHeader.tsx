"use client";

import AuraAvatar from "./AuraAvatar";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import type { AvatarState, Language } from "@/types";

interface ChatHeaderProps {
  avatarState: AvatarState;
  onCartOpen: () => void;
  onHistoryOpen?: () => void;
}

const langLabels: Record<Language, string> = {
  en: "EN",
  si: "සිං",
  tanglish: "TG",
};

export default function ChatHeader({ avatarState, onCartOpen, onHistoryOpen }: ChatHeaderProps) {
  const { theme, toggle: toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { totalItems } = useCart();

  const languages: Language[] = ["en", "si", "tanglish"];
  const nextLang = languages[(languages.indexOf(language) + 1) % languages.length];

  return (
    <header className="glass-header flex items-center justify-between px-4 py-3 z-20 relative">
      <div className="flex items-center gap-3">
        <div className="avatar-glow rounded-full">
          <AuraAvatar state={avatarState} size={44} />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {process.env.NEXT_PUBLIC_APP_NAME || "Aura ඕරා"}
          </h1>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Online — here to help you shine
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Chat history */}
        {onHistoryOpen && (
          <button
            onClick={onHistoryOpen}
            className="touch-target w-10 h-10 flex items-center justify-center rounded-full
              bg-gray-100 dark:bg-gray-800
              hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-lg"
            aria-label="Chat history"
          >
            📋
          </button>
        )}

        {/* Language toggle */}
        <button
          onClick={() => setLanguage(nextLang)}
          className="touch-target px-3 py-1.5 text-xs font-semibold rounded-full
            bg-gray-100 dark:bg-gray-800
            text-gray-600 dark:text-gray-400
            hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
          aria-label={`Switch language to ${nextLang}`}
        >
          {langLabels[language]}
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="touch-target w-10 h-10 flex items-center justify-center rounded-full
            bg-gray-100 dark:bg-gray-800
            hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-lg"
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>

        {/* Cart button */}
        <button
          onClick={onCartOpen}
          className="touch-target relative w-10 h-10 flex items-center justify-center rounded-full
            bg-gray-100 dark:bg-gray-800
            hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-lg"
          aria-label={`Cart with ${totalItems} items`}
        >
          🛒
          {totalItems > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-gray-900">
              {totalItems > 9 ? "9+" : totalItems}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
