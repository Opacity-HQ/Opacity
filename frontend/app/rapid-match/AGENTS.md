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
- **[layout.tsx](file:///c:/Users/athar/Downloads/Opacity/frontend/app/rapid-match/layout.tsx)**: Server layout component wrapping the route in `GameLayout title="rapid match"`. Resolves current user via `getDisplayUsername()`.
- **[loading.tsx](file:///c:/Users/athar/Downloads/Opacity/frontend/app/rapid-match/loading.tsx)**: Next.js route loading state fallback.
- **[page.tsx](file:///c:/Users/athar/Downloads/Opacity/frontend/app/rapid-match/page.tsx)**: Client entry page (`"use client"`). Connects server state (`useDashboardQuery`) with Zustand client store (`useRapidMatchStore`). Manages audio initialization (`cuelume.bind`), trial outcome buffering/flushing, keyboard shortcuts, progress bar, and phase rendering (`intro` → `playing` → `completed`).

### Component Files (`app/rapid-match/components/`)
- **[ChildSetup.tsx](file:///c:/Users/athar/Downloads/Opacity/frontend/app/rapid-match/components/ChildSetup.tsx)**: Inline profile creation form rendered when no active child profile exists.
- **[MatchIntro.tsx](file:///c:/Users/athar/Downloads/Opacity/frontend/app/rapid-match/components/MatchIntro.tsx)**: Game intro screen featuring the official `/rapid.svg` icon asset, instructions list, and start session button.
- **[TargetMatchRound.tsx](file:///c:/Users/athar/Downloads/Opacity/frontend/app/rapid-match/components/TargetMatchRound.tsx)**: Target symbol matching round. Stamps precise input timing via `requestAnimationFrame` and supports `1-6` keyboard shortcuts.
- **[CompareMatchRound.tsx](file:///c:/Users/athar/Downloads/Opacity/frontend/app/rapid-match/components/CompareMatchRound.tsx)**: Symbol pair comparison round ("Same or Different?") supporting `1`/`2` and `Left`/`Right` Arrow shortcuts.
- **[GridDashRound.tsx](file:///c:/Users/athar/Downloads/Opacity/frontend/app/rapid-match/components/GridDashRound.tsx)**: Fast 3x3 symbol grid search round supporting `1-9` cell keyboard shortcuts.
- **[MatchCompleted.tsx](file:///c:/Users/athar/Downloads/Opacity/frontend/app/rapid-match/components/MatchCompleted.tsx)**: Post-game results screen summarizing accuracy %, average reaction time, item throughput (items/min), and next difficulty level.

### State, Queries & Hooks (`app/rapid-match/components/`)
- **[store.ts](file:///c:/Users/athar/Downloads/Opacity/frontend/app/rapid-match/components/store.ts)**: Zustand store (`useRapidMatchStore`) managing active game session phase, trial index, cursor, and outcome results.
- **[queries.ts](file:///c:/Users/athar/Downloads/Opacity/frontend/app/rapid-match/components/queries.ts)**: TanStack Query mutation hooks (`useStartRapidMatchSessionMutation`, `useSubmitRapidMatchTrialsMutation`, `useCompleteRapidMatchSessionMutation`) utilizing `fetchJson`.
- **[types.ts](file:///c:/Users/athar/Downloads/Opacity/frontend/app/rapid-match/components/types.ts)**: TypeScript interfaces for `TrialOutcome` and `AccuracyResult`.
- **[useGameFeedback.ts](file:///c:/Users/athar/Downloads/Opacity/frontend/app/rapid-match/components/useGameFeedback.ts)**: Integrated sound (`cuelume`) and haptics (`web-haptics`) feedback hook.

---

## Backend API Endpoints (`app/api/games/rapid-match/`)

- **[plan.ts](file:///c:/Users/athar/Downloads/Opacity/frontend/app/api/games/rapid-match/plan.ts)**:
  - **Plan Generator (`generatePlan`)**: Generates authoritative 18-trial stimulus plans (3 warmup + 15 scored) tailored to the child's difficulty level (shapes, alphanumerics, confusable pairs).
  - **Grading Logic (`gradeTrial`)**: Evaluates trial responses server-side against stored session `config` and computes `is_correct` and `error_type` (`visual_similar`, `omission`, `timeout`).

- **[route.ts](file:///c:/Users/athar/Downloads/Opacity/frontend/app/api/games/rapid-match/route.ts)**: `POST /api/games/rapid-match`
  - Starts a new session: checks access via `requireChildAccess`, reads current `processing_speed` level from `skill_states`, generates plan, and persists entry to `game_sessions`.

- **[trial/route.ts](file:///c:/Users/athar/Downloads/Opacity/frontend/app/api/games/rapid-match/trial/route.ts)**: `POST /api/games/rapid-match/trial`
  - Batch trial submission handler: grades submitted responses against session `config` and upserts trial rows into `game_trials`.

- **[complete/route.ts](file:///c:/Users/athar/Downloads/Opacity/frontend/app/api/games/rapid-match/complete/route.ts)**: `POST /api/games/rapid-match/complete`
  - Session completion handler: computes `accuracy`, `mean_rt_ms`, `median_rt_ms`, `rt_cv`, `throughput`, upserts `session_scores`, and updates adaptive difficulty in `skill_states`.
