# Implementation Plan — Saket: Backend + Letter Detective

Design docs: [`docs/saket/PRD.md`](docs/saket/PRD.md) · [`TRD.md`](docs/saket/TRD.md) · [`APP_FLOW.md`](docs/saket/APP_FLOW.md) · [`UIUX_BRIEF.md`](docs/saket/UIUX_BRIEF.md) · [`BACKEND_SCHEMA.md`](docs/saket/BACKEND_SCHEMA.md)

Branch: `Saket-Backend_LetterDetective`

## Phase 0 — Branch + design docs
- [x] Branch created
- [x] PRD, TRD, App Flow, UI/UX Brief, Backend Schema written
- [x] `backend/backend.md` updated with Environment & Secrets section
- [x] `.env.local` set up (Saket, locally)

## Phase 1 — Foundations
- [ ] Add deps: `@supabase/supabase-js`, `@supabase/ssr`, `zod`
- [ ] `frontend/lib/supabase/server.ts` — cookie-bound server client
- [ ] `frontend/lib/supabase/admin.ts` — service-role client, server-only guard
- [ ] `frontend/lib/supabase/client.ts` — browser client
- [ ] `frontend/lib/api/response.ts` — `ApiSuccess`/`ApiError` envelope
- [ ] `frontend/lib/api/auth.ts` — `requireUser()`, `requireChildAccess()`
- [ ] `frontend/proxy.ts` — Next 16 session-refresh (renamed from middleware)
- [ ] `frontend/.env.example`

## Phase 2 — Database schema
- [ ] `backend/supabase/migrations/` — profiles, children, classrooms, classroom_members
- [ ] games, game_sessions, game_trials, session_scores, skill_states, screening_reports
- [ ] ld_letter_pairs, ld_word_items
- [ ] RLS on every table + `owns_child`/`teaches_child` helper functions
- [ ] `backend/supabase/seed/` — games, ld_letter_pairs, ld_word_items
- [ ] Apply migrations to the provisioned Supabase project (Saket confirms)
- [ ] Generate `frontend/lib/db/types.ts`

## Phase 3 — Auth API
- [ ] `app/api/signin/route.ts` — account creation + anonymous entry
- [ ] `app/api/login/route.ts` — password login, refresh, sign-out
- [ ] Wire `components/signin.tsx` to real calls (small diff, flagged to Atharv in PR)
- [ ] Enable Anonymous provider in Supabase dashboard (Saket, manual step)

## Phase 4 — Dashboard API
- [ ] `app/api/dashboard/route.ts` — children, per-game progress, latest report

## Phase 5 — Letter Detective API
- [ ] `app/api/games/letter-detective/route.ts` — start session
- [ ] `app/api/games/letter-detective/trial/route.ts` — batched trial submit
- [ ] `app/api/games/letter-detective/complete/route.ts` — grade + score + update skill_states

## Phase 6 — Letter Detective game
- [ ] `app/letter-detective/page.tsx` + `app/letter-detective/components/`
- [ ] Round types: The Lineup, Spot the Impostor, Stakeout, Undercover in Words, Case Files
- [ ] Timing: rAF-stamped onset, `event.timeStamp` response capture
- [ ] Anti-frustration: no live score, no failure state, reduced-motion support
- [ ] Keyboard access end to end

## Phase 7 — Adaptive difficulty
- [ ] `skill_states` read on session start, written on completion

## Verification
- [ ] `npm run lint` / `npm run build` pass
- [ ] RLS cross-child access proof (deny, not error-then-allow)
- [ ] Full guest playthrough → correct DB rows
- [ ] Tamper check: client-claimed correctness rejected
- [ ] Session replay reproduces identical stimulus sequence
- [ ] Keyboard-only + reduced-motion playthroughs
- [ ] Mobile width check

## PR
- [ ] Open via GitHub MCP (`gh` not installed locally), `Saket-Backend_LetterDetective` → `main`
