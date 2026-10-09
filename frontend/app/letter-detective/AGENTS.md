# Letter Detective — Game Agent Guide

This document describes the structure, architecture, and file responsibilities for **Letter Detective** (`app/letter-detective/`) and its corresponding backend API endpoints (`app/api/games/letter-detective/`).

---

## Game Overview

Letter Detective is Opacity's reference implementation for visual discrimination and letter confusion screening (mirror confusion `b/d`, rotation confusion `b/p, d/q`, visual similarity). The child acts as a detective solving cases built around confusable letter pairs.

- **Game ID**: `letter-detective`
- **Skill Key / Domain**: `letter_discrimination` / `visual_discrimination`

---

## Frontend Directory Structure (`app/letter-detective/`)

### Route Files
- **[layout.tsx](layout.tsx)**: Server layout component wrapping the route in `GameLayout title="letter detective"`. Resolves current user via `getDisplayUsername()`.
- **[loading.tsx](loading.tsx)**: Next.js route loading state fallback.
- **[page.tsx](page.tsx)**: Client entry page (`"use client"`). Connects server state (`useDashboardQuery`) with Zustand client store (`useLetterDetectiveStore`). Manages audio initialization (`cuelume.bind`), trial outcome buffering/flushing, keyboard shortcuts, progress bar, and phase rendering (`intro` → `playing` → `solved`).

### Component Files (`app/letter-detective/components/`)
- **[CaseIntro.tsx](components/CaseIntro.tsx)**: Case intro screen presenting "today's case" letter confusion pair, instructions, and start trigger button.
- **[CaseSolved.tsx](components/CaseSolved.tsx)**: Post-game summary screen displaying accuracy, mastery updates, unlocked suspect card, and play again button.
- **[ChildSetup.tsx](components/ChildSetup.tsx)**: Inline profile creation form rendered when no active child profile exists.
- **[LineupRound.tsx](components/LineupRound.tsx)**: "The Lineup" round component isolating mirror vs rotation confusion. Target letter shown with 5 suspect choices.
- **[ImpostorRound.tsx](components/ImpostorRound.tsx)**: "Spot the Impostor" round component isolating pure visual discrimination. 3x3 letter grid containing 1 flipped impostor.
- **[StakeoutRound.tsx](components/StakeoutRound.tsx)**: "Stakeout" round component measuring throughput and vigilance. Rapid single-letter stream where child taps only on target match.
- **[WordsRound.tsx](components/WordsRound.tsx)**: "Undercover in Words" round component measuring position-conditional accuracy (initial/medial/final). Child taps all target letter occurrences in a real word.

### State, Queries & Utilities (`app/letter-detective/components/`)
- **[store.ts](components/store.ts)**: Zustand store (`useLetterDetectiveStore`) managing active game session phase, confusable letter pair, trial cursor, and accuracy results.
- **[queries.ts](components/queries.ts)**: TanStack Query mutation hooks (`useStartLetterDetectiveSessionMutation`, `useSubmitLetterDetectiveTrialsMutation`, `useCompleteLetterDetectiveSessionMutation`) utilizing `fetchJson`.
- **[types.ts](components/types.ts)**: TypeScript interfaces for `TrialOutcome`, `LDPair`, `LDTrial`, and `LDResponse`.
- **[useGameFeedback.ts](components/useGameFeedback.ts)**: Integrated sound (`cuelume`) and haptics (`web-haptics`) feedback hook.
- **[useTrialClock.ts](components/useTrialClock.ts)**: High-resolution stimulus timing hook measuring reaction times using `performance.now()`.
- **[usePrefersReducedMotion.ts](components/usePrefersReducedMotion.ts)**: Accessibility hook detecting reduced-motion browser preferences.

---

## Backend API Endpoints (`app/api/games/letter-detective/`)

- **[plan.ts](../api/games/letter-detective/plan.ts)**:
  - **Plan Generator (`generatePlan`)**: Queries `ld_letter_pairs` and `ld_word_items` Supabase tables based on difficulty level to select a confusable pair and generate a 20-trial stimulus plan (3 warmup + lineup, impostor, stakeout, words rounds).
  - **Grading Logic (`gradeTrial`)**: Evaluates trial responses server-side against stored session `config` and computes `is_correct` and `error_type` (`mirror`, `rotation`, `visual_similar`, `omission`, `timeout`).

- **[route.ts](../api/games/letter-detective/route.ts)**: `POST /api/games/letter-detective`
  - Starts a new session: checks access via `requireChildAccess`, reads current `letter_discrimination` level from `skill_states`, generates plan, and persists entry to `game_sessions`.

- **[trial/route.ts](../api/games/letter-detective/trial/route.ts)**: `POST /api/games/letter-detective/trial`
  - Batch trial submission handler: grades submitted responses against session `config` and upserts trial rows into `game_trials`.

- **[complete/route.ts](../api/games/letter-detective/complete/route.ts)**: `POST /api/games/letter-detective/complete`
  - Session completion handler: computes `accuracy`, `mean_rt_ms`, `median_rt_ms`, `rt_cv`, `mirror_error_rate`, `throughput`, upserts `session_scores`, and updates adaptive difficulty in `skill_states`.

### Feature definition version

`complete/route.ts` writes `raw_features.version = 2`: `mirror_error_rate` counts mirror errors only, and `raw_features.confusionErrorRate` counts mirror/rotation/visual-similarity errors together. Older v1 rows retain the combined definition in `mirror_error_rate`; recompute from recorded trials before mixing versions. Pure rate calculations live in `feature-statistics.ts`; regression tests are in `frontend/tests/letter-detective-features.test.mjs`.
