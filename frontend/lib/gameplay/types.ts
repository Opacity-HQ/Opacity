import type { GameReadiness } from "./features";

export type GameplayResult = {
  simulated: true;
  trainingSource: "synthetic";
  assessmentWindowDays: number;
  games: GameReadiness[];
  pendingSession: boolean;
} & ({
  status: "needs_games";
} | {
  status: "ready";
  modelId: string;
  schemaVersion: string;
  classification: "dyslexia" | "no_dyslexia";
  score: number;
  confidence: number;
  threshold: number;
  missingFeatureCount: number;
  sessionsIncluded: string[];
});
