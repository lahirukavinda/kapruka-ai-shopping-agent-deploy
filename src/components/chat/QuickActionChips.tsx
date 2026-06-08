"use client";

import { motion } from "framer-motion";

interface QuickActionChipsProps {
  onAction: (text: string) => void;
  disabled?: boolean;
}

const actions = [
  { label: "🛍️ Browse categories", text: "Show me all categories" },
  { label: "📦 Track order", text: "I want to track my order" },
  { label: "🎁 Gift ideas", text: "I need gift ideas" },
  { label: "📱 Electronics", text: "Show me popular electronics" },
  { label: "🛒 Groceries", text: "I need to buy groceries" },
];

export default function QuickActionChips({
  onAction,
  disabled = false,
}: QuickActionChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 px-4 py-2">
      {actions.map((action, index) => (
        <motion.button
          key={action.label}
          className="touch-target inline-flex items-center px-3 py-2 rounded-full text-sm font-medium
            bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
            border border-gray-200 dark:border-gray-700
            hover:bg-primary-50 hover:border-primary-300 dark:hover:bg-gray-700
            transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onAction(action.text)}
          disabled={disabled}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, type: "spring" as const, damping: 20, stiffness: 300 }}
          tabIndex={0}
        >
          {action.label}
        </motion.button>
      ))}
    </div>
  );
}
