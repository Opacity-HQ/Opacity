"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { bind, play } from "cuelume";
import { useWebHaptics } from "web-haptics/react";
import { motion, AnimatePresence } from "motion/react";
import {
  Star, Home, TreePine, Moon, Book, Sun, Key, Cloud,
  Heart, Flower, Umbrella, Music, Anchor, Bell, Rocket,
  Snowflake, Trophy, Zap, HelpCircle, Eye, Brain, Hand, Frown, Target, Hash, Timer, Sparkles, type LucideIcon
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type GamePhase = "intro" | "loading" | "show" | "recall" | "feedback" | "stats";

interface Challenge {
  id: string;
  type: "sequence" | "position";
  level: number;
  sequence: string[];
  target?: string;
  targetIndex?: number;
  gridSize?: number;
  displayMs: number;
  sequenceLength: number;
}

interface FeedbackResult {
  correct: boolean;
  score: number;
  level: number;
  nextLevel: number;
  feedback: string;
}

interface GameSummary {
  accuracy: number;
  maxSequenceLength: number;
  averageResponseTimeMs: number;
  attempts: number;
  errors: number;
  difficultyLevelReached: number;
}

// ─── Icon map ────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  Star, Home, TreePine, Moon, Book, Sun, Key, Cloud,
  Heart, Flower, Umbrella, Music, Anchor, Bell, Rocket,
  Snowflake, Trophy, Zap, Eye, Brain, Hand, Frown, Target, Hash, Timer, Sparkles
};

const ALL_SYMBOLS = [
  "Star", "Home", "TreePine", "Moon", "Book", "Sun", "Key", "Cloud",
  "Heart", "Flower", "Umbrella", "Music", "Anchor", "Bell", "Rocket",
  "Snowflake", "Trophy", "Zap",
];
const PLAYER_ID = "pranshu";

function getIcon(symbol: string, className: string = "w-8 h-8 sm:w-10 sm:h-10 text-[#1d1d1d]") {
  const Icon = ICON_MAP[symbol] || HelpCircle;
  return <Icon className={className} strokeWidth={2.5} />;
}

/** Build a shuffled bank of emojis: sequence items + random distractors. */
function buildEmojiBank(sequence: string[]): string[] {
  const uniqueSeq = [...new Set(sequence)];
  const distractors = ALL_SYMBOLS
    .filter((s) => !uniqueSeq.includes(s))
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.max(3, 9 - uniqueSeq.length));
  return [...uniqueSeq, ...distractors].sort(() => Math.random() - 0.5);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MemoryQuestPage() {
  const { trigger } = useWebHaptics();
  const [phase, setPhase] = useState<GamePhase>("intro");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState<string[]>([]);
  const [emojiBank, setEmojiBank] = useState<string[]>([]);
  const [feedbackResult, setFeedbackResult] = useState<FeedbackResult | null>(null);
  const [summary, setSummary] = useState<GameSummary | null>(null);
  const [roundCount, setRoundCount] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [displayProgress, setDisplayProgress] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mistakes, setMistakes] = useState(0);

  // Refs for values needed inside async callbacks without stale closures
  const startTimeRef = useRef<number>(0);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const challengeRef = useRef<Challenge | null>(null);
  const mistakesRef = useRef<number>(0);
  const roundCountRef = useRef<number>(0);
  const isSubmittingRef = useRef<boolean>(false);
  const summaryRef = useRef<GameSummary | null>(null);

  // Keep refs in sync
  useEffect(() => { challengeRef.current = challenge; }, [challenge]);
  useEffect(() => { mistakesRef.current = mistakes; }, [mistakes]);
  useEffect(() => { roundCountRef.current = roundCount; }, [roundCount]);
  useEffect(() => { isSubmittingRef.current = isSubmitting; }, [isSubmitting]);
  useEffect(() => { summaryRef.current = summary; }, [summary]);

  useEffect(() => {
    bind();
  }, []);

  const triggerHaptic = useCallback(
    (preset: "nudge" | "success" | "error" | "buzz") => {
      trigger(preset);
    },
    [trigger],
  );

  const playCue = useCallback(
    (sound: "loading" | "pulse" | "tick" | "success" | "error" | "droplet" | "release", volume?: number) => {
      play(sound, volume !== undefined ? { volume } : undefined);
    },
    [],
  );

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  // ─── Core actions ─────────────────────────────────────────────────────────

  const submitAnswer = useCallback(async (answer: string[]) => {
    if (isSubmittingRef.current) return;
    const c = challengeRef.current;
    if (!c) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    const responseTimeMs = Date.now() - startTimeRef.current;

    try {
      const res = await fetch("/api/games/memory-quest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: c.id,
          playerId: PLAYER_ID,
          response: answer,
          responseTimeMs,
          attempts: 1,
          mistakes: mistakesRef.current,
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        result: FeedbackResult;
        summary: GameSummary;
      };

      if (data.ok) {
        setFeedbackResult(data.result);
        setSummary(data.summary);
        summaryRef.current = data.summary;
        setTotalScore((prev) => prev + data.result.score);
        setCurrentLevel(data.result.nextLevel);
        setRoundCount((prev) => {
          roundCountRef.current = prev + 1;
          return prev + 1;
        });

        if (data.result.correct) {
          playCue("success");
          triggerHaptic("success");
        } else {
          playCue("error");
          triggerHaptic("error");
        }

        setPhase("feedback");
      }
    } catch {
      // Network failure — stay on recall so the player can retry
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [playCue, triggerHaptic]);

  // Auto-submit when the answer slots are completely filled
  useEffect(() => {
    if (
      phase !== "recall" ||
      !challenge ||
      challenge.type === "position" ||
      currentAnswer.length !== challenge.sequence.length ||
      isSubmitting
    ) return;

    const answer = [...currentAnswer];
    const t = setTimeout(() => submitAnswer(answer), 120);
    return () => clearTimeout(t);
  }, [currentAnswer, phase, challenge, isSubmitting, submitAnswer]);

  const fetchChallenge = useCallback(async () => {
    if (showTimerRef.current) clearTimeout(showTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    playCue("loading");
    triggerHaptic("nudge");
    setPhase("loading");
    setCurrentAnswer([]);
    setMistakes(0);

    try {
      const type = (roundCountRef.current % 3 === 2) ? "position" : "sequence";
      const res = await fetch(
        `/api/games/memory-quest?playerId=${PLAYER_ID}&type=${type}`
      );
      const data = (await res.json()) as { ok: boolean; challenge: Challenge };
      if (!data.ok) { setPhase("intro"); return; }

      const c = data.challenge;
      setChallenge(c);
      challengeRef.current = c;
      setEmojiBank(buildEmojiBank(c.sequence));
      setDisplayProgress(100);
      setPhase("show");

      // Countdown progress bar
      const startMs = Date.now();
      progressIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startMs;
        setDisplayProgress(Math.max(0, (1 - elapsed / c.displayMs) * 100));
      }, 50);

      // After displayMs, hide sequence and start recall
      showTimerRef.current = setTimeout(() => {
        clearInterval(progressIntervalRef.current!);
        setDisplayProgress(0);
        startTimeRef.current = Date.now();
        setPhase("recall");
      }, c.displayMs);
    } catch {
      setPhase("intro");
    }
  }, [playCue, triggerHaptic]);

  const handleEmojiTap = useCallback((symbol: string) => {
    if (isSubmittingRef.current) return;
    const c = challengeRef.current;
    if (!c) return;
    setCurrentAnswer((prev) => {
      if (prev.length >= c.sequence.length) return prev;
      playCue("tick", 0.7);
      triggerHaptic("nudge");
      return [...prev, symbol];
    });
  }, [playCue, triggerHaptic]);

  const handleBackspace = useCallback(() => {
    setCurrentAnswer((prev) => {
      if (prev.length === 0) return prev;
      setMistakes((m) => m + 1);
      playCue("droplet", 0.7);
      triggerHaptic("nudge");
      return prev.slice(0, -1);
    });
  }, [playCue, triggerHaptic]);

  const handleNextRound = useCallback(() => {
    const rc = roundCountRef.current;
    playCue("pulse", 0.8);
    triggerHaptic("nudge");
    if (rc > 0 && rc % 3 === 0 && summaryRef.current) {
      setPhase("stats");
    } else {
      fetchChallenge();
    }
  }, [fetchChallenge, playCue, triggerHaptic]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center justify-start w-full flex-1 px-4 sm:px-6 py-8 sm:py-10">
      <AnimatePresence mode="wait">

        {/* ── INTRO ──────────────────────────────────────────────────────── */}
        {phase === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center w-full gap-6 sm:gap-8"
          >
            {/* Decorative forest path */}
            <div className="flex flex-row items-center justify-center gap-1.5 sm:gap-2 text-[36px] sm:text-[48px] mt-2">
              {["🌳", "🐰", "⭐", "🏠"].map((e, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
                >
                  {getIcon(e, "w-10 h-10 sm:w-12 sm:h-12 text-[#1d1d1d]")}
                </motion.span>
              ))}
            </div>

            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="font-pixel text-[28px] sm:text-[36px] text-[#1d1d1d]">
                Memory Quest
              </h1>
              <p className="font-sauce text-[15px] sm:text-[17px] text-[#5e5e5e] max-w-[300px] leading-[22px]">
                Remember the path and find the hidden treasure!
              </p>
            </div>

            {/* How to play */}
            <div className="w-full max-w-[340px] bg-white border-[2px] border-[#efefef] rounded-[15px] p-4">
              {[
                { icon: "Eye", text: "Watch the path or map carefully" },
                { icon: "Brain", text: "Remember the order or treasure spot" },
                { icon: "Hand", text: "Tap to reproduce the memory" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex flex-row items-center gap-3 py-1.5">
                  <span className="text-[18px]">{getIcon(icon, "w-5 h-5 text-[#5e5e5e]")}</span>
                  <span className="font-sauce text-[14px] sm:text-[15px] text-[#5e5e5e]">
                    {text}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center gap-2">
              {roundCount > 0 && (
                <p className="font-sauce text-[13px] text-[#a0a0a0]">
                  level {currentLevel} · {currentLevel + 2} items
                </p>
              )}
              <button
                id="memory-quest-start"
                onClick={() => {
                  playCue("pulse", 0.8);
                  triggerHaptic("nudge");
                  fetchChallenge();
                }}
                className="button-shadow flex flex-row items-center justify-center bg-[#1b1b1b] hover:bg-[#323232] hover:translate-y-[-4px] transition-all duration-200 rounded-[20px] px-[24px] py-[10px] cursor-pointer"
              >
                <span className="font-pixel text-[18px] sm:text-[20px] text-white">
                  {roundCount > 0 ? "next round" : "start"}
                </span>
              </button>
            </div>

            {totalScore > 0 && (
              <p className="font-pixel text-[13px] text-[#a0a0a0]">
                total score: {totalScore}
              </p>
            )}
          </motion.div>
        )}

        {/* ── LOADING ─────────────────────────────────────────────────────── */}
        {phase === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center flex-1 gap-4 pt-16"
          >
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="text-[44px] block"
            >
              <Sparkles className="w-10 h-10 text-[#1d1d1d]" strokeWidth={2} />
            </motion.span>
            <span className="font-pixel text-[16px] text-[#5e5e5e]">loading path...</span>
          </motion.div>
        )}

        {/* ── SHOW ────────────────────────────────────────────────────────── */}
        {phase === "show" && challenge && (
          <motion.div
            key="show"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center w-full gap-5 sm:gap-6"
          >
            <div className="flex flex-col items-center gap-1 text-center mt-2">
              <h2 className="font-pixel text-[20px] sm:text-[24px] text-[#1d1d1d]">
                {challenge.type === "position" ? "the map" : "the path"}
              </h2>
              <p className="font-sauce text-[14px] text-[#5e5e5e] flex items-center justify-center gap-1">
                {challenge.type === "position" ? <>Remember where {getIcon(challenge.target || "", "w-5 h-5 text-[#1d1d1d]")} is!</> : "Remember this sequence!"}
              </p>
            </div>

            {challenge.type === "position" && challenge.gridSize ? (
              <div 
                className="grid gap-2 p-2"
                style={{ gridTemplateColumns: `repeat(${challenge.gridSize}, minmax(0, 1fr))` }}
              >
                {challenge.sequence.map((symbol, i) => (
                  <motion.div
                    key={`map-${i}`}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05, type: "spring", stiffness: 250 }}
                    className="flex items-center justify-center w-[60px] h-[60px] sm:w-[70px] sm:h-[70px] bg-[#f9f0f0] border-[2px] border-[#efefef] rounded-[14px]"
                  >
                    <span className="text-[30px] sm:text-[34px] select-none">
                      {symbol ? getIcon(symbol, "w-8 h-8 sm:w-10 sm:h-10 text-[#1d1d1d]") : ""}
                    </span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-row flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-2">
                {challenge.sequence.map((symbol, i) => (
                  <motion.div
                    key={`${symbol}-${i}`}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1, type: "spring", stiffness: 250 }}
                    className="flex flex-row items-center gap-1.5 sm:gap-2"
                  >
                    <div className="flex items-center justify-center w-[62px] h-[62px] sm:w-[70px] sm:h-[70px] bg-[#f9f0f0] border-[2px] border-[#efefef] rounded-[14px]">
                      <span className="text-[30px] sm:text-[34px] select-none">
                        {getIcon(symbol, "w-8 h-8 sm:w-10 sm:h-10 text-[#1d1d1d]")}
                      </span>
                    </div>
                    {i < challenge.sequence.length - 1 && (
                      <span className="font-pixel text-[14px] sm:text-[16px] text-[#d0d0d0]">
                        →
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* Progress bar */}
            <div className="flex flex-col items-center w-full max-w-[340px] gap-2 px-2">
              <div className="flex flex-row items-center justify-between w-full">
                <span className="font-pixel text-[12px] text-[#a0a0a0]">
                  level {challenge.level}
                </span>
                <span className="font-pixel text-[12px] text-[#a0a0a0]">
                  {challenge.sequence.length} items
                </span>
              </div>
              <div className="w-full h-[5px] bg-[#efefef] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1d1d1d] rounded-full transition-none"
                  style={{ width: `${displayProgress}%` }}
                />
              </div>
              <span className="font-sauce text-[12px] text-[#c0c0c0]">
                memorise before the bar runs out
              </span>
            </div>
          </motion.div>
        )}

        {/* ── RECALL ──────────────────────────────────────────────────────── */}
        {phase === "recall" && challenge && (
          <motion.div
            key="recall"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center w-full gap-5"
          >
            <div className="flex flex-col items-center gap-1 mt-2">
              <h2 className="font-pixel text-[20px] sm:text-[24px] text-[#1d1d1d]">
                your turn!
              </h2>
              <p className="font-sauce text-[14px] text-[#5e5e5e] flex items-center justify-center gap-1">
                {challenge.type === "position" ? <>Where was {getIcon(challenge.target || "", "w-5 h-5 text-[#1d1d1d]")}?</> : "Tap the emojis in the correct order"}
              </p>
            </div>

            {challenge.type === "position" && challenge.gridSize ? (
              <div 
                className="grid gap-2 p-2 mt-4"
                style={{ gridTemplateColumns: `repeat(${challenge.gridSize}, minmax(0, 1fr))` }}
              >
                {Array.from({ length: challenge.gridSize * challenge.gridSize }).map((_, i) => (
                  <motion.div
                    key={`recall-map-${i}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => {
                      if (!isSubmitting) {
                        setCurrentAnswer([i.toString()]);
                        submitAnswer([i.toString()]);
                      }
                    }}
                    className={`flex items-center justify-center w-[60px] h-[60px] sm:w-[70px] sm:h-[70px] rounded-[12px] border-[2px] transition-all duration-150 cursor-pointer ${
                      currentAnswer[0] === i.toString()
                        ? "bg-[#f9f0f0] border-[#e0c0c0]"
                        : "bg-white border-dashed border-[#e0e0e0] hover:bg-[#fdf5f5]"
                    }`}
                  />
                ))}
              </div>
            ) : (
              <>
                <div className="flex flex-row flex-wrap items-center justify-center gap-2 px-4 max-w-full">
                  {Array.from({ length: challenge.sequence.length }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className={`flex items-center justify-center w-[52px] h-[52px] sm:w-[60px] sm:h-[60px] rounded-[12px] border-[2px] transition-all duration-150 ${
                        currentAnswer[i]
                          ? "bg-[#f9f0f0] border-[#e0c0c0]"
                          : i === currentAnswer.length
                          ? "bg-white border-[#a0a0a0] border-dashed"
                          : "bg-white border-dashed border-[#e0e0e0]"
                      }`}
                    >
                      {currentAnswer[i] ? (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-[26px] sm:text-[30px] select-none"
                        >
                          {getIcon(currentAnswer[i], "w-8 h-8 sm:w-10 sm:h-10 text-[#1d1d1d]")}
                        </motion.span>
                      ) : (
                        <span className="font-pixel text-[11px] text-[#d0d0d0]">
                          {i + 1}
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>

                <div className="flex flex-col items-center w-full gap-3 px-4 mt-2">
                  <div
                    className={`grid gap-2 sm:gap-2.5 w-full max-w-[380px] ${
                      emojiBank.length <= 6
                        ? "grid-cols-3"
                        : emojiBank.length <= 8
                        ? "grid-cols-4"
                        : "grid-cols-4 sm:grid-cols-5"
                    }`}
                  >
                    {emojiBank.map((symbol, i) => (
                      <motion.button
                        key={`${symbol}-${i}`}
                        id={`emoji-bank-${symbol}-${i}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.035 }}
                        whileTap={{ scale: 0.88 }}
                        onClick={() => handleEmojiTap(symbol)}
                        disabled={
                          currentAnswer.length >= challenge.sequence.length ||
                          isSubmitting
                        }
                        className="flex items-center justify-center aspect-square bg-white border-[2px] border-[#efefef] rounded-[12px] hover:bg-[#fdf5f5] hover:border-[#e8d0d0] transition-all duration-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <span className="text-[26px] sm:text-[30px] select-none">
                          {getIcon(symbol, "w-8 h-8 sm:w-10 sm:h-10 text-[#1d1d1d]")}
                        </span>
                      </motion.button>
                    ))}
                  </div>

                  <button
                    id="memory-quest-backspace"
                    onClick={handleBackspace}
                    disabled={currentAnswer.length === 0 || isSubmitting}
                    className="flex flex-row items-center gap-2 px-4 py-2 bg-white border-[2px] border-[#efefef] rounded-[12px] hover:bg-[#f5f5f5] disabled:opacity-30 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <span className="font-pixel text-[13px] sm:text-[14px] text-[#5e5e5e]">
                      ← backspace
                    </span>
                  </button>
                </div>
              </>
            )}

            {isSubmitting && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-pixel text-[13px] text-[#a0a0a0]"
              >
                checking...
              </motion.p>
            )}
          </motion.div>
        )}

        {/* ── FEEDBACK ────────────────────────────────────────────────────── */}
        {phase === "feedback" && feedbackResult && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center w-full gap-5 sm:gap-6 mt-2"
          >
            {/* Result icon */}
            <motion.span
              animate={
                feedbackResult.correct
                  ? { scale: [1, 1.35, 1], rotate: [0, 10, -10, 0] }
                  : { x: [-10, 10, -10, 10, 0] }
              }
              transition={{ duration: 0.55 }}
              className="text-[64px] sm:text-[72px] block"
            >
              {feedbackResult.correct ? <Trophy className="w-16 h-16 sm:w-20 sm:h-20 text-[#1d1d1d]" strokeWidth={2} /> : <Frown className="w-16 h-16 sm:w-20 sm:h-20 text-[#1d1d1d]" strokeWidth={2} />}
            </motion.span>

            <div className="flex flex-col items-center gap-1 text-center">
              <h2 className="font-pixel text-[22px] sm:text-[26px] text-[#1d1d1d]">
                {feedbackResult.correct ? "perfect!" : "good try!"}
              </h2>
              <p className="font-sauce text-[14px] sm:text-[15px] text-[#5e5e5e]">
                {feedbackResult.correct
                  ? "You remembered the path!"
                  : "The forest path was tricky!"}
              </p>
            </div>

            {/* Score / level / round row */}
            <div className="flex flex-row items-stretch justify-center gap-3 w-full max-w-[340px]">
              {[
                {
                  label: "score",
                  value: feedbackResult.correct ? `+${feedbackResult.score}` : "+0",
                },
                {
                  label: "level",
                  value:
                    feedbackResult.nextLevel > feedbackResult.level
                      ? `${feedbackResult.nextLevel} ↑`
                      : feedbackResult.nextLevel < feedbackResult.level
                      ? `${feedbackResult.nextLevel} ↓`
                      : `${feedbackResult.level}`,
                },
                { label: "round", value: roundCount },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex flex-col items-center flex-1 bg-white border-[2px] border-[#efefef] rounded-[12px] py-3"
                >
                  <span className="font-pixel text-[15px] sm:text-[17px] text-[#1d1d1d]">
                    {value}
                  </span>
                  <span className="font-sauce text-[12px] text-[#a0a0a0] mt-0.5">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Reveal correct sequence on wrong answer */}
            {!feedbackResult.correct && challenge && (
              <div className="flex flex-col items-center gap-2 w-full max-w-[340px]">
                <span className="font-pixel text-[12px] sm:text-[13px] text-[#a0a0a0]">
                  {challenge.type === "position" ? "the correct spot was:" : "the correct path was:"}
                </span>
                
                {challenge.type === "position" && challenge.gridSize ? (
                  <div 
                    className="grid gap-1.5"
                    style={{ gridTemplateColumns: `repeat(${challenge.gridSize}, minmax(0, 1fr))` }}
                  >
                    {Array.from({ length: challenge.gridSize * challenge.gridSize }).map((_, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-center w-[40px] h-[40px] rounded-[10px] border-[2px] ${
                          i === challenge.targetIndex
                            ? "bg-[#f9f0f0] border-[#e8c8c8]"
                            : "bg-white border-[#efefef]"
                        }`}
                      >
                        <span className="text-[20px] select-none">
                          {i === challenge.targetIndex ? getIcon(challenge.target || "", "w-6 h-6 inline-block align-text-bottom text-[#1d1d1d]") : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-row flex-wrap items-center justify-center gap-1.5">
                    {challenge.sequence.map((symbol, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-center w-[44px] h-[44px] bg-[#f9f0f0] border-[2px] border-[#e8c8c8] rounded-[10px]"
                      >
                        <span className="text-[22px] select-none">{getIcon(symbol, "w-8 h-8 sm:w-10 sm:h-10 text-[#1d1d1d]")}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              id="memory-quest-next"
              onClick={handleNextRound}
              className="button-shadow flex items-center justify-center bg-[#1b1b1b] hover:bg-[#323232] hover:translate-y-[-4px] transition-all duration-200 rounded-[20px] px-[24px] py-[10px] cursor-pointer"
            >
              <span className="font-pixel text-[17px] sm:text-[20px] text-white">
                {roundCount > 0 && roundCount % 3 === 0 ? "see stats" : "next round"}
              </span>
            </button>
          </motion.div>
        )}

        {/* ── STATS ───────────────────────────────────────────────────────── */}
        {phase === "stats" && summary && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center w-full gap-5 sm:gap-6 mt-2"
          >
            <div className="flex flex-col items-center gap-1 text-center">
              <h2 className="font-pixel text-[24px] sm:text-[28px] text-[#1d1d1d]">
                your stats
              </h2>
              <p className="font-sauce text-[14px] text-[#5e5e5e]">
                after {roundCount} round{roundCount !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Stats card — same visual style as the disclaimer on the home page */}
            <div className="w-full max-w-[360px] bg-white border-[2px] border-[#efefef] rounded-[15px] overflow-hidden">
              {[
                { label: "accuracy",      value: `${summary.accuracy}%`,                              icon: "Target" },
                { label: "max sequence",  value: `${summary.maxSequenceLength} items`,                icon: "Hash" },
                { label: "avg response",  value: `${(summary.averageResponseTimeMs / 1000).toFixed(1)}s`, icon: "Timer" },
                { label: "level reached", value: `level ${summary.difficultyLevelReached}`,           icon: "Star" },
                { label: "total score",   value: `${totalScore}`,                                     icon: "Trophy" },
              ].map(({ label, value, icon }, i, arr) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className={`flex flex-row items-center justify-between px-4 py-3 ${
                    i < arr.length - 1 ? "border-b-[1px] border-[#f2f2f2]" : ""
                  }`}
                >
                  <div className="flex flex-row items-center gap-2">
                    <span className="text-[16px]">{getIcon(icon, "w-4 h-4 text-[#5e5e5e]")}</span>
                    <span className="font-sauce text-[14px] text-[#5e5e5e]">{label}</span>
                  </div>
                  <span className="font-pixel text-[14px] sm:text-[15px] text-[#1d1d1d]">
                    {value}
                  </span>
                </motion.div>
              ))}
            </div>

            <button
              id="memory-quest-continue"
              onClick={() => {
                playCue("pulse", 0.8);
                triggerHaptic("nudge");
                fetchChallenge();
              }}
              className="button-shadow flex items-center justify-center bg-[#1b1b1b] hover:bg-[#323232] hover:translate-y-[-4px] transition-all duration-200 rounded-[20px] px-[24px] py-[10px] cursor-pointer"
            >
              <span className="font-pixel text-[17px] sm:text-[20px] text-white">
                keep going
              </span>
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
