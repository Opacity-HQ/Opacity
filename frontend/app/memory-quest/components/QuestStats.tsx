"use client";

import { motion } from "motion/react";
import { Hash, Star, Target, Timer, Trophy, type LucideIcon } from "lucide-react";
import type { SessionResult } from "./types";

// End-of-sitting card, built from the server's graded /complete result
// rather than the client's local grades.
export default function QuestStats({
  result,
  roundsPlayed,
  totalScore,
  loading,
  onContinue,
}: {
  result: SessionResult;
  roundsPlayed: number;
  totalScore: number;
  loading: boolean;
  onContinue: () => void;
}) {
  const levelLabel =
    result.nextDifficultyLevel > result.level
      ? `level ${result.nextDifficultyLevel} (up)`
      : result.nextDifficultyLevel < result.level
        ? `level ${result.nextDifficultyLevel} (down)`
        : `level ${result.nextDifficultyLevel}`;

  const rows: { label: string; value: string; icon: LucideIcon }[] = [
    { label: "accuracy", value: `${Math.round(result.accuracy * 100)}%`, icon: Target },
    { label: "max sequence", value: `${result.maxSequenceLength} items`, icon: Hash },
    {
      label: "avg response",
      value: result.meanRtMs !== null ? `${(result.meanRtMs / 1000).toFixed(1)}s` : "-",
      icon: Timer,
    },
    { label: "next level", value: levelLabel, icon: Star },
    { label: "total score", value: `${totalScore}`, icon: Trophy },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center w-full gap-5 sm:gap-6 mt-2"
    >
      <div className="flex flex-col items-center gap-1 text-center">
        <h2 className="font-pixel text-[24px] sm:text-[28px] text-[#1d1d1d]">your stats</h2>
        <p className="font-sauce text-[14px] text-[#5e5e5e]">
          after {roundsPlayed} round{roundsPlayed !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="w-full max-w-[360px] bg-white border-[2px] border-[#efefef] rounded-[15px] overflow-hidden">
        {rows.map(({ label, value, icon: Icon }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            className={`flex flex-row items-center justify-between px-4 py-3 ${
              i < rows.length - 1 ? "border-b-[1px] border-[#f2f2f2]" : ""
            }`}
          >
            <div className="flex flex-row items-center gap-2">
              <Icon className="w-4 h-4 text-[#5e5e5e]" strokeWidth={1.75} aria-hidden />
              <span className="font-sauce text-[14px] text-[#5e5e5e]">{label}</span>
            </div>
            <span className="font-pixel text-[14px] sm:text-[15px] text-[#1d1d1d]">{value}</span>
          </motion.div>
        ))}
      </div>

      <button
        type="button"
        id="memory-quest-continue"
        onClick={onContinue}
        disabled={loading}
        className="button-shadow flex items-center justify-center bg-[#1b1b1b] hover:bg-[#323232] hover:translate-y-[-4px] transition-all duration-200 rounded-[20px] px-[24px] py-[10px] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <span className="font-pixel text-[17px] sm:text-[20px] text-white">
          {loading ? "loading..." : "keep going"}
        </span>
      </button>
    </motion.div>
  );
}
