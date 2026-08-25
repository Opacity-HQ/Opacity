# Frontend Agent Guide

This file applies to everything under `frontend/`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project Snapshot

- Framework: Next.js `16.3.1` with the App Router.
- Runtime UI: React `19.2.8`.
- Language: TypeScript with `strict` enabled.
- Server State & API: `@tanstack/react-query` (TanStack Query).
- Client Global State: Zustand (`zustand`).
- Styling: Tailwind CSS v4 through `app/globals.css`, plus shadcn/base-ui components.
- Icons: `lucide-react`.
- Motion: `motion/react`.
- Sound: `cuelume`.
- Haptics: `web-haptics`.
- Import alias: use `@/` for project-root imports.
- Product: Opacity, a dyslexia screening experience with game-like routes.

## Commands

Run commands from `frontend/`.

```bash
npm run dev
npm run build
npm run lint
```

Use `npm run lint` for quick validation after edits. Use `npm run build` before handing off larger changes that touch routing, layout, assets, or framework APIs.

## Directory Conventions

- `app/` contains routes, layouts, loading states, global CSS, and font assets.
- `components/` contains reusable application components.
- `components/ui/` contains shadcn/base-ui primitives. Keep these generic and reusable.
- `lib/` contains shared helpers such as `cn`.
- `public/` contains static images and SVGs referenced from the app.

Add new game routes under `app/<route-name>/` with `page.tsx`; include `layout.tsx` and `loading.tsx` when the route needs its own shell or loading treatment.

## Game Work Boundaries

- Do not edit `app/page.tsx`; it was created by Atharv and should remain untouched unless Atharv explicitly asks for changes there.
- Each game must stay in its own route folder under `app/`.
- Put `letter-detective` work only in `app/letter-detective/`.
- Put `memory-quest` work only in `app/memory-quest/`.
- Put `rapid-match` work only in `app/rapid-match/`.
- Put `sound-match` work only in `app/sound-match/`.
- Put `word-builder` work only in `app/word-builder/`.
- Do not edit any game folder's `layout.tsx`; every game route already has its layout, and it should remain untouched unless Atharv explicitly asks for layout changes.
- Build or update the actual game only in that game's `page.tsx`.
- Do not place one game's logic, state, assets, or route-only components inside another game's folder.
- For game API endpoints, use only the game-specific folders already created under `app/api/games/`.
- Put `letter-detective` endpoints only in `app/api/games/letter-detective/`.
- Put `memory-quest` endpoints only in `app/api/games/memory-quest/`.
- Put `rapid-match` endpoints only in `app/api/games/rapid-match/`.
- Put `sound-match` endpoints only in `app/api/games/sound-match/`.
- Put `word-builder` endpoints only in `app/api/games/word-builder/`.
- If a new game is created, make a new `app/<game-name>/` folder for it and keep that game's route-specific files there.
- Move code out of a game folder only when it is genuinely shared by multiple routes.

## Git Workflow

- Any game that has been created or edited must be raised in a pull request.
- Do not commit game changes directly to the main branch.
- Keep each pull request focused on the specific game or shared component being changed.

Use this flow to create a pull request:

```bash
git status
git switch main
git pull origin main
git switch -c feature/<short-change-name>
# make the game changes after creating the branch
git add <changed-files>
git commit -m "<clear commit message>"
git push -u origin feature/<short-change-name>
gh pr create --base main --head feature/<short-change-name> --title "<clear PR title>" --body "<short summary and test notes>"
```

Before creating the PR, run the relevant checks:

```bash
npm run lint
npm run build
```

## Next.js Rules

- Before changing Next-specific APIs, routing behavior, metadata, fonts, server/client component boundaries, or config, read the matching guide in `node_modules/next/dist/docs/`.
- Prefer server components by default. Add `"use client"` only when a component needs state, effects, browser APIs, event handlers, animation, or other client-only behavior.
- Use `next/image` for image assets unless there is a specific reason to use a raw element.
- Keep route metadata close to the relevant layout or page.
- Do not remove the managed Next.js block in this file.

## Data Fetching & API (TanStack Query)

- **Exclusive API & Data Fetching Standard**: Use **only** TanStack Query (`@tanstack/react-query`) for all client-side data fetching, mutations, caching, and server-state management. Do not use raw `fetch()` calls directly inside client components, `axios`, or manual `useEffect` + `useState` fetching patterns.
- **Structured Query Keys**: Organize query keys consistently as tuples or array hierarchies (e.g. `['games', gameId]`, `['user', userId]`) to ensure predictable cache updates and precise invalidations via `queryClient.invalidateQueries`.
- **Mandatory Performance & Optimization Practices**:
  - **`staleTime`**: Set an explicit, tailored `staleTime` for queries to avoid unnecessary background re-fetches (e.g., non-zero `staleTime` for static or infrequently changing game configuration data).
  - **`gcTime`**: Configure `gcTime` (Garbage Collection Time) intentionally based on lifecycle needs to optimize client memory usage.
  - **`select` Data Transformation**: Use the `select` option in `useQuery` to transform or filter response data inline. This memoizes the output and prevents unnecessary component re-renders when unneeded fields update.
  - **Refetch Fine-Tuning**: Explicitly configure `refetchOnWindowFocus`, `refetchOnReconnect`, and `refetchOnMount` to avoid disruptive background fetching during user gameplay or active UI interactions.
  - **Optimistic Updates**: For user actions using `useMutation`, implement optimistic updates (`onMutate`, `onError`, `onSettled`, `queryClient.setQueryData`) to deliver immediate visual feedback.
  - **Prefetching**: Leverage `queryClient.prefetchQuery` or `queryClient.ensureQueryData` to pre-load route or game assets ahead of navigation/transitions.
  - **Retry & Error Management**: Fine-tune `retry` counts and backoff logic to prevent hammering endpoints when requests fail (e.g. disable automatic retries on 4xx client errors).

## Client Global State (Zustand)

- **Purpose & Scope**: Use Zustand (`zustand`) exclusively for client-side global UI state, active game session state, temporary local settings/preferences, and cross-component client state.
- **Separation of Concerns**: Do NOT use Zustand to store or duplicate server data or API responses — use TanStack Query as the single source of truth for server state.
- **Store Organization**: Keep stores modular and scoped to specific domain areas or game routes (e.g. `useSoundMatchStore`, `useUIStore`) rather than creating a single bloated monolithic store.
- **Selectors & Performance**: Always use selector functions when subscribing to Zustand store state (e.g. `const score = useGameStore((s) => s.score)`) to prevent unnecessary component re-renders when unrelated properties in the store change.

## Sound & Haptics

- **In-Game Sound Effects & Audio**: All game sounds and audio effects must be implemented using the pre-installed `cuelume` library.
- **Web Haptics & Vibration**: All tactile and vibrational feedback across games must be implemented using the pre-installed `web-haptics` library.

## TypeScript And React

- Keep TypeScript strict: avoid `any` unless the external API is genuinely untyped and a narrow local type is not practical.
- Type component props explicitly.
- Keep component state local until there is a real sharing requirement.
- Prefer small, readable components over large pages with repeated JSX.
- Use `React.ReactElement`, `React.ReactNode`, and route types consistently with the existing code.

## Styling And UI

- Use Tailwind utilities and the tokens defined in `app/globals.css` before adding custom CSS.
- Use only the existing `font-pixel` and `font-sauce` font utilities. Do not introduce or rely on any other font family for game UI.
- Keep each game's visual theme consistent with the rest of the website.
- Keep the visual tone playful but readable for dyslexic users: clear spacing, strong hierarchy, predictable controls, and simple copy.
- Do not rely on color alone to communicate important state.
- Preserve keyboard access, labels, focus states, and semantic HTML for interactive elements.
- Use `lucide-react` icons for common controls when an icon improves clarity.

## Components

- Use shadcn components first when a UI component is needed.
- Reuse `components/ui/*` before creating a new primitive.
- When editing `components/ui/*`, keep changes generic and avoid product-specific behavior.
- Put any extra shared components you create in `components/`.
- Put any game-specific component only in that game's own component folder, such as `app/<game-name>/components/`; do not put game-specific components in `components/`.
- Use `cn` from `@/lib/utils` for conditional class names.
- Keep responsive behavior explicit with stable dimensions and Tailwind breakpoints.

## Assets

- Put static assets in `public/`.
- Reference public assets with root-relative paths such as `/logo.svg`.
- Keep image alt text useful and human-readable.
- Avoid committing generated build output such as `.next/` or TypeScript build info.

## Quality Bar

Before finishing a frontend change:

1. Run `npm run lint`.
2. Run `npm run build` for substantial changes.
3. Manually check responsive behavior for pages, dialogs, drawers, and game screens.
4. Verify interactive flows with keyboard and pointer input.
5. Confirm text does not overlap or overflow on mobile widths.

If a command cannot be run, note that clearly in the handoff.
