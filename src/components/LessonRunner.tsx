"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/Nav";
import LessonPlayer, {
  type LessonCompleteSummary,
  type LessonCorrectEvent,
} from "@/components/LessonPlayer";
import { DEFAULT_XP_PER_CORRECT_ANSWER } from "@/lib/gamification/engine";
import type { GamificationState, Lesson, Tier } from "@/lib/types";

interface ProgressApiProfile {
  tier: Tier;
  xp: number;
  hearts: number | null;
  maxHearts: number | null;
  streakDays: number;
  streakFreezeAvailable: boolean;
  lastActiveDateISO: string;
  badges: string[];
}

interface ProgressApiResponse {
  profile: ProgressApiProfile;
}

function fromApiProfile(apiProfile: ProgressApiProfile): {
  tier: Tier;
  gamification: GamificationState;
} {
  const { tier, hearts, maxHearts, ...rest } = apiProfile;
  return {
    tier,
    gamification: {
      ...rest,
      hearts: hearts ?? Infinity,
      maxHearts: maxHearts ?? Infinity,
    },
  };
}

interface LessonRunnerProps {
  lesson: Lesson;
  initialTier: Tier;
  initialGamification: GamificationState;
}

export default function LessonRunner({ lesson, initialTier, initialGamification }: LessonRunnerProps) {
  const router = useRouter();
  const [tier, setTier] = useState(initialTier);
  const [gamification, setGamification] = useState(initialGamification);

  const persist = useCallback(
    async (body: Record<string, unknown>) => {
      try {
        const response = await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonId: lesson.id, subject: lesson.subject, ...body }),
        });
        if (!response.ok) return;
        const data: ProgressApiResponse = await response.json();
        const next = fromApiProfile(data.profile);
        setTier(next.tier);
        setGamification(next.gamification);
      } catch {
        // Local-first, best-effort: LessonPlayer's own question flow and session
        // XP counter keep working fully offline even if a save round-trip fails —
        // only this event's persisted XP/heart/streak change is lost.
      }
    },
    [lesson.id, lesson.subject],
  );

  const handleCorrect = useCallback(
    (event: LessonCorrectEvent) => {
      void persist({ correct: true, xpAward: event.xpAwarded });
    },
    [persist],
  );

  const handleIncorrect = useCallback(() => {
    void persist({ correct: false });
  }, [persist]);

  const handleComplete = useCallback(
    (summary: LessonCompleteSummary) => {
      void persist({ completeLesson: true, scorePercent: summary.scorePercent });
    },
    [persist],
  );

  const handleExit = useCallback(() => {
    router.push(`/subjects/${lesson.subject}`);
  }, [router, lesson.subject]);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Nav gamification={gamification} tier={tier} />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
        <LessonPlayer
          key={lesson.id}
          lesson={lesson}
          hearts={gamification.hearts}
          maxHearts={gamification.maxHearts}
          streakDays={gamification.streakDays}
          streakFreezeAvailable={gamification.streakFreezeAvailable}
          xpPerCorrectAnswer={DEFAULT_XP_PER_CORRECT_ANSWER}
          onCorrect={handleCorrect}
          onIncorrect={handleIncorrect}
          onComplete={handleComplete}
          onExit={handleExit}
        />
      </main>
    </div>
  );
}
