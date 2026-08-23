"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ChildSetup from "./components/ChildSetup";
import CaseIntro from "./components/CaseIntro";
import CaseSolved from "./components/CaseSolved";
import LineupRound from "./components/LineupRound";
import ImpostorRound from "./components/ImpostorRound";
import StakeoutRound from "./components/StakeoutRound";
import WordsRound from "./components/WordsRound";
import type { LDPair, LDTrial, TrialOutcome } from "./components/types";

type Stage = "loading" | "needs-child" | "intro" | "playing" | "solved" | "error";

const FLUSH_BATCH_SIZE = 5;

export default function LetterDetectivePage() {
  const [stage, setStage] = useState<Stage>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [childId, setChildId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pair, setPair] = useState<LDPair | null>(null);
  const [trials, setTrials] = useState<LDTrial[]>([]);
  const [trialCursor, setTrialCursor] = useState(0);
  const [accuracyResult, setAccuracyResult] = useState(0);
  const [starting, setStarting] = useState(false);

  const bufferRef = useRef<TrialOutcome[]>([]);
  const pendingFlushesRef = useRef<Promise<unknown>[]>([]);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((body) => {
        if (cancelled) return;
        if (!body.ok) {
          setStage("error");
          setErrorMessage(body.error?.message ?? "Could not load your profile.");
          return;
        }
        const children = body.data.children as { id: string }[];
        if (children.length === 0) {
          setStage("needs-child");
        } else {
          setChildId(children[0].id);
          setStage("intro");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStage("error");
          setErrorMessage("Could not connect. Please check your connection.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function flushBuffer() {
    if (bufferRef.current.length === 0 || !sessionIdRef.current) return;
    const batch = bufferRef.current;
    bufferRef.current = [];
    const promise = fetch("/api/games/letter-detective/trial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sessionIdRef.current,
        trials: batch.map((t) => ({
          trialIndex: t.trialIndex,
          response: t.response,
          reactionTimeMs: t.reactionTimeMs,
          timeToFirstMoveMs: t.timeToFirstMoveMs,
        })),
      }),
    }).catch(() => {
      // Network hiccup on a background flush isn't fatal to gameplay; the
      // final flush before /complete is what matters most, and any gap
      // here just means fewer trials scored, not a broken session.
    });
    pendingFlushesRef.current.push(promise);
  }

  async function startCase() {
    if (!childId) return;
    setStarting(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/games/letter-detective", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          device: {
            userAgent: navigator.userAgent,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            inputType: "ontouchstart" in window ? "touch" : "mouse",
          },
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setErrorMessage(body.error?.message ?? "Could not start the case.");
        setStage("error");
        return;
      }
      bufferRef.current = [];
      pendingFlushesRef.current = [];
      setSessionId(body.data.sessionId);
      setPair(body.data.pair);
      setTrials(body.data.trials);
      setTrialCursor(0);
      setStage("playing");
    } catch {
      setErrorMessage("Could not connect. Please check your connection.");
      setStage("error");
    } finally {
      setStarting(false);
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
          const res = await fetch("/api/games/letter-detective/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: sessionIdRef.current }),
          });
          const body = await res.json();
          if (!res.ok) {
            setErrorMessage(body.error?.message ?? "Could not finish the case.");
            setStage("error");
            return;
          }
          setAccuracyResult(body.data.accuracy);
          setStage("solved");
        } catch {
          setErrorMessage("Could not connect. Please check your connection.");
          setStage("error");
        }
        return;
      }

      setTrialCursor((c) => c + 1);
    },
    [trialCursor, trials.length],
  );

  const currentTrial = trials[trialCursor];

  return (
    <div className="flex flex-col items-center justify-center w-full flex-1 px-4 sm:px-6 py-8 sm:py-12">
      {stage === "loading" && (
        <p className="font-pixel text-[18px] text-[#5e5e5e]">loading...</p>
      )}

      {stage === "needs-child" && (
        <ChildSetup
          onCreated={(child) => {
            setChildId(child.id);
            setStage("intro");
          }}
        />
      )}

      {stage === "intro" && (
        <CaseIntro pair={pair} loading={starting} onStart={startCase} />
      )}

      {stage === "playing" && currentTrial && (
        <div className="flex flex-col items-center justify-center w-full gap-8">
          <div
            role="progressbar"
            aria-valuenow={trialCursor + 1}
            aria-valuemin={1}
            aria-valuemax={trials.length}
            aria-label="Case progress"
            className="flex flex-row gap-1.5"
          >
            {trials.map((t, i) => (
              <span
                key={t.index}
                className={`w-2 h-2 rounded-full ${i <= trialCursor ? "bg-[#1d1d1d]" : "bg-[#e0e0e0]"}`}
              />
            ))}
          </div>

          {currentTrial.roundType === "lineup" && (
            <LineupRound
              key={currentTrial.index}
              trial={currentTrial}
              onAnswer={handleAnswer}
            />
          )}
          {currentTrial.roundType === "impostor" && (
            <ImpostorRound
              key={currentTrial.index}
              trial={currentTrial}
              onAnswer={handleAnswer}
            />
          )}
          {currentTrial.roundType === "stakeout" && pair && (
            <StakeoutRound
              key={currentTrial.index}
              trial={currentTrial}
              targetLetter={pair.letterA}
              onAnswer={handleAnswer}
            />
          )}
          {currentTrial.roundType === "words" && (
            <WordsRound
              key={currentTrial.index}
              trial={currentTrial}
              onAnswer={handleAnswer}
            />
          )}
        </div>
      )}

      {stage === "solved" && (
        <CaseSolved
          accuracy={accuracyResult}
          onPlayAgain={() => {
            setStage("intro");
          }}
        />
      )}

      {stage === "error" && (
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <p className="font-pixel text-[18px] text-[#1d1d1d]">
            {errorMessage ?? "Something went wrong."}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="font-pixel text-[16px] bg-[#1b1b1b] hover:bg-[#323232] transition-all duration-200 rounded-[15px] px-[24px] py-[10px] text-white cursor-pointer"
          >
            try again
          </button>
        </div>
      )}
    </div>
  );
}
