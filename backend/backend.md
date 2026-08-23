# Backend Guide

This project currently defines API routes through the Next.js app under `frontend/app/api/`.

Use this file as the backend contract for where API work should live, which routes are reserved, and how frontend game APIs should be organized.

## API Route Location

- Dashboard API work belongs in `frontend/app/api/dashboard/`.
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

## Auth API

Use these folders for authentication routes:

```text
frontend/app/api/signin/
frontend/app/api/login/
```

Use `frontend/app/api/signin/` for sign-in or account-entry flows. Use `frontend/app/api/login/` for login-session flows. Keep auth route handlers in these folders and do not mix auth API code into dashboard or game API folders.

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
