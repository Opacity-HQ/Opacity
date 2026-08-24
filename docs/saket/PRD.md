# PRD — Backend & Letter Detective

Owner: Saket Rama · Scope: platform backend (Supabase, auth, dashboard/session APIs) + the Letter Detective game.

## Problem

Opacity screens for early signs of dyslexia through five short browser games. None of it works without a backend: right now nothing can create a user, start a session, record a single trial, or compute a score. Every other game on the team (Sound Match, Word Builder, Memory Quest, Rapid Match) is blocked on this contract existing. Letter Detective is built alongside it as the reference implementation — the pattern the other four games copy.

## Users

- **Child** — plays the game, browser only, no reading of instructions required beyond simple icons/audio. May be a guest (no account) or a logged-in child profile under a parent.
- **Parent** — creates an account, adds one or more children, views each child's Risk Report and progress over time.
- **Teacher** — creates/joins a classroom, sees which students in the classroom show elevated risk, cannot see raw session data outside their classroom.

## In scope (this branch)

- Supabase project schema: identity, children, classrooms, game sessions, trials, scores, skill states, screening reports, Letter Detective content tables.
- Row Level Security on every table — a child's data is invisible to every other child's account, by default, at the database layer.
- Auth: email/password signup, login, session refresh, and **anonymous guest play** that can later be claimed by adding an email (matches the existing "play without login" button in `signin.tsx`).
- API contract used by all five games: start session → submit trials → complete session → scored + persisted.
- Dashboard aggregate API (children list, per-game progress, latest risk report).
- Letter Detective: full game (5 round types), its 3 API routes, adaptive difficulty via `skill_states`.

## Out of scope (explicitly not this branch)

- The ML scoring service (GBDT + SHAP), Whisper integration — Saatvik's work, consumes `session_scores.raw_features` once it exists.
- The other four games' UI — Zaid, Ritwik, Pranshu, Atharv build against the API contract this branch defines.
- Parent/teacher dashboard *UI* — Atharv's route folders (`app/dashboard/`) already exist; this branch only ships the API they'll call.
- Payment, notifications, multi-language content.

## Success criteria

- A guest can play a full Letter Detective session with zero account setup, and the resulting trial data is stored and correctly graded server-side.
- A parent account can own multiple children, each with fully isolated data (RLS-proven, not just UI-hidden).
- The trial/session schema is generic enough that Sound Match, Word Builder, Memory Quest, and Rapid Match can be built against `game_sessions` / `game_trials` without schema changes.
- `npm run lint` and `npm run build` pass in `frontend/`.

## Non-goals / constraints

- **This is a screening tool, not a diagnostic tool.** No table, API response, or UI copy may claim to diagnose dyslexia. Output is a `risk_band` (low/moderate/elevated), never a label like "has dyslexia."
- Data minimization for minors: store `birth_year`, not a full birthdate; no data collected beyond what scoring needs.
- Every game route's client can only ever assert *what the child did* (a choice, a timestamp) — never *whether they were correct*. Grading happens server-side only.
