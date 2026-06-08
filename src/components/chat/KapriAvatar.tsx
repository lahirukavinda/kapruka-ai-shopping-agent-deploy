"use client";

import { motion, type Variants } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { AvatarState } from "@/types";

interface KapriAvatarProps {
  state: AvatarState;
  size?: number;
}

const stateColors: Record<AvatarState, string> = {
  idle: "#f9ac1b",
  thinking: "#a78bfa",
  excited: "#fb923c",
  celebrating: "#34d399",
  empathetic: "#f472b6",
};

const stateEmojis: Record<AvatarState, string> = {
  idle: "🛍️",
  thinking: "🤔",
  excited: "✨",
  celebrating: "🎉",
  empathetic: "💛",
};

export default function KapriAvatar({ state, size = 32 }: KapriAvatarProps) {
  const reducedMotion = useReducedMotion();

  const variants: Variants = reducedMotion
    ? {
        idle: {},
        thinking: { opacity: [0.85, 1] },
        excited: { opacity: 1 },
        celebrating: { opacity: 1 },
        empathetic: { opacity: 0.9 },
      }
    : {
        idle: {
          y: [0, -2, 0],
          transition: { repeat: Infinity, duration: 3, ease: "easeInOut" as const },
        },
        thinking: {
          scale: [1, 1.05, 1],
          transition: { repeat: Infinity, duration: 1.2, ease: "easeInOut" as const },
        },
        excited: {
          scale: [1, 1.15, 1],
          transition: { duration: 0.4 },
        },
        celebrating: {
          rotate: [0, -5, 5, -5, 0],
          scale: [1, 1.1, 1],
          transition: { duration: 0.6 },
        },
        empathetic: {
          opacity: [0.85, 1, 0.85],
          transition: { repeat: Infinity, duration: 2, ease: "easeInOut" as const },
        },
      };

  return (
    <motion.div
      className="flex items-center justify-center rounded-full flex-shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: stateColors[state],
      }}
      animate={state}
      variants={variants}
      aria-label={`Kapri is ${state}`}
      role="img"
    >
      <span style={{ fontSize: size * 0.5 }} aria-hidden="true">
        {stateEmojis[state]}
      </span>
    </motion.div>
  );
}
