"use client";

import { motion } from "framer-motion";
import type { Category } from "@/types";

interface CategoryTilesProps {
  categories: Category[];
  onSelect: (category: Category) => void;
}

const categoryIcons: Record<string, string> = {
  electronics: "📱",
  groceries: "🛒",
  fashion: "👗",
  flowers: "🌸",
  gifts: "🎁",
  toys: "🧸",
  home: "🏠",
  beauty: "💄",
  sports: "⚽",
  books: "📚",
  baby: "👶",
  health: "💊",
  automotive: "🚗",
  jewelry: "💍",
  default: "🏷️",
};

function getCategoryIcon(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(categoryIcons)) {
    if (lower.includes(key)) return icon;
  }
  return categoryIcons.default;
}

export default function CategoryTiles({ categories, onSelect }: CategoryTilesProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {categories.map((cat, index) => (
        <motion.button
          key={cat.id}
          onClick={() => onSelect(cat)}
          className="touch-target flex flex-col items-center gap-1.5 p-3 rounded-xl
            bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
            hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-gray-700
            transition-colors text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03, type: "spring" as const, damping: 20, stiffness: 300 }}
        >
          <span className="text-2xl">{getCategoryIcon(cat.name)}</span>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 line-clamp-1">
            {cat.name}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
