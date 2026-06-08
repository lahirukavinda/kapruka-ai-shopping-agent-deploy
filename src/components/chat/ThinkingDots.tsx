"use client";

export default function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2" aria-label="Kapri is thinking">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-dot-bounce"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}
