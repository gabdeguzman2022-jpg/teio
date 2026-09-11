# Teio

A gamified STEM learning app for grades 7-12 — math, science, technology, and engineering built
local-first for personal use. No cloud database, no login screen, no payment processing: everything
runs on your own machine, including the AI tutor.

## What's in it

- A Duolingo-style skill tree per subject, with XP, hearts (lives), daily streaks (with one
  streak-freeze), and badges
- An AI tutor that talks to a small model running locally through [Ollama](https://ollama.com) —
  Socratic by default (hints, not answers, unless you explicitly ask to be told)
- Free / Pro / Max tiers, fully implemented in the gating logic (hearts, AI tutor message limits) —
  your local profile defaults to `max` since this is your own copy
- One full lesson unit per subject: Algebra foundations (math), general/physical science, intro
  computational thinking (technology), and constraint/design-challenge problems (engineering)

## Running it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Progress is stored in a local SQLite file at `data/teio.db`, created automatically on first run.
Delete `data/teio.db*` (while the dev server isn't running) to reset to a fresh profile.

### AI tutor setup (optional)

The rest of the app works fully without this — the tutor just shows an "offline" message until it's
set up.

1. Install [Ollama](https://ollama.com).
2. Pull the default model: `ollama pull qwen2.5:3b-instruct`
3. Make sure Ollama is running (`ollama serve`, or it's already running as a background service).

To use a different local model, set `OLLAMA_MODEL` in a `.env.local` file, e.g.:

```
OLLAMA_MODEL=llama3.2:3b
```

## Known limitations

- No real multiplayer leagues/leaderboards — the data model leaves room for it, but there's only one
  local user right now, so it isn't built.
- The mascot is a simple placeholder SVG character, not custom illustration — intentional for now,
  worth revisiting later.
- `lottie-react` is installed but unused; the mascot's expression states are hand-built with Framer
  Motion instead. Worth spending on a small unlock/celebration animation later if wanted.
- Streak day boundaries use the server process's local timezone, which is correct for this
  single-user local setup but would need revisiting if this ever became multi-user/hosted.
- The AI tutor's daily-message quota isn't fully race-proof under truly concurrent requests (e.g. two
  browser tabs submitting at the exact same instant) — low-risk for a single local user, flagged here
  rather than silently ignored.

## Tech stack

Next.js 15 (App Router) + TypeScript + Tailwind CSS + Framer Motion + Drizzle ORM + better-sqlite3 +
Ollama (local LLM) + Zod + Lucide icons.
