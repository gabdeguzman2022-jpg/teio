"use client";

import { AnimatePresence, motion, useReducedMotion, type Transition } from "framer-motion";
import { cn } from "@/lib/utils";

export type MascotExpression = "idle" | "happy" | "sad" | "celebrating";

interface MascotCharacterProps {
  expression: MascotExpression;
  size?: number;
  className?: string;
}

const SPARKLES = [
  { x: 14, y: 18, delay: 0 },
  { x: 86, y: 12, delay: 0.15 },
  { x: 90, y: 52, delay: 0.3 },
];

function starPoints(cx: number, cy: number, outerR: number, innerR: number) {
  const points = 4;
  let d = "";
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    d += `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  return `${d}Z`;
}

function MascotFace({ expression }: { expression: MascotExpression }) {
  switch (expression) {
    case "happy":
      return (
        <>
          <circle cx="37" cy="45" r="5.5" className="fill-ink" />
          <circle cx="63" cy="45" r="5.5" className="fill-ink" />
          <circle cx="25" cy="56" r="5" className="fill-accent-300" opacity="0.85" />
          <circle cx="75" cy="56" r="5" className="fill-accent-300" opacity="0.85" />
          <path
            d="M35 60 Q50 76 65 60"
            className="stroke-ink"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M10 62 Q2 50 8 38" className="stroke-ink" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M90 62 Q98 50 92 38" className="stroke-ink" strokeWidth="4" strokeLinecap="round" fill="none" />
        </>
      );
    case "sad":
      return (
        <>
          <path d="M31 39 L44 44" className="stroke-ink" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M69 39 L56 44" className="stroke-ink" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="37" cy="49" r="5" className="fill-ink" />
          <circle cx="63" cy="49" r="5" className="fill-ink" />
          <path
            d="M36 68 Q50 56 64 68"
            className="stroke-ink"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M71 50 Q77 58 71 65 Q65 58 71 50 Z"
            className="fill-primary-200 stroke-ink"
            strokeWidth="2"
          />
          <path d="M14 66 Q8 60 12 52" className="stroke-ink" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M86 66 Q92 60 88 52" className="stroke-ink" strokeWidth="4" strokeLinecap="round" fill="none" />
        </>
      );
    case "celebrating":
      return (
        <>
          <path d="M31 45 Q37 39 43 45" className="stroke-ink" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M57 45 Q63 39 69 45" className="stroke-ink" strokeWidth="4" strokeLinecap="round" fill="none" />
          <circle cx="25" cy="56" r="5" className="fill-accent-300" opacity="0.9" />
          <circle cx="75" cy="56" r="5" className="fill-accent-300" opacity="0.9" />
          <path
            d="M33 60 Q50 80 67 60"
            className="stroke-ink"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M12 60 Q-4 44 6 22" className="stroke-ink" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M88 60 Q104 44 94 22" className="stroke-ink" strokeWidth="4" strokeLinecap="round" fill="none" />
        </>
      );
    case "idle":
    default:
      return (
        <>
          <circle cx="37" cy="46" r="5.5" className="fill-ink" />
          <circle cx="63" cy="46" r="5.5" className="fill-ink" />
          <path
            d="M40 62 Q50 66 60 62"
            className="stroke-ink"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M10 60 Q6 54 9 47" className="stroke-ink" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M90 60 Q94 54 91 47" className="stroke-ink" strokeWidth="4" strokeLinecap="round" fill="none" />
        </>
      );
  }
}

/**
 * Simple geometric placeholder mascot — a body + a crossfaded face group so
 * expression changes don't require remounting the whole figure. Elaborate
 * illustration is deliberately out of scope; this is a stand-in for later polish.
 */
export default function MascotCharacter({ expression, size = 96, className }: MascotCharacterProps) {
  const reducedMotion = useReducedMotion();

  const bodyAnimate = reducedMotion
    ? undefined
    : expression === "celebrating"
      ? { y: [0, -10, 0], rotate: [-4, 4, -4] }
      : expression === "sad"
        ? { y: 4, rotate: -3 }
        : { y: [0, -3, 0], rotate: 0 };

  const bodyTransition: Transition =
    !reducedMotion && expression === "celebrating"
      ? { duration: 0.7, repeat: Infinity, ease: "easeInOut" }
      : !reducedMotion && expression !== "sad"
        ? { duration: 2.6, repeat: Infinity, ease: "easeInOut" }
        : { duration: 0.4 };

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={cn("overflow-visible", className)}
      role="img"
      aria-label={`Teio mascot, ${expression}`}
    >
      <motion.g animate={bodyAnimate} transition={bodyTransition}>
        <rect
          x="12"
          y="18"
          width="76"
          height="68"
          rx="30"
          className="fill-primary-500 stroke-ink"
          strokeWidth="4"
        />
        <circle cx="50" cy="10" r="5" className="fill-accent-400 stroke-ink" strokeWidth="3" />
        <line x1="50" y1="15" x2="50" y2="20" className="stroke-ink" strokeWidth="3" />
        <ellipse cx="26" cy="90" rx="9" ry="4" className="fill-ink" opacity="0.15" />
        <ellipse cx="74" cy="90" rx="9" ry="4" className="fill-ink" opacity="0.15" />
        <AnimatePresence>
          <motion.g
            key={expression}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.18 }}
          >
            <MascotFace expression={expression} />
          </motion.g>
        </AnimatePresence>
      </motion.g>
      {expression === "celebrating" &&
        !reducedMotion &&
        SPARKLES.map((s, i) => (
          <motion.path
            key={i}
            d={starPoints(s.x, s.y, 4.5, 1.8)}
            className="fill-accent-300 stroke-ink"
            strokeWidth="1.5"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: [0, 1, 0], scale: [0.4, 1, 0.4] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: s.delay }}
          />
        ))}
    </svg>
  );
}
