"use client";

import { useMemo } from "react";
import { useSharedGameFeedback } from "@/lib/game-feedback";

// Letter Detective's names for the shared cue map in lib/game-feedback.ts.
// Do not call cuelume/web-haptics directly here: every game must sound the
// same for the same moment.
export function useGameFeedback() {
  const shared = useSharedGameFeedback();
  return useMemo(
    () => ({
      onCorrect: shared.onCorrect,
      onWrong: shared.onWrong,
      onCaseStart: shared.onStart,
      onCaseSolved: shared.onComplete,
    }),
    [shared],
  );
}
