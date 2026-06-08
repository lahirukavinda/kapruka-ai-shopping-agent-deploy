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

const defaultColors = [
  "from-yellow-500/10 to-emerald-500/10 border-yellow-200 dark:border-yellow-800 hover:from-yellow-500/20 hover:to-emerald-500/20",
  "from-blue-500/10 to-indigo-500/10 border-blue-200 dark:border-indigo-800 hover:from-blue-500/20 hover:to-indigo-500/20",
  "from-pink-500/10 to-rose-500/10 border-pink-200 dark:border-rose-800 hover:from-pink-500/20 hover:to-rose-500/20",
  "from-cyan-500/10 to-teal-500/10 border-cyan-200 dark:border-teal-800 hover:from-cyan-500/20 hover:to-teal-500/20",
  "from-green-500/10 to-emerald-500/10 border-green-200 dark:border-emerald-800 hover:from-green-500/20 hover:to-emerald-500/20",
];

export default function QuickActionChips({
  onAction,
  disabled = false,
  dynamicActions,
}: QuickActionChipsProps) {
  const actions = dynamicActions && dynamicActions.length > 0 ? dynamicActions : defaultActions;

  return (
    <div className="flex flex-wrap justify-center gap-2 px-4 py-2">
      {actions.map((action, index) => (
        <motion.button
          key={action.label}
          className={`touch-target inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium
            bg-gradient-to-r ${defaultColors[index % defaultColors.length]}
            text-gray-700 dark:text-gray-300
            border
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            shadow-sm hover:shadow-md`}
          onClick={() => onAction(action.text)}
          disabled={disabled}
          initial={{ opacity: 0, scale: 0.9, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: index * 0.07, type: "spring" as const, damping: 20, stiffness: 300 }}
          whileHover={{ scale: 1.03 }}
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
