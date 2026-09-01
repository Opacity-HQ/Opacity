import { useCallback } from "react";
import { play } from "cuelume";
import { useWebHaptics } from "web-haptics/react";

// UI sound + haptic feedback for Sound Match, per frontend/AGENTS.md
// ("cuelume for all game audio, web-haptics for all tactile feedback").
// Centralized here rather than per round component — page.tsx already sees
// every trial outcome in one place.
//
// This is NOT where spoken words come from: cuelume is UI sound-effect
// presets only. The target/option words are spoken via the browser's
// SpeechSynthesis API behind useSpeech.ts. The two are never conflated.
//
// Everything is wrapped so audio/haptics failing silently (unsupported
// device, blocked autoplay, no Vibration API) never blocks gameplay.
export function useGameFeedback() {
  const { trigger } = useWebHaptics();

  const onCaseStart = useCallback(() => {
    try {
      play("pulse", { volume: 0.8 });
      trigger("nudge");
    } catch {
      // no-op fallback
    }
  }, [trigger]);

  const onCorrect = useCallback(() => {
    try {
      play("success");
      trigger("success");
    } catch {
      // no-op fallback
    }
  }, [trigger]);

  const onWrong = useCallback(() => {
    try {
      play("error");
      trigger(40, { intensity: 0.3 });
    } catch {
      // no-op fallback
    }
  }, [trigger]);

  const onLevelUp = useCallback(() => {
    try {
      play("pulse", { volume: 0.9 });
      trigger("success");
    } catch {
      // no-op fallback
    }
  }, [trigger]);

  const onCaseSolved = useCallback(() => {
    try {
      play("pulse", { volume: 1 });
      trigger("success");
    } catch {
      // no-op fallback
    }
  }, [trigger]);

  return { onCaseStart, onCorrect, onWrong, onLevelUp, onCaseSolved };
}
