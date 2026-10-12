import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { Check, XCircle } from "lucide-react";
import type { RMTrial } from "@/app/api/games/rapid-match/plan";
import type { TrialOutcome } from "./types";

type CompareMatchRoundProps = {
  trial: Extract<RMTrial, { roundType: "compare" }>;
  onAnswer: (outcome: TrialOutcome) => void;
};

export default function CompareMatchRound({
  trial,
  onAnswer,
}: CompareMatchRoundProps) {
  const [claimedMatch, setClaimedMatch] = useState<boolean | null>(null);
  const [answered, setAnswered] = useState(false);

  const onsetRef = useRef<number | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      onsetRef.current = performance.now();
    });
    return () => cancelAnimationFrame(frame);
  }, [trial.index]);

  const handleSelect = useCallback(
    (choice: boolean, eventTime?: number) => {
      if (answered) return;
      setAnswered(true);
      setClaimedMatch(choice);

      const endTime = eventTime ?? performance.now();
      const onset = onsetRef.current ?? endTime;
      const reactionTimeMs = Math.max(0, Math.round(endTime - onset));
      const localCorrect = choice === trial.isMatch;

      setTimeout(() => {
        onAnswer({
          trialIndex: trial.index,
          response: { kind: "compare", claimedMatch: choice },
          localCorrect,
          reactionTimeMs,
        });
      }, 500);
    },
    [answered, onAnswer, trial.index, trial.isMatch],
  );

  // Keyboard shortcut support (1 or Left Arrow = SAME, 2 or Right Arrow = DIFFERENT)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (answered) return;
      if (e.key === "1" || e.key === "ArrowLeft") {
        e.preventDefault();
        handleSelect(true, e.timeStamp);
      } else if (e.key === "2" || e.key === "ArrowRight") {
        e.preventDefault();
        handleSelect(false, e.timeStamp);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [answered, handleSelect]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center w-full max-w-[440px] gap-6"
    >
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="font-pixel text-[13px] text-[#a0a0a0]">
          {trial.isWarmup ? "warm-up trial" : "same or different"}
        </span>
        <h2 className="font-pixel text-[22px] sm:text-[26px] text-[#1d1d1d] dark:text-[#f2f2f2]">
          are these two symbols identical?
        </h2>
      </div>

      {/* Side by side comparison */}
      <div className="flex flex-row items-center justify-center gap-4 sm:gap-6 w-full">
        <div className="flex flex-col items-center justify-center flex-1 max-w-[140px] h-[110px] sm:h-[130px] bg-white dark:bg-[#141414] border-[3px] border-[#1d1d1d] dark:border-[#f2f2f2] rounded-[20px] shadow-sm">
          <span className="font-pixel text-[46px] sm:text-[56px] text-[#1d1d1d] dark:text-[#f2f2f2] select-none">
            {trial.leftSymbol}
          </span>
        </div>

        <span className="font-sauce text-[20px] text-[#a0a0a0]">vs</span>

        <div className="flex flex-col items-center justify-center flex-1 max-w-[140px] h-[110px] sm:h-[130px] bg-white dark:bg-[#141414] border-[3px] border-[#1d1d1d] dark:border-[#f2f2f2] rounded-[20px] shadow-sm">
          <span className="font-pixel text-[46px] sm:text-[56px] text-[#1d1d1d] dark:text-[#f2f2f2] select-none">
            {trial.rightSymbol}
          </span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-row items-center gap-4 w-full max-w-[360px]">
        {[
          { label: "SAME", value: true, keyHint: "1 or ←" },
          { label: "DIFFERENT", value: false, keyHint: "2 or →" },
        ].map((btn) => {
          const isSelected = claimedMatch === btn.value;
          const isCorrect = btn.value === trial.isMatch;

          let btnClasses =
            "bg-white dark:bg-[#141414] border-[#d4d4d4] dark:border-[#3a3a3a] hover:border-[#1d1d1d] dark:hover:border-[#f2f2f2] text-[#1d1d1d] dark:text-[#f2f2f2]";
          let iconNode = null;

          if (answered) {
            if (isCorrect) {
              btnClasses = "bg-[#f0fbf5] dark:bg-[#0f2118] border-[#a3e635] text-[#166534] dark:text-emerald-300";
              iconNode = <Check className="w-4 h-4 text-[#166534] dark:text-emerald-300 absolute top-2.5 right-2.5" />;
            } else if (isSelected) {
              btnClasses = "bg-[#f9f0f0] dark:bg-[#2a1a1a] border-[#e8c8c8] dark:border-[#5c2b2b] text-[#991b1b] dark:text-[#fca5a5]";
              iconNode = <XCircle className="w-4 h-4 text-[#991b1b] dark:text-[#fca5a5] absolute top-2.5 right-2.5" />;
            }
          }

          return (
            <button
              key={btn.label}
              type="button"
              id={`compare-${btn.label.toLowerCase()}`}
              disabled={answered}
              onClick={(e) => handleSelect(btn.value, e.timeStamp)}
              data-cuelume-press
              className={`relative flex-1 flex flex-col items-center justify-center py-4 rounded-[16px] border shadow-[0_4px_14px_rgba(0,0,0,0.07)] transition-all duration-150 cursor-pointer disabled:cursor-default ${btnClasses}`}
            >
              <div className="flex flex-row items-center gap-2">
                <span className="font-sauce text-[18px] sm:text-[20px]">
                  {btn.label}
                </span>
              </div>
              <span className="font-sauce text-[12px] text-[#6b6b6b] dark:text-[#a3a3a3] mt-0.5">
                {btn.keyHint}
              </span>
              {iconNode}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
