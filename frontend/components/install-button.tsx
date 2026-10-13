"use client";

import { useState, useSyncExternalStore } from "react";
import { motion } from "motion/react";
import { Download, Share, SquarePlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

// Chromium's install event. Not in lib.dom yet.
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type InstallMode = "prompt" | "ios" | "hidden";

// beforeinstallprompt can fire before the page hydrates, so it is captured
// at module load (this file loads with the home page's JS) rather than in an
// effect, and exposed to React through a tiny external store.
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // keep Chrome's mini-infobar from competing with our button
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

// iPadOS reports itself as a Mac, so fall back to touch support.
function isIOS() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function getMode(): InstallMode {
  if (isStandalone()) return "hidden";
  if (deferredPrompt) return "prompt";
  // iOS has no install API — every iOS browser installs via Share → Add to Home Screen.
  if (isIOS()) return "ios";
  return "hidden";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Shown next to "lets play" on the home page. Hidden when the app is already
// installed or the browser can't install it (e.g. Firefox desktop).
export function InstallButton({ className }: { className?: string }) {
  const mode = useSyncExternalStore(subscribe, getMode, () => "hidden" as const);
  const [iosHelpOpen, setIosHelpOpen] = useState(false);

  if (mode === "hidden") return null;

  async function handleClick() {
    if (mode === "ios") {
      setIosHelpOpen(true);
      return;
    }
    const prompt = deferredPrompt;
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice;
    // A prompt can only be used once; Chrome fires a fresh event if it's offered again.
    deferredPrompt = null;
    notify();
  }

  return (
    <>
      <motion.button
        type="button"
        onClick={handleClick}
        className={`cursor-pointer inline-block ${className ?? ""}`}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        <div className="flex flex-row items-center justify-center w-fit h-fit border-2 border-[#1b1b1b] dark:border-[#f2f2f2] hover:bg-[#f5f5f5] dark:hover:bg-[#2a2a2a] hover:translate-y-[-5px] transition-all duration-200 rounded-[10px] px-[15px] py-[6px]">
          <Download className="size-[22px] mr-[8px] text-[#1b1b1b] dark:text-[#f2f2f2]" strokeWidth={2.25} />
          <span className="font-pixel [-webkit-text-stroke:0.4px_currentColor] text-[18px] sm:text-[20px] text-[#1b1b1b] dark:text-[#f2f2f2]">install</span>
        </div>
      </motion.button>

      <Dialog open={iosHelpOpen} onOpenChange={setIosHelpOpen}>
        <DialogContent className="w-[380px] max-w-[calc(100%-2rem)] p-5 sm:p-6 gap-0">
          <DialogTitle className="font-pixel text-[24px] sm:text-[28px] text-[#1d1d1d] dark:text-[#f2f2f2] leading-tight">
            install opacity
          </DialogTitle>
          <DialogDescription className="font-pixel text-[14px] text-[#5e5e5e] dark:text-[#a3a3a3] leading-[18px] mt-2">
            Add Opacity to your home screen to open it like an app.
          </DialogDescription>
          <ol className="flex flex-col gap-3 mt-5 font-pixel text-[15px] text-[#1d1d1d] dark:text-[#f2f2f2]">
            <li className="flex flex-row items-center gap-2">
              <span className="text-[#5e5e5e] dark:text-[#a3a3a3]">1.</span>
              Tap
              <Share className="size-[18px]" aria-label="Share" />
              in the browser bar
            </li>
            <li className="flex flex-row items-center gap-2">
              <span className="text-[#5e5e5e] dark:text-[#a3a3a3]">2.</span>
              Choose
              <SquarePlus className="size-[18px]" aria-hidden />
              Add to Home Screen
            </li>
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
}
