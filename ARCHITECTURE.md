# Teio architecture

Local-first, single-user gamified STEM learning app. Next.js 15 App Router,
TypeScript, Tailwind CSS, Drizzle ORM over a local SQLite file. No cloud
database, no auth provider, no payment processing — one local profile.

## Folder layout

```
src/
  app/                    Routes (Next.js App Router pages, layouts, route handlers)
  components/             UI components, one component per file
    animations/           Framer Motion / lottie / confetti pieces (mascot reactions,
                           level-up celebration, button press physics, etc.)
  lib/
    types.ts              Core shared domain types — Subject, Question, Lesson,
                           UserProgress, GamificationState, Tier, TierLimits.
                           Every other module should import from here rather than
                           redeclaring these shapes.
    utils.ts              Small shared helpers (currently: `cn` class merger)
    db/
      schema.ts            Drizzle table definitions, mirrors src/lib/types.ts
      client.ts            Opens ./data/teio.db, bootstraps tables, exports `db`
    gamification/          XP, hearts, streak, tier-limit enforcement logic.
                           This is where TIER_LIMITS from types.ts gets enforced
                           for real (hearts cap, AI message cap) — tiers must
                           never unlock a way to skip a lesson's questions.
    ai/                    Ollama tutor integration (http://localhost:11434).
                           Must fail soft: if the health check / request fails,
                           callers get a typed "unavailable" result, never a
                           thrown error that breaks the page.
  content/                 Static lesson data, one file per subject
                           (math.ts, science.ts, technology.ts, engineering.ts).
                           Lessons are code/data, not database rows — the DB only
                           stores progress against lesson ids defined here.
data/
  teio.db                  Local SQLite file (gitignored). Created on first run.
```

## Conventions for other builders

- One component per file under `src/components`. Animation-heavy components
  (anything primarily about a Framer Motion variant, a lottie player, or a
  canvas-confetti burst) go in `src/components/animations` instead of the
  top-level folder.
- `src/lib/types.ts` is the single source of truth for domain shapes. Drizzle
  rows in `src/lib/db/schema.ts` are the persistence-layer mirror of those
  types, not a replacement for them — application code should work in terms
  of the `src/lib/types.ts` types and map to/from DB rows at the query layer.
- Lesson content lives in `src/content/<subject>.ts` as plain typed data
  (`Lesson[]`), not in the database. The database only tracks per-lesson
  `UserProgress` and the single profile's `GamificationState`/`Tier`.
- Tier gating (`TIER_LIMITS` in `src/lib/types.ts`) is enforced in
  `src/lib/gamification`, not in UI components. A tier can raise `maxHearts`
  or `aiMessagesPerDay`; it must never change which questions a lesson
  presents or let a lesson be marked complete without answering them.
- The local single profile defaults to `tier: "max"`, but the gating code
  must behave the same regardless of which tier is stored — cosmetic-only
  gating is a bug, not a shortcut.
- Ollama calls (`src/lib/ai`) must check reachability and degrade to a clear
  inline "tutor unavailable" state rather than throwing — the rest of the
  app (lessons, gamification, progress) must work with Ollama off.
- No real multiplayer/leaderboard UI yet (single local user) — keep any
  future leaderboard-shaped data extensible in the schema, but don't build
  a leaderboard screen against fake data.

## Environment

- `OLLAMA_MODEL` — model name for the AI tutor, defaults to
  `qwen2.5:3b-instruct` (see `src/lib/ai`).
- `./data/teio.db` is created automatically on first import of
  `src/lib/db/client.ts`; the `data/` directory is gitignored.

## Scripts

- `npm run dev` / `build` / `start` / `lint` — standard Next.js scripts.
- `npm run db:push` — pushes `src/lib/db/schema.ts` to `./data/teio.db` via
  drizzle-kit after a schema change (the app also self-bootstraps its tables
  on startup, so this is only needed when the schema changes after a DB
  already exists).
