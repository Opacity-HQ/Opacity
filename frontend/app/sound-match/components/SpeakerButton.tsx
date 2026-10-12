"use client";

import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Tappable replay control. Every round speaks its target on mount and then
// leaves this button on screen so the audio is never a single unrepeatable
// pass (dyslexia-friendly rule from the Sound Match build brief).
export default function SpeakerButton({
  onPlay,
  label,
  size = "lg",
  className,
}: {
  onPlay: () => void;
  label: string;
  size?: "lg" | "sm";
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onPlay}
      aria-label={label}
      data-cuelume-press
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border-2 border-[#1d1d1d] dark:border-[#f2f2f2] bg-white dark:bg-[#141414] text-[#1d1d1d] dark:text-[#f2f2f2] transition-all duration-150 hover:bg-[#f4f4f4] dark:hover:bg-[#2a2a2a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d1d1d] dark:focus-visible:ring-[#f2f2f2] focus-visible:ring-offset-2 cursor-pointer",
        size === "lg" ? "w-16 h-16" : "w-11 h-11",
        className,
      )}
    >
      <Volume2
        className={size === "lg" ? "w-7 h-7" : "w-5 h-5"}
        aria-hidden="true"
      />
    </button>
  );
}
