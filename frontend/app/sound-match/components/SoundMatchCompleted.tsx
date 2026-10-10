"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Trophy, Target, Flame, Star, Sparkles } from "lucide-react";
import type { AccuracyResult } from "./types";

type SoundMatchCompletedProps = {
  accuracyResult: AccuracyResult | null;
  onPlayAgain: () => void;
};

export default function SoundMatchCompleted({
  accuracyResult,
  onPlayAgain,
}: SoundMatchCompletedProps) {
  const correct = accuracyResult?.correctCount ?? 0;
  const total = accuracyResult?.totalScored ?? 0;
  const accuracyPct = Math.round((accuracyResult?.accuracy ?? 0) * 100);
  const xp = accuracyResult?.xp ?? 0;
  const streak = accuracyResult?.streak ?? 0;
  const levelReached = accuracyResult?.levelReached ?? 1;

  const rows = [
    { icon: Sparkles, label: "XP earned", value: `${xp}` },
    {
      icon: Target,
      label: "Accuracy",
      value: `${correct}/${total}, ${accuracyPct}%`,
    },
    { icon: Flame, label: "Longest streak", value: `${streak}` },
    { icon: Star, label: "Level reached", value: `Level ${levelReached}` },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center w-full max-w-[420px] gap-6 text-center"
    >
      <Trophy className="w-12 h-12 text-[#1d1d1d] dark:text-[#f2f2f2]" strokeWidth={2} aria-hidden="true" />

      <div className="flex flex-col items-center gap-1">
        <h2 className="font-pixel text-[26px] sm:text-[32px] text-[#1d1d1d] dark:text-[#f2f2f2]">
          Great listening!
        </h2>
        <p className="font-sauce text-[15px] text-[#5e5e5e] dark:text-[#a3a3a3] max-w-[320px]">
          You finished all 15 questions. Every round helps you hear sounds more
          clearly.
        </p>
      </div>

      <div className="w-full bg-white dark:bg-[#141414] border-[2px] border-[#efefef] dark:border-[#262626] rounded-[16px] overflow-hidden">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`flex flex-row items-center justify-between px-5 py-3.5 ${
              i < rows.length - 1 ? "border-b-[1px] border-[#f2f2f2] dark:border-[#262626]" : ""
            }`}
          >
            <div className="flex flex-row items-center gap-2.5">
              <row.icon className="w-4 h-4 text-[#5e5e5e] dark:text-[#a3a3a3]" aria-hidden="true" />
              <span className="font-sauce text-[14px] sm:text-[15px] text-[#5e5e5e] dark:text-[#a3a3a3]">
                {row.label}
              </span>
            </div>
            <span className="font-pixel text-[16px] sm:text-[18px] text-[#1d1d1d] dark:text-[#f2f2f2]">
              {row.value}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-row items-center justify-center gap-3">
        <button
          type="button"
          id="sound-match-play-again"
          onClick={onPlayAgain}
          data-cuelume-press
          data-cuelume-release
          className="button-shadow font-pixel text-[16px] flex items-center justify-center bg-[#1b1b1b] dark:bg-[#f2f2f2] hover:bg-[#323232] dark:hover:bg-white hover:translate-y-[-3px] transition-all duration-200 rounded-[18px] px-[22px] py-[9px] text-white dark:text-[#1b1b1b] cursor-pointer"
        >
          play again
        </button>
        <Link
          href="/dashboard"
          data-cuelume-press
          data-cuelume-release
          className="font-pixel text-[16px] flex items-center justify-center bg-[#f7f7f7] dark:bg-[#1f1f1f] hover:bg-[#eaeaea] dark:hover:bg-[#333333] transition-all duration-200 rounded-[18px] px-[22px] py-[9px] text-[#1d1d1d] dark:text-[#f2f2f2]"
        >
          back to dashboard
        </Link>
      </div>
    </motion.div>
  );
}
