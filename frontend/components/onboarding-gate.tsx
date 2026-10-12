"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  useOnboardingQuery,
  useSaveOnboardingMutation,
} from "@/lib/queries/onboarding";

const INPUT_CLASSES =
  "font-pixel h-[40px] w-full rounded-[13px] !text-[16px] !px-[15px] bg-white dark:bg-[#1a1a1a] border-[1px] border-[#e0e0e0] dark:border-[#333333] focus:border-[#949494] focus-visible:ring-0 focus-visible:outline-none";

// One-time "tell us about you" form for a confirmed (non-guest) user's first
// signed-in session. Mounted once in app/providers.tsx so it appears on
// whichever route they land on. It is blocking on purpose — no close button,
// Escape or outside-click dismissal — because every game needs the child it
// creates. Renders nothing for signed-out visitors, guests, and anyone who
// has already completed it.
export default function OnboardingGate() {
  const router = useRouter();
  const status = useOnboardingQuery();
  const save = useSaveOnboardingMutation();
  const [fullName, setFullName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");

  const needsOnboarding = status.data?.needsOnboarding ?? false;
  // A guest who played and then claimed an email already has a child, so
  // there's no player detail left to ask for.
  const askForChild = !(status.data?.hasChildren ?? false);
  const currentYear = new Date().getFullYear();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await save.mutateAsync({
        fullName,
        birthYear: askForChild ? Number(birthYear) : undefined,
        gradeLevel: gradeLevel.trim() || undefined,
      });
      // Headers are server-rendered (getDisplayUsername in each layout), so
      // re-run them to swap the email-derived name for the first name now.
      router.refresh();
    } catch {
      // Surfaced via save.error below.
    }
  }

  return (
    <Dialog open={needsOnboarding} onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        className="w-[380px] max-w-[calc(100%-2rem)] p-5 sm:p-6 gap-0"
      >
        <form onSubmit={handleSubmit} className="contents">
          <DialogTitle className="font-pixel text-[24px] sm:text-[28px] text-[#1d1d1d] dark:text-[#f2f2f2] leading-tight">
            let&apos;s get to know you
          </DialogTitle>
          <DialogDescription className="font-pixel text-[14px] text-[#5e5e5e] dark:text-[#a3a3a3] leading-[18px] mt-2">
            A few quick details so the games can greet the player by name.
          </DialogDescription>

          <div className="flex flex-col items-start w-full gap-1 mt-5">
            <label htmlFor="onboarding-name" className="font-pixel text-[13px] text-[#5e5e5e] dark:text-[#a3a3a3]">
              full name
            </label>
            <Input
              id="onboarding-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Aarav Sharma"
              autoComplete="name"
              maxLength={80}
              required
              className={INPUT_CLASSES}
            />
          </div>

          {askForChild && (
            <>
              <div className="flex flex-col items-start w-full gap-1 mt-3">
                <label htmlFor="onboarding-year" className="font-pixel text-[13px] text-[#5e5e5e] dark:text-[#a3a3a3]">
                  birth year
                </label>
                <Input
                  id="onboarding-year"
                  type="number"
                  min={1990}
                  max={currentYear}
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  placeholder={String(currentYear - 8)}
                  required
                  className={INPUT_CLASSES}
                />
              </div>
              <div className="flex flex-col items-start w-full gap-1 mt-3">
                <label htmlFor="onboarding-grade" className="font-pixel text-[13px] text-[#5e5e5e] dark:text-[#a3a3a3]">
                  grade (optional)
                </label>
                <Input
                  id="onboarding-grade"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  placeholder="e.g. 3rd grade"
                  maxLength={40}
                  className={INPUT_CLASSES}
                />
              </div>
            </>
          )}

          {save.isError && (
            <p role="alert" className="font-pixel text-[13px] text-red-600 dark:text-red-400 mt-3">
              {save.error.message}
            </p>
          )}

          <button
            type="submit"
            disabled={save.isPending}
            className="font-pixel text-[16px] flex items-center justify-center bg-[#1b1b1b] hover:bg-[#323232] dark:bg-[#f2f2f2] dark:hover:bg-white transition-all duration-200 rounded-[15px] px-[24px] py-[10px] text-white dark:text-[#1b1b1b] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed w-full mt-5"
          >
            {save.isPending ? "saving..." : "let's go"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
