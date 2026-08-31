import Image from "next/image";
import { Eye, Timer, Sparkles } from "lucide-react";
import { motion } from "motion/react";

type MatchIntroProps = {
  loading: boolean;
  onStart: () => void;
};

export default function MatchIntro({ loading, onStart }: MatchIntroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center w-full max-w-[420px] gap-6 sm:gap-8 text-center"
    >
      <div className="flex flex-row items-center justify-center mt-2">
        <Image
          src="/rapid.svg"
          alt="Rapid Match Icon"
          width={48}
          height={48}
          className="w-12 h-12"
        />
      </div>

      <div className="flex flex-col items-center gap-2">
        <h1 className="font-pixel text-[28px] sm:text-[36px] text-[#1d1d1d] leading-tight">
          Rapid Match
        </h1>
        <p className="font-sauce text-[15px] sm:text-[17px] text-[#5e5e5e] max-w-[320px] leading-[22px]">
          Match symbols rapidly! Speed up your visual recognition.
        </p>
      </div>

      <div className="w-full bg-white border-[2px] border-[#efefef] rounded-[15px] p-5 text-left flex flex-col gap-3">
        <div className="flex flex-row items-center gap-3">
          <Eye className="w-5 h-5 text-[#5e5e5e] shrink-0" strokeWidth={2} />
          <span className="font-sauce text-[14px] sm:text-[15px] text-[#5e5e5e]">
            Watch the target symbol at the top
          </span>
        </div>
        <div className="flex flex-row items-center gap-3">
          <Image
            src="/rapid.svg"
            alt="Rapid Match"
            width={20}
            height={20}
            className="w-5 h-5 shrink-0"
          />
          <span className="font-sauce text-[14px] sm:text-[15px] text-[#5e5e5e]">
            Tap the matching symbol or press keys (1-6)
          </span>
        </div>
        <div className="flex flex-row items-center gap-3">
          <Timer className="w-5 h-5 text-[#5e5e5e] shrink-0" strokeWidth={2} />
          <span className="font-sauce text-[14px] sm:text-[15px] text-[#5e5e5e]">
            React as quickly and accurately as you can
          </span>
        </div>
      </div>

      <button
        type="button"
        id="rapid-match-start"
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
          <span className="font-pixel text-[18px] sm:text-[20px]">
            start game
          </span>
        )}
      </button>
    </motion.div>
  );
}
