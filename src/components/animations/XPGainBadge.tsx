"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface XPGainEvent {
  id: number;
  amount: number;
}

interface XPGainBadgeProps {
  events: XPGainEvent[];
  className?: string;
}

export default function XPGainBadge({ events, className }: XPGainBadgeProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div className={cn("pointer-events-none relative", className)}>
      <AnimatePresence>
        {events.map((event) => (
          <motion.span
            key={event.id}
            initial={{ opacity: 0, y: 6, scale: 0.7 }}
            animate={{ opacity: 1, y: reducedMotion ? 0 : -26, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.2 : 0.8, ease: "easeOut" }}
            className="absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap rounded-full border-2 border-ink bg-accent-300 px-3 py-1 font-display text-sm font-bold text-ink shadow-[2px_2px_0_0_var(--color-ink)]"
          >
            +{event.amount} XP
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
