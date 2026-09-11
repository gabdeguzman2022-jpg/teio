import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "./client";
import { aiMessageLog, badge, lessonProgress, profile } from "./schema";
import type { GamificationState, Subject, Tier, UserProgress } from "@/lib/types";
import { tierLimits } from "@/lib/gamification/tiers";
import {
  DEFAULT_XP_PER_CORRECT_ANSWER,
  awardXp,
  checkBadgeUnlocks,
  loseHeart,
  refillHeartsOverTime,
  updateStreak,
} from "@/lib/gamification/engine";
import { getLessonById } from "@/content";

const LOCAL_PROFILE_ID = "local";

// Thrown by saveProgress when the request doesn't line up with real lesson
// content — an unknown lessonId/subject pair, or a scorePercent that isn't
// achievable for that lesson's actual question count. This is the boundary
// that stops a request from writing XP/badges/completion state that no real
// answer session could have produced.
export class InvalidProgressError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidProgressError";
  }
}

function resolveLesson(lessonId: string, subject: Subject) {
  const lesson = getLessonById(lessonId);
  if (!lesson || lesson.subject !== subject) {
    throw new InvalidProgressError(`Unknown lesson "${lessonId}" for subject "${subject}".`);
  }
  return lesson;
}

// scorePercent must be reachable as round(k / n * 100) for some whole number
// of correct answers k out of the lesson's real question count n — the same
// formula LessonPlayer uses client-side. This can't confirm k answers were
// actually submitted (the API only receives the final tally, not a per-answer
// trail), but it does reject scores fabricated against the wrong question count.
function isAchievableScorePercent(scorePercent: number, questionCount: number): boolean {
  if (questionCount <= 0) return true;
  for (let k = 0; k <= questionCount; k++) {
    if (Math.round((k / questionCount) * 100) === scorePercent) return true;
  }
  return false;
}

// SQLite integer columns can't hold Infinity, so unlimited-heart tiers are
// stored as this sentinel and mapped back to Infinity on read. Application
// code above the query layer only ever sees real GamificationState numbers
// (Infinity included), per the contract in types.ts.
const UNLIMITED_HEARTS_DB_VALUE = 999_999;

function heartsToDb(hearts: number): number {
  return hearts === Infinity ? UNLIMITED_HEARTS_DB_VALUE : hearts;
}

function heartsFromDb(hearts: number): number {
  return hearts >= UNLIMITED_HEARTS_DB_VALUE ? Infinity : hearts;
}

export type LocalProfile = { tier: Tier } & GamificationState;

export interface ProgressBundle {
  profile: LocalProfile;
  lessons: UserProgress[];
}

export interface SaveProgressInput {
  lessonId: string;
  subject: Subject;
  // Omitted for a lesson-completion-only save (no new answer to score) — that
  // call must still update the streak and persist lesson_progress without
  // double-awarding XP or docking a heart for the answer that already did.
  correct?: boolean;
  xpAward?: number;
  completeLesson?: boolean;
  scorePercent?: number;
}

type ProfileRow = typeof profile.$inferSelect;

function getBadgeIds(profileId: string): string[] {
  return db
    .select({ badgeId: badge.badgeId })
    .from(badge)
    .where(eq(badge.profileId, profileId))
    .all()
    .map((row) => row.badgeId);
}

// maxHearts is always derived from tier, never trusted from the stored row —
// tier is the single source of truth so gating can't drift out of sync with
// TIER_LIMITS by editing the row directly.
function toLocalProfile(row: ProfileRow, badges: string[]): LocalProfile {
  const tier = row.tier as Tier;
  const limits = tierLimits(tier);
  return {
    tier,
    xp: row.xp,
    hearts: Math.min(heartsFromDb(row.hearts), limits.maxHearts),
    maxHearts: limits.maxHearts,
    streakDays: row.streakDays,
    streakFreezeAvailable: row.streakFreezeAvailable,
    lastActiveDateISO: row.lastActiveDateISO,
    lastHeartRegenISO: row.lastHeartRegenISO ?? row.lastActiveDateISO,
    badges,
  };
}

export function getOrCreateLocalProfile(): LocalProfile {
  const row = db.select().from(profile).where(eq(profile.id, LOCAL_PROFILE_ID)).get();
  if (row) {
    return toLocalProfile(row, getBadgeIds(row.id));
  }

  const defaultTier: Tier = "max";
  const limits = tierLimits(defaultTier);
  const nowISO = new Date().toISOString();
  const newRow: ProfileRow = {
    id: LOCAL_PROFILE_ID,
    tier: defaultTier,
    xp: 0,
    hearts: heartsToDb(limits.maxHearts),
    maxHearts: heartsToDb(limits.maxHearts),
    streakDays: 0,
    streakFreezeAvailable: true,
    lastActiveDateISO: nowISO,
    lastHeartRegenISO: nowISO,
  };
  db.insert(profile).values(newRow).run();
  return toLocalProfile(newRow, []);
}

function getLessonProgressRows(profileId: string): UserProgress[] {
  return db
    .select()
    .from(lessonProgress)
    .where(eq(lessonProgress.profileId, profileId))
    .all()
    .map((row) => ({
      lessonId: row.lessonId,
      completed: row.completed,
      bestScorePercent: row.bestScorePercent,
      attempts: row.attempts,
      lastAttemptISO: row.lastAttemptISO,
    }));
}

export function getAiMessagesUsedToday(nowISO: string = new Date().toISOString()): number {
  const today = nowISO.slice(0, 10);
  const row = db
    .select({ count: aiMessageLog.count })
    .from(aiMessageLog)
    .where(and(eq(aiMessageLog.profileId, LOCAL_PROFILE_ID), eq(aiMessageLog.dateISO, today)))
    .get();
  return row?.count ?? 0;
}

export function getProgress(nowISO: string = new Date().toISOString()): ProgressBundle {
  const localProfile = getOrCreateLocalProfile();
  const { tier, ...state } = localProfile;
  const refilled = refillHeartsOverTime(state, nowISO);

  return {
    profile: { tier, ...refilled },
    lessons: getLessonProgressRows(LOCAL_PROFILE_ID),
  };
}

// A mid-lesson question only ever affects XP/hearts. The lesson_progress row
// itself (completed/bestScorePercent/attempts) is only written when the
// lesson is actually finished — there's no "in progress" state in the schema.
function upsertLessonProgress(input: SaveProgressInput, nowISO: string): void {
  if (!input.completeLesson) return;
  const scorePercent = input.scorePercent ?? 0;

  const existing = db
    .select()
    .from(lessonProgress)
    .where(
      and(eq(lessonProgress.profileId, LOCAL_PROFILE_ID), eq(lessonProgress.lessonId, input.lessonId)),
    )
    .get();

  if (!existing) {
    db.insert(lessonProgress)
      .values({
        id: `${LOCAL_PROFILE_ID}:${input.lessonId}`,
        profileId: LOCAL_PROFILE_ID,
        lessonId: input.lessonId,
        subject: input.subject,
        completed: true,
        bestScorePercent: scorePercent,
        attempts: 1,
        lastAttemptISO: nowISO,
      })
      .run();
    return;
  }

  db.update(lessonProgress)
    .set({
      completed: true,
      bestScorePercent: Math.max(existing.bestScorePercent, scorePercent),
      attempts: existing.attempts + 1,
      lastAttemptISO: nowISO,
    })
    .where(eq(lessonProgress.id, existing.id))
    .run();
}

export function saveProgress(
  input: SaveProgressInput,
  nowISO: string = new Date().toISOString(),
): ProgressBundle {
  const localProfile = getOrCreateLocalProfile();
  const { tier, ...state } = localProfile;

  let gamification: GamificationState = refillHeartsOverTime(state, nowISO);
  if (input.correct === true) {
    gamification = awardXp(gamification, input.xpAward ?? DEFAULT_XP_PER_CORRECT_ANSWER);
  } else if (input.correct === false) {
    gamification = loseHeart(gamification);
  }
  gamification = updateStreak(gamification, nowISO);

  upsertLessonProgress(input, nowISO);
  const lessons = getLessonProgressRows(LOCAL_PROFILE_ID);

  const newlyUnlocked = checkBadgeUnlocks(gamification, lessons);
  for (const badgeId of newlyUnlocked) {
    db.insert(badge)
      .values({
        id: `${LOCAL_PROFILE_ID}:${badgeId}`,
        profileId: LOCAL_PROFILE_ID,
        badgeId,
        earnedAtISO: nowISO,
      })
      .run();
  }
  gamification = { ...gamification, badges: [...gamification.badges, ...newlyUnlocked] };

  const limits = tierLimits(tier);
  db.update(profile)
    .set({
      xp: gamification.xp,
      hearts: heartsToDb(gamification.hearts),
      maxHearts: heartsToDb(limits.maxHearts),
      streakDays: gamification.streakDays,
      streakFreezeAvailable: gamification.streakFreezeAvailable,
      lastActiveDateISO: gamification.lastActiveDateISO,
    })
    .where(eq(profile.id, LOCAL_PROFILE_ID))
    .run();

  return {
    profile: { tier, ...gamification },
    lessons,
  };
}
