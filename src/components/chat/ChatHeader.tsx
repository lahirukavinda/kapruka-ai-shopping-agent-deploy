"use client";

import KapriAvatar from "./KapriAvatar";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import type { AvatarState, Language } from "@/types";

interface ChatHeaderProps {
  avatarState: AvatarState;
  onCartOpen: () => void;
}

const langLabels: Record<Language, string> = {
  en: "EN",
  si: "සිං",
  tanglish: "TG",
};

export default function ChatHeader({ avatarState, onCartOpen }: ChatHeaderProps) {
  const { theme, toggle: toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { totalItems } = useCart();

  const languages: Language[] = ["en", "si", "tanglish"];
  const nextLang = languages[(languages.indexOf(language) + 1) % languages.length];

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3">
        <KapriAvatar state={avatarState} size={40} />
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {process.env.NEXT_PUBLIC_APP_NAME || "Kapri"}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Your Kapruka Shopping Buddy
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Language toggle */}
        <button
          onClick={() => setLanguage(nextLang)}
          className="touch-target px-2.5 py-1.5 text-xs font-medium rounded-lg
            border border-gray-300 dark:border-gray-600
            text-gray-600 dark:text-gray-400
            hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label={`Switch language to ${nextLang}`}
        >
          {langLabels[language]}
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="touch-target w-9 h-9 flex items-center justify-center rounded-lg
            border border-gray-300 dark:border-gray-600
            hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>

        {/* Cart button */}
        <button
          onClick={onCartOpen}
          className="touch-target relative w-9 h-9 flex items-center justify-center rounded-lg
            border border-gray-300 dark:border-gray-600
            hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label={`Cart with ${totalItems} items`}
        >
          🛒
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {totalItems > 9 ? "9+" : totalItems}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
