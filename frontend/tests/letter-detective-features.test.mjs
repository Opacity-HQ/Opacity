import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";

// Use the installed TypeScript compiler so tests work with supported Node 20.9+.
const source = readFileSync(
  new URL("../app/api/games/letter-detective/feature-statistics.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext },
});
const { confusionErrorRates } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

test("mirror feature distinguishes mirror errors from other visual confusion", () => {
  const result = confusionErrorRates([
    null, "mirror", "rotation", "visual_similar", "timeout", null,
  ]);
  assert.equal(result.mirrorErrorRate, 1 / 6);
  assert.equal(result.confusionErrorRate, 3 / 6);
});

test("no observed trials stays distinct from a completed error-free sitting", () => {
  assert.deepEqual(confusionErrorRates([]), {
    mirrorErrorRate: null, confusionErrorRate: null,
  });
  assert.deepEqual(confusionErrorRates([null, null]), {
    mirrorErrorRate: 0, confusionErrorRate: 0,
  });
});
