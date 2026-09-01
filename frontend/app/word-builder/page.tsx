"use client";

import { useCallback, useEffect, useRef } from "react";
import { bind, play } from "cuelume";
import { useWebHaptics } from "web-haptics/react";
import { useDashboardQuery } from "@/lib/queries/dashboard";
import { ApiError } from "@/lib/queries/api-error";
import Signin from "@/components/signin";
import { useWordBuilderStore } from "./components/store";
import {
  useStartWordBuilderSessionMutation,
  useSubmitWordBuilderTrialsMutation,
  useCompleteWordBuilderSessionMutation,
} from "./components/queries";
import ChildSetup from "./components/ChildSetup";
import BuilderIntro from "./components/BuilderIntro";
import BuilderComplete from "./components/BuilderComplete";
import BuildRound from "./components/BuildRound";
import type { TrialOutcome } from "./components/types";

const FLUSH_BATCH_SIZE = 5;

const PRIMARY_BUTTON_CLASSES =
  "font-pixel text-[16px] bg-[#1b1b1b] hover:bg-[#323232] transition-all duration-200 rounded-[15px] px-[24px] py-[10px] text-white cursor-pointer";

export default function WordBuilderPage() {
  // Server state (dashboard/children) lives entirely in TanStack Query —
  // per frontend/AGENTS.md, Zustand never duplicates it.
  const dashboardQuery = useDashboardQuery();
  const { trigger } = useWebHaptics();

  // Client-side active-session state lives in Zustand, scoped to this game.
  const storeChildId = useWordBuilderStore((s) => s.childId);
  const phase = useWordBuilderStore((s) => s.phase);
  const sessionId = useWordBuilderStore((s) => s.sessionId);
  const trials = useWordBuilderStore((s) => s.trials);
  const trialCursor = useWordBuilderStore((s) => s.trialCursor);
  const accuracyResult = useWordBuilderStore((s) => s.accuracyResult);
  const setChildId = useWordBuilderStore((s) => s.setChildId);
  const startSessionState = useWordBuilderStore((s) => s.startSession);
  const advanceTrial = useWordBuilderStore((s) => s.advanceTrial);
  const setSolved = useWordBuilderStore((s) => s.setSolved);
  const resetToIntro = useWordBuilderStore((s) => s.resetToIntro);

  const startSessionMutation = useStartWordBuilderSessionMutation();
  const submitTrialsMutation = useSubmitWordBuilderTrialsMutation();
  const completeSessionMutation = useCompleteWordBuilderSessionMutation();

  useEffect(() => {
    bind();
  }, []);

  const playCue = useCallback(
    (sound: "tick" | "success" | "error" | "droplet" | "loading") => {
      play(sound);
    },
    [],
  );

  const triggerHaptic = useCallback(
    (preset: "nudge" | "success" | "error") => {
      trigger(preset);
    },
    [trigger],
  );

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
        // Network hiccup on a background flush isn't fatal to gameplay; the
        // final flush before /complete is what matters most, and any gap
        // here just means fewer trials scored, not a broken session.
      });
    pendingFlushesRef.current.push(promise);
  }

  async function startRound(childId: string) {
    playCue("loading");
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
      // Surfaced via startSessionMutation.error in the render below.
    }
  }

  const handleAnswer = useCallback(
    async (outcome: TrialOutcome) => {
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
          playCue("success");
          setSolved(result.accuracy);
        } catch {
          // Surfaced via completeSessionMutation.error in the render below.
        }
        return;
      }

      advanceTrial();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trialCursor, trials.length],
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
          <BuilderIntro
            loading={startSessionMutation.isPending}
            onStart={() => startRound(effectiveChildId)}
          />
          {startSessionMutation.isError && (
            <p role="alert" className="font-pixel text-[13px] text-red-600">
              {startSessionMutation.error.message}
            </p>
          )}
        </div>
      )}

      {phase === "playing" && currentTrial && (
        <div className="flex flex-col items-center justify-center w-full gap-8">
          <div
            role="progressbar"
            aria-valuenow={trialCursor + 1}
            aria-valuemin={1}
            aria-valuemax={trials.length}
            aria-label="Round progress"
            className="flex flex-row gap-1.5"
          >
            {trials.map((t, i) => (
              <span
                key={t.index}
                className={`w-2 h-2 rounded-full ${i <= trialCursor ? "bg-[#1d1d1d]" : "bg-[#e0e0e0]"}`}
              />
            ))}
          </div>

          <BuildRound
            key={currentTrial.index}
            trial={currentTrial}
            onAnswer={handleAnswer}
            playCue={playCue}
            triggerHaptic={triggerHaptic}
          />
        </div>
      )}

      {phase === "solved" && (
        <div className="flex flex-col items-center gap-4">
          <BuilderComplete accuracy={accuracyResult} onPlayAgain={resetToIntro} />
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
