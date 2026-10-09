"use client";

import { play } from "cuelume";
import { useWebHaptics } from "web-haptics/react";

// Sound + haptic feedback for Memory Quest, per frontend/AGENTS.md
// ("Sound & Haptics" — cuelume for all game audio, web-haptics for all
// tactile feedback). The cue map is the one from PR #6, documented in
// docs/saket/MEMORY_QUEST_AUDIO_HAPTICS.md. Never gates anything on this —
// both libraries no-op safely on unsupported devices.
export function useGameFeedback() {
  const { trigger } = useWebHaptics();

  function onStart() {
    play("loading");
    trigger("nudge");
  }

  function onTap() {
    play("tap", { volume: 0.8 });
    trigger("nudge");
  }

  function onSelect() {
    play("select", { volume: 0.7 });
    trigger("nudge");
  }

  function onBackspace() {
    play("close", { volume: 0.7 });
    trigger("nudge");
  }

  function onCorrect() {
    play("success");
    trigger("success");
  }

  function onWrong() {
    play("error");
    trigger("error");
  }

  return { onStart, onTap, onSelect, onBackspace, onCorrect, onWrong };
}
