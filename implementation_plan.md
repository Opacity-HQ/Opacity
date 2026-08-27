# Implementation Plan — Saket: Backend + Letter Detective

Design docs: [`docs/saket/PRD.md`](docs/saket/PRD.md) · [`TRD.md`](docs/saket/TRD.md) · [`APP_FLOW.md`](docs/saket/APP_FLOW.md) · [`UIUX_BRIEF.md`](docs/saket/UIUX_BRIEF.md) · [`BACKEND_SCHEMA.md`](docs/saket/BACKEND_SCHEMA.md)

Branch: `Saket-Backend_LetterDetective`

## Phase 0 — Branch + design docs
- [x] Branch created
- [x] PRD, TRD, App Flow, UI/UX Brief, Backend Schema written
- [x] `backend/backend.md` updated with Environment & Secrets section
- [x] `.env.local` set up (Saket, locally)

## Phase 1 — Foundations
- [x] Add deps: `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `server-only`
- [x] `frontend/lib/supabase/server.ts` — cookie-bound server client
- [x] `frontend/lib/supabase/admin.ts` — service-role client, server-only guard
- [x] `frontend/lib/supabase/client.ts` — browser client
- [x] `frontend/lib/api/response.ts` — `ApiSuccess`/`ApiError` envelope
- [x] `frontend/lib/api/auth.ts` — `requireUser()`, `requireChildAccess()`
- [x] `frontend/proxy.ts` — Next 16 session-refresh (renamed from middleware)
- [x] `frontend/.env.example`

## Phase 2 — Database schema
- [x] `backend/supabase/migrations/` — profiles, children, classrooms, classroom_members
- [x] games, game_sessions, game_trials, session_scores, skill_states, screening_reports
- [x] ld_letter_pairs, ld_word_items
- [x] RLS on every table + `owns_child`/`teaches_child` helper functions
- [x] Seeds — games, ld_letter_pairs, ld_word_items (as migrations, applied)
- [x] Applied all 13 migrations to the provisioned Supabase project
- [x] Generate `frontend/lib/db/types.ts`, wired into all 3 clients
- [x] Security advisor clean (2 expected findings only, documented in migration)

## Phase 3 — Auth API
- [x] `app/api/signin/route.ts` — account creation, guest entry, claim-on-anonymous
- [x] `app/api/login/route.ts` — password login, sign-out
- [x] Wire `components/signin.tsx` to real calls (flagged to Atharv in PR)
- [x] Verified live: signup, wrong-password rejection, error surfacing all correct
- [ ] Enable Anonymous provider in Supabase dashboard (Saket, manual step — pending)

## Phase 4 — Dashboard API
- [x] `app/api/dashboard/route.ts` — GET children/per-game progress/latest report, POST create child
- [x] Verified live: empty list, child creation, aggregate shape, validation, cross-user RLS isolation (relies entirely on RLS, no manual owner_id filter)

## Phase 5 — Letter Detective API
- [x] `plan.ts` — trial plan generator (lineup/impostor/stakeout/words) + grading, no answer-key fields sent to client
- [x] `app/api/games/letter-detective/route.ts` — start session, reads skill_states for difficulty
- [x] `app/api/games/letter-detective/trial/route.ts` — batched trial submit, server-side grading only
- [x] `app/api/games/letter-detective/complete/route.ts` — session_scores + skill_states adaptive update
- [x] Verified live end-to-end: 21-trial session, tamper attempt correctly rejected, all DB rows/scores/skill_states hand-checked correct, cascade cleanup confirmed

## Phase 6 — Letter Detective game
- [x] `app/letter-detective/page.tsx` + `app/letter-detective/components/` — full state machine (loading/needs-child/intro/playing/solved/error)
- [x] Round types: The Lineup, Spot the Impostor, Stakeout, Undercover in Words. Case Files = the session-level wrapper (one pair per session), not a separate mechanic
- [x] Timing: `useTrialClock` — rAF-stamped onset, `event.timeStamp` response capture
- [x] Anti-frustration: no live score (dot progress only), no failure state (wiggle+glow, never red X), reduced-motion via `usePrefersReducedMotion`/`useSyncExternalStore`
- [x] Real semantic buttons, `onKeyDown` Enter/Space handling, `aria-label`/`aria-pressed`/`role=group`/`role=progressbar`, focus-visible rings throughout
- [x] Verified live: full playthrough via actual rendered UI (not just API calls) — child setup, all 4 round types, timeout path, case-solved screen, DB rows match UI exactly

## Phase 7 — Adaptive difficulty
- [x] `skill_states` read on session start, written on completion (built as part of Phase 5's complete route)

## Verification
- [x] `npm run lint` / `npm run build` pass (checked after every phase)
- [x] RLS cross-child access proof (Phase 4: second account sees zero of first account's children, no manual filter in the query)
- [x] Full guest playthrough → correct DB rows (done with a confirmed test account; true anonymous-guest path still blocked on the dashboard toggle, see Phase 3)
- [x] Tamper check: fabricated trial-index rejected with `trial_out_of_range`; client can never submit a claimed correctness, only raw response+timestamp
- [ ] Session replay reproduces identical stimulus sequence (plan is stored verbatim in `game_sessions.config`, replay = re-render same array; not separately re-tested)
- [ ] Keyboard-only playthrough (structural support in place — real buttons, keydown handlers, focus rings — not separately click-tested via keyboard-only)
- [x] Mobile width check — actual playthrough happened at 374px width; desktop 1280px screenshot also checked, no overflow either way

## PR
- [ ] Open via GitHub MCP (`gh` not installed locally), `Saket-Backend_LetterDetective` → `main`
