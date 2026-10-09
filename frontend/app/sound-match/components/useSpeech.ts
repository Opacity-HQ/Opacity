"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

// Speaks words aloud via the browser's native SpeechSynthesis API. Nothing
// in this repo plays spoken words otherwise — cuelume is UI sound-effect
// presets only, and there is no TTS/audio-asset pipeline. Per the Sound
// Match build brief:
//  - feature-detected (`"speechSynthesis" in window`) with a silent no-op
//    fallback — never throws, never blocks a trial;
//  - callers expose a tappable replay button (see SpeakerButton) so audio
//    is never a single unrepeatable pass.
function subscribe() {
  return () => {};
}

function getSupportedSnapshot() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function getServerSnapshot() {
  return false;
}

export function useSpeech() {
  const isSupported = useSyncExternalStore(
    subscribe,
    getSupportedSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    return () => {
      try {
        window.speechSynthesis?.cancel();
      } catch {
        // no-op
      }
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Unsupported / blocked — silently no-op, don't block the trial.
    }
  }, []);

  return { speak, isSupported };
}
