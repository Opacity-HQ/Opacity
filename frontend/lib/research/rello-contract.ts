import { z } from "zod";

export const RELLO_QUESTIONS = [
  ...Array.from({ length: 12 }, (_, i) => `Q${i + 1}`),
  "Q14", "Q15", "Q16", "Q17", "Q22", "Q23", "Q30",
] as const;
export const RELLO_SCHEMA_VERSION = "rello-counts-v1" as const;
const count = z.number().int().min(0).max(1_000_000).nullable();
const task = z.strictObject({ clicks: count, hits: count, misses: count }).superRefine((value, ctx) => {
  if (value.clicks !== null) {
    for (const field of ["hits", "misses"] as const) {
      if (value[field] !== null && value[field] > value.clicks) {
        ctx.addIssue({ code: "custom", path: [field], message: `${field} cannot exceed clicks` });
      }
    }
  }
});

export const relloInputSchema = z.strictObject({
  schema_version: z.literal(RELLO_SCHEMA_VERSION),
  tasks: z.record(z.string(), task),
}).superRefine((value, ctx) => {
  const keys = Object.keys(value.tasks);
  if (keys.length !== 19 || keys.some((key) => !RELLO_QUESTIONS.includes(key))) {
    ctx.addIssue({ code: "custom", path: ["tasks"], message: "Supply exactly the 19 Rello task keys; use null counts for missing tasks." });
  }
  if (!Object.values(value.tasks).some((t) => t.clicks !== null && t.clicks > 0 && t.hits !== null && t.misses !== null)) {
    ctx.addIssue({ code: "custom", path: ["tasks"], message: "At least one task needs complete counts with clicks greater than zero." });
  }
});

const identity = {
  model_id: z.literal("rello-rf-2026-10-09"),
  model_sha256: z.string().regex(/^[a-f0-9]{64}$/),
  schema_version: z.literal(RELLO_SCHEMA_VERSION),
  scope: z.literal("research_only"),
  threshold: z.number().gt(0).lt(1),
  feature_count: z.literal(42),
  warnings: z.array(z.string()).min(3),
};

export const relloPredictionSchema = z.strictObject({
  ...identity,
  score: z.number().min(0).max(1),
  above_threshold: z.boolean(),
  missing_feature_count: z.number().int().min(0).max(42),
  complete_task_count: z.number().int().min(1).max(19),
  active_task_count: z.number().int().min(1).max(19),
}).refine((v) => v.above_threshold === (v.score >= v.threshold), "Inconsistent cutoff result");

const evaluation = z.strictObject({
  n: z.number().int().positive(),
  roc_auc: z.number().min(0).max(1),
  sensitivity: z.number().min(0).max(1),
  specificity: z.number().min(0).max(1),
  precision: z.number().min(0).max(1),
});

export const relloMetadataSchema = z.strictObject({
  ...identity,
  questions: z.array(z.string()).length(19),
  examples: z.strictObject({ complete: relloInputSchema, partial: relloInputSchema }),
  evaluation: z.strictObject({ desktop_holdout: evaluation, tablet_external: evaluation }),
}).refine((v) => v.questions.every((q, i) => q === RELLO_QUESTIONS[i]), "Unexpected task order");

export type RelloInput = z.infer<typeof relloInputSchema>;
export type RelloPrediction = z.infer<typeof relloPredictionSchema>;
export type RelloMetadata = z.infer<typeof relloMetadataSchema>;
