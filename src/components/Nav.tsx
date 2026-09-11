"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Cog, Cpu, FlaskConical, Flame, Heart, Menu, Sigma, X, Zap } from "lucide-react";
import type { ComponentType } from "react";
import type { GamificationState, Subject, Tier } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface NavProps {
  gamification?: GamificationState;
  tier?: Tier;
}

const DEFAULT_GAMIFICATION: GamificationState = {
  xp: 0,
  hearts: 5,
  maxHearts: 5,
  streakDays: 0,
  streakFreezeAvailable: true,
  lastActiveDateISO: new Date(0).toISOString(),
  badges: [],
};

const NAV_SUBJECTS: {
  subject: Subject;
  label: string;
  Icon: ComponentType<{ className?: string; strokeWidth?: number }>;
}[] = [
  { subject: "math", label: "Math", Icon: Sigma },
  { subject: "science", label: "Science", Icon: FlaskConical },
  { subject: "technology", label: "Technology", Icon: Cpu },
  { subject: "engineering", label: "Engineering", Icon: Cog },
];

const TIER_LABEL: Record<Tier, string> = { free: "Free", pro: "Pro", max: "Max" };

const TIER_CLASS: Record<Tier, string> = {
  free: "border-ink/30 bg-white text-ink/60",
  pro: "border-primary-600 bg-primary-100 text-primary-700",
  max: "border-ink bg-accent-300 text-ink",
};

function TeioMark() {
  return (
    <svg width="32" height="32" viewBox="0 0 40 40" aria-hidden="true" className="shrink-0">
      <rect
        x="3"
        y="6"
        width="34"
        height="30"
        rx="12"
        fill="var(--color-primary-500)"
        stroke="var(--color-ink)"
        strokeWidth="3"
      />
      <circle cx="14" cy="10" r="3" fill="var(--color-accent-400)" stroke="var(--color-ink)" strokeWidth="2" />
      <circle cx="26" cy="10" r="3" fill="var(--color-accent-400)" stroke="var(--color-ink)" strokeWidth="2" />
      <circle cx="15" cy="22" r="3" fill="var(--color-ink)" />
      <circle cx="25" cy="22" r="3" fill="var(--color-ink)" />
      <path
        d="M14 29c2.5 3 9.5 3 12 0"
        stroke="var(--color-ink)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function StatPill({
  icon: Icon,
  value,
  tone,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  value: number | string;
  tone: "danger" | "accent" | "primary";
}) {
  const toneClass = {
    danger: "text-danger-600",
    accent: "text-accent-600",
    primary: "text-primary-600",
  }[tone];

  return (
    <span className="flex items-center gap-1 rounded-full border-2 border-ink bg-white px-2 py-1 text-sm font-bold text-ink">
      <Icon className={cn("h-4 w-4", toneClass)} strokeWidth={2.5} />
      {value}
    </span>
  );
}

export function Nav({ gamification = DEFAULT_GAMIFICATION, tier = "max" }: NavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const heartsDisplay = Number.isFinite(gamification.hearts) ? gamification.hearts : "∞";

  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-ink bg-cream">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <TeioMark />
          <span className="font-display text-xl font-bold tracking-tight text-primary-700">
            Teio
          </span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {NAV_SUBJECTS.map(({ subject, label, Icon }) => {
            const active = pathname === `/subjects/${subject}`;
            return (
              <Link
                key={subject}
                href={`/subjects/${subject}`}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-sm font-bold transition-colors",
                  active
                    ? "border-ink bg-primary-600 text-white"
                    : "border-transparent text-ink/70 hover:border-ink/20 hover:bg-ink/5",
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={2.5} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <StatPill icon={Heart} value={heartsDisplay} tone="danger" />
          <StatPill icon={Flame} value={gamification.streakDays} tone="accent" />
          <span className="hidden sm:inline-flex">
            <StatPill icon={Zap} value={gamification.xp} tone="primary" />
          </span>
          <span
            className={cn(
              "hidden items-center rounded-full border-2 px-2.5 py-1 text-xs font-bold uppercase tracking-wide sm:inline-flex",
              TIER_CLASS[tier],
            )}
          >
            {TIER_LABEL[tier]}
          </span>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink sm:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t-2 border-ink/10 sm:hidden"
          >
            <nav className="flex flex-col gap-1 px-4 py-3">
              {NAV_SUBJECTS.map(({ subject, label, Icon }) => (
                <Link
                  key={subject}
                  href={`/subjects/${subject}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-xl border-2 border-ink/10 px-3 py-2 text-sm font-bold text-ink hover:border-ink/30"
                >
                  <Icon className="h-4 w-4" strokeWidth={2.5} />
                  {label}
                </Link>
              ))}
              <div className="mt-1 flex items-center justify-between rounded-xl border-2 border-ink/10 px-3 py-2">
                <span className="flex items-center gap-1.5 text-sm font-bold text-ink/70">
                  <Zap className="h-4 w-4 text-primary-600" strokeWidth={2.5} />
                  {gamification.xp} XP
                </span>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border-2 px-2.5 py-1 text-xs font-bold uppercase tracking-wide",
                    TIER_CLASS[tier],
                  )}
                >
                  {TIER_LABEL[tier]}
                </span>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
