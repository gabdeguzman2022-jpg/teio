import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqlite = new Database(path.join(dataDir, "teio.db"));
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

// Idempotent bootstrap so a fresh checkout works with zero setup. This must
// stay in sync with schema.ts by hand; `npm run db:push` (drizzle-kit) is the
// tool for real schema changes during development.
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS profile (
    id TEXT PRIMARY KEY,
    tier TEXT NOT NULL DEFAULT 'max',
    xp INTEGER NOT NULL DEFAULT 0,
    hearts INTEGER NOT NULL DEFAULT 5,
    max_hearts INTEGER NOT NULL DEFAULT 5,
    streak_days INTEGER NOT NULL DEFAULT 0,
    streak_freeze_available INTEGER NOT NULL DEFAULT 1,
    last_active_date_iso TEXT NOT NULL,
    last_heart_regen_iso TEXT
  );

  CREATE TABLE IF NOT EXISTS lesson_progress (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    lesson_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    best_score_percent INTEGER NOT NULL DEFAULT 0,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_attempt_iso TEXT
  );

  CREATE TABLE IF NOT EXISTS badge (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL,
    earned_at_iso TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ai_message_log (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    date_iso TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0
  );
`);

// CREATE TABLE IF NOT EXISTS above only shapes a fresh database — a db file
// that already existed before a column/constraint was added here keeps its
// old shape. This backfills columns added after the initial release; the
// FK constraints above can't be retrofitted this way (SQLite requires a full
// table rebuild to add one to an existing table), so they only take effect
// for a fresh database until this schema is reused for a real multi-user
// extension, per the low-severity note this is tracked under.
const profileColumns = sqlite.prepare("PRAGMA table_info(profile)").all() as { name: string }[];
if (!profileColumns.some((col) => col.name === "last_heart_regen_iso")) {
  // Next.js's build spawns several worker processes to collect page data for
  // different routes in parallel, and each one imports this module and runs
  // this backfill independently — so a plain check-then-ALTER races across
  // processes (two workers can see the column missing before either adds
  // it). Treat "duplicate column" as a lost race, not a real error.
  try {
    sqlite.exec("ALTER TABLE profile ADD COLUMN last_heart_regen_iso TEXT");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes("duplicate column name")) throw err;
  }
}

export const db = drizzle(sqlite, { schema });

const LOCAL_PROFILE_ID = "local";

export function ensureLocalProfile() {
  const existing = sqlite
    .prepare("SELECT id FROM profile WHERE id = ?")
    .get(LOCAL_PROFILE_ID);
  if (existing) return;
  sqlite
    .prepare(
      `INSERT INTO profile (id, tier, xp, hearts, max_hearts, streak_days, streak_freeze_available, last_active_date_iso)
       VALUES (?, 'max', 0, 5, 5, 0, 1, ?)`,
    )
    .run(LOCAL_PROFILE_ID, new Date().toISOString());
}
