"use client";

export default function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-800/80 overflow-hidden shadow-sm min-w-[220px] max-w-[280px] border border-gray-100 dark:border-gray-700/50 animate-pulse">
      <div className="h-44 w-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 relative overflow-hidden">
        <div className="absolute inset-0 animate-shimmer" />
      </div>
      <div className="p-3.5 space-y-2.5">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/2" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/3" />
        <div className="flex gap-2 pt-1">
          <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-xl flex-1" />
          <div className="h-9 bg-amber-100 dark:bg-amber-900/20 rounded-xl flex-1" />
        </div>
      </div>
    </div>
  );
}
