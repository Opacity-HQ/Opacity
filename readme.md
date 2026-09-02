# Opacity — Dyslexia Screening Platform

Opacity is a web-based platform that screens for early signs of dyslexia through interactive browser games. Designed for children, parents, and teachers, it uses evidence-based cognitive assessments delivered through engaging gameplay.

**Status**: Backend + Letter Detective complete (Phase 7); other games (Sound Match, Word Builder, Memory Quest, Rapid Match) in development against this API contract.

---

## Overview

### What is Opacity?

Opacity screens for dyslexia risk through five short, game-like cognitive assessments. The platform supports:

- **Children**: Play games as guests (no login required) or as registered profiles under a parent account
- **Parents**: Create accounts, manage multiple children, view risk reports and progress over time
- **Teachers**: Create or join classrooms, monitor classroom-wide risk screening results (no access to individual session data outside their classroom)

The output is a **risk band** (low/moderate/elevated), never a diagnostic label. This is a screening tool, not a diagnostic tool.

### Key Features

- ✅ **Anonymous Guest Play** — Play without account setup; claim account later by adding an email
- ✅ **Server-Side Grading** — All scoring, trial validation, and correctness judgments happen on the server, never in the browser
- ✅ **Row-Level Security (RLS)** — Every table protected at the database layer; a child's data is invisible to other children by default
- ✅ **Adaptive Difficulty** — Game difficulty adjusts based on `skill_states` stored per child
- ✅ **Session Replay** — Complete stimulus plans are stored, enabling session replay for QA/debugging
- ✅ **Anti-Tampering** — Clients send only raw responses (what they chose, when); servers compute correctness independently
- ✅ **Accessibility** — WCAG 2.1 AA compliance with semantic HTML, keyboard navigation, focus indicators, and reduced-motion support

---

## Architecture

```
Browser (React 19, Next.js 16, App Router)
    │
    ├─ Supabase browser client (anon key, RLS-scoped)
    │
    ▼
Next.js Route Handlers (frontend/app/api/**/route.ts)
    │
    ├─ Supabase server client (cookie-bound, anon key)
    ├─ Supabase admin client (service role key, server-only)
    │
    ▼
Supabase (Postgres + Auth + RLS)
```

**No standalone backend server.** Route handlers *are* the backend. The one service that can't live in Vercel functions — Whisper transcription + ML scoring — is reserved for a separate Python service (under `backend/`, owned by Saatvik), called server-to-server from route handlers.

### Security Model

- **RLS is the security boundary**, not application code. If a route handler has a bug, the database still refuses unauthorized queries.
- **Anonymous auth is native**: a "guest" is a real `auth.users` row with a real JWT. No separate guest code path.
- **Service role key is master-only**: bypasses RLS entirely, imported only in `frontend/lib/supabase/admin.ts`, used only in server-only code (route handlers).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Next.js 16, TypeScript, Tailwind CSS, shadcn/ui |
| **UI State** | Zustand, TanStack React Query |
| **Database** | Supabase (Postgres + Auth + RLS) |
| **API** | Next.js route handlers, REST |
| **Validation** | Zod |
| **Animations** | Motion, Cuelume (haptics), tw-animate-css |
| **Auth** | Supabase Auth (email/password + anonymous) |
| **ML** | Python (GBDT + SHAP), reserved for `backend/` |

---

## Project Structure

```
Opacity/
├── frontend/                          # Next.js app (all web work lives here)
│   ├── app/
│   │   ├── api/
│   │   │   ├── dashboard/            # Dashboard aggregates (children list, progress, reports)
│   │   │   ├── login/                # Password login, sign-out
│   │   │   ├── signin/               # Account creation, guest entry, claim-on-anonymous
│   │   │   └── games/
│   │   │       ├── letter-detective/ # Letter Detective API (complete)
│   │   │       ├── memory-quest/     # Memory Quest API (in development)
│   │   │       ├── rapid-match/      # Rapid Match API (in development)
│   │   │       ├── sound-match/      # Sound Match API (in development)
│   │   │       └── word-builder/     # Word Builder API (in development)
│   │   ├── letter-detective/         # Letter Detective game UI
│   │   ├── memory-quest/             # Memory Quest game UI
│   │   ├── rapid-match/              # Rapid Match game UI
│   │   ├── sound-match/              # Sound Match game UI
│   │   ├── word-builder/             # Word Builder game UI
│   │   ├── dashboard/                # Parent/teacher dashboard (UI only)
│   │   ├── globals.css               # Global styles
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Root page (signin/entry flow)
│   │   ├── providers.tsx             # React Context, query clients, auth state
│   │   └── font/                     # Font files
│   ├── components/
│   │   ├── game-layout.tsx           # Shared game wrapper
│   │   ├── signin.tsx                # Sign-in/account entry UI
│   │   └── ui/                       # Shared UI components (buttons, inputs, dialogs, etc.)
│   ├── lib/
│   │   ├── api/
│   │   │   ├── auth.ts               # requireUser(), requireChildAccess()
│   │   │   └── response.ts           # ApiSuccess / ApiError envelope
│   │   ├── auth/
│   │   │   └── get-display-username.ts
│   │   ├── db/
│   │   │   └── types.ts              # Generated Supabase types
│   │   ├── queries/                  # API client utilities
│   │   ├── supabase/
│   │   │   ├── admin.ts              # Service-role client (server-only)
│   │   │   ├── client.ts             # Browser client
│   │   │   └── server.ts             # Cookie-bound server client
│   │   └── utils.ts
│   ├── public/                       # Static assets
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── postcss.config.mjs
│   ├── tailwind.config.ts
│   ├── eslint.config.mjs
│   ├── proxy.ts                      # Next.js 16 proxy (auth refresh middleware)
│   └── .env.example                  # Environment variable template
│
├── backend/                           # Backend utilities & future ML service
│   ├── supabase/
│   │   └── migrations/               # SQL migrations (13 complete, applied)
│   │       ├── 01-profiles.sql       # User profiles (parents/teachers)
│   │       ├── 02-children.sql       # Child profiles
│   │       ├── 03-classrooms.sql     # Teacher classrooms
│   │       ├── 04-access_helper_functions.sql
│   │       ├── 05-children_teacher_select_policy.sql
│   │       ├── 06-games.sql          # Game definitions
│   │       ├── 07-game_sessions_and_trials.sql
│   │       ├── 08-session_scores_and_skill_states.sql
│   │       ├── 09-screening_reports.sql
│   │       ├── 10-letter_detective_content.sql
│   │       ├── 11-seed_games.sql
│   │       ├── 12-seed_letter_detective_content.sql
│   │       └── 13-harden_access_functions.sql
│   ├── backend.md                    # API route specification & secrets management
│   └── ml.md                         # ML service placeholder
│
├── docs/                              # Design & specification documents
│   └── saket/
│       ├── PRD.md                    # Product requirements
│       ├── TRD.md                    # Technical requirements & architecture
│       ├── APP_FLOW.md               # User flows & interactions
│       ├── UIUX_BRIEF.md             # UI/UX guidelines
│       ├── BACKEND_SCHEMA.md         # Database schema & RLS policies
│       └── MEMORY_QUEST_AUDIO_HAPTICS.md
│
├── ml/                                # Machine learning service (reserved)
│   └── ml.md
│
├── implementation_plan.md             # Phase-by-phase completion checklist
└── README.md                          # This file
```

---

## Getting Started

### Prerequisites

- **Node.js 18+** (check with `node --version`)
- **A Supabase project** (free tier available at https://supabase.com)
  - Get keys from Project Settings → API
  - Ask Saket for organization access if needed

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo>
   cd Opacity
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `frontend/.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```
   
   ⚠️ **Never commit `.env.local`** — it's in `.gitignore` for a reason.

4. **Apply database migrations**
   ```bash
   # In Supabase dashboard, go to SQL Editor
   # Run migrations from backend/supabase/migrations/ in order (01 → 13)
   # Or use Supabase CLI if you have it set up
   ```

5. **Enable Anonymous Authentication** (required for guest play)
   - Supabase dashboard → Authentication → Providers → Anonymous → Enable

6. **Start the development server**
   ```bash
   npm run dev
   ```
   
   Open http://localhost:3000 in your browser.

### Development Commands

```bash
npm run dev    # Start Next.js dev server on http://localhost:3000
npm run build  # Production build
npm run start  # Run production build
npm run lint   # Run ESLint
```

---

## API Routes

### Auth API

**Sign-in / Account Creation**
```
POST /api/signin
```
- Create a new account with email + password
- Create an anonymous guest session
- Claim an anonymous session by adding an email

**Login / Sign-out**
```
POST /api/login
```
- Log in with email + password
- Sign out (clear session)

### Dashboard API

**List Children, Progress, & Reports**
```
GET /api/dashboard
```
- Returns: array of children for this parent, per-game progress, latest risk report

**Create Child**
```
POST /api/dashboard
```
- Creates a new child profile under this parent

### Game APIs

Each game follows this pattern:

**Start Session**
```
GET /api/games/{game}/route.ts
```

**Submit Trials (Batched)**
```
POST /api/games/{game}/trial/route.ts
```

**Complete Session & Compute Score**
```
POST /api/games/{game}/complete/route.ts
```

#### Letter Detective (Complete)

- `GET /api/games/letter-detective/` — Start session, returns first trial
- `POST /api/games/letter-detective/trial/` — Batch submit trials
- `POST /api/games/letter-detective/complete/` — End session, returns score + difficulty update

#### Other Games (In Development)

- Memory Quest
- Rapid Match
- Sound Match
- Word Builder

See [backend/backend.md](backend/backend.md) for detailed route specifications and rules.

---

## Database Schema

### Key Tables

| Table | Purpose |
|-------|---------|
| `profiles` | Parents and teachers |
| `children` | Child player profiles |
| `classrooms` | Teacher-managed classrooms |
| `games` | Game definitions |
| `game_sessions` | One per game play session |
| `game_trials` | Individual trials within a session |
| `session_scores` | Final score + metadata per session |
| `skill_states` | Adaptive difficulty state per child per game |
| `screening_reports` | Risk band + timestamp per child |
| `ld_*` | Letter Detective-specific content (letter pairs, words) |

**Every table has Row-Level Security (RLS)** enabled from creation. See [BACKEND_SCHEMA.md](docs/saket/BACKEND_SCHEMA.md) for full schema with RLS policies.

---

## Games

### Letter Detective ✅ Complete

Children identify the odd letter or letter pair in a group (The Lineup), spot an impostor (Spot the Impostor), identify the correct pair from a suspect lineup (Stakeout), or find pairs hiding in words (Undercover in Words).

- 4 round types
- 21 trials per session
- Adaptive difficulty
- Anti-frustration UI (no failure state, no live score)
- Full accessibility

**API Routes**: `frontend/app/api/games/letter-detective/`  
**Game UI**: `frontend/app/letter-detective/`

### Memory Quest (In Development)

Children remember and replay a sequence of items that grows in length.

**API Contract**: `GET /api/games/memory-quest?playerId=<id>&type=sequence|position` + `POST /api/games/memory-quest` (see [backend/backend.md](backend/backend.md))

### Other Games (Planned)

- **Sound Match** — Acoustic matching
- **Word Builder** — Word formation under time pressure
- **Rapid Match** — Fast visual/semantic matching

---

## Key Concepts

### Response Envelope

Every API response follows this shape (from `frontend/lib/api/response.ts`):

```typescript
type ApiSuccess<T> = { ok: true; data: T }
type ApiError = { ok: false; error: { code: string; message: string; details?: unknown } }
```

Error codes are stable strings: `unauthorized`, `not_found`, `validation_failed`, `session_already_completed`, `trial_out_of_range`, etc. Client code branches on `code`, never on message text.

### Auth Helpers

From `frontend/lib/api/auth.ts`:

- **`requireUser()`** — Assert caller is authenticated. Works for both anonymous and full accounts (both have a real user id).
- **`requireChildAccess(childId)`** — Assert caller owns or teaches this child (via the same RLS predicate).

### Timing Methodology

- **Stimulus onset** is stamped in `requestAnimationFrame`, post-paint (not at state-update call site)
- **Response time** is read from DOM event's `event.timeStamp` (hardware input time)
- Clients send raw offsets in milliseconds; **servers compute correctness independently**
- Trials batch-flush (~every 5 trials + on completion) to avoid network latency in timing data

### Anti-Tamper Model

Clients can assert: *what the child selected, and when.*  
Clients cannot assert: *whether that was correct.*

The server holds the authoritative stimulus plan (stored in `game_sessions.config` at session start) and grades every trial against it. This makes sessions reproducible and auditable.

---

## Environment Variables

| Variable | Exposure | Used By | Purpose |
|----------|----------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Browser + Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Browser + Server | Public client key (RLS-scoped) |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Server only | Master key, bypasses RLS (⚠️ never expose) |

**Rules for `SUPABASE_SERVICE_ROLE_KEY`:**
- ✅ Imported only in `frontend/lib/supabase/admin.ts`
- ✅ Used only in server-only code (route handlers)
- ❌ Never in Client Components (`"use client"`)
- ❌ Never in browser-shipped code
- ❌ Never logged or put in error messages

---

## Development Workflow

### Adding a Game Route

1. Create the folder: `frontend/app/api/games/{game-name}/`
2. Create `route.ts` inside for your endpoints
3. Use `requireUser()` and `requireChildAccess()` to validate
4. Return `{ ok: true, data: ... }` or `{ ok: false, error: { code, message } }`
5. Do all grading server-side (never in the browser)
6. Store raw responses, not correctness claims

### Adding a Game UI

1. Create the folder: `frontend/app/{game-name}/`
2. Create `layout.tsx`, `page.tsx`, `loading.tsx`
3. Use `game-layout.tsx` wrapper for consistent styling
4. Follow accessibility guidelines from [UIUX_BRIEF.md](docs/saket/UIUX_BRIEF.md)
5. Use timing from trials (captured via `event.timeStamp`)
6. Call the game API routes from your component

See [backend/backend.md](backend/backend.md) for API route rules and examples.

---

## Testing

### Manual Verification Checklist

- [ ] Full guest playthrough (no login)
- [ ] Parent account creation + child addition
- [ ] Session data stored correctly in database
- [ ] Adaptive difficulty updates after session completion
- [ ] Cross-user RLS isolation (second account sees zero of first account's data)
- [ ] Tamper rejection (fabricated trial index, false correctness claims)
- [ ] Keyboard-only navigation
- [ ] Mobile viewport (< 400px width)
- [ ] `npm run lint` passes
- [ ] `npm run build` passes

### LiveOps

- Monitor `session_scores` for anomalies (e.g., unrealistic perfect scores)
- Check `skill_states` for adaptive difficulty drift
- Audit `game_sessions.config` for any missing or malformed plans

---

## Contributing

### Branch Naming

Current work: `Saket-Backend_LetterDetective` (owner-scope)

Future: `{owner}-{feature}` (e.g., `Zaid-SoundMatch_UI`)

### PR Checklist

- [ ] Code follows ESLint rules (`npm run lint`)
- [ ] Build passes (`npm run build`)
- [ ] Database migrations applied (if applicable)
- [ ] API responses follow the envelope shape
- [ ] All grading is server-side only
- [ ] No secrets in commit messages, PR descriptions, or code
- [ ] RLS policies are documented (if database changes)

### Code Review

All PRs to `main` require review. Watch for:
- Grading logic in the browser (❌ must be server-only)
- Service role key usage outside `admin.ts` (❌ never)
- New tables without RLS (❌ must have RLS from creation)
- Secrets in env files or logs (❌ never)

---

## Troubleshooting

### "Unauthorized" on every request

- Check that `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set in `.env.local`
- Verify Supabase URL is correct
- Check that RLS policies allow the operation for anon key users

### "Service role key not found"

- Confirm `SUPABASE_SERVICE_ROLE_KEY` is in `.env.local`
- Check that the route handler is using `admin.ts` from `lib/supabase/`
- Verify the file is imported, not in a Client Component

### "Cannot find child" (RLS reject)

- This is intentional — the user doesn't own that child
- Check `children.owner_id` matches the logged-in user's id
- For teachers, check the `classroom_members` and `owns_child`/`teaches_child` helper functions

### Migrations failed to apply

- Ensure migrations are run in order (01 → 13)
- Check Supabase dashboard SQL Editor for error messages
- Verify you're in the correct Supabase project

---

## Roadmap

| Phase | Status | Deliverables |
|-------|--------|--------------|
| **0** | ✅ Complete | Design docs, branch, env setup |
| **1** | ✅ Complete | Supabase clients, auth helpers, response envelope |
| **2** | ✅ Complete | Database schema + RLS + migrations |
| **3** | ✅ Complete | Auth API (signup, login, anonymous) |
| **4** | ✅ Complete | Dashboard API |
| **5** | ✅ Complete | Letter Detective API |
| **6** | ✅ Complete | Letter Detective game UI |
| **7** | ✅ Complete | Adaptive difficulty |
| **8** | 🔄 In Progress | Memory Quest API + UI |
| **9** | 🔄 In Progress | Sound Match API + UI |
| **10** | 🔄 In Progress | Rapid Match API + UI |
| **11** | 🔄 In Progress | Word Builder API + UI |
| **12** | ⏳ Planned | Parent/teacher dashboard UI |
| **13** | ⏳ Planned | ML scoring service (Python backend) |

---

## Team

- [saket](https://github.com/saketrama-v) — Backend, Letter Detective, Database Schema
- [Atharv](https://github.com/atharv-rem) — dashboard UI + frontend + rapid match game
- [Zaid](https://github.com/Zaidk2509), [Ritwik](https://github.com/RitwikGupta06), [Pranshu](https://github.com/pranshu1606) — Game UIs (Sound Match, Word Builder, Memory Quest)
- [Saatvik](https://github.com/Saatvik6) — ML scoring service (GBDT + SHAP, Whisper integration)

---


## Resources

- [Supabase Docs](https://supabase.com/docs)
- [Next.js 16 Docs](https://nextjs.org/docs)
- [Zod Validation](https://zod.dev)
- [React 19 Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)

---

## Questions?

See [docs/saket/](docs/saket/) for deep dives into:
- [PRD.md](docs/saket/PRD.md) — Problem statement & success criteria
- [TRD.md](docs/saket/TRD.md) — Technical architecture & auth model
- [APP_FLOW.md](docs/saket/APP_FLOW.md) — User flows & interactions
- [UIUX_BRIEF.md](docs/saket/UIUX_BRIEF.md) — UI/UX guidelines & accessibility
- [BACKEND_SCHEMA.md](docs/saket/BACKEND_SCHEMA.md) — Database schema with RLS policies
- [backend/backend.md](backend/backend.md) — API route specification & secrets management
