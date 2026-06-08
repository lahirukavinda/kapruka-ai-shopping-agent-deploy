"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import AuraAvatar from "./AuraAvatar";
import type { AvatarState } from "@/types";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  avatarState?: AvatarState;
}

function formatInline(text: string): React.ReactNode[] {
  // Split by bold, links, and images
  return text.split(/(\*\*[^*]+\*\*|!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\([^)]+\))/g).map((part, j) => {
    // Bold
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    // Image ![alt](url) — render as link text since images in chat are noisy
    const imgMatch = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      return (
        <a
          key={j}
          href={imgMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-aura-gold dark:text-aura-goldenLight underline decoration-aura-gold/30 hover:decoration-aura-gold transition-colors"
        >
          {imgMatch[1] || "View image"}
        </a>
      );
    }
    // Link [text](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={j}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-aura-gold dark:text-aura-goldenLight underline decoration-aura-gold/30 hover:decoration-aura-gold transition-colors"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return part;
  });
}

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    // Headings (### ## #)
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const cls = level === 1
        ? "text-base font-bold mt-2 mb-1"
        : level === 2
          ? "text-sm font-bold mt-2 mb-0.5"
          : "text-sm font-semibold mt-1.5 mb-0.5 text-aura-gold dark:text-aura-goldenLight";
      elements.push(<div key={i} className={cls}>{formatInline(headingMatch[2])}</div>);
      return;
    }

    // Numbered list
    const numMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (numMatch) {
      elements.push(
        <div key={i} className="flex gap-2 py-0.5">
          <span className="text-aura-gold dark:text-aura-goldenLight font-semibold text-xs min-w-[18px] text-right mt-0.5">
            {numMatch[1]}.
          </span>
          <span className="flex-1">{formatInline(numMatch[2])}</span>
        </div>
      );
      return;
    }

    // Bullet list
    if (line.startsWith("- ") || line.startsWith("• ")) {
      const content = line.slice(2);
      elements.push(
        <div key={i} className="flex gap-2 py-0.5">
          <span className="text-aura-gold dark:text-aura-goldenLight mt-1">•</span>
          <span className="flex-1">{formatInline(content)}</span>
        </div>
      );
      return;
    }

    // Empty line = paragraph break
    if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
      return;
    }

    elements.push(<div key={i}>{formatInline(line)}</div>);
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
          ? `Aura says: ${content.slice(0, 100)}`
          : `You said: ${content.slice(0, 100)}`
      }
      aria-busy={isStreaming}
    >
      {isAssistant && <AuraAvatar state={avatarState} size={32} />}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed break-words ${
          isAssistant
            ? "assistant-bubble text-gray-800 dark:text-gray-100"
            : "user-bubble text-white shadow-lg"
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
