# Memory Quest — Game Agent Guide

This document describes the structure, architecture, and file responsibilities for **Memory Quest** (`app/memory-quest/`) and its corresponding backend API endpoint (`app/api/games/memory-quest/`).

---

## Game Overview

Memory Quest screens for **working memory** capacity, spatial recall, and visual-sequential memory performance in early dyslexia assessment. Players remember sequences of visual symbols or spatial grid locations across adaptively scaled difficulty levels.

- **Game ID**: `memory-quest`
- **Skill Key / Domain**: `working_memory`

---

## Frontend Directory Structure (`app/memory-quest/`)

### Route Files
- **[layout.tsx](file:///c:/Users/athar/Downloads/Opacity/frontend/app/memory-quest/layout.tsx)**: Server layout component wrapping the route in `GameLayout title="memory quest"`. Resolves current user dynamically via `getDisplayUsername()`.
- **[loading.tsx](file:///c:/Users/athar/Downloads/Opacity/frontend/app/memory-quest/loading.tsx)**: Next.js route loading state fallback.
- **[page.tsx](file:///c:/Users/athar/Downloads/Opacity/frontend/app/memory-quest/page.tsx)**: Full client game application (`"use client"`). Controls game phase state machine (`intro` → `loading` → `show` → `recall` → `feedback` → `stats`):
  - **Intro**: Title, instructions card, and start button.
  - **Show**: Timed stimulus display showing the sequence or spatial map with a progress bar.
  - **Recall**: Interactive recall phase with symbol bank input and backspace correction.
  - **Feedback**: Immediate result screen with points scored, level change indicators, and correct sequence reveals on errors.
  - **Stats**: Comprehensive summary card displaying accuracy %, max sequence length, average response time, level reached, and total score.
  - **Sound & Haptics**: Integrates `cuelume` audio (`loading`, `pulse`, `tick`, `success`, `error`, `droplet`) and `web-haptics` vibration presets (`nudge`, `success`, `error`).

---

## Backend API Endpoints (`app/api/games/memory-quest/`)

- **[route.ts](file:///c:/Users/athar/Downloads/Opacity/frontend/app/api/games/memory-quest/route.ts)**: Single Next.js route handler file powering Memory Quest challenge generation and adaptive evaluation:

  - **`GET /api/games/memory-quest?playerId=<id>&type=sequence|position`**:
    - Generates a new sequence or spatial grid challenge tailored to the player's current adaptive level.
    - Scales sequence length (`level + 2`) and exposure display window (`displayMsForLevel`, 3000ms at Level 1 down to 500ms floor).
    - Stores generated challenges server-side with unique UUIDs.

  - **`POST /api/games/memory-quest`**:
    - Receives user response array, response time in ms, and mistake counts.
    - Evaluates accuracy (partial position matches for sequence rounds, exact grid index for position rounds).
    - Executes the rule-based adaptive difficulty engine:
      - **ADVANCE**: Requires sustained high accuracy (≥85%) and fast response time across N consecutive rounds (window size scales with level).
      - **DROP**: Immediate drop by 1 level if accuracy <40% or mistakes ≥3.
      - **HOLD**: Maintains level for intermediate performance.
    - Returns round result (score, level updates, feedback text) and cumulative behavioral feature summary (`accuracy`, `maxSequenceLength`, `averageResponseTimeMs`, `difficultyLevelReached`).
