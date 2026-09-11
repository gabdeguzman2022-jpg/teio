"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, RotateCcw, X } from "lucide-react";
import type { Lesson, Question } from "@/lib/types";
import { cn } from "@/lib/utils";
import MascotCharacter, { type MascotExpression } from "@/components/MascotCharacter";
import HeartsDisplay from "@/components/HeartsDisplay";
import StreakBanner from "@/components/StreakBanner";
import PressableButton from "@/components/animations/PressableButton";
import ConfettiBurst from "@/components/animations/ConfettiBurst";
import XPCounter from "@/components/animations/XPCounter";
import XPGainBadge, { type XPGainEvent } from "@/components/animations/XPGainBadge";

export interface LessonAnswerEvent {
  lesson: Lesson;
  question: Question;
  questionIndex: number;
}

export interface LessonCorrectEvent extends LessonAnswerEvent {
  xpAwarded: number;
}

export interface LessonCompleteSummary {
  lesson: Lesson;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  scorePercent: number;
  xpGained: number;
}

interface LessonPlayerProps {
  lesson: Lesson;
  hearts?: number;
  maxHearts?: number;
  streakDays?: number;
  streakFreezeAvailable?: boolean;
  xpPerCorrectAnswer?: number;
  onCorrect?: (event: LessonCorrectEvent) => void;
  onIncorrect?: (event: LessonAnswerEvent) => void;
  onComplete?: (summary: LessonCompleteSummary) => void;
  onExit?: () => void;
  className?: string;
}

type Phase = "intro" | "active" | "complete";
type AnswerStatus = "unanswered" | "correct" | "incorrect";

function isAnswerCorrect(question: Question, choice: number | null, numeric: string): boolean {
  if (question.type === "multiple-choice") {
    return choice === question.correctChoiceIndex;
  }
  const parsed = Number.parseFloat(numeric);
  if (Number.isNaN(parsed)) return false;
  const tolerance = question.tolerance ?? 0;
  return Math.abs(parsed - question.correctAnswer) <= tolerance;
}

/**
 * Purely a UI/flow layer: it never touches hearts, XP, or streak state
 * directly. `hearts`/`maxHearts`/`streakDays` are read-only display props the
 * gamification wiring owns, and onCorrect/onIncorrect/onComplete are the only
 * way this component reports outcomes back. Parents should render this with
 * `key={lesson.id}` so switching lessons remounts a clean run.
 */
export default function LessonPlayer({
  lesson,
  hearts = Infinity,
  maxHearts = Infinity,
  streakDays = 0,
  streakFreezeAvailable = false,
  xpPerCorrectAnswer = 10,
  onCorrect,
  onIncorrect,
  onComplete,
  onExit,
  className,
}: LessonPlayerProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [numericValue, setNumericValue] = useState("");
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>("unanswered");
  const [results, setResults] = useState<boolean[]>([]);
  const [sessionXp, setSessionXp] = useState(0);
  const [correctBurst, setCorrectBurst] = useState(0);
  const [completeBurst, setCompleteBurst] = useState(0);
  const [xpEvents, setXpEvents] = useState<XPGainEvent[]>([]);

  const xpEventIdRef = useRef(0);
  const completeCalledRef = useRef(false);
  const pendingTimeouts = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const timeouts = pendingTimeouts.current;
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (phase !== "complete" || completeCalledRef.current) return;
    completeCalledRef.current = true;
    setCompleteBurst((b) => b + 1);
    const correctCount = results.filter(Boolean).length;
    const total = lesson.questions.length;
    onComplete?.({
      lesson,
      totalQuestions: total,
      correctCount,
      incorrectCount: total - correctCount,
      scorePercent: total === 0 ? 0 : Math.round((correctCount / total) * 100),
      xpGained: sessionXp,
    });
  }, [phase, results, sessionXp, lesson, onComplete]);

  const total = lesson.questions.length;
  const question = lesson.questions[questionIndex] as Question | undefined;
  const isLastQuestion = questionIndex >= total - 1;
  const blocked = !Number.isFinite(maxHearts) ? false : hearts <= 0;

  const mascotExpression: MascotExpression = useMemo(() => {
    if (phase === "complete") return "celebrating";
    if (blocked) return "sad";
    if (answerStatus === "correct") return "happy";
    if (answerStatus === "incorrect") return "sad";
    return "idle";
  }, [phase, blocked, answerStatus]);

  function resetQuestionInputs() {
    setAnswerStatus("unanswered");
    setSelectedChoice(null);
    setNumericValue("");
  }

  function handleStart() {
    setPhase("active");
  }

  function handleCheck() {
    if (!question || answerStatus !== "unanswered") return;
    const correct = isAnswerCorrect(question, selectedChoice, numericValue);
    setAnswerStatus(correct ? "correct" : "incorrect");
    setResults((prev) => [...prev, correct]);

    if (correct) {
      setSessionXp((xp) => xp + xpPerCorrectAnswer);
      setCorrectBurst((b) => b + 1);
      const id = ++xpEventIdRef.current;
      setXpEvents((prev) => [...prev, { id, amount: xpPerCorrectAnswer }]);
      const timeout = setTimeout(() => {
        setXpEvents((prev) => prev.filter((e) => e.id !== id));
        pendingTimeouts.current.delete(timeout);
      }, 1000);
      pendingTimeouts.current.add(timeout);
      onCorrect?.({ lesson, question, questionIndex, xpAwarded: xpPerCorrectAnswer });
    } else {
      onIncorrect?.({ lesson, question, questionIndex });
    }
  }

  function handleContinue() {
    if (isLastQuestion) {
      setPhase("complete");
      return;
    }
    setQuestionIndex((i) => i + 1);
    resetQuestionInputs();
  }

  function handleRetry() {
    completeCalledRef.current = false;
    setPhase("active");
    setQuestionIndex(0);
    setResults([]);
    setSessionXp(0);
    resetQuestionInputs();
  }

  const canCheck = question
    ? question.type === "multiple-choice"
      ? selectedChoice !== null
      : numericValue.trim() !== ""
    : false;

  if (total === 0) {
    return (
      <div className={cn("rounded-2xl border-[3px] border-ink bg-white p-6 text-center", className)}>
        <p className="font-display text-lg font-bold">This lesson has no questions yet.</p>
      </div>
    );
  }

  if (phase === "complete") {
    const correctCount = results.filter(Boolean).length;
    const scorePercent = Math.round((correctCount / total) * 100);
    return (
      <div className={cn("mx-auto flex w-full max-w-xl flex-col items-center gap-6 text-center", className)}>
        <ConfettiBurst trigger={completeBurst} intensity="big" />
        <MascotCharacter expression="celebrating" size={120} />
        <div>
          <h2 className="font-display text-3xl font-bold text-ink">Lesson complete!</h2>
          <p className="mt-1 text-ink/70">{lesson.title}</p>
        </div>
        <div className="grid w-full grid-cols-2 gap-4">
          <div className="rounded-2xl border-[3px] border-ink bg-primary-100 p-4">
            <XPCounter value={sessionXp} className="text-3xl" />
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-primary-700">
              XP gained
            </p>
          </div>
          <div className="rounded-2xl border-[3px] border-ink bg-accent-100 p-4">
            <span className="font-display text-3xl font-bold text-accent-700">
              {correctCount}/{total}
            </span>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-accent-700">
              {scorePercent}% correct
            </p>
          </div>
        </div>
        <StreakBanner
          streakDays={streakDays}
          freezeAvailable={streakFreezeAvailable}
          className="w-full"
        />
        <div className="flex w-full gap-3">
          <PressableButton variant="ghost" onClick={handleRetry} className="flex-1 justify-center">
            <span className="flex items-center justify-center gap-2">
              <RotateCcw size={18} />
              Practice again
            </span>
          </PressableButton>
          {onExit && (
            <PressableButton variant="primary" onClick={onExit} className="flex-1 justify-center text-center">
              Done
            </PressableButton>
          )}
        </div>
      </div>
    );
  }

  if (blocked) {
    return (
      <div className={cn("mx-auto flex w-full max-w-xl flex-col items-center gap-5 text-center", className)}>
        <MascotCharacter expression="sad" size={120} />
        <h2 className="font-display text-2xl font-bold text-ink">Out of hearts</h2>
        <p className="max-w-sm text-ink/70">
          You&apos;re out of hearts for now. They refill over time — come back soon to keep going
          with {lesson.title}.
        </p>
        <HeartsDisplay hearts={hearts} maxHearts={maxHearts} size="lg" />
        {onExit && (
          <PressableButton variant="primary" onClick={onExit}>
            Back to lessons
          </PressableButton>
        )}
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div className={cn("mx-auto flex w-full max-w-xl flex-col items-center gap-5 text-center", className)}>
        {onExit && (
          <button
            type="button"
            onClick={onExit}
            aria-label="Exit lesson"
            className="self-start rounded-full border-2 border-ink bg-white p-1.5 text-ink/70 hover:text-ink"
          >
            <X size={18} />
          </button>
        )}
        <MascotCharacter expression="idle" size={120} />
        <span className="rounded-full border-2 border-ink bg-primary-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary-700">
          {lesson.subject}
        </span>
        <h2 className="font-display text-3xl font-bold text-ink">{lesson.title}</h2>
        <p className="max-w-md text-ink/70">{lesson.teachingBlurb}</p>
        <PressableButton variant="primary" onClick={handleStart}>
          Start lesson
        </PressableButton>
      </div>
    );
  }

  if (!question) return null;

  const progressPercent = ((questionIndex + (answerStatus === "unanswered" ? 0 : 1)) / total) * 100;

  return (
    <div className={cn("mx-auto flex w-full max-w-xl flex-col gap-5", className)}>
      <ConfettiBurst trigger={correctBurst} intensity="burst" />

      <div className="flex items-center gap-3">
        {onExit && (
          <button
            type="button"
            onClick={onExit}
            aria-label="Exit lesson"
            className="rounded-full border-2 border-ink bg-white p-1.5 text-ink/70 hover:text-ink"
          >
            <X size={18} />
          </button>
        )}
        <div className="h-3 flex-1 overflow-hidden rounded-full border-2 border-ink bg-white">
          <motion.div
            className="h-full bg-primary-500"
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 22 }}
          />
        </div>
        <HeartsDisplay hearts={hearts} maxHearts={maxHearts} size="sm" />
      </div>

      <div className="relative flex justify-end">
        <div className="relative">
          <XPCounter value={sessionXp} />
          <XPGainBadge events={xpEvents} className="absolute left-1/2 top-0 -translate-x-1/2" />
        </div>
      </div>

      <div className="rounded-3xl border-[3px] border-ink bg-white p-6 shadow-[6px_6px_0_0_var(--color-ink)]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <p className="font-display text-xl font-bold leading-snug text-ink">{question.prompt}</p>
          <MascotCharacter expression={mascotExpression} size={64} className="shrink-0" />
        </div>

        {question.type === "multiple-choice" ? (
          <div className="flex flex-col gap-3">
            {question.choices.map((choice, i) => {
              const isCorrectChoice = i === question.correctChoiceIndex;
              const isSelected = selectedChoice === i;
              const state =
                answerStatus === "unanswered"
                  ? "default"
                  : isCorrectChoice
                    ? "correct"
                    : isSelected
                      ? "incorrect"
                      : "default";
              return (
                <PressableButton
                  key={i}
                  fullWidth
                  active={isSelected && answerStatus === "unanswered"}
                  state={state}
                  disabled={answerStatus !== "unanswered"}
                  onClick={() => setSelectedChoice(i)}
                >
                  {choice}
                </PressableButton>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <input
              type="number"
              inputMode="decimal"
              value={numericValue}
              onChange={(e) => setNumericValue(e.target.value)}
              disabled={answerStatus !== "unanswered"}
              placeholder="Your answer"
              aria-label={question.prompt}
              className="w-full rounded-2xl border-[3px] border-ink bg-white px-4 py-3 font-display text-lg font-semibold text-ink shadow-[4px_4px_0_0_var(--color-ink)] outline-none focus:border-primary-600 disabled:opacity-70"
            />
            {question.unit && (
              <span className="font-display text-lg font-semibold text-ink/60">{question.unit}</span>
            )}
          </div>
        )}

        <AnimatePresence>
          {answerStatus !== "unanswered" && (
            <motion.div
              initial={{ opacity: 0, y: 8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className={cn(
                "mt-4 overflow-hidden rounded-2xl border-2 px-4 py-3",
                answerStatus === "correct"
                  ? "border-success-600 bg-success-400/15"
                  : "border-danger-600 bg-danger-400/15",
              )}
            >
              <p
                className={cn(
                  "flex items-center gap-2 font-display font-bold",
                  answerStatus === "correct" ? "text-success-600" : "text-danger-600",
                )}
              >
                {answerStatus === "correct" ? <Check size={18} /> : <X size={18} />}
                {answerStatus === "correct"
                  ? "Correct!"
                  : question.type === "numeric"
                    ? `Not quite — the answer is ${question.correctAnswer}${question.unit ? ` ${question.unit}` : ""}.`
                    : "Not quite."}
              </p>
              {question.explanation && (
                <p className="mt-1 text-sm text-ink/70">{question.explanation}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-5">
          {answerStatus === "unanswered" ? (
            <PressableButton variant="primary" disabled={!canCheck} onClick={handleCheck} fullWidth>
              <span className="block text-center">Check</span>
            </PressableButton>
          ) : (
            <PressableButton variant="accent" onClick={handleContinue} fullWidth>
              <span className="block text-center">{isLastQuestion ? "Finish lesson" : "Continue"}</span>
            </PressableButton>
          )}
        </div>
      </div>
    </div>
  );
}
