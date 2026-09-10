export type Subject = "math" | "science" | "technology" | "engineering";

interface QuestionBase {
  id: string;
  prompt: string;
  explanation?: string;
}

export interface MultipleChoiceQuestion extends QuestionBase {
  type: "multiple-choice";
  choices: string[];
  correctChoiceIndex: number;
}

export interface NumericQuestion extends QuestionBase {
  type: "numeric";
  correctAnswer: number;
  tolerance?: number;
  unit?: string;
}

export type Question = MultipleChoiceQuestion | NumericQuestion;

export interface Lesson {
  id: string;
  subject: Subject;
  order: number;
  title: string;
  teachingBlurb: string;
  questions: Question[];
}

export interface UserProgress {
  lessonId: string;
  completed: boolean;
  bestScorePercent: number;
  attempts: number;
  lastAttemptISO: string | null;
}

export interface GamificationState {
  xp: number;
  hearts: number;
  maxHearts: number;
  streakDays: number;
  streakFreezeAvailable: boolean;
  lastActiveDateISO: string;
  badges: string[];
}

export type Tier = "free" | "pro" | "max";

// maxHearts uses Infinity (a valid finite `number`-typed JS value) to mean
// unlimited, matching how hearts are stored/compared elsewhere; aiMessagesPerDay
// uses null for unlimited since a daily message count is naturally nullable.
export interface TierLimits {
  tier: Tier;
  maxHearts: number;
  aiMessagesPerDay: number | null;
  adsEnabled: boolean;
  stepByStepSolvingEnabled: boolean;
}

export const TIER_LIMITS: Record<Tier, TierLimits> = {
  free: {
    tier: "free",
    maxHearts: 5,
    aiMessagesPerDay: 5,
    adsEnabled: true,
    stepByStepSolvingEnabled: false,
  },
  pro: {
    tier: "pro",
    maxHearts: Infinity,
    aiMessagesPerDay: 20,
    adsEnabled: false,
    stepByStepSolvingEnabled: false,
  },
  max: {
    tier: "max",
    maxHearts: Infinity,
    aiMessagesPerDay: null,
    adsEnabled: false,
    stepByStepSolvingEnabled: true,
  },
};
