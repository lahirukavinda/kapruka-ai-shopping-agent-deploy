"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import KapriAvatar from "./KapriAvatar";
import type { AvatarState } from "@/types";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  avatarState?: AvatarState;
}

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    let processed: React.ReactNode = line;

    // Bold
    processed = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      // Links
      const linkParts = part.split(/(\[[^\]]+\]\([^)]+\))/g);
      return linkParts.map((lp, k) => {
        const linkMatch = lp.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          return (
            <a
              key={`${j}-${k}`}
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 dark:text-amber-400 underline decoration-amber-300/50 hover:decoration-amber-500 transition-colors"
            >
              {linkMatch[1]}
            </a>
          );
        }
        return lp;
      });
    });

    // Numbered list
    const numMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (numMatch) {
      elements.push(
        <div key={i} className="flex gap-2 py-0.5">
          <span className="text-amber-500 dark:text-amber-400 font-semibold text-xs min-w-[18px] text-right mt-0.5">
            {numMatch[1]}.
          </span>
          <span className="flex-1">{processed}</span>
        </div>
      );
      return;
    }

    // Bullet list
    if (line.startsWith("- ") || line.startsWith("• ")) {
      elements.push(
        <div key={i} className="flex gap-2 py-0.5">
          <span className="text-amber-500 dark:text-amber-400 mt-1">•</span>
          <span className="flex-1">{processed}</span>
        </div>
      );
      return;
    }

    // Empty line = paragraph break
    if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
      return;
    }

    elements.push(<div key={i}>{processed}</div>);
  });

  return elements;
}

export default function MessageBubble({
  role,
  content,
  isStreaming = false,
  avatarState = "idle",
}: MessageBubbleProps) {
  const prefersReducedMotion = useReducedMotion();
  const isAssistant = role === "assistant";

  const variants: Variants = prefersReducedMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.15 } },
      }
    : {
        hidden: { opacity: 0, y: 12, scale: 0.97 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { type: "spring" as const, damping: 20, stiffness: 300 },
        },
      };

  return (
    <motion.div
      className={`flex gap-2.5 ${isAssistant ? "justify-start" : "justify-end"} mb-4`}
      variants={variants}
      initial="hidden"
      animate="visible"
      role="article"
      aria-label={
        isAssistant
          ? `Kapri says: ${content.slice(0, 100)}`
          : `You said: ${content.slice(0, 100)}`
      }
      aria-busy={isStreaming}
    >
      {isAssistant && <KapriAvatar state={avatarState} size={32} />}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed break-words ${
          isAssistant
            ? "bg-white dark:bg-gray-800/90 text-gray-800 dark:text-gray-100 shadow-sm border border-gray-100 dark:border-gray-700/50"
            : "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md"
        }`}
      >
        {isAssistant ? renderMarkdown(content) : content}
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 ml-0.5 bg-amber-500 dark:bg-amber-400 animate-pulse rounded-sm align-text-bottom" />
        )}
      </div>
    </motion.div>
  );
}
