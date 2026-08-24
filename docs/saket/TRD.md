# TRD — Backend & Letter Detective

## Architecture

```
Browser (React 19, App Router)
   │
   ├─ Supabase browser client (auth state, anon key) — RLS-scoped, read-only-ish
   │
   ▼
Next.js Route Handlers  (frontend/app/api/**/route.ts)
   │
   ├─ Supabase server client (cookie-bound, anon key)  — normal per-user operations, RLS-scoped
   ├─ Supabase admin client (service role key)          — only for operations RLS cannot express
   │
   ▼
Supabase (Postgres + Auth + RLS), single project, one environment for now
```

No standalone backend server. Route handlers *are* the backend — `backend.md` already mandates this location, and everything Saket's slice needs (CRUD + auth + aggregation) is expressible as Postgres + RLS behind a thin route handler. The one thing that can't live in a Vercel function — Whisper transcription and the GBDT/SHAP model, both Python with heavy native deps — is a separate service under `backend/`, owned by Saatvik, called server-to-server from route handlers when that work lands. This branch reserves the shape (`session_scores.raw_features`) but does not build that service.

## Why Supabase this way

- **RLS is the security boundary**, not application code. A bug in a route handler must not be able to leak another child's data — the database refuses the query regardless of what the handler does. This is why every table gets RLS from its first migration, not retrofitted later.
- **Anonymous auth** means "guest" isn't a separate code path — an anonymous user is a real `auth.users` row with a real JWT, so RLS policies don't need a guest special-case. Claiming an account later is just `supabase.auth.updateUser({ email })` on the same user id; `is_anonymous` flips to false automatically. Must be enabled in Supabase dashboard → Authentication → Providers → Anonymous (**disabled by default**).
- **service_role bypasses RLS entirely.** It exists only for operations RLS genuinely can't express (e.g. writing an aggregate the child's own policy wouldn't allow, or scoring writes that need to touch another user's row context). See `backend/backend.md` "Environment & Secrets" for the exact rules — server-only, one import site.

## Next.js 16 specifics (read before writing route/auth code)

- Route handlers: `app/api/**/route.ts`, Web `Request`/`Response`, exported HTTP verbs. Typed dynamic params via the global `RouteContext<'/path/[id]'>` helper.
- `cookies()` from `next/headers` is **async** — always `await cookies()`.
- Middleware is renamed **Proxy** in Next 16: file is `proxy.ts` at the project root (same level as `app/`), export a `proxy(request: NextRequest)` function (default or named), not `middleware`. Functionally identical to old middleware, just renamed.
- Confirmed via the bundled docs in `frontend/node_modules/next/dist/docs/` — re-check there if anything here looks off; that copy is the ground truth for this exact installed version.

## Env vars (`frontend/.env.local`, git-ignored)

| Var | Exposure | Used by |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public | browser + server clients |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | browser + server clients (RLS-scoped) |
| `SUPABASE_SERVICE_ROLE_KEY` | secret, server-only | `lib/supabase/admin.ts` only |

## API response envelope

Every route handler returns one shape (`frontend/lib/api/response.ts`):

```ts
type ApiSuccess<T> = { ok: true; data: T }
type ApiError = { ok: false; error: { code: string; message: string; details?: unknown } }
```

Error `code`s are stable strings (`unauthorized`, `not_found`, `validation_failed`, `session_already_completed`, `trial_out_of_range`, …) — client code branches on `code`, never on `message` text.

## Auth helpers (`frontend/lib/api/auth.ts`)

- `requireUser()` — reads the session from the server client, 401s via a thrown typed error if absent. Works identically for anonymous and full accounts (both have a real user id).
- `requireChildAccess(childId)` — `requireUser()` + confirms the caller owns or teaches that child, via the same predicate RLS uses (`owns_child` / `teaches_child`), so the check can never drift from what the database actually enforces.

## Timing methodology (applies to every game, defined here for reuse)

- Stimulus onset is stamped inside `requestAnimationFrame`, after paint — not at the React state-update call site, which fires before paint and would systematically under-report elapsed time.
- Response time is read from the triggering DOM event's `event.timeStamp` (hardware input time), not from calling `performance.now()` inside the handler, which adds JS scheduling jitter on top of the true input time.
- Clients send raw offsets in milliseconds relative to session start; the server never trusts a claimed reaction-time-derived correctness judgment, only the raw response + timestamp, and grades independently.
- Trials batch-flush (~every 5 trials + on completion) rather than one request per trial, so network latency doesn't leak into the timing data collection path itself.

## Anti-tamper model

The client can assert: *what the child selected, and when.* It can never assert: *whether that was correct.* The server holds the authoritative stimulus plan (persisted at session start in `game_sessions.config`) and grades every submitted trial against it. This is the same reason session `config` is generated and stored server-side rather than client-side — a reproducible, server-authored plan is also what makes a session replayable for QA/debugging.

## Error taxonomy (initial set, extend as needed)

`unauthorized` · `forbidden` · `not_found` · `validation_failed` · `session_not_found` · `session_already_completed` · `trial_out_of_range` · `rate_limited` · `internal_error`
