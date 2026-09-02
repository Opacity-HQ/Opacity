"use client";

import { useCallback, useEffect, useRef } from "react";
import { bind } from "cuelume";
import { useDashboardQuery } from "@/lib/queries/dashboard";
import { ApiError } from "@/lib/queries/api-error";
import Signin from "@/components/signin";
import { useSoundMatchStore } from "./components/store";
import { useGameFeedback } from "./components/useGameFeedback";
import {
  useStartSoundMatchSessionMutation,
  useSubmitSoundMatchTrialsMutation,
  useCompleteSoundMatchSessionMutation,
} from "./components/queries";
import ChildSetup from "./components/ChildSetup";
import SoundMatchIntro from "./components/SoundMatchIntro";
import SoundMatchCompleted from "./components/SoundMatchCompleted";
import FirstSoundRound from "./components/FirstSoundRound";
import RhymeRound from "./components/RhymeRound";
import MinimalPairRound from "./components/MinimalPairRound";
import PhonemeLetterRound from "./components/PhonemeLetterRound";
import LevelUpTransition from "./components/LevelUpTransition";
import type { TrialOutcome } from "./components/types";

const FLUSH_BATCH_SIZE = 5;

const PRIMARY_BUTTON_CLASSES =
  "font-pixel text-[16px] bg-[#1b1b1b] hover:bg-[#323232] transition-all duration-200 rounded-[15px] px-[24px] py-[10px] text-white cursor-pointer";

export default function SoundMatchPage() {
  const dashboardQuery = useDashboardQuery();

  const storeChildId = useSoundMatchStore((s) => s.childId);
  const phase = useSoundMatchStore((s) => s.phase);
  const sessionId = useSoundMatchStore((s) => s.sessionId);
  const trials = useSoundMatchStore((s) => s.trials);
  const trialCursor = useSoundMatchStore((s) => s.trialCursor);
  const levelUpTo = useSoundMatchStore((s) => s.levelUpTo);
  const accuracyResult = useSoundMatchStore((s) => s.accuracyResult);
  const setChildId = useSoundMatchStore((s) => s.setChildId);
  const startSessionState = useSoundMatchStore((s) => s.startSession);
  const advanceTrial = useSoundMatchStore((s) => s.advanceTrial);
  const enterLevelUp = useSoundMatchStore((s) => s.enterLevelUp);
  const exitLevelUp = useSoundMatchStore((s) => s.exitLevelUp);
  const setCompleted = useSoundMatchStore((s) => s.setCompleted);
  const resetToIntro = useSoundMatchStore((s) => s.resetToIntro);

  const startSessionMutation = useStartSoundMatchSessionMutation();
  const submitTrialsMutation = useSubmitSoundMatchTrialsMutation();
  const completeSessionMutation = useCompleteSoundMatchSessionMutation();
  const feedback = useGameFeedback();

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
        // Network hiccup on a background flush isn't fatal — the final flush
        // before /complete is what matters most.
      });
    pendingFlushesRef.current.push(promise);
  }

  async function startGame(childId: string) {
    feedback.onCaseStart();
    try {
      const result = await startSessionMutation.mutateAsync({
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
      startSessionState(result);
    } catch {
      // Surfaced via startSessionMutation.error
    }
  }

  const handleAnswer = useCallback(
    async (outcome: TrialOutcome) => {
      if (outcome.localCorrect) {
        feedback.onCorrect();
      } else {
        feedback.onWrong();
      }

      bufferRef.current.push(outcome);
      const isLastTrial = trialCursor + 1 >= trials.length;

      if (bufferRef.current.length >= FLUSH_BATCH_SIZE || isLastTrial) {
        flushBuffer();
      }

      if (isLastTrial) {
        await Promise.all(pendingFlushesRef.current);
        try {
          const result = await completeSessionMutation.mutateAsync(
            sessionIdRef.current!,
          );
          feedback.onCaseSolved();
          setCompleted(result);
        } catch {
          // Surfaced via completeSessionMutation.error
        }
        return;
      }

      // Level boundary — read straight off the server-authored plan, never
      // computed client-side. Insert the non-blocking level-up transition;
      // the cursor advances when it finishes (store.exitLevelUp).
      const nextTrial = trials[trialCursor + 1];
      if (nextTrial && nextTrial.level > trials[trialCursor].level) {
        feedback.onLevelUp();
        enterLevelUp(nextTrial.level);
        return;
      }

      advanceTrial();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trialCursor, trials],
  );

  const currentTrial = trials[trialCursor];

  if (dashboardQuery.isPending) {
    return (
      <div className="flex flex-col items-center justify-center w-full flex-1 px-4 sm:px-6 py-8 sm:py-12">
        <p className="font-pixel text-[18px] text-[#5e5e5e]">loading...</p>
      </div>
    );
  }

  if (dashboardQuery.isError) {
    const err = dashboardQuery.error;
    const isUnauthorized = err instanceof ApiError && err.code === "unauthorized";
    return (
      <div className="flex flex-col items-center justify-center w-full flex-1 px-4 sm:px-6 py-8 sm:py-12">
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
    return (
      <div className="flex flex-col items-center justify-center w-full flex-1 px-4 sm:px-6 py-8 sm:py-12">
        <ChildSetup onCreated={(child) => setChildId(child.id)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full flex-1 px-4 sm:px-6 py-8 sm:py-12">
      {phase === "intro" && (
        <div className="flex flex-col items-center gap-4">
          <SoundMatchIntro
            loading={startSessionMutation.isPending}
            onStart={() => startGame(effectiveChildId)}
          />
          {startSessionMutation.isError && (
            <p role="alert" className="font-pixel text-[13px] text-red-600">
              {startSessionMutation.error.message}
            </p>
          )}
        </div>
      )}

      {(phase === "playing" || phase === "levelup") && currentTrial && (
        <div className="flex flex-col items-center justify-center w-full gap-8">
          <div className="flex flex-col items-center gap-2">
            <span className="font-pixel text-[12px] uppercase tracking-wide text-[#a0a0a0]">
              {currentTrial.isWarmup
                ? "warm-up"
                : `level ${currentTrial.level}`}
            </span>
            <div
              role="progressbar"
              aria-valuenow={trialCursor + 1}
              aria-valuemin={1}
              aria-valuemax={trials.length}
              aria-label="Game progress"
              className="flex flex-row gap-1.5"
            >
              {trials.map((t, i) => (
                <span
                  key={t.index}
                  className={`w-2 h-2 rounded-full ${
                    i <= trialCursor ? "bg-[#1d1d1d]" : "bg-[#e0e0e0]"
                  }`}
                />
              ))}
            </div>
          </div>

          {phase === "levelup" && levelUpTo !== null ? (
            <LevelUpTransition level={levelUpTo} onDone={exitLevelUp} />
          ) : (
            <>
              {currentTrial.roundType === "first-sound" && (
                <FirstSoundRound
                  key={currentTrial.index}
                  trial={currentTrial}
                  onAnswer={handleAnswer}
                />
              )}
              {currentTrial.roundType === "rhyme" && (
                <RhymeRound
                  key={currentTrial.index}
                  trial={currentTrial}
                  onAnswer={handleAnswer}
                />
              )}
              {currentTrial.roundType === "minimal-pair" && (
                <MinimalPairRound
                  key={currentTrial.index}
                  trial={currentTrial}
                  onAnswer={handleAnswer}
                />
              )}
              {currentTrial.roundType === "phoneme-letter" && (
                <PhonemeLetterRound
                  key={currentTrial.index}
                  trial={currentTrial}
                  onAnswer={handleAnswer}
                />
              )}
            </>
          )}
        </div>
      )}

      {phase === "completed" && (
        <div className="flex flex-col items-center gap-4">
          <SoundMatchCompleted
            accuracyResult={accuracyResult}
            onPlayAgain={resetToIntro}
          />
          {completeSessionMutation.isError && (
            <p role="alert" className="font-pixel text-[13px] text-red-600">
              {completeSessionMutation.error.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
