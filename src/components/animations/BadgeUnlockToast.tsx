"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Award } from "lucide-react";
import ConfettiBurst from "@/components/animations/ConfettiBurst";

export interface UnlockedBadge {
  id: string;
  name: string;
  description: string;
}

interface BadgeUnlockToastProps {
  badges: UnlockedBadge[];
  onDismiss: (id: string) => void;
}

const AUTO_DISMISS_MS = 4500;

/**
 * A distinct celebratory moment for badges, separate from the generic
 * lesson-complete confetti — badges are one of the four core gamification
 * pillars and previously had no feedback at all when unlocked.
 */
export default function BadgeUnlockToast({ badges, onDismiss }: BadgeUnlockToastProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-3 px-4"
      aria-live="polite"
    >
      {badges.length > 0 && <ConfettiBurst trigger={badges.length} intensity="burst" />}
      <AnimatePresence>
        {badges.map((b) => (
          <BadgeToastCard key={b.id} badge={b} reducedMotion={!!reducedMotion} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function BadgeToastCard({
  badge,
  reducedMotion,
  onDismiss,
}: {
  badge: UnlockedBadge;
  reducedMotion: boolean;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timeout = setTimeout(() => onDismiss(badge.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timeout);
  }, [badge.id, onDismiss]);

  return (
    <motion.div
      layout
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -24, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.95 }}
      transition={reducedMotion ? { duration: 0.15 } : { type: "spring", stiffness: 320, damping: 24 }}
      role="status"
      onClick={() => onDismiss(badge.id)}
      className="pointer-events-auto flex w-full max-w-sm cursor-pointer items-center gap-3 rounded-2xl border-[3px] border-ink bg-accent-100 p-4 shadow-[6px_6px_0_0_var(--color-ink)]"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-accent-400">
        <Award size={22} className="text-ink" />
      </span>
      <div>
        <p className="font-display text-xs font-bold uppercase tracking-wide text-accent-700">
          Badge unlocked
        </p>
        <p className="font-display text-base font-bold text-ink">{badge.name}</p>
        <p className="text-xs text-ink/70">{badge.description}</p>
      </div>
    </motion.div>
  );
}
