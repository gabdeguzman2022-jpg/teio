import type { GamificationState, UserProgress } from "@/lib/types";

export const DEFAULT_XP_PER_CORRECT_ANSWER = 10;
export const HEART_REGEN_MINUTES = 30;

export function awardXp(state: GamificationState, amount: number): GamificationState {
  if (amount <= 0) return state;
  return { ...state, xp: state.xp + amount };
}

// state.hearts/maxHearts can be `Infinity` for unlimited-heart tiers (see the
// TierLimits comment in types.ts). Math.max/Math.min treat Infinity correctly
// with no special-casing needed here — an unlimited profile just never drops.
export function loseHeart(state: GamificationState): GamificationState {
  return { ...state, hearts: Math.max(0, state.hearts - 1) };
}

// Heart regen has its own anchor (lastHeartRegenISO), separate from the
// streak's lastActiveDateISO — see the GamificationState comment in types.ts.
// While capped at maxHearts the anchor is kept at `now` so that whenever a
// heart is later lost, the 30-minute countdown for the next one starts from
// that moment rather than from however long ago hearts last happened to be
// full. Below the cap, the anchor only advances by whole regen intervals
// actually consumed (clamped to what's missing), so a session full of other
// requests in between never resets or discards progress toward the next heart.
export function refillHeartsOverTime(
  state: GamificationState,
  nowISO: string = new Date().toISOString(),
): GamificationState {
  const anchor = state.lastHeartRegenISO ?? state.lastActiveDateISO;

  if (state.hearts >= state.maxHearts) {
    return anchor === nowISO ? state : { ...state, lastHeartRegenISO: nowISO };
  }

  const elapsedMs = Date.parse(nowISO) - Date.parse(anchor);
  if (!(elapsedMs > 0)) {
    return state.lastHeartRegenISO === anchor ? state : { ...state, lastHeartRegenISO: anchor };
  }

  const regenIntervalMs = HEART_REGEN_MINUTES * 60_000;
  const rawHeartsToAdd = Math.floor(elapsedMs / regenIntervalMs);
  if (rawHeartsToAdd <= 0) {
    return state.lastHeartRegenISO === anchor ? state : { ...state, lastHeartRegenISO: anchor };
  }

  const heartsToAdd = Math.min(rawHeartsToAdd, state.maxHearts - state.hearts);
  const nextAnchor = new Date(Date.parse(anchor) + heartsToAdd * regenIntervalMs).toISOString();

  return { ...state, hearts: state.hearts + heartsToAdd, lastHeartRegenISO: nextAnchor };
}

// Local calendar day, not UTC — this app is local-first/single-user and the
// server runs on the same machine as the student, so the process's own
// timezone (via the Date object's local getters) is the student's timezone.
function dateOnlyLocal(iso: string): number {
  const d = new Date(iso);
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}

// Only ever moves lastActiveDateISO forward. Guards against clock skew or a
// delayed/retried request landing after a newer one already advanced the
// row, which would otherwise inflate refillHeartsOverTime's elapsed-time math.
function laterISO(a: string, b: string): string {
  return b > a ? b : a;
}

// One streak-freeze can be spent to bridge exactly one fully-missed calendar
// day; it does not replenish until the streak next resets. Any gap of more
// than two calendar days (or a missed day with no freeze left) breaks the
// streak back to 1 (today counts, since the caller only invokes this on
// genuine activity) and restores the freeze for the new streak.
export function updateStreak(
  state: GamificationState,
  nowISO: string = new Date().toISOString(),
): GamificationState {
  // streakDays === 0 means "no active day recorded yet" (a fresh profile) —
  // lastActiveDateISO is just its creation timestamp, not a credited day, so
  // the very first activity always starts the streak at 1.
  if (state.streakDays === 0) {
    return { ...state, streakDays: 1, lastActiveDateISO: laterISO(state.lastActiveDateISO, nowISO) };
  }

  const dayDiff = Math.round(
    (dateOnlyLocal(nowISO) - dateOnlyLocal(state.lastActiveDateISO)) / 86_400_000,
  );

  if (dayDiff <= 0) {
    return { ...state, lastActiveDateISO: laterISO(state.lastActiveDateISO, nowISO) };
  }

  if (dayDiff === 1) {
    return {
      ...state,
      streakDays: state.streakDays + 1,
      lastActiveDateISO: laterISO(state.lastActiveDateISO, nowISO),
    };
  }

  if (dayDiff === 2 && state.streakFreezeAvailable) {
    return {
      ...state,
      streakDays: state.streakDays + 1,
      streakFreezeAvailable: false,
      lastActiveDateISO: laterISO(state.lastActiveDateISO, nowISO),
    };
  }

  return {
    ...state,
    streakDays: 1,
    streakFreezeAvailable: true,
    lastActiveDateISO: laterISO(state.lastActiveDateISO, nowISO),
  };
}

interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  isUnlocked: (state: GamificationState, lessons: UserProgress[]) => boolean;
}

export const BADGES: BadgeDefinition[] = [
  {
    id: "first-lesson",
    name: "First Steps",
    description: "Complete your first lesson.",
    isUnlocked: (_state, lessons) => lessons.some((l) => l.completed),
  },
  {
    id: "five-lessons",
    name: "Getting Serious",
    description: "Complete five lessons.",
    isUnlocked: (_state, lessons) => lessons.filter((l) => l.completed).length >= 5,
  },
  {
    id: "perfect-score",
    name: "Perfectionist",
    description: "Score 100% on a lesson.",
    isUnlocked: (_state, lessons) => lessons.some((l) => l.bestScorePercent === 100),
  },
  {
    id: "streak-3",
    name: "3-Day Streak",
    description: "Keep a 3-day streak going.",
    isUnlocked: (state) => state.streakDays >= 3,
  },
  {
    id: "streak-7",
    name: "Week Warrior",
    description: "Keep a 7-day streak going.",
    isUnlocked: (state) => state.streakDays >= 7,
  },
  {
    id: "streak-30",
    name: "Unstoppable",
    description: "Keep a 30-day streak going.",
    isUnlocked: (state) => state.streakDays >= 30,
  },
  {
    id: "xp-100",
    name: "Century Club",
    description: "Earn 100 total XP.",
    isUnlocked: (state) => state.xp >= 100,
  },
  {
    id: "xp-500",
    name: "XP Machine",
    description: "Earn 500 total XP.",
    isUnlocked: (state) => state.xp >= 500,
  },
];

export function checkBadgeUnlocks(state: GamificationState, lessons: UserProgress[]): string[] {
  const alreadyEarned = new Set(state.badges);
  return BADGES.filter(
    (badge) => !alreadyEarned.has(badge.id) && badge.isUnlocked(state, lessons),
  ).map((badge) => badge.id);
}
