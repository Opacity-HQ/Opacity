"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Device-level preferences. Kept on the device (localStorage) rather than in
// the database: sound, haptics and text size depend on the hardware in the
// child's hands, not on the account. Theme is owned by next-themes.
export type TextSize = "sm" | "md" | "lg" | "xl";
export type SessionLength = "short" | "standard" | "long";

export const TEXT_ZOOM: Record<TextSize, number> = {
  sm: 0.9,
  md: 1,
  lg: 1.15,
  xl: 1.3,
};

type SettingsState = {
  textSize: TextSize;
  soundEnabled: boolean;
  volume: number; // 0-100
  hapticsEnabled: boolean;
  reduceMotion: boolean;
  sessionLength: SessionLength;
  set: (patch: Partial<Omit<SettingsState, "set" | "reset">>) => void;
  reset: () => void;
};

const defaults = {
  textSize: "md" as TextSize,
  soundEnabled: true,
  volume: 80,
  hapticsEnabled: true,
  reduceMotion: false,
  sessionLength: "standard" as SessionLength,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaults,
      set: (patch) => set(patch),
      reset: () => set(defaults),
    }),
    { name: "opacity-settings" },
  ),
);
