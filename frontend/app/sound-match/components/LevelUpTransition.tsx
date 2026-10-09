"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import { PartyPopper } from "lucide-react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

// The 1-2s non-blocking transition between in-session levels. Auto-advances
// via a timeout — never a separate screen the player has to leave. Respects
// prefers-reduced-motion (instant swap, no easing, shorter hold).
export default function LevelUpTransition({
  level,
  onDone,
}: {
  level: number;
  onDone: () => void;
}) {
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const timeout = window.setTimeout(onDone, reducedMotion ? 900 : 1600);
    return () => window.clearTimeout(timeout);
  }, [onDone, reducedMotion]);

  const card = (
    <div className="button-shadow flex flex-col items-center gap-3 rounded-[20px] border-2 border-[#1d1d1d] bg-white px-8 py-7 text-center">
      <PartyPopper className="w-10 h-10 text-[#1d1d1d]" aria-hidden="true" />
      <span className="font-pixel text-[22px] sm:text-[26px] text-[#1d1d1d]">
        Level Up!
      </span>
      <span className="font-pixel text-[16px] text-[#5e5e5e]">
        Level {level}
      </span>
    </div>
  );

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex w-full flex-col items-center justify-center"
    >
      {reducedMotion ? (
        card
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
        >
          {card}
        </motion.div>
      )}
    </div>
  );
}
