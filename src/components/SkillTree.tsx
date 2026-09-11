"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, Lock, Play, Star } from "lucide-react";
import type { Lesson, Subject, UserProgress } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface SkillTreeProps {
  subject: Subject;
  lessons: Lesson[];
  progress: UserProgress[];
  onSelectLesson?: (lessonId: string) => void;
  className?: string;
}

type LessonStatus = "locked" | "unlocked" | "completed";

interface SubjectVisual {
  bgClass: string;
  onInk: boolean;
}

const SUBJECT_VISUALS: Record<Subject, SubjectVisual> = {
  math: { bgClass: "bg-primary-600", onInk: false },
  science: { bgClass: "bg-success-500", onInk: true },
  technology: { bgClass: "bg-ink", onInk: false },
  engineering: { bgClass: "bg-accent-500", onInk: true },
};

const ROW_ALIGN = ["justify-center", "justify-end", "justify-center", "justify-start"];

function starsForScore(bestScorePercent: number) {
  if (bestScorePercent >= 90) return 3;
  if (bestScorePercent >= 70) return 2;
  return 1;
}

function LessonNode({
  lesson,
  status,
  bestScorePercent,
  visual,
  onSelect,
  reduceMotion,
}: {
  lesson: Lesson;
  status: LessonStatus;
  bestScorePercent: number;
  visual: SubjectVisual;
  onSelect?: (lessonId: string) => void;
  reduceMotion: boolean;
}) {
  const isInteractive = status !== "locked";
  const stars = status === "completed" ? starsForScore(bestScorePercent) : 0;

  return (
    <div className="flex flex-col items-center gap-2">
      {status === "unlocked" && (
        <span
          className={cn(
            "rounded-full border-2 border-ink px-3 py-1 text-xs font-bold uppercase tracking-wide text-white",
            visual.bgClass,
          )}
        >
          Start
        </span>
      )}
      <div className="relative">
        {status === "unlocked" && !reduceMotion && (
          <motion.span
            aria-hidden
            className={cn("absolute inset-0 rounded-full", visual.bgClass)}
            style={{ opacity: 0.35 }}
            animate={{ scale: [1, 1.35, 1], opacity: [0.35, 0, 0.35] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <motion.button
          type="button"
          disabled={!isInteractive}
          aria-disabled={!isInteractive}
          aria-label={`${lesson.title} — ${status}`}
          onClick={() => isInteractive && onSelect?.(lesson.id)}
          whileHover={isInteractive ? { scale: 1.06 } : undefined}
          whileTap={isInteractive ? { scale: 0.94, y: 2 } : undefined}
          className={cn(
            "relative flex h-16 w-16 items-center justify-center rounded-full border-[3px]",
            status === "locked"
              ? "cursor-not-allowed border-ink/20 bg-ink/5 text-ink/30"
              : cn(
                  "border-ink shadow-[4px_4px_0_0_var(--color-ink)] text-white",
                  visual.bgClass,
                  visual.onInk && "text-ink",
                ),
          )}
        >
          {status === "locked" && <Lock className="h-5 w-5" strokeWidth={2.5} />}
          {status === "unlocked" && <Play className="h-5 w-5 fill-current" strokeWidth={2.5} />}
          {status === "completed" && <Check className="h-6 w-6" strokeWidth={3} />}
        </motion.button>
      </div>
      <span className="max-w-[6.5rem] text-center text-xs font-bold leading-tight text-ink/80">
        {lesson.title}
      </span>
      {status === "completed" && (
        <div className="flex gap-0.5">
          {[1, 2, 3].map((n) => (
            <Star
              key={n}
              className={cn(
                "h-3.5 w-3.5",
                n <= stars ? "fill-accent-400 text-accent-500" : "fill-transparent text-ink/20",
              )}
              strokeWidth={2}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function SkillTree({ subject, lessons, progress, onSelectLesson, className }: SkillTreeProps) {
  const reduceMotion = !!useReducedMotion();
  const visual = SUBJECT_VISUALS[subject];
  const sorted = [...lessons].filter((l) => l.subject === subject).sort((a, b) => a.order - b.order);
  const progressMap = new Map(progress.map((p) => [p.lessonId, p]));
  const completedCount = sorted.filter((l) => progressMap.get(l.id)?.completed).length;

  if (sorted.length === 0) {
    return (
      <div
        className={cn(
          "rounded-[28px] border-[3px] border-dashed border-ink/30 bg-white/50 p-8 text-center text-sm font-bold text-ink/50",
          className,
        )}
      >
        No lessons yet for this subject.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-[28px] border-[3px] border-ink bg-white px-4 py-8 shadow-[6px_6px_0_0_var(--color-ink)] sm:px-8",
        className,
      )}
    >
      <div className="mb-8 flex items-center justify-between px-2">
        <h2 className="font-display text-xl font-bold capitalize text-ink">{subject}</h2>
        <span className="rounded-full border-2 border-ink bg-cream px-3 py-1 text-xs font-bold text-ink/70">
          {completedCount}/{sorted.length} complete
        </span>
      </div>

      <div className="mx-auto flex max-w-xs flex-col items-stretch">
        {sorted.map((lesson, index) => {
          const entry = progressMap.get(lesson.id);
          const prevCompleted = index === 0 || !!progressMap.get(sorted[index - 1].id)?.completed;
          const status: LessonStatus = entry?.completed
            ? "completed"
            : prevCompleted
              ? "unlocked"
              : "locked";

          return (
            <div key={lesson.id} className="flex flex-col items-center">
              {index > 0 && <span aria-hidden className="h-6 w-1 rounded-full bg-ink/15" />}
              <div className={cn("flex w-full py-1", ROW_ALIGN[index % ROW_ALIGN.length])}>
                <motion.div
                  initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
                  animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.35 }}
                >
                  <LessonNode
                    lesson={lesson}
                    status={status}
                    bestScorePercent={entry?.bestScorePercent ?? 0}
                    visual={visual}
                    onSelect={onSelectLesson}
                    reduceMotion={reduceMotion}
                  />
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
