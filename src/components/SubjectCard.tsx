"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Cog, Cpu, FlaskConical, Sigma, Trophy } from "lucide-react";
import type { ComponentType } from "react";
import type { Subject } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface SubjectCardProps {
  subject: Subject;
  completedLessons: number;
  totalLessons: number;
  href: string;
  className?: string;
}

interface SubjectVisual {
  label: string;
  blurb: string;
  Icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  bgClass: string;
  onInk: boolean;
}

const SUBJECT_VISUALS: Record<Subject, SubjectVisual> = {
  math: {
    label: "Math",
    blurb: "Algebra, geometry & problem solving",
    Icon: Sigma,
    bgClass: "bg-primary-600",
    onInk: false,
  },
  science: {
    label: "Science",
    blurb: "Matter, energy & the natural world",
    Icon: FlaskConical,
    bgClass: "bg-success-500",
    onInk: true,
  },
  technology: {
    label: "Technology",
    blurb: "Computing, data & digital systems",
    Icon: Cpu,
    bgClass: "bg-ink",
    onInk: false,
  },
  engineering: {
    label: "Engineering",
    blurb: "Design, build & solve real problems",
    Icon: Cog,
    bgClass: "bg-accent-500",
    onInk: true,
  },
};

function ProgressRing({ percent, onInk }: { percent: number; onInk: boolean }) {
  const size = 56;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percent));
  const offset = circumference * (1 - clamped / 100);
  const trackColor = onInk ? "rgba(23,20,35,0.18)" : "rgba(255,255,255,0.3)";
  const barColor = onInk ? "#171423" : "#ffffff";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={barColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center font-display text-xs font-bold",
          onInk ? "text-ink" : "text-white",
        )}
      >
        {Math.round(clamped)}%
      </span>
    </div>
  );
}

export function SubjectCard({
  subject,
  completedLessons,
  totalLessons,
  href,
  className,
}: SubjectCardProps) {
  const visual = SUBJECT_VISUALS[subject];
  const percent = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
  const isMastered = totalLessons > 0 && completedLessons >= totalLessons;
  const textClass = visual.onInk ? "text-ink" : "text-white";
  const subTextClass = visual.onInk ? "text-ink/70" : "text-white/80";

  return (
    <Link href={href} className={cn("block", className)}>
      <motion.div
        whileHover={{ y: -4 }}
        whileTap={{ y: 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
        className={cn(
          "relative rounded-[28px] border-[3px] border-ink p-5 shadow-[6px_6px_0_0_var(--color-ink)]",
          "transition-shadow hover:shadow-[8px_8px_0_0_var(--color-ink)] active:shadow-[2px_2px_0_0_var(--color-ink)]",
          visual.bgClass,
        )}
      >
        {isMastered && (
          <span className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-ink bg-accent-300 shadow-[3px_3px_0_0_var(--color-ink)]">
            <Trophy className="h-4 w-4 text-ink" strokeWidth={2.5} />
          </span>
        )}
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl border-[3px] border-ink",
              visual.onInk ? "bg-ink/10" : "bg-white/15",
            )}
          >
            <visual.Icon className={cn("h-6 w-6", textClass)} strokeWidth={2.5} />
          </div>
          <ProgressRing percent={percent} onInk={visual.onInk} />
        </div>
        <h3 className={cn("mt-4 font-display text-2xl font-bold", textClass)}>{visual.label}</h3>
        <p className={cn("mt-1 text-sm leading-snug", subTextClass)}>{visual.blurb}</p>
        <div
          className={cn(
            "mt-4 flex items-center justify-between border-t-2 pt-3 text-sm font-bold",
            visual.onInk ? "border-ink/15" : "border-white/25",
            textClass,
          )}
        >
          <span>
            {completedLessons}/{totalLessons} lessons
          </span>
          <span>{isMastered ? "Mastered" : completedLessons > 0 ? "Continue →" : "Start →"}</span>
        </div>
      </motion.div>
    </Link>
  );
}
