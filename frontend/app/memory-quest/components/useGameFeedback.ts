"use client";

import { useMemo } from "react";
import { useSharedGameFeedback } from "@/lib/game-feedback";

// Memory Quest's names for the shared cue map in lib/game-feedback.ts.
// Do not call cuelume/web-haptics directly here: every game must sound the
// same for the same moment.
export function useGameFeedback() {
  const shared = useSharedGameFeedback();
  return useMemo(
    () => ({
      onStart: shared.onStart,
      onTap: shared.onTap,
      onSelect: shared.onSelect,
      onBackspace: shared.onBackspace,
      onCorrect: shared.onCorrect,
      onWrong: shared.onWrong,
    }),
    [shared],
  );
}
