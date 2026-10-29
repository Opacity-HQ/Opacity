# Memory Quest — Game Agent Guide

This document describes the structure, architecture, and file responsibilities for **Memory Quest** (`app/memory-quest/`) and its backend API endpoints (`app/api/games/memory-quest/`).

---

## Game Overview

Memory Quest screens **working memory** capacity, spatial recall, and visual-sequential memory for early dyslexia assessment. Players remember a path of symbols (sequence rounds) or where a symbol sat on a map (position rounds), at an adaptive level.

- **Game ID**: `memory-quest`
- **Skill Key / Domain**: `working_memory`
- **Sitting**: one `game_sessions` row per sitting of 3 rounds (path, path, map), followed by a stats card. "keep going" starts a new sitting at the child's updated level.

Everything is persisted to Supabase like the other four games: the real child plays (no shared player ID), grading happens only on the server, and results feed the dashboard and the ML features.

---

## Frontend Directory Structure (`app/memory-quest/`)

### Route Files
- **[layout.tsx](layout.tsx)**: Server layout wrapping the route in `GameLayout title="memory quest"`. Do not edit.
- **[loading.tsx](loading.tsx)**: Next.js route loading fallback.
- **[page.tsx](page.tsx)**: Client orchestrator (`"use client"`). Resolves the child from `useDashboardQuery()`, starts sittings, buffers and flushes round answers, completes the session, and renders the current phase: `intro` → `show` → `recall` → `feedback` (× 3) → results loading → `stats`.

### Components (`components/`)
- **[queries.ts](components/queries.ts)**: TanStack Query mutations (via `fetchJson`) for start, trial, and complete. Completing a sitting invalidates the dashboard query.
- **[store.ts](components/store.ts)**: Zustand store for active-sitting flow state only (phase, session ID, rounds, cursor, last outcome, running score). Server data stays in TanStack Query.
- **[types.ts](components/types.ts)**: Client copies of the round, response, and result shapes.
- **[ChildSetup.tsx](components/ChildSetup.tsx)**: Name + birth-year form for **guests only**. Signed-in accounts get their child from the app-wide onboarding form (`components/onboarding-gate.tsx`), so the page shows a loading state behind that modal instead.
- **[ShowRound.tsx](components/ShowRound.tsx)**: Memorise step: shows the path or map with a countdown bar for the round's `displayMs`.
- **[RecallRound.tsx](components/RecallRound.tsx)**: Recall step: symbol bank with backspace (path) or an empty tappable grid (map). Measures reaction time and time to first move, counts backspaces as `corrections`, and grades locally only for instant feedback.
- **[RoundFeedback.tsx](components/RoundFeedback.tsx)**: Per-round result with the correct answer revealed after a miss.
- **[QuestStats.tsx](components/QuestStats.tsx)**: End-of-sitting card built from the server's `/complete` result.
- **[icons.tsx](components/icons.tsx)**: Symbol name → `lucide-react` icon map. No emojis.
- **[useGameFeedback.ts](components/useGameFeedback.ts)**: `cuelume` sounds and `web-haptics` presets (see `docs/saket/MEMORY_QUEST_AUDIO_HAPTICS.md`).
- **[useTrialClock.ts](components/useTrialClock.ts)**: Per-game copy of the rAF-stamped trial clock from Letter Detective.

---

## Backend API Endpoints (`app/api/games/memory-quest/`)

- **[plan.ts](../api/games/memory-quest/plan.ts)**: Round generation, grading, scoring, and the adaptive-level rule. No separate answer key is sent: a path's answer is the path itself, and a map's target symbol appears exactly once in its grid.
- **[route.ts](../api/games/memory-quest/route.ts)** — `POST /api/games/memory-quest` `{ childId, device? }`: `requireChildAccess(childId)`, reads the `working_memory` level from `skill_states`, generates the rounds, stores them in `game_sessions.config`, and returns `{ sessionId, level, trials }`.
- **[trial/route.ts](../api/games/memory-quest/trial/route.ts)** — `POST /api/games/memory-quest/trial` `{ sessionId, trials: [{ trialIndex, response, reactionTimeMs?, timeToFirstMoveMs? }] }`: grades each raw response against the stored plan and upserts `game_trials` (stimulus, response, is_correct, error_type, timings). The client never sends correctness.
- **[complete/route.ts](../api/games/memory-quest/complete/route.ts)** — `POST /api/games/memory-quest/complete` `{ sessionId }`: regrades the recorded rounds, marks the session completed, writes `session_scores` (accuracy, RT stats, throughput, and `raw_features` with max sequence length, attempts, errors, corrections, score), and upserts `skill_states`.

### Adaptive level
- Strong round: ≥ 85% accuracy, answered within 2× the display time.
- **Advance** after 3 strong rounds in a row. The streak is stored in `skill_states.streak`, so it carries across sittings.
- **Drop** one level after any round with < 40% accuracy or 3+ backspaces.
- Otherwise **hold**. Levels run 1–20; a path has `level + 2` symbols, and display time shrinks from 3000 ms to a 500 ms floor.

---

## Shared Building Blocks

- **Experimental classification**: after the awaited completion request succeeds, `page.tsx` mounts shared `components/gameplay-prediction.tsx` below the result card. It reads `/api/experimental/gameplay` through TanStack Query using the current child and completed session ID. One full game is enough for a simulated Dyslexia / No dyslexia result with confidence; more completed games update it. The API withholds stale results if this session is unavailable. Replay unmounts the panel. See `ml/gameplay/README.md` for the synthetic model and development flag.

- **Intro screen**: `components/game-intro.tsx` (`GameIntro`) renders the intro card from `{ icon, title, description, steps }`; the page supplies the content.
- **Results loading**: `components/results-loading.tsx` (`ResultsLoading`) shows the post-session loading and retry state while `/complete` resolves.
- **Feedback**: `useGameFeedback.ts` is a thin rename of `useSharedGameFeedback` in `lib/game-feedback.ts`; sounds and haptics follow the Settings toggles (`lib/settings/store.ts`). Do not call `cuelume` / `web-haptics` directly.
- **Child**: signed-in accounts get their child from the app-wide `OnboardingGate`; `ChildSetup.tsx` is shown to guests only.
