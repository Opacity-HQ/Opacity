import { useMemo } from "react";
import { useSharedGameFeedback } from "@/lib/game-feedback";

// Sound Match's names for the shared cue map in lib/game-feedback.ts.
// Do not call cuelume/web-haptics directly here: every game must sound the
// same for the same moment.
//
// This is NOT where spoken words come from: cuelume is UI sound-effect
// presets only. The target/option words are spoken via the browser's
// SpeechSynthesis API behind useSpeech.ts. The two are never conflated.
export function useGameFeedback() {
  const shared = useSharedGameFeedback();
  return useMemo(
    () => ({
      onCaseStart: shared.onStart,
      onCorrect: shared.onCorrect,
      onWrong: shared.onWrong,
      onLevelUp: shared.onLevelUp,
      onCaseSolved: shared.onComplete,
    }),
    [shared],
  );
}
