import { useMemo } from "react";
import { useSharedGameFeedback } from "@/lib/game-feedback";

// Rapid Match's names for the shared cue map in lib/game-feedback.ts.
// Do not call cuelume/web-haptics directly here: every game must sound the
// same for the same moment.
export function useGameFeedback() {
  const shared = useSharedGameFeedback();
  return useMemo(
    () => ({
      onCaseStart: shared.onStart,
      onCorrect: shared.onCorrect,
      onWrong: shared.onWrong,
      onCaseSolved: shared.onComplete,
      onTick: shared.onSelect,
    }),
    [shared],
  );
}
