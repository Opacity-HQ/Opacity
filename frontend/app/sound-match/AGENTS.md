# Sound Match — Game Agent Guide

This document describes the structure, architecture, and file responsibilities
for **Sound Match** (`app/sound-match/`) and its backend API endpoints
(`app/api/games/sound-match/`). It is the third instance of the pattern
established by Letter Detective and Rapid Match — same session shape (warm-up +
scored trials, batched flush, Zustand store, TanStack Query mutations,
server-authored plan, server-side grading).

---

## Game Overview

Sound Match screens for **phonological awareness** — first-sound recognition,
rhyme, minimal-pair discrimination, and phoneme→letter mapping.

- **Game ID**: `sound-match` (already seeded in `games`).
- **Skill Key / Domain**: `phonological_awareness` (free-text `skill_states.skill_key`,
  no enum/FK — an upsert with this key is enough).

### Two difficulty axes

- **Inter-session** (`route.ts`): reads `skill_states.difficulty_level` for
  `phonological_awareness` (1–4) at session start. This scales how hard the
  content *within* each in-session level is — timeout length, and which
  minimal-pair pool Level 3 draws from (easy `b/p`, `sh/ch` at base ≤2; adds
  `i/ee`, `a/e`, `f/v`, `d/t` at base ≥3).
- **Intra-session** (`plan.ts` `generatePlan`): builds exactly **15 scored
  trials** up front, tagged `level: 1 | 2 | 3 | 4` by question position per the
  source design (Q1–4 → L1, Q5–8 → L2, Q9–12 → L3, Q13–15 → L4), mirroring the
  pure `getLevel(questionNumber)`. An incorrect answer never demotes the level.
  The client reads `trial.level` off the server-authored plan; it never
  computes the level itself (anti-tamper + reproducibility, see
  `docs/saket/TRD.md`).

---

## Decisions (called out per the build brief)

### Warm-up: option (b)

**2 unscored practice trials run before Q1**, shown as "warm-up" outside the
1–15 counter (both use the Level 1 first-sound mechanic). Q1 then starts the
visible progression. This keeps the "first real trial isn't the first exposure
to the mechanic" convention every other game follows. The session is therefore
17 trials total: 2 warm-up + 15 scored. Warm-up trials are recorded in
`game_trials` with `is_correct` / `error_type` = `null` and are excluded from
scoring, exactly like Rapid Match / Letter Detective.

### Audio: browser SpeechSynthesis, hybrid text visibility

Nothing in this repo plays spoken words — `cuelume` is UI sound-effect presets
only. Sound Match speaks words via the browser's native `SpeechSynthesis` API
behind `useSpeech.ts`: feature-detected (`"speechSynthesis" in window`), silent
no-op fallback, never throws, never blocks a trial. `cuelume` / `web-haptics`
remain for UI feedback only (correct / wrong / level-up) — the two are never
conflated.

Text visibility of answer options, per the construct-validity judgment call:

| Level | Target | Options |
|---|---|---|
| 1 first-sound | word shown as text **and** spoken | picture (lucide icon) + word label |
| 2 rhyme | word shown as text **and** spoken | picture (lucide icon) + word label |
| 3 minimal-pair | spoken only (replay button) | **audio-replay buttons** — shape glyph + "Sound N", the spelled word is NOT printed (printing `SHIP / SHEEP / CHIP` would let a child letter-match and skip the auditory discrimination the trial measures). Fallback: if `speechSynthesis` is unavailable the words ARE shown, so the trial stays answerable. |
| 4 phoneme→letter | phoneme label (e.g. `/b/`) shown as text **and** spoken | letter glyphs (must be visible — picking the letter *is* the task). Last two items target a non-initial sound ("last sound in 'cat'"). |

### `ChildSetup.tsx`

Byte-identical to `rapid-match` / `letter-detective` copies. Flagged here as a
candidate for promotion to `frontend/components/` now that four games carry an
identical copy — left to whoever owns cross-game refactors (`backend.md`: "move
to shared only when multiple routes genuinely need it"), not done unilaterally.

---

## Frontend Directory Structure (`app/sound-match/`)

### Route Files
- **`layout.tsx`** — unchanged; wires `GameLayout title="sound match"`.
- **`loading.tsx`** — unchanged route loading fallback.
- **`page.tsx`** — client entry (`"use client"`). State machine:
  `dashboardQuery.isPending / isError` → `ChildSetup` (no child) → `intro` →
  `playing` (buffers trial outcomes, flushes every 5, inserts the `levelup`
  phase at each level boundary read from `trial.level`) → `completed`. Mirrors
  `rapid-match/page.tsx` structurally.

### Components (`app/sound-match/components/`)
- **`store.ts`** — Zustand `useSoundMatchStore`. Phases
  `"intro" | "playing" | "levelup" | "completed"`. `levelup` renders instead of
  the current trial; the cursor only advances when the transition finishes
  (`exitLevelUp`).
- **`queries.ts`** — TanStack Query mutations `useStartSoundMatchSessionMutation`
  / `useSubmitSoundMatchTrialsMutation` / `useCompleteSoundMatchSessionMutation`,
  via `fetchJson`.
- **`types.ts`** — `TrialOutcome`, `AccuracyResult` (accuracy, meanRtMs,
  mastery, nextDifficultyLevel, streak = longest in-session run, xp, levelReached,
  correctCount, totalScored).
- **`useGameFeedback.ts`** — `cuelume` + `web-haptics` presets (correct / wrong /
  level-up / start / solved). All wrapped so failure never blocks gameplay.
- **`useSpeech.ts`** — `SpeechSynthesis` wrapper: `speak(text)` + `isSupported`.
- **`useTrialClock.ts`** — copied from Letter Detective. Stimulus onset stamped
  in `requestAnimationFrame` after paint; reaction time read from the DOM
  event's `timeStamp`; `MIN_REACTION_MS` spam-tap guard (`docs/saket/TRD.md`
  timing methodology).
- **`usePrefersReducedMotion.ts`** — copied from Letter Detective; not
  reimplemented differently.
- **`optionIcons.tsx`** — `OptionIcon` — lucide icon lookup for L1/L2 picture
  answers. The plan's content banks only reference names in this map.
- **`SpeakerButton.tsx`** — shared tappable replay control (`Volume2`).
- **`PictureChoiceRound.tsx`** — shared body for L1/L2 (picture answers +
  text + audio), following `TargetMatchRound.tsx`'s timing pattern.
- **`FirstSoundRound.tsx`** (L1) / **`RhymeRound.tsx`** (L2) — thin wrappers
  over `PictureChoiceRound` so every level still has its own named component.
- **`MinimalPairRound.tsx`** (L3) — audio-replay option buttons, minimal-pair
  discrimination, `confusionPair` from the plan.
- **`PhonemeLetterRound.tsx`** (L4) — phoneme label + spoken sound, 4 letter
  options.
- **`LevelUpTransition.tsx`** — the 1–2s non-blocking level-up card. Auto-
  advances via timeout; reduced-motion fallback (instant swap, shorter hold).
- **`SoundMatchIntro.tsx`** / **`SoundMatchCompleted.tsx`** — intro and post-Q15
  results screen (XP, accuracy `13/15, 87%`, longest streak, level reached,
  closing message). Pattern-match `MatchIntro.tsx` / `MatchCompleted.tsx`.
- **`ChildSetup.tsx`** — inline profile-creation form (see decision above).

### Anti-frustration compliance (`docs/saket/UIUX_BRIEF.md`)
- No running score / streak / XP / countdown visible during `playing` — only a
  quiet `level N` badge + dot progress bar (equivalent to what Rapid Match /
  Letter Detective already show). XP / accuracy / streak appear only on the
  post-Q15 results screen.
- Per-trial feedback is wiggle-on-wrong / glow-on-correct (never a red X, never
  a failure sound), then the correct answer glows so the child still learns it.
- Timeouts quietly end the trial (`selectedIndex: null` → `error_type: "timeout"`),
  nothing on screen implies fault.
- Real `<button>` elements throughout; full keyboard path (number keys 1–4 for
  options, `Enter` / `Space` to confirm a focused option); visible focus rings.
- Stable layout dimensions once a round starts.

---

## Backend API Endpoints (`app/api/games/sound-match/`)

- **`plan.ts`**
  - **`generatePlan(supabase, difficultyLevel)`** — returns a versioned,
    server-authored `SMPlan` of 2 warm-ups + 15 scored trials, each a
    discriminated union on `roundType` (`first-sound` | `rhyme` |
    `minimal-pair` | `phoneme-letter`) carrying one `level` field. The Supabase
    client is unused (content banks are static in this file, unlike Letter
    Detective's `ld_*` tables) but kept in the signature for contract parity.
  - **`getLevel(questionNumber)`** — pure position → level function.
  - **`gradeTrial(trial, response)`** — pure, server-only. Returns
    `{ isCorrect, errorType }`: `errorType` is `null` on correct, `"timeout"`
    when `selectedIndex === null`, `"phonological"` otherwise (the value
    `game_trials.error_type` already reserves for this game).
- **`route.ts`** — `POST /api/games/sound-match`. `requireChildAccess(childId)`,
  read `skill_states` for `phonological_awareness`, `generatePlan`, insert
  `game_sessions` (`status: "in_progress"`, `config: plan`), return
  `{ sessionId, trials, difficultyLevel }`.
- **`trial/route.ts`** — `POST /api/games/sound-match/trial`. `requireUser()`,
  load session, reject if not `in_progress` (`session_already_completed`),
  reject unknown trial index (`trial_out_of_range`), `gradeTrial` each
  submission against `session.config`, upsert `game_trials` with
  `onConflict: "session_id,trial_index"`. `is_correct` / `error_type` stay
  `null` for warm-ups.
- **`complete/route.ts`** — `POST /api/games/sound-match/complete`. Computes
  `accuracy`, `mean_rt_ms`, `median_rt_ms`, `rt_cv`, `throughput` the same way
  Rapid Match does; `mirror_error_rate` is `null` (not applicable). Upserts
  `session_scores` with per-level accuracy breakdown, longest streak, level
  reached and XP inside `raw_features` (no new top-level columns). Upserts
  `skill_states` (`skill_key = "phonological_awareness"`) with the same
  advance / hold / drop-by-accuracy logic as Rapid Match.
