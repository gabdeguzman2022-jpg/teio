import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const profile = sqliteTable("profile", {
  id: text("id").primaryKey(),
  tier: text("tier").notNull().default("max"),
  xp: integer("xp").notNull().default(0),
  hearts: integer("hearts").notNull().default(5),
  maxHearts: integer("max_hearts").notNull().default(5),
  streakDays: integer("streak_days").notNull().default(0),
  streakFreezeAvailable: integer("streak_freeze_available", {
    mode: "boolean",
  })
    .notNull()
    .default(true),
  lastActiveDateISO: text("last_active_date_iso").notNull(),
});

export const lessonProgress = sqliteTable("lesson_progress", {
  id: text("id").primaryKey(),
  profileId: text("profile_id").notNull(),
  lessonId: text("lesson_id").notNull(),
  subject: text("subject").notNull(),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  bestScorePercent: integer("best_score_percent").notNull().default(0),
  attempts: integer("attempts").notNull().default(0),
  lastAttemptISO: text("last_attempt_iso"),
});

export const badge = sqliteTable("badge", {
  id: text("id").primaryKey(),
  profileId: text("profile_id").notNull(),
  badgeId: text("badge_id").notNull(),
  earnedAtISO: text("earned_at_iso").notNull(),
});

export const aiMessageLog = sqliteTable("ai_message_log", {
  id: text("id").primaryKey(),
  profileId: text("profile_id").notNull(),
  dateISO: text("date_iso").notNull(),
  count: integer("count").notNull().default(0),
});
