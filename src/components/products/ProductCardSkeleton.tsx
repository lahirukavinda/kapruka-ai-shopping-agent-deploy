"use client";

export default function ProductCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 dark:border-gray-700 p-4 min-w-[240px] max-w-[300px]">
      <div className="h-48 w-full rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-shimmer" />
      <div className="mt-3 h-4 w-3/4 rounded bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-shimmer" />
      <div className="mt-2 h-4 w-1/3 rounded bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-shimmer" />
      <div className="mt-4 h-10 w-full rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-shimmer" />
    </div>
  );
}
