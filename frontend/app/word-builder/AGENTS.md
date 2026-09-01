# Word Builder — Game Agent Guide

This document describes the structure, architecture, and file responsibilities for **Word Builder** (`app/word-builder/`) and its corresponding backend API endpoints (`app/api/games/word-builder/`).

---

## Game Overview

Word Builder screens for **word decoding / spelling recall**. The child briefly sees a whole word, then its letters scramble into tiles (plus a few distractor letters at higher tiers) and they must tap the tiles back into the correct order. Errors are classified into a full taxonomy (omission, insertion, transposition, reversal, substitution, timeout) to surface dyslexia-relevant patterns such as b/d and p/q reversals.

- **Game ID**: `word-builder`
- **Skill Key / Domain**: `word_decoding`

---

## Frontend Directory Structure (`app/word-builder/`)

### Route Files
- **[layout.tsx](layout.tsx)**: Server layout component wrapping the route in `GameLayout title="word builder"`. Resolves current user via `getDisplayUsername()`.
- **[loading.tsx](loading.tsx)**: Next.js route loading state fallback.
- **[page.tsx](page.tsx)**: Client entry page (`"use client"`). Connects server state (`useDashboardQuery`) with the Zustand client store (`useWordBuilderStore`). Handles child selection/creation, sound binding (`cuelume.bind`), buffered trial-outcome flushing (every 5 trials or on the final trial), and phase rendering (`intro` → `playing` → `solved`).

### Component Files (`app/word-builder/components/`)
- **[ChildSetup.tsx](components/ChildSetup.tsx)**: Inline child-profile creation form (name + birth year) rendered when no active child profile exists. Uses `useCreateChildMutation` from the shared dashboard queries.
- **[BuilderIntro.tsx](components/BuilderIntro.tsx)**: Game intro screen with the `/block.svg` icon, instructions copy, and the "start building" button.
- **[BuildRound.tsx](components/BuildRound.tsx)**: Core trial component with two stages — `preview` (word shown briefly, with a shrinking progress bar) and `build` (letters scrambled into tappable tiles, with backspace). Auto-submits on timeout. Stamps reaction time / time-to-first-move via `useTrialClock` and plays sound/haptic feedback via the callbacks passed from `page.tsx`.
- **[BuilderComplete.tsx](components/BuilderComplete.tsx)**: Post-session results screen showing percent accuracy, a "build more words" replay button, and a link back to `/dashboard`.

### State, Queries & Hooks (`app/word-builder/components/`)
- **[store.ts](components/store.ts)**: Zustand store (`useWordBuilderStore`) holding only client-side active-session state — `childId`, `phase`, `sessionId`, `trials`, `trialCursor`, `accuracyResult`. Server/dashboard data is never duplicated here (lives in TanStack Query).
- **[queries.ts](components/queries.ts)**: TanStack Query mutation hooks (`useStartWordBuilderSessionMutation`, `useSubmitWordBuilderTrialsMutation`, `useCompleteWordBuilderSessionMutation`) built on `fetchJson`.
- **[types.ts](components/types.ts)**: Shared local types — `WBTrial`, `WBResponse`, `TrialOutcome` — mirroring the backend's public trial shape without importing the API module directly.
- **[useTrialClock.ts](components/useTrialClock.ts)**: Stamps stimulus onset inside `requestAnimationFrame` (post-paint) and computes `reactionTimeMs` / `timeToFirstMoveMs` from DOM event `timeStamp`s on the same performance-timeline epoch.
- **[usePrefersReducedMotion.ts](components/usePrefersReducedMotion.ts)**: `useSyncExternalStore` wrapper around the `prefers-reduced-motion` media query, used to shorten/disable animations in `BuildRound`.

---

## Backend API Endpoints (`app/api/games/word-builder/`)

- **[word-bank.ts](../api/games/word-builder/word-bank.ts)**: Static curated word list (`WORD_BANK`) keyed by difficulty tier 1-4 (word length/complexity increases with tier), plus the `DISTRACTOR_LETTER_POOL` used to pad tiles at higher tiers.

- **[plan.ts](../api/games/word-builder/plan.ts)**:
  - **Plan Generator (`generatePlan`)**: Builds the authoritative per-session trial plan — 2 tier-1 warmup trials (excluded from scoring) plus 8 scored trials spread mostly around the child's assigned tier with a couple of neighboring-tier trials for variety. Each trial stores `word`, scrambled `tiles`, `previewMs`, `timeoutMs`, and `difficultyTier`; no separate "answer" field is stored since `trial.word` is already sent to the client for the preview.
  - **Grading Logic (`classifyOutcome` / `gradeTrial`)**: Recomputes correctness server-side from the submitted tile order against the stored plan — never trusts client-asserted correctness. Classifies errors into a full taxonomy (`timeout`, `omission`, `insertion`, `transposition`, `reversal`, `substitution`); `gradeTrial` maps that down to the `game_trials.error_type` DB constraint's vocabulary (only `timeout`, `omission`, and `reversal`→`mirror` have a match — others are stored as `null`, full detail preserved in `session_scores.raw_features`).

- **[route.ts](../api/games/word-builder/route.ts)**: `POST /api/games/word-builder`
  - Starts a new session: validates the child via `requireChildAccess`, reads the child's current `word_decoding` difficulty from `skill_states` (defaults to tier 1), generates the plan, and persists it to `game_sessions` (`config` = the plan, so every later trial can be graded against it). Returns `{ sessionId, trials }`.

- **[trial/route.ts](../api/games/word-builder/trial/route.ts)**: `POST /api/games/word-builder/trial`
  - Batch trial submission handler (client flushes buffered outcomes in batches of ~5, or on the final trial). Loads the session's stored plan, grades each submitted response with `gradeTrial`, and upserts rows into `game_trials` (`onConflict: session_id,trial_index`). Rejects trials once the session is no longer `in_progress` or if a `trialIndex` isn't part of the stored plan.

- **[complete/route.ts](../api/games/word-builder/complete/route.ts)**: `POST /api/games/word-builder/complete`
  - Session completion handler: pulls all recorded `game_trials` (excluding warmups, which have `is_correct = null`), computes `accuracy`, `meanRtMs`/`medianRtMs`, `rtCv`, reversal/transposition error rates, and `throughput`, and upserts `session_scores` (reversal rate stored in the shared `mirror_error_rate` column). Then updates `skill_states` with an exponential-moving-average `mastery`, a streak counter, and adaptive `nextDifficultyLevel` (tier 1-4, up on `accuracy >= 0.85` with a 2-session streak, down on `accuracy < 0.5`). Returns `{ accuracy, meanRtMs, mastery, nextDifficultyLevel, streak }`.
