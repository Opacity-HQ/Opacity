"use client";

import { useEffect, useRef, useState } from "react";
import { bind } from "cuelume";
import { AnimatePresence, motion } from "motion/react";
import { Brain, Eye, Hand } from "lucide-react";
import { useDashboardQuery } from "@/lib/queries/dashboard";
import { useOnboardingQuery } from "@/lib/queries/onboarding";
import { ApiError } from "@/lib/queries/api-error";
import Signin from "@/components/signin";
import GameIntro from "@/components/game-intro";
import ResultsLoading from "@/components/results-loading";
import { useMemoryQuestStore } from "./components/store";
import { useGameFeedback } from "./components/useGameFeedback";
import {
  useStartMemoryQuestSessionMutation,
  useSubmitMemoryQuestTrialsMutation,
  useCompleteMemoryQuestSessionMutation,
} from "./components/queries";
import ChildSetup from "./components/ChildSetup";
import ShowRound from "./components/ShowRound";
import RecallRound from "./components/RecallRound";
import RoundFeedback from "./components/RoundFeedback";
import QuestStats from "./components/QuestStats";
import type { TrialOutcome } from "./components/types";

const SKILL_KEY = "working_memory";
const FLUSH_BATCH_SIZE = 5;
const MIN_RESULTS_LOADING_MS = 1800;

const PAGE_CLASSES =
  "flex flex-col items-center justify-center w-full flex-1 px-4 sm:px-6 py-8 sm:py-10";
const PRIMARY_BUTTON_CLASSES =
  "font-pixel text-[16px] bg-[#1b1b1b] hover:bg-[#323232] transition-all duration-200 rounded-[15px] px-[24px] py-[10px] text-white cursor-pointer";

export default function MemoryQuestPage() {
  // Server state (dashboard/children) lives entirely in TanStack Query —
  // per frontend/AGENTS.md, Zustand never duplicates it.
  const dashboardQuery = useDashboardQuery();
  const onboardingQuery = useOnboardingQuery();

  // Client-side active-sitting state lives in Zustand, scoped to this game.
  const storeChildId = useMemoryQuestStore((s) => s.childId);
  const phase = useMemoryQuestStore((s) => s.phase);
  const sessionId = useMemoryQuestStore((s) => s.sessionId);
  const trials = useMemoryQuestStore((s) => s.trials);
  const trialCursor = useMemoryQuestStore((s) => s.trialCursor);
  const lastOutcome = useMemoryQuestStore((s) => s.lastOutcome);
  const roundsPlayed = useMemoryQuestStore((s) => s.roundsPlayed);
  const totalScore = useMemoryQuestStore((s) => s.totalScore);
  const result = useMemoryQuestStore((s) => s.result);
  const setChildId = useMemoryQuestStore((s) => s.setChildId);
  const startSessionState = useMemoryQuestStore((s) => s.startSession);
  const startRecall = useMemoryQuestStore((s) => s.startRecall);
  const recordOutcome = useMemoryQuestStore((s) => s.recordOutcome);
  const nextRound = useMemoryQuestStore((s) => s.nextRound);
  const setResult = useMemoryQuestStore((s) => s.setResult);

  const startSessionMutation = useStartMemoryQuestSessionMutation();
  const submitTrialsMutation = useSubmitMemoryQuestTrialsMutation();
  const completeSessionMutation = useCompleteMemoryQuestSessionMutation();
  const feedback = useGameFeedback();
  const [isFinishing, setIsFinishing] = useState(false);

  // Delegates data-cuelume-* press/release sounds for every button in this
  // page's subtree, per frontend/AGENTS.md.
  useEffect(() => {
    bind();
  }, []);

  const bufferRef = useRef<TrialOutcome[]>([]);
  const pendingFlushesRef = useRef<Promise<unknown>[]>([]);
  const sessionIdRef = useRef<string | null>(null);
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  function flushBuffer() {
    if (bufferRef.current.length === 0 || !sessionIdRef.current) return;
    const batch = bufferRef.current;
    bufferRef.current = [];
    const promise = submitTrialsMutation
      .mutateAsync({
        sessionId: sessionIdRef.current,
        trials: batch.map((t) => ({
          trialIndex: t.trialIndex,
          response: t.response,
          reactionTimeMs: t.reactionTimeMs,
          timeToFirstMoveMs: t.timeToFirstMoveMs,
        })),
      })
      .catch(() => {
        // A failed background flush isn't fatal to gameplay; it just means
        // fewer rounds scored, not a broken session.
      });
    pendingFlushesRef.current.push(promise);
  }

  async function startSitting(childId: string) {
    feedback.onStart();
    try {
      const started = await startSessionMutation.mutateAsync({
        childId,
        device: {
          userAgent: navigator.userAgent,
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          inputType: "ontouchstart" in window ? "touch" : "mouse",
        },
      });
      bufferRef.current = [];
      pendingFlushesRef.current = [];
      startSessionState(started);
    } catch {
      // Surfaced via startSessionMutation.error in the render below.
    }
  }

  async function finishSession() {
    setIsFinishing(true);
    // Hold the loading screen briefly so it never just flashes on fast networks
    const minDisplay = new Promise((resolve) =>
      setTimeout(resolve, MIN_RESULTS_LOADING_MS),
    );
    await Promise.all(pendingFlushesRef.current);
    try {
      const [completed] = await Promise.all([
        completeSessionMutation.mutateAsync(sessionIdRef.current!),
        minDisplay,
      ]);
      setResult(completed);
      setIsFinishing(false);
    } catch {
      // Surfaced via completeSessionMutation.error on the loading screen.
    }
  }

  function handleAnswer(outcome: TrialOutcome) {
    if (outcome.localCorrect) {
      feedback.onCorrect();
    } else {
      feedback.onWrong();
    }

    bufferRef.current.push(outcome);
    const isLastRound = trialCursor + 1 >= trials.length;
    if (bufferRef.current.length >= FLUSH_BATCH_SIZE || isLastRound) {
      flushBuffer();
    }

    recordOutcome(outcome);
  }

  function handleNext() {
    feedback.onTap();
    if (trialCursor + 1 >= trials.length) {
      finishSession();
    } else {
      nextRound();
    }
  }

  const currentTrial = trials[trialCursor];

  if (dashboardQuery.isPending) {
    return (
      <div className={PAGE_CLASSES}>
        <p className="font-pixel text-[18px] text-[#5e5e5e]">loading...</p>
      </div>
    );
  }

  if (dashboardQuery.isError) {
    const err = dashboardQuery.error;
    const isUnauthorized = err instanceof ApiError && err.code === "unauthorized";
    return (
      <div className={PAGE_CLASSES}>
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <p className="font-pixel text-[18px] text-[#1d1d1d]">
            {err.message || "Something went wrong."}
          </p>
          {isUnauthorized ? (
            <Signin
              onSuccess={() => dashboardQuery.refetch()}
              trigger={
                <button type="button" className={PRIMARY_BUTTON_CLASSES}>
                  go sign in
                </button>
              }
            />
          ) : (
            <button
              type="button"
              onClick={() => dashboardQuery.refetch()}
              className={PRIMARY_BUTTON_CLASSES}
            >
              try again
            </button>
          )}
        </div>
      </div>
    );
  }

  const children = dashboardQuery.data.children;
  const effectiveChildId = storeChildId ?? children[0]?.id ?? null;

  if (!effectiveChildId) {
    // Signed-in accounts get their child from the app-wide onboarding form
    // (components/onboarding-gate.tsx), which is open over this page right
    // now — so only guests ever see the per-game setup form.
    if (onboardingQuery.isPending || onboardingQuery.data?.needsOnboarding) {
      return (
        <div className={PAGE_CLASSES}>
          <p className="font-pixel text-[18px] text-[#5e5e5e]">loading...</p>
        </div>
      );
    }
    return (
      <div className={PAGE_CLASSES}>
        <ChildSetup onCreated={(child) => setChildId(child.id)} />
      </div>
    );
  }

  const child = children.find((c) => c.id === effectiveChildId);
  const skill = child?.skills.find((s) => s.skillKey === SKILL_KEY);
  const startError = startSessionMutation.isError ? (
    <p role="alert" className="font-pixel text-[13px] text-red-600 text-center">
      {startSessionMutation.error.message}
    </p>
  ) : null;

  return (
    <div className={PAGE_CLASSES}>
      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <div key="intro" className="flex flex-col items-center justify-center w-full flex-1 gap-4">
            <GameIntro
              icon="/memory.svg"
              title="Memory Quest"
              description="Remember the path and find the hidden treasure!"
              steps={[
                { icon: Eye, text: "Watch the path or map carefully" },
                { icon: Brain, text: "Remember the order or treasure spot" },
                { icon: Hand, text: "Tap to reproduce the memory" },
              ]}
              note={
                skill ? (
                  <p className="font-sauce text-[13px] text-[#6b6b6b]">
                    level {skill.difficultyLevel} · {skill.difficultyLevel + 2} items
                  </p>
                ) : null
              }
              loading={startSessionMutation.isPending}
              onStart={() => startSitting(effectiveChildId)}
              startLabel="start game"
              startId="memory-quest-start"
              pressCue={false}
            />
            {startError}
          </div>
        )}

        {phase === "show" && currentTrial && (
          <ShowRound key={`show-${sessionId}-${currentTrial.index}`} trial={currentTrial} onDone={startRecall} />
        )}

        {phase === "recall" && currentTrial && (
          <RecallRound
            key={`recall-${sessionId}-${currentTrial.index}`}
            trial={currentTrial}
            feedback={feedback}
            onAnswer={handleAnswer}
          />
        )}

        {phase === "feedback" && currentTrial && lastOutcome && !isFinishing && (
          <RoundFeedback
            key={`feedback-${sessionId}-${currentTrial.index}`}
            trial={currentTrial}
            outcome={lastOutcome}
            roundsPlayed={roundsPlayed}
            isLastRound={trialCursor + 1 >= trials.length}
            onNext={handleNext}
          />
        )}

        {phase === "feedback" && isFinishing && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center flex-1"
          >
            <ResultsLoading
              error={
                completeSessionMutation.isError
                  ? completeSessionMutation.error.message
                  : null
              }
              onRetry={finishSession}
            />
          </motion.div>
        )}

        {phase === "stats" && result && (
          <div key="stats" className="flex flex-col items-center w-full gap-4">
            <QuestStats
              result={result}
              roundsPlayed={roundsPlayed}
              totalScore={totalScore}
              loading={startSessionMutation.isPending}
              onContinue={() => {
                feedback.onTap();
                startSitting(effectiveChildId);
              }}
            />
            {startError}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
