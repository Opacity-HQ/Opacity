import { useEffect, useRef } from "react";

// Fastest plausible simple visual reaction time. A response arriving
// faster than this after stimulus onset isn't a real reaction to THIS
// trial — it's a leftover click from spam-tapping through fast-paced
// rounds like Stakeout, which would otherwise let a session be blitzed
// through in a fraction of a second regardless of what was shown. See
// docs/saket/TRD.md "Timing methodology".
export const MIN_REACTION_MS = 150;

// Stimulus timing per docs/saket/TRD.md "Timing methodology": onset is
// stamped inside requestAnimationFrame after paint (not at the React
// state-update call site, which fires before paint and would under-report
// elapsed time), and reaction time is read from the triggering DOM event's
// timeStamp — both share the same performance-timeline epoch, so
// event.timeStamp - onset is directly meaningful.
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

  // True once at least MIN_REACTION_MS have elapsed since this trial's
  // stimulus appeared. Callers should ignore (not just delay) any input
  // this returns false for — a genuine reaction to the current trial
  // can't be faster than that, so an earlier "response" is spillover from
  // spam-tapping through the previous trial's remounted button.
  //
  // Fails open when onset isn't stamped yet: unlike commit()'s `?? eventTimeStamp`
  // fallback (fine there — it only affects a *reported* number), falling back to
  // eventTimeStamp here would make `eventTimeStamp - onset` always equal 0,
  // permanently rejecting every input for the trial. This is a guard against
  // spam-clicking, not the source of truth for correctness (the server grades
  // independently), so an unstamped onset should never be able to softlock input.
  function hasElapsedSinceOnset(minMs: number, eventTimeStamp: number) {
    if (onsetRef.current === null) return true;
    return eventTimeStamp - onsetRef.current >= minMs;
  }

  return { markFirstMove, commit, hasElapsedSinceOnset };
}
