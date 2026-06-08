"use client";

import { motion } from "framer-motion";

interface DynamicAction {
  label: string;
  icon?: string;
  text: string;
}

interface QuickActionChipsProps {
  onAction: (text: string) => void;
  disabled?: boolean;
  dynamicActions?: DynamicAction[];
}

const defaultActions: DynamicAction[] = [
  { label: "Browse categories", icon: "🛍️", text: "Show me all categories" },
  { label: "Track order", icon: "📦", text: "I want to track my order" },
  { label: "Gift ideas", icon: "🎁", text: "I need gift ideas for a birthday" },
  { label: "Electronics", icon: "📱", text: "Show me popular electronics" },
  { label: "Groceries", icon: "🛒", text: "I need to buy groceries" },
];

export default function QuickActionChips({
  onAction,
  disabled = false,
  dynamicActions,
}: QuickActionChipsProps) {
  const actions = dynamicActions && dynamicActions.length > 0 ? dynamicActions : defaultActions;

  return (
    <div className="flex flex-wrap justify-center gap-2.5 px-4 py-2">
      {actions.map((action, index) => (
        <motion.button
          key={action.label}
          className="premium-chip touch-target inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium
            text-gray-700 dark:text-gray-300
            disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onAction(action.text)}
          disabled={disabled}
          initial={{ opacity: 0, scale: 0.9, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: index * 0.07, type: "spring" as const, damping: 20, stiffness: 300 }}
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.97 }}
          tabIndex={0}
        >
          {action.icon && <span className="text-base">{action.icon}</span>}
          {action.label}
        </motion.button>
      ))}
    </div>
  );
}
