"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

const subscribe = () => () => {};

// White eyes in light mode, black in dark. next-themes reports the stored theme
// on the first client render but nothing on the server, so the colour is only
// switched once mounted; until then the server and client both render white.
export function useAvatarEyeColor() {
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const { resolvedTheme } = useTheme();
  return mounted && resolvedTheme === "dark" ? "#000000" : "#ffffff";
}
