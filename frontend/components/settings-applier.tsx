"use client";

import { useEffect } from "react";
import { setEnabled, setVolume } from "cuelume";
import { TEXT_ZOOM, useSettingsStore } from "@/lib/settings/store";

// Pushes the saved device preferences into the things that actually produce
// the effect: cuelume (sound), the <html> element (text size, reduced
// motion). Haptics are gated at call time in lib/game-feedback.ts and
// motion/react's reduced-motion in app/providers.tsx. Mounted once, app-wide.
export function SettingsApplier() {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const volume = useSettingsStore((s) => s.volume);
  const textSize = useSettingsStore((s) => s.textSize);
  const reduceMotion = useSettingsStore((s) => s.reduceMotion);

  useEffect(() => {
    setEnabled(soundEnabled);
    setVolume(volume / 100);
  }, [soundEnabled, volume]);

  useEffect(() => {
    document.documentElement.style.zoom =
      textSize === "md" ? "" : String(TEXT_ZOOM[textSize]);
  }, [textSize]);

  useEffect(() => {
    document.documentElement.toggleAttribute("data-reduce-motion", reduceMotion);
  }, [reduceMotion]);

  return null;
}
