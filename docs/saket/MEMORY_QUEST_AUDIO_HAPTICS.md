# Memory Quest Audio & Haptics Documentation

## Overview

Memory Quest is a short-form memory game built for children. It presents a sequence or a positional challenge, then asks the player to reproduce it. To make the experience more responsive and encouraging, the game includes both audio cues and haptic feedback.

This implementation uses:

- `cuelume` for synthesized sound effects
- `web-haptics/react` for vibration feedback

The behaviors are implemented in the game page itself so the feedback stays local to the interaction flow and does not affect other routes.

## Files involved

- [frontend/app/memory-quest/page.tsx](../../frontend/app/memory-quest/page.tsx)
- [frontend/components/game-layout.tsx](../../frontend/components/game-layout.tsx)

## Goals

The feedback system is designed to:

- reinforce game state transitions
- make the game feel responsive on touch devices
- signal success and failure without relying on text alone
- keep the experience playful and easy to understand for young users

## Libraries used

### Cuelume

Cuelume provides lightweight, browser-based audio cues using Web Audio. It is safe to import on the server, and the sound plays only in the browser when the user interacts with the page.

The Memory Quest game initializes the delegated event binding once with:

```ts
useEffect(() => {
  bind();
}, []);
```

This enables the game to play sound cues programmatically using `play(...)` calls during game actions.

### Web Haptics

Web Haptics is used for vibration feedback on supported mobile devices. The app uses the React hook:

```ts
const { trigger } = useWebHaptics();
```

This provides feedback such as a subtle nudge, success pulse, and error vibration pattern.

## Sound and haptic mapping

| Game event | Sound | Haptic | Purpose |
| --- | --- | --- | --- |
| Start new round | `loading` | `nudge` | Signals the game is beginning |
| Tap emoji | `tick` | `nudge` | Confirms input selection |
| Backspace | `droplet` | `nudge` | Indicates a removed answer |
| Correct answer | `success` | `success` | Reinforces a correct memory recall |
| Incorrect answer | `error` | `error` | Signals a wrong answer without being harsh |
| Continue / next round | `pulse` | `nudge` | Moves to the next stage |

## Implementation notes

The sound helpers are defined as a small local utility layer in the game page:

```ts
const triggerHaptic = useCallback(
  (preset: "nudge" | "success" | "error" | "buzz") => {
    trigger(preset);
  },
  [trigger],
);

const playCue = useCallback(
  (sound: "loading" | "pulse" | "tick" | "success" | "error" | "droplet" | "release", volume?: number) => {
    play(sound, volume !== undefined ? { volume } : undefined);
  },
  [],
);
```

These helpers are then called when the game transitions between states:

- before a challenge starts
- when a tile or emoji is chosen
- when the user removes their last answer
- after the server evaluates the result
- before moving to the next round

## UX intent

The feedback system is intentionally light and positive:

- a subtle nudge is used for general interaction input
- success feedback is celebratory and rewarding
- error feedback is soft and recoverable rather than punishing
- sounds do not interrupt the game flow or overwhelm the user

This supports the product goal of a playful and encouraging dyslexia-supportive educational experience.

## Validation

The implementation was checked with project validation commands:

```bash
cd frontend
npm run lint
npm run build
```

The final validation completed successfully and the app built without errors.

## Best practices follow-up

If similar feedback is added to future games, keep the same pattern:

1. keep sound logic local to the game route
2. use short, non-intrusive sound names
3. reserve stronger effects for wins and errors only
4. avoid haptic feedback on every re-render
5. keep mobile support graceful when the device does not support vibration

This keeps the interaction design consistent across the app while staying within the project’s game-by-game boundaries.
