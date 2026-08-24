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

### Memory Quest contract

Memory Quest exposes one route at:

```text
GET/POST frontend/app/api/games/memory-quest/route.ts
```

`GET /api/games/memory-quest?playerId=<id>&type=sequence|position` creates a challenge. The response includes an opaque challenge ID, the sequence to display, the display duration, and the current adaptive level. The expected answer is retained server-side until submission.

`POST /api/games/memory-quest` accepts:

```json
{
	"challengeId": "uuid",
	"playerId": "user-id",
	"response": ["apple", "dog", "star"],
	"responseTimeMs": 1800,
	"attempts": 1,
	"mistakes": 0
}
```

The response returns correctness, score, the next level, and the measured summary: accuracy, maximum sequence length, average response time, attempts, errors, and difficulty reached. The adaptive policy advances after three strong recent rounds and eases the level after low accuracy or repeated mistakes. This is an explainable baseline model, so it needs no AI API.

The current route uses an in-memory store as a development fallback. A Supabase project URL and server-only service role key are needed later for durable challenge and performance storage across deployments. Never expose the service role key to the browser.

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
