"use client";

import { useMemo } from "react";
import { play } from "cuelume";
import { useWebHaptics } from "web-haptics/react";

// The one sound + haptic vocabulary every game shares, per frontend/AGENTS.md
// ("cuelume for all game audio, web-haptics for all tactile feedback"). A
// given moment must sound and feel the same in every game, so each game's
// own useGameFeedback hook is a thin alias over this map — change a cue here
// and all five games change together.
//
// Only cuelume's stable cue names are used (no deprecated 0.2 aliases like
// pulse/bloom/tick). A wrong answer is deliberately gentle (soft "error"
// cue + one light pulse) because the games must never feel punishing.
// Audio/haptics are fire-and-forget: both libraries no-op safely on
// unsupported devices and must never block gameplay.
export type GameFeedback = ReturnType<typeof useSharedGameFeedback>;

export function useSharedGameFeedback() {
  const { trigger } = useWebHaptics();

  return useMemo(
    () => ({
      /** A session/round begins (usually waits on the network). */
      onStart() {
        play("loading");
        trigger("nudge");
      },
      /** Generic button press with no richer meaning (continue, next). */
      onTap() {
        play("tap", { volume: 0.8 });
        trigger("nudge");
      },
      /** A tile/option is picked or added. */
      onSelect() {
        play("select", { volume: 0.7 });
        trigger("nudge");
      },
      /** A pick is undone. */
      onBackspace() {
        play("close", { volume: 0.7 });
        trigger("nudge");
      },
      onCorrect() {
        play("success");
        trigger("success");
      },
      onWrong() {
        play("error");
        trigger(40, { intensity: 0.3 });
      },
      /** The player moved up a difficulty level mid-session. */
      onLevelUp() {
        play("ready");
        trigger("success");
      },
      /** The session finished and the results are shown. */
      onComplete() {
        play("success", { emphasis: "strong" });
        trigger("success");
      },
    }),
    [trigger],
  );
}
