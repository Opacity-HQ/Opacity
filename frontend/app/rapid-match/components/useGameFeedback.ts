import { useCallback } from "react";
import { play } from "cuelume";
import { useWebHaptics } from "web-haptics/react";

export function useGameFeedback() {
  const { trigger } = useWebHaptics();

  const onCaseStart = useCallback(() => {
    try {
      play("pulse", { volume: 0.8 });
      trigger("nudge");
    } catch {
      // Audio/haptic fallback
    }
  }, [trigger]);

  const onCorrect = useCallback(() => {
    try {
      play("success");
      trigger("success");
    } catch {
      // Audio/haptic fallback
    }
  }, [trigger]);

  const onWrong = useCallback(() => {
    try {
      play("error");
      trigger("error");
    } catch {
      // Audio/haptic fallback
    }
  }, [trigger]);

  const onCaseSolved = useCallback(() => {
    try {
      play("pulse", { volume: 1 });
      trigger("success");
    } catch {
      // Audio/haptic fallback
    }
  }, [trigger]);

  const onTick = useCallback(() => {
    try {
      play("tick", { volume: 0.6 });
      trigger("nudge");
    } catch {
      // Audio/haptic fallback
    }
  }, [trigger]);

  return {
    onCaseStart,
    onCorrect,
    onWrong,
    onCaseSolved,
    onTick,
  };
}
