import { useEffect, useRef } from "react";

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

  return { markFirstMove, commit };
}
