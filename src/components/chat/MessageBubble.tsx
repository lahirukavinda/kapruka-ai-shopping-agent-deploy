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
        hidden: { opacity: 0, y: 12 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { type: "spring" as const, damping: 20, stiffness: 300 },
        },
      };

  return (
    <motion.div
      className={`flex gap-2 ${isAssistant ? "justify-start" : "justify-end"} mb-3`}
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
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isAssistant
            ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm border border-gray-100 dark:border-gray-700"
            : "bg-primary-500 text-white"
        }`}
      >
        {content}
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 ml-0.5 bg-primary-500 dark:bg-primary-400 animate-pulse rounded-sm" />
        )}
      </div>
    </motion.div>
  );
}
