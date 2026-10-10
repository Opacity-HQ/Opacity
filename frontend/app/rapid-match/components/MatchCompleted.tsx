import { motion } from "motion/react";
import { Trophy, Target, Timer, Star } from "lucide-react";
import Image from "next/image";
import type { AccuracyResult } from "./types";

type MatchCompletedProps = {
  accuracyResult: AccuracyResult | null;
  onPlayAgain: () => void;
};

export default function MatchCompleted({
  accuracyResult,
  onPlayAgain,
}: MatchCompletedProps) {
  const accuracyPct = Math.round((accuracyResult?.accuracy ?? 0) * 100);
  const meanRtSec = accuracyResult?.meanRtMs
    ? (accuracyResult.meanRtMs / 1000).toFixed(2)
    : "—";
  const throughput = accuracyResult?.throughput
    ? accuracyResult.throughput.toFixed(1)
    : "—";
  const level = accuracyResult?.nextDifficultyLevel ?? 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center w-full max-w-[420px] gap-6 text-center"
    >
      <div className="flex flex-row items-center justify-center gap-2 mt-2">
        <Trophy className="w-12 h-12 text-[#1d1d1d] dark:text-[#f2f2f2]" strokeWidth={2} />
      </div>

      <div className="flex flex-col items-center gap-1">
        <h2 className="font-pixel text-[26px] sm:text-[32px] text-[#1d1d1d] dark:text-[#f2f2f2]">
          Game Complete!
        </h2>
        <p className="font-sauce text-[15px] text-[#5e5e5e] dark:text-[#a3a3a3]">
          Great job! You finished the rapid match trial.
        </p>
      </div>

      {/* Metrics container */}
      <div className="w-full bg-white dark:bg-[#141414] border-[2px] border-[#efefef] dark:border-[#262626] rounded-[16px] overflow-hidden">
        <div className="flex flex-row items-center justify-between px-5 py-3.5 border-b-[1px] border-[#f2f2f2] dark:border-[#262626]">
          <div className="flex flex-row items-center gap-2.5">
            <Target className="w-4 h-4 text-[#5e5e5e] dark:text-[#a3a3a3]" />
            <span className="font-sauce text-[14px] sm:text-[15px] text-[#5e5e5e] dark:text-[#a3a3a3]">
              Accuracy
            </span>
          </div>
          <span className="font-pixel text-[16px] sm:text-[18px] text-[#1d1d1d] dark:text-[#f2f2f2]">
            {accuracyPct}%
          </span>
        </div>

        <div className="flex flex-row items-center justify-between px-5 py-3.5 border-b-[1px] border-[#f2f2f2] dark:border-[#262626]">
          <div className="flex flex-row items-center gap-2.5">
            <Timer className="w-4 h-4 text-[#5e5e5e] dark:text-[#a3a3a3]" />
            <span className="font-sauce text-[14px] sm:text-[15px] text-[#5e5e5e] dark:text-[#a3a3a3]">
              Average Speed
            </span>
          </div>
          <span className="font-pixel text-[16px] sm:text-[18px] text-[#1d1d1d] dark:text-[#f2f2f2]">
            {meanRtSec}s
          </span>
        </div>

        <div className="flex flex-row items-center justify-between px-5 py-3.5 border-b-[1px] border-[#f2f2f2] dark:border-[#262626]">
          <div className="flex flex-row items-center gap-2.5">
            <Image src="/rapid.svg" alt="Throughput" width={16} height={16} className="w-4 h-4 dark:invert" />
            <span className="font-sauce text-[14px] sm:text-[15px] text-[#5e5e5e] dark:text-[#a3a3a3]">
              Throughput
            </span>
          </div>
          <span className="font-pixel text-[16px] sm:text-[18px] text-[#1d1d1d] dark:text-[#f2f2f2]">
            {throughput} / min
          </span>
        </div>

        <div className="flex flex-row items-center justify-between px-5 py-3.5">
          <div className="flex flex-row items-center gap-2.5">
            <Star className="w-4 h-4 text-[#5e5e5e] dark:text-[#a3a3a3]" />
            <span className="font-sauce text-[14px] sm:text-[15px] text-[#5e5e5e] dark:text-[#a3a3a3]">
              Next Level
            </span>
          </div>
          <span className="font-pixel text-[16px] sm:text-[18px] text-[#1d1d1d] dark:text-[#f2f2f2]">
            Level {level}
          </span>
        </div>
      </div>

      <button
        type="button"
        id="rapid-match-play-again"
        onClick={onPlayAgain}
        data-cuelume-press
        className="button-shadow flex items-center justify-center bg-[#1b1b1b] dark:bg-[#f2f2f2] hover:bg-[#323232] dark:hover:bg-white hover:translate-y-[-4px] transition-all duration-200 rounded-[20px] px-[28px] py-[12px] cursor-pointer"
      >
        <span className="font-pixel text-[18px] sm:text-[20px] text-white dark:text-[#1b1b1b]">
          play again
        </span>
      </button>
    </motion.div>
  );
}
