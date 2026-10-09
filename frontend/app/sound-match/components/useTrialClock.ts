import { useEffect, useRef } from "react";

// Copied from app/letter-detective/components/useTrialClock.ts — the
// project-wide timing methodology from docs/saket/TRD.md, not optional
// per-game.

// Fastest plausible simple visual/auditory reaction time. A response
// arriving faster than this after stimulus onset isn't a real reaction to
// THIS trial — it's a leftover tap from spam-tapping through the previous
// trial's remounted buttons. Callers should ignore such input, not delay it.
export const MIN_REACTION_MS = 150;

// Stimulus onset is stamped inside requestAnimationFrame, after paint (not
// at the React state-update call site, which fires before paint and would
// under-report elapsed time). Reaction time is read from the triggering DOM
// event's timeStamp (hardware input time) — both share the same
// performance-timeline epoch, so `event.timeStamp - onset` is directly
// meaningful.
export function useTrialClock(trialKey: string | number) {
  const onsetRef = useRef<number | null>(null);
  const firstMoveRef = useRef<number | null>(null);

  useEffect(() => {
    onsetRef.current = null;
    firstMoveRef.current = null;
    const rafId = requestAnimationFrame((ts) => {
      onsetRef.current = ts;
    });
    return () => cancelAnimationFrame(rafId);
  }, [trialKey]);

  function markFirstMove(eventTimeStamp: number) {
    if (firstMoveRef.current === null) {
      firstMoveRef.current = eventTimeStamp;
    }
  }

  function commit(eventTimeStamp: number) {
    const onset = onsetRef.current ?? eventTimeStamp;
    const firstMove = firstMoveRef.current ?? eventTimeStamp;
    return {
      reactionTimeMs: Math.max(0, Math.round(eventTimeStamp - onset)),
      timeToFirstMoveMs: Math.max(0, Math.round(firstMove - onset)),
    };
  }

  // Fails open when onset isn't stamped yet — this is a spam-tap guard, not
  // the source of truth for correctness (the server grades independently),
  // so an unstamped onset must never softlock input.
  function hasElapsedSinceOnset(minMs: number, eventTimeStamp: number) {
    if (onsetRef.current === null) return true;
    return eventTimeStamp - onsetRef.current >= minMs;
  }

  return { markFirstMove, commit, hasElapsedSinceOnset };
}
