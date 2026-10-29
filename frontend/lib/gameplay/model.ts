import "server-only";
import { z } from "zod";
import artifact from "./model.json";
import { FEATURE_NAMES, GAMEPLAY_CONTRACT } from "./features";

const vector = z.array(z.number().finite()).length(FEATURE_NAMES.length);
const modelSchema = z.object({
  model_id: z.literal("opacity-logistic-synthetic-v2"),
  schema_version: z.literal("opacity-gameplay-v2"),
  training_source: z.literal("synthetic"),
  simulated: z.literal(true),
  feature_names: z.array(z.string()),
  classes: z.tuple([z.literal("no_dyslexia"), z.literal("dyslexia")]),
  threshold: z.number().gt(0).lt(1),
  imputer_medians: vector,
  scaler_mean: vector,
  scaler_scale: z.array(z.number().finite().positive()).length(FEATURE_NAMES.length),
  coefficients: vector,
  intercept: z.number().finite(),
});

export function predictGameplayVector(values: (number | null)[], source: unknown = artifact) {
  const model = modelSchema.parse(source);
  if (model.schema_version !== GAMEPLAY_CONTRACT.schema_version
      || JSON.stringify(model.feature_names) !== JSON.stringify(FEATURE_NAMES)
      || values.length !== FEATURE_NAMES.length
      || values.some((value) => value !== null && (typeof value !== "number" || !Number.isFinite(value)))) {
    throw new Error("Incompatible gameplay feature contract");
  }
  const available = values.slice(20);
  if (available.some((value) => value !== 0 && value !== 1) || !available.includes(1)
      || available.some((value, game) => value === 0
        && values.slice(game * 4, game * 4 + 4).some((measurement) => measurement !== null))) {
    throw new Error("Invalid gameplay coverage");
  }
  const logit = values.reduce<number>((sum, value, index) => sum
    + ((value ?? model.imputer_medians[index]) - model.scaler_mean[index])
      / model.scaler_scale[index] * model.coefficients[index], model.intercept);
  if (!Number.isFinite(logit)) throw new Error("Invalid model output");
  const score = logit >= 0 ? 1 / (1 + Math.exp(-logit)) : Math.exp(logit) / (1 + Math.exp(logit));
  return {
    modelId: model.model_id,
    schemaVersion: model.schema_version,
    classification: score >= model.threshold ? "dyslexia" as const : "no_dyslexia" as const,
    confidence: score >= model.threshold ? score : 1 - score,
    score,
    threshold: model.threshold,
    missingFeatureCount: values.filter((value) => value === null).length,
  };
}
