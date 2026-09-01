"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Volume2, Ear, Sparkles, Headphones } from "lucide-react";

type SoundMatchIntroProps = {
  loading: boolean;
  onStart: () => void;
};

export default function SoundMatchIntro({ loading, onStart }: SoundMatchIntroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center w-full max-w-[420px] gap-6 sm:gap-8 text-center"
    >
      <Image
        src="/sound.svg"
        alt=""
        width={48}
        height={48}
        aria-hidden="true"
        className="w-12 h-12"
      />

      <div className="flex flex-col items-center gap-2">
        <h1 className="font-pixel text-[28px] sm:text-[36px] text-[#1d1d1d] leading-tight">
          Sound Match
        </h1>
        <p className="font-sauce text-[15px] sm:text-[17px] text-[#5e5e5e] max-w-[320px] leading-[22px]">
          Listen to a word, then pick the answer that matches its sound. Take
          your time — there is no wrong way to play.
        </p>
      </div>

      <div className="w-full bg-white border-[2px] border-[#efefef] rounded-[15px] p-5 text-left flex flex-col gap-3">
        <div className="flex flex-row items-center gap-3">
          <Headphones className="w-5 h-5 text-[#5e5e5e] shrink-0" strokeWidth={2} />
          <span className="font-sauce text-[14px] sm:text-[15px] text-[#5e5e5e]">
            Turn your sound on — headphones help
          </span>
        </div>
        <div className="flex flex-row items-center gap-3">
          <Volume2 className="w-5 h-5 text-[#5e5e5e] shrink-0" strokeWidth={2} />
          <span className="font-sauce text-[14px] sm:text-[15px] text-[#5e5e5e]">
            Tap the speaker any time to hear the word again
          </span>
        </div>
        <div className="flex flex-row items-center gap-3">
          <Ear className="w-5 h-5 text-[#5e5e5e] shrink-0" strokeWidth={2} />
          <span className="font-sauce text-[14px] sm:text-[15px] text-[#5e5e5e]">
            Tap an answer, or press keys 1&ndash;4
          </span>
        </div>
      </div>

      <button
        type="button"
        id="sound-match-start"
        onClick={onStart}
        disabled={loading}
        data-cuelume-press
        className="button-shadow flex flex-row items-center justify-center bg-[#1b1b1b] hover:bg-[#323232] hover:translate-y-[-4px] transition-all duration-200 rounded-[20px] px-[28px] py-[12px] text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="font-pixel text-[18px] sm:text-[20px] flex items-center gap-2">
            <Sparkles className="w-5 h-5 animate-spin" /> preparing game...
          </span>
        ) : (
          <span className="font-pixel text-[18px] sm:text-[20px]">start game</span>
        )}
      </button>
    </motion.div>
  );
}
