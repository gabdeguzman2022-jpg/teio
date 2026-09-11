"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Flame, Snowflake } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakBannerProps {
  streakDays: number;
  freezeAvailable?: boolean;
  className?: string;
}

export default function StreakBanner({
  streakDays,
  freezeAvailable = false,
  className,
}: StreakBannerProps) {
  const reducedMotion = useReducedMotion();
  const active = streakDays > 0;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border-[3px] border-ink px-4 py-3 shadow-[4px_4px_0_0_var(--color-ink)]",
        active ? "bg-accent-300" : "bg-white",
        className,
      )}
    >
      <motion.div
        animate={
          !reducedMotion && active ? { scale: [1, 1.12, 1], rotate: [0, -4, 4, 0] } : undefined
        }
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-white"
      >
        <Flame size={22} className={active ? "fill-accent-500 stroke-accent-700" : "stroke-ink/40"} />
      </motion.div>
      <div className="flex flex-col">
        <span className="font-display text-xl font-bold leading-none text-ink">
          {active ? `${streakDays} day${streakDays === 1 ? "" : "s"}` : "No streak yet"}
        </span>
        <span className="text-sm font-medium text-ink/60">
          {active ? "Keep it going today" : "Finish a lesson to start one"}
        </span>
      </div>
      {freezeAvailable && (
        <span className="ml-auto flex shrink-0 items-center gap-1 rounded-full border-2 border-ink bg-primary-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-primary-700">
          <Snowflake size={14} />
          Freeze ready
        </span>
      )}
    </div>
  );
}
