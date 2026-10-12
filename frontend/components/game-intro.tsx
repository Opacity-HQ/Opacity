"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { Sparkles, type LucideIcon } from "lucide-react";

export type GameIntroStep = {
  icon: LucideIcon;
  text: string;
};

type GameIntroProps = {
  /** Root-relative path of the game's icon, e.g. "/sound.svg". */
  icon: string;
  title: string;
  description: string;
  steps: GameIntroStep[];
  loading: boolean;
  onStart: () => void;
  startLabel?: string;
  startId?: string;
  /** Plays the shared tap cue through cuelume's data attribute. Turn off when onStart already plays one. */
  pressCue?: boolean;
  /** Extra lines under the start button, such as a level or a score. */
  footer?: ReactNode;
  /** Extra line above the start button. */
  note?: ReactNode;
};

/** The start screen every game shares: icon, title, one line of what to do, three steps, and a start button. */
export default function GameIntro({
  icon,
  title,
  description,
  steps,
  loading,
  onStart,
  startLabel = "start game",
  startId,
  pressCue = true,
  footer,
  note,
}: GameIntroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center w-full max-w-[420px] gap-6 sm:gap-8 text-center"
    >
      <Image
        src={icon}
        alt=""
        width={48}
        height={48}
        aria-hidden="true"
        className="w-12 h-12 dark:invert"
      />

      <div className="flex flex-col items-center gap-2">
        <h1 className="font-pixel text-[28px] sm:text-[36px] text-[#1d1d1d] dark:text-[#f2f2f2] leading-tight">
          {title}
        </h1>
        <p className="font-sauce text-[15px] sm:text-[17px] text-[#5e5e5e] dark:text-[#a3a3a3] max-w-[320px] leading-[22px]">
          {description}
        </p>
      </div>

      <div className="w-full bg-white dark:bg-[#141414] border-[2px] border-[#efefef] dark:border-[#262626] rounded-[15px] p-5 text-left flex flex-col gap-3">
        {steps.map(({ icon: StepIcon, text }) => (
          <div key={text} className="flex flex-row items-center gap-3">
            <StepIcon className="w-5 h-5 text-[#5e5e5e] dark:text-[#a3a3a3] shrink-0" strokeWidth={2} />
            <span className="font-sauce text-[14px] sm:text-[15px] text-[#5e5e5e] dark:text-[#a3a3a3]">
              {text}
            </span>
          </div>
        ))}
      </div>

      {note}

      <button
        type="button"
        id={startId}
        onClick={onStart}
        disabled={loading}
        data-cuelume-press={pressCue ? "" : undefined}
        className="button-shadow flex flex-row items-center justify-center bg-[#1b1b1b] dark:bg-[#f2f2f2] hover:bg-[#323232] dark:hover:bg-white hover:translate-y-[-4px] transition-all duration-200 rounded-[20px] px-[28px] py-[12px] text-white dark:text-[#1b1b1b] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="font-pixel [-webkit-text-stroke:0.4px_currentColor] text-[18px] sm:text-[20px] flex items-center gap-2">
            <Sparkles className="w-5 h-5 animate-spin" /> preparing game...
          </span>
        ) : (
          <span className="font-pixel [-webkit-text-stroke:0.4px_currentColor] text-[18px] sm:text-[20px]">{startLabel}</span>
        )}
      </button>

      {footer}
    </motion.div>
  );
}
