# Backend Guide

This project currently defines API routes through the Next.js app under `frontend/app/api/`.

Use this file as the backend contract for where API work should live, which routes are reserved, and how frontend game APIs should be organized.

## API Route Location

- Dashboard API work belongs in `frontend/app/api/dashboard/`.
- Profile and settings API work belongs in `frontend/app/api/profile/`.
- Sign-in API work belongs in `frontend/app/api/signin/`.
- Login API work belongs in `frontend/app/api/login/`.
- Game API work belongs in `frontend/app/api/games/`.
- Do not create game API endpoints outside `frontend/app/api/games/`.
- Do not mix one game's API logic into another game's folder.

## Dashboard API

Use this folder only for dashboard-level data:

```text
frontend/app/api/dashboard/
```

Examples of dashboard-level API work:

- User progress summaries.
- Overall screening results.
- Dashboard cards, stats, and history.
- Cross-game aggregate data.

`GET /api/dashboard` returns every child the caller can see, each with per-game progress (`games`), skill mastery (`skills`), the latest `screening_reports` row (`latestReport`) and `history`: every completed session, oldest first, as `{ sessionId, gameId, gameName, completedAt, difficultyLevel, accuracy, meanRtMs, mirrorErrorRate }`. The charts on the dashboard page are built from `history`. Scores are embedded in the sessions query (`session_scores` is one-to-one with `game_sessions`) instead of being fetched by a long `.in("session_id", [...])` list, which breaks once a child has a few hundred sessions. Sessions are read newest first, so any row cap drops the oldest history.

## Profile API

The profile page (`app/profile/`) uses these routes. All of them go through `requireUser` or `requireChildAccess`; none trusts a client-sent owner id.

```text
frontend/app/api/profile/child/      PATCH, DELETE
frontend/app/api/profile/account/    DELETE
```

- `PATCH /api/profile/child { childId, displayName, age }` edits a child. `age` is stored as `birth_year` (current year minus age; the database only allows 1990 or later). If it is the account's first child on a non-guest account, `profiles.display_name` is kept in step so the header greeting matches.
- `DELETE /api/profile/child?childId=` deletes one child. `ON DELETE CASCADE` removes their sessions, trials, scores, skill states and reports.
- `DELETE /api/profile/account` permanently deletes the signed-in auth user, and with it every child and all of their data. This is the only profile route that uses the service-role client (`lib/supabase/admin.ts`), because removing an auth user can't be expressed under RLS.

Only the child's owner may edit or delete a child; the `owner_id` filter makes a teacher's request match zero rows (`403`).

Device settings (text size, sound, volume, haptics, reduce motion, session length) are not in the database. They live in the persisted `useSettingsStore` (`lib/settings/store.ts`, localStorage) because they depend on the device, not the account, so there is no settings API.

## Auth API

Use these folders for authentication routes:

```text
frontend/app/api/signin/
frontend/app/api/login/
```

Use `frontend/app/api/signin/` for sign-in or account-entry flows. Use `frontend/app/api/login/` for login-session flows. Keep auth route handlers in these folders and do not mix auth API code into dashboard or game API folders.

### Sign-up, claim and confirmation contract

`POST /api/signin` takes `{ mode: "anonymous" }` or `{ mode: "email", email, password }`. Passwords for new accounts must be 8+ characters; validation errors say so plainly ("Password must be at least 8 characters.") because the dialog shows `error.message` as-is. `lib/auth/auth-errors.ts` rewords the Supabase failures a person can actually hit (email rate limit, resend cooldown, weak password, invalid email) and detects "this email already has an account".

- **New email, confirmation on (Supabase default):** returns `confirmationRequired: true` and no session. The dialog says to check email. Logging in before confirming returns `unauthorized` with `reason: "email_not_confirmed"`.
- **New email, confirmation off:** `signUp` returns a session immediately (`confirmationRequired: false`) and the dialog finishes the sign-in.
- **Existing email:** `422` with `details.reason: "email_already_registered"`, which the dialog turns into a login attempt.
- **Guest claim** (a guest session is active): the same user gets the email and password, so their children carry over. With confirmation on the email is only pending, so the response is `claimPending: true` and the guest session stays active. With confirmation off it applies instantly and the response is `isAnonymous: false`. If the email already belongs to another account the reason is `email_already_registered`, so the dialog falls back to login (which replaces the guest session).
- **Short passwords:** the dialog sends a password under 8 characters straight to `/api/login`, since it can only belong to an older account. If that fails it explains the 8-character rule for new accounts.

`GET /api/signin/callback` is where the confirmation email's link lands (`emailRedirectTo`). It exchanges the one-time `?code=` for a session and redirects to `/dashboard`, where the onboarding gate takes over. If the email is opened in a different browser than the one that signed up, the exchange fails (the PKCE verifier is a cookie in the original browser); the address is still confirmed, so it redirects home with `?confirmed=1` and the person signs in normally.

**Supabase dashboard settings the app depends on** (they are project settings, not code, and can break sign-up silently):

- Authentication -> Providers -> *Allow anonymous sign-ins*: must be **on** for "play without login".
- Authentication -> URL Configuration -> *Site URL*: the real deployed origin, not `http://localhost:3000`. Confirmation links are built from it.
- Authentication -> URL Configuration -> *Redirect URLs*: add `<origin>/api/signin/callback` for every origin the app runs on (production, previews, `http://localhost:3000`). If it isn't listed Supabase ignores `emailRedirectTo` and falls back to the Site URL.
- Authentication -> Providers -> Email -> *Confirm email*: on or off. The code supports both. With it on, the built-in mail sender is heavily rate limited, so configure a custom SMTP provider before real users sign up.

#### Local auth testing

Auth behaviour can't be tested against the hosted project without creating real accounts, so run Supabase locally (Docker required). From `backend/`:

```bash
npx supabase start -x studio,imgproxy,vector,logflare,edge-runtime,realtime,storage-api,supavisor
```

This applies every migration in `supabase/migrations/` to a throwaway database, starts a real auth server, and catches confirmation emails in a local inbox at `http://127.0.0.1:54324`. `npx supabase status` prints the local URL and keys. Run the app against it by setting `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` in the shell that runs `next dev` (process variables override `.env.local`), then run the scripts in `backend/tests/auth-e2e/`:

- `signup-login.sh`, `guest-claim.sh`, `profile-actions.sh`: set `enable_confirmations = false` in `supabase/config.toml` under `[auth.email]` and restart the stack.
- `email-confirmation.sh`: needs `enable_confirmations = true` (the committed default).

Stop the stack with `npx supabase stop`.

### Onboarding contract

`frontend/app/api/signin/onboarding/route.ts` is the one-time onboarding a confirmed (non-guest) user completes on their first signed-in session. It can't run at sign-up time because Supabase email confirmation means no session exists yet, so the client gates on it instead (`components/onboarding-gate.tsx`, mounted in `app/providers.tsx`).

- `GET` returns `{ signedIn, needsOnboarding, hasChildren, displayName }`. Always `200`, including for signed-out visitors (`needsOnboarding: false`), because the gate runs on every route and a `401` would spam logged-out page loads. Guests never need onboarding. `needsOnboarding` is also `true` for a confirmed account that has no child left (for example the parent deleted the only one on the profile page), because no game can start without a child. The same form then collects a new one.
- `POST { fullName, birthYear?, gradeLevel? }` upserts `profiles.display_name` with the full name and, only if the account has no child yet, creates the first child (named by first name) so games can skip their own setup form. `birthYear` (1990 to the current year) is required in that case. Guests get `403`. Invalid input writes nothing.

The header shows the first name only: `lib/auth/get-display-username.ts` reads `profiles.display_name` and takes the first word via `lib/auth/first-name.ts`. Accounts that haven't onboarded yet fall back to the email's local part; guests show "guest".

## Game API Routes

Each game must use only its own API folder:

```text
frontend/app/api/games/letter-detective/
frontend/app/api/games/memory-quest/
frontend/app/api/games/rapid-match/
frontend/app/api/games/sound-match/
frontend/app/api/games/word-builder/
```

Use the matching folder for each game's route handlers, scoring logic, submission endpoints, and game-specific data.

### Memory Quest contract

Memory Quest follows the same three-endpoint pattern as the other games, persisted to Supabase:

```text
POST frontend/app/api/games/memory-quest/route.ts            start a sitting
POST frontend/app/api/games/memory-quest/trial/route.ts      batched round answers
POST frontend/app/api/games/memory-quest/complete/route.ts   score the sitting
     frontend/app/api/games/memory-quest/plan.ts             generation, grading, adaptive level
```

`POST /api/games/memory-quest` takes `{ "childId": "uuid", "device": { ... } }` and checks access with `requireChildAccess(childId)`. It reads the child's `working_memory` level from `skill_states` (default 1), generates three rounds (path, path, map), stores them in `game_sessions.config`, and returns `{ sessionId, level, trials }`.

`POST /api/games/memory-quest/trial` accepts raw answers only, never correctness:

```json
{
	"sessionId": "uuid",
	"trials": [
		{ "trialIndex": 0, "response": { "kind": "sequence", "items": ["Star", "Moon", "Key"], "corrections": 1 }, "reactionTimeMs": 1800, "timeToFirstMoveMs": 450 },
		{ "trialIndex": 2, "response": { "kind": "position", "selectedIndex": 4 }, "reactionTimeMs": 900 }
	]
}
```

Each answer is graded against `game_sessions.config` and upserted into `game_trials` (`stimulus`, `response`, `is_correct`, `error_type` of `order`, `item`, `location` or `timeout`, and timings). Sequence rounds also earn partial credit per position.

`POST /api/games/memory-quest/complete` takes `{ "sessionId": "uuid" }`. It marks the session completed and writes `session_scores`: accuracy (mean partial accuracy), mean/median RT, RT coefficient of variation, throughput, and `raw_features` (`maxSequenceLength`, `longestRecalledSequence`, `attempts`, `errors`, `corrections`, `score`, `errorTypeCounts`). It then upserts `skill_states` for `working_memory`. The adaptive rule advances one level after three strong rounds in a row (85%+ accuracy within 2x the display time; the streak carries across sittings in `skill_states.streak`), drops one level after a round under 40% accuracy or with 3+ backspaces, and otherwise holds. This is an explainable baseline model, so it needs no AI API.

## Route Handler Rules

- Create Next.js route handlers as `route.ts` files inside the correct API folder.
- Keep request validation close to the route handler unless it becomes shared by multiple routes.
- Keep game-specific schemas, scoring, and transformations inside that game's API folder.
- Move code to a shared backend helper only when multiple routes genuinely need it.
- Return consistent JSON responses from all API routes.

## Boundaries

- Frontend game UI should remain in `frontend/app/<game-name>/page.tsx`.
- Game-specific UI components should remain in `frontend/app/<game-name>/components/`.
- Shared UI components belong in `frontend/components/`.
- API code belongs in `frontend/app/api/`, not inside UI component folders.

## Empty Folders

The `.gitkeep` files exist only so Git can track empty API folders. Remove a `.gitkeep` only after that folder contains a real tracked file, such as `route.ts`.

## Environment & Secrets

The project uses Supabase (Postgres + Auth + RLS). Env vars live in `frontend/.env.local`, which is git-ignored by `frontend/.gitignore` (`.env*`). Never commit an env file, never paste a real key into a commit, PR description, issue, or chat log.

There are three Supabase keys. Know which one you're using:

- `NEXT_PUBLIC_SUPABASE_URL` — the project URL. Public, safe anywhere.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public client key. Safe in browser code. Every request made with it is still subject to Row Level Security, so it can only ever see what RLS allows.
- `SUPABASE_SERVICE_ROLE_KEY` — **bypasses RLS entirely.** Whoever holds this key can read or write every row in every table, including other children's game data. Treat it as a master key, not an API key.

Rules for the service role key:

- Only ever imported in `frontend/lib/supabase/admin.ts`. Do not import it anywhere else.
- Only ever used inside a route handler (`route.ts`) or other server-only code — never in a Client Component, never in anything under `"use client"`, never in code that ships to the browser.
- Never read it into a game's own API folder directly. If a game route genuinely needs a privileged operation, call the shared `admin.ts` helper instead of importing the key again elsewhere.
- Never log it, never put it in an error message, never put it in a GitHub Actions secret that a client-side step can echo.
- If you think you need the service role key inside a Client Component, you almost certainly don't — RLS through the anon key with `requireUser()` / `requireChildAccess()` is the default. Ask before reaching for the service role key.

Get keys from the Supabase dashboard: Project Settings → API. Ask Saket for org access if you don't have it yet — invites are per-organization, so one invite gives you every project in it.

## ML integration status

The external-data baseline is under `ml/research/rello/`. The preliminary Python service is under `ml/service/`, reached from the signed-in `/api/research/rello` route and `/research/rello` demo page. See [service setup](../ml/service/README.md). It accepts explicit Rello counts and does not classify Opacity sessions or generate child reports. Completion handlers write typed score columns plus game-specific `raw_features`, not the Rello feature vector. See [FEATURE_ALIGNMENT.md](../ml/FEATURE_ALIGNMENT.md). Apply `20261009150000_allow_memory_quest_error_types.sql` to accept the Memory Quest taxonomy before live persistence testing.
