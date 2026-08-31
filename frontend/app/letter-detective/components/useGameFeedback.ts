"use client";

import { play } from "cuelume";
import { useWebHaptics } from "web-haptics/react";

// Sound + haptic feedback for Letter Detective, per frontend/AGENTS.md
// ("Sound & Haptics" — cuelume for all game audio, web-haptics for all
// tactile feedback). Centralized here rather than duplicated per round
// component: page.tsx already receives every trial's client-computed
// localCorrect in one place (handleAnswer), so that's the single point
// outcome feedback needs to fire from. Never gates anything on this —
// audio/haptics failing silently (unsupported device, blocked autoplay,
// no Vibration API) must never block gameplay; both libraries already
// no-op safely on their own.
export function useGameFeedback() {
  const { trigger } = useWebHaptics();

  function onCorrect() {
    play("success");
    trigger("success");
  }

  function onWrong() {
    // "error" is cuelume's correct semantic match and is itself described
    // as soft ("soft knock and descending refusal"), fitting the game's
    // never-punish tone. The built-in haptic "error" preset (three sharp
    // taps at 0.75 intensity) reads as harsher than that — use a single
    // gentle pulse instead so a wrong pick never feels like a penalty.
    play("error");
    trigger(40, { intensity: 0.3 });
  }

  function onCaseStart() {
    play("ready");
  }

  function onCaseSolved() {
    play("bloom");
    trigger("success");
  }

  return { onCorrect, onWrong, onCaseStart, onCaseSolved };
}
