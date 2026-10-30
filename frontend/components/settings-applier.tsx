"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
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
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();

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

  // The theme-color metas in app/layout.tsx follow the OS scheme; override
  // them with the in-app theme so the installed app's status bar matches.
  // Re-applied on navigation in case the head is re-rendered.
  useEffect(() => {
    if (!resolvedTheme) return;
    const color = resolvedTheme === "dark" ? "#0a0a0a" : "#ffffff";
    document
      .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
      .forEach((meta) => meta.setAttribute("content", color));
  }, [resolvedTheme, pathname]);

  return null;
}
