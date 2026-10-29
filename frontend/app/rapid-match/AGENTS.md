# Rapid Match — Game Agent Guide

This document describes the structure, architecture, and file responsibilities for **Rapid Match** (`app/rapid-match/`) and its corresponding backend API endpoints (`app/api/games/rapid-match/`).

---

## Game Overview

Rapid Match screens for **processing speed** and rapid symbol matching performance (Rapid Automatized Naming / RAN markers) in early dyslexia assessment. It measures visual recognition reaction time, response consistency, and item throughput under standardized speed conditions.

- **Game ID**: `rapid-match`
- **Skill Key / Domain**: `processing_speed`

---

## Frontend Directory Structure (`app/rapid-match/`)

### Route Files
- **[layout.tsx](layout.tsx)**: Server layout component wrapping the route in `GameLayout title="rapid match"`. Resolves current user via `getDisplayUsername()`.
- **[loading.tsx](loading.tsx)**: Next.js route loading state fallback.
- **[page.tsx](page.tsx)**: Client entry page (`"use client"`). Connects server state (`useDashboardQuery`) with Zustand client store (`useRapidMatchStore`). Manages audio initialization (`cuelume.bind`), trial outcome buffering/flushing, keyboard shortcuts, progress bar, and phase rendering (`intro` → `playing` → `completed`).

### Component Files (`app/rapid-match/components/`)
- **[ChildSetup.tsx](components/ChildSetup.tsx)**: Inline profile creation form rendered when no active child profile exists.
- **[MatchIntro.tsx](components/MatchIntro.tsx)**: Game intro screen featuring the official `/rapid.svg` icon asset, instructions list, and start session button.
- **[TargetMatchRound.tsx](components/TargetMatchRound.tsx)**: Target symbol matching round. Stamps precise input timing via `requestAnimationFrame` and supports `1-6` keyboard shortcuts.
- **[CompareMatchRound.tsx](components/CompareMatchRound.tsx)**: Symbol pair comparison round ("Same or Different?") supporting `1`/`2` and `Left`/`Right` Arrow shortcuts.
- **[GridDashRound.tsx](components/GridDashRound.tsx)**: Fast 3x3 symbol grid search round supporting `1-9` cell keyboard shortcuts.
- **[MatchCompleted.tsx](components/MatchCompleted.tsx)**: Post-game results screen summarizing accuracy %, average reaction time, item throughput (items/min), and next difficulty level.

### State, Queries & Hooks (`app/rapid-match/components/`)
- **[store.ts](components/store.ts)**: Zustand store (`useRapidMatchStore`) managing active game session phase, trial index, cursor, and outcome results.
- **[queries.ts](components/queries.ts)**: TanStack Query mutation hooks (`useStartRapidMatchSessionMutation`, `useSubmitRapidMatchTrialsMutation`, `useCompleteRapidMatchSessionMutation`) utilizing `fetchJson`.
- **[types.ts](components/types.ts)**: TypeScript interfaces for `TrialOutcome` and `AccuracyResult`.
- **[useGameFeedback.ts](components/useGameFeedback.ts)**: Integrated sound (`cuelume`) and haptics (`web-haptics`) feedback hook.

---

## Backend API Endpoints (`app/api/games/rapid-match/`)

- **[plan.ts](../api/games/rapid-match/plan.ts)**:
  - **Plan Generator (`generatePlan`)**: Generates authoritative 18-trial stimulus plans (3 warmup + 15 scored) tailored to the child's difficulty level (shapes, alphanumerics, confusable pairs).
  - **Grading Logic (`gradeTrial`)**: Evaluates trial responses server-side against stored session `config` and computes `is_correct` and `error_type` (`visual_similar`, `omission`, `timeout`).

- **[route.ts](../api/games/rapid-match/route.ts)**: `POST /api/games/rapid-match`
  - Starts a new session: checks access via `requireChildAccess`, reads current `processing_speed` level from `skill_states`, generates plan, and persists entry to `game_sessions`.

- **[trial/route.ts](../api/games/rapid-match/trial/route.ts)**: `POST /api/games/rapid-match/trial`
  - Batch trial submission handler: grades submitted responses against session `config` and upserts trial rows into `game_trials`.

- **[complete/route.ts](../api/games/rapid-match/complete/route.ts)**: `POST /api/games/rapid-match/complete`
  - Session completion handler: computes `accuracy`, `mean_rt_ms`, `median_rt_ms`, `rt_cv`, `throughput`, upserts `session_scores`, and updates adaptive difficulty in `skill_states`.

---

## Shared Building Blocks

- **Experimental classification**: after the awaited completion request succeeds, `page.tsx` mounts shared `components/gameplay-prediction.tsx` below the result card. It reads `/api/experimental/gameplay` through TanStack Query using the current child and completed session ID. One full game is enough for a simulated Dyslexia / No dyslexia result with confidence; more completed games update it. The API withholds stale results if this session is unavailable. Replay unmounts the panel. See `ml/gameplay/README.md` for the synthetic model and development flag.

- **Intro screen**: `components/game-intro.tsx` (`GameIntro`) renders the intro card from `{ icon, title, description, steps }`; `MatchIntro.tsx` only supplies the content.
- **Results loading**: `components/results-loading.tsx` (`ResultsLoading`) shows the post-session loading and retry state while `/complete` resolves.
- **Feedback**: `useGameFeedback.ts` is a thin rename of `useSharedGameFeedback` in `lib/game-feedback.ts`; sounds and haptics follow the Settings toggles (`lib/settings/store.ts`). Do not call `cuelume` / `web-haptics` directly.
- **Child**: signed-in accounts get their child from the app-wide `OnboardingGate`; `ChildSetup.tsx` is shown to guests only.
