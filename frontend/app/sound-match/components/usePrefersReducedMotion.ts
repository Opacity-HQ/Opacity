import { useSyncExternalStore } from "react";

// Copied from app/letter-detective/components/usePrefersReducedMotion.ts —
// per the Sound Match build brief, reduced-motion detection must not be
// reimplemented differently per game.
function subscribe(callback: () => void) {
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getServerSnapshot() {
  return false;
}

export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
