import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const jsUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
async function moduleUrl(path, replacements = {}) {
  let source = await readFile(new URL(path, import.meta.url), "utf8");
  for (const [from, to] of Object.entries(replacements)) source = source.replaceAll(`"${from}"`, JSON.stringify(to));
  return jsUrl(ts.transpileModule(source, { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext,
  } }).outputText);
}
const artifact = JSON.parse(await readFile(new URL("../lib/gameplay/model.json", import.meta.url), "utf8"));
const contract = JSON.parse(await readFile(new URL("../lib/gameplay/contract.json", import.meta.url), "utf8"));
const featuresUrl = await moduleUrl("../lib/gameplay/features.ts", { "./contract.json": jsUrl(`export default ${JSON.stringify(contract)}`) });
const { extractGameplayFeatures, FEATURE_NAMES } = await import(featuresUrl);
const modelUrl = await moduleUrl("../lib/gameplay/model.ts", {
  "server-only": jsUrl("export {};"), zod: import.meta.resolve("zod"), "./features": featuresUrl,
  "./model.json": jsUrl(`export default ${JSON.stringify(artifact)}`),
});
const { predictGameplayVector } = await import(modelUrl);
const { createGameplayHandler } = await import(await moduleUrl("../lib/gameplay/route.ts", {
  zod: import.meta.resolve("zod"), "./features": featuresUrl, "./model": modelUrl,
}));
const { gameplayPrototypeEnabled } = await import(await moduleUrl("../lib/gameplay/config.ts", { "server-only": jsUrl("export {}; ") }));
const childId = "11111111-1111-4111-8111-111111111111";
const otherId = "22222222-2222-4222-8222-222222222222";
const now = Date.parse("2026-10-13T12:00:00Z");

function sessions({ accuracy = .98, meanRt = 500, cv = .12 } = {}) {
  return contract.games.map((game, i) => ({
    id: `session-${i}`, child_id: childId, game_id: game.id, status: "completed",
    started_at: "2026-10-13T10:00:00Z", completed_at: "2026-10-13T10:05:00Z", difficulty_level: 1,
    config: { version: 1, trials: Array.from({ length: 5 }, (_, index) => ({ index,
      ...(game.id === "memory-quest" ? {} : { isWarmup: index < 2 }) })) },
    session_scores: { accuracy, mean_rt_ms: meanRt, rt_cv: cv,
      raw_features: { version: game.score_version, [game.count_field]: game.id === "memory-quest" ? 5 : 3 } },
  }));
}
function features(rows = sessions()) { return extractGameplayFeatures(rows, childId, now); }
function request(query = `childId=${childId}`) { return new Request(`http://localhost/api/experimental/gameplay?${query}`); }
function handler(overrides = {}) {
  return createGameplayHandler({ enabled: () => true, now: () => now,
    loadAuthorizedSessions: async () => sessions(),
    errorResponse: (error) => Response.json({ ok: false, error: { code: error.code ?? "internal_error" } }, { status: error.status ?? 500 }),
    ...overrides });
}

test("Python sklearn and TypeScript inference agree, including missing timing", async () => {
  const fixtures = JSON.parse(await readFile(new URL("./gameplay-parity.json", import.meta.url), "utf8"));
  const classes = new Set();
  for (const fixture of fixtures) {
    const prediction = predictGameplayVector(fixture.features);
    assert.ok(Math.abs(prediction.score - fixture.score) < 1e-12);
    classes.add(prediction.classification);
  }
  assert.equal(classes.size, 2);
  assert.ok(fixtures.some((fixture) => fixture.features.includes(null)));
});

test("five complete sessions produce 20 measurements plus five availability flags", () => {
  const result = features();
  assert.equal(result.values.length, 25);
  assert.equal(FEATURE_NAMES.length, 25);
  assert.deepEqual(result.values.slice(20), [1, 1, 1, 1, 1]);
  assert.ok(result.games.every((game) => game.ready));
  assert.deepEqual(result.values.slice(0, 4), [.98, Math.log1p(500), .12, 1]);
});

test("actual saved score changes can drive both simulated classes", () => {
  assert.equal(predictGameplayVector(features().values).classification, "no_dyslexia");
  assert.equal(predictGameplayVector(features(sessions({ accuracy: .2, meanRt: 12000, cv: 1 })).values).classification, "dyslexia");
});

test("missing games stay missing; other children cannot fill gaps", () => {
  const rows = sessions();
  rows[0].child_id = otherId;
  const result = features(rows);
  assert.deepEqual(result.values.slice(0, 4), [null, null, null, null]);
  assert.equal(result.values[20], 0);
  assert.equal(result.games[0].ready, false);
  assert.equal(result.games.filter((game) => game.ready).length, 4);
});

test("partial, empty, duplicate-plan, in-progress and old-version sessions are excluded", () => {
  const mutations = [
    (row) => { row.session_scores.raw_features.trialsScored = 2; },
    (row) => { row.session_scores.raw_features.trialsScored = 0; },
    (row) => { row.config.trials = []; },
    (row) => { row.config.trials[1].index = 0; },
    (row) => { row.status = "in_progress"; },
    (row) => { row.session_scores.raw_features.version = 1; },
    (row) => { row.config.version = 99; },
    (row) => { row.session_scores = null; },
  ];
  for (const mutate of mutations) { const rows = sessions(); mutate(rows[0]); assert.equal(features([rows[0]]).values, null); }
});

test("missing timings remain missing; zero accuracy remains a valid observed result", () => {
  const rows = sessions();
  rows[0].session_scores.accuracy = 0;
  rows[0].session_scores.mean_rt_ms = null;
  rows[0].session_scores.rt_cv = null;
  const result = features(rows);
  assert.deepEqual(result.values.slice(0, 4), [0, null, null, 1]);
  assert.equal(predictGameplayVector(result.values).missingFeatureCount, 2);
});

test("malformed scores and unsupported difficulties block prediction", () => {
  for (const value of [NaN, Infinity, -1, 1.01, null, ".8"]) {
    const rows = sessions(); rows[0].session_scores.accuracy = value;
    assert.equal(features([rows[0]]).values, null);
  }
  for (const value of [-1, Infinity, "100"]) {
    const rows = sessions(); rows[0].session_scores.mean_rt_ms = value;
    assert.equal(features([rows[0]]).values, null);
  }
  const rows = sessions(); rows[0].difficulty_level = 5;
  assert.equal(features([rows[0]]).values, null);
  rows[0].difficulty_level = 4; rows[3].difficulty_level = 20;
  assert.ok(features(rows).values);
});

test("latest completed session is used deterministically, even when incomplete", () => {
  const rows = sessions();
  const latest = structuredClone(rows[0]); latest.id = "latest"; latest.completed_at = "2026-10-13T11:00:00Z";
  latest.session_scores.accuracy = .3;
  assert.equal(features([...rows, latest]).values[0], .3);
  assert.equal(features([latest, ...rows]).values[0], .3);
  latest.session_scores.raw_features.trialsScored = 1;
  assert.deepEqual(features([...rows, latest]).values.slice(0, 4), [null, null, null, null]);
  assert.equal(features([...rows, latest]).games[0].sessionId, "latest");
});

test("stale, future and invalid timestamps cannot produce a classification", () => {
  for (const [start, end] of [["2026-10-01", "2026-10-02"], ["2026-10-13", "2026-10-14"],
    ["bad", "2026-10-13"], ["2026-10-13", "2026-10-12"], ["2026-10-13", "bad"]]) {
    const rows = sessions(); rows[0].started_at = start; rows[0].completed_at = end;
    assert.equal(features([rows[0]]).values, null);
  }
});

test("model rejects incompatible feature order, invalid weights and wrong training provenance", () => {
  for (const mutate of [
    (model) => model.feature_names.reverse(),
    (model) => { model.scaler_scale[0] = 0; },
    (model) => { model.coefficients[0] = Infinity; },
    (model) => { model.training_source = "real"; },
    (model) => { model.schema_version = "rello-counts-v1"; },
  ]) {
    const modified = structuredClone(artifact); mutate(modified);
    assert.throws(() => predictGameplayVector(features().values, modified));
  }
  assert.throws(() => predictGameplayVector([1]));
});

test("prototype defaults on only in development and honors explicit disable", () => {
  assert.equal(gameplayPrototypeEnabled({ NODE_ENV: "development" }), true);
  assert.equal(gameplayPrototypeEnabled({ NODE_ENV: "production" }), false);
  assert.equal(gameplayPrototypeEnabled({ NODE_ENV: "development", OPACITY_GAMEPLAY_PROTOTYPE_ENABLED: "false" }), false);
  assert.equal(gameplayPrototypeEnabled({ NODE_ENV: "production", OPACITY_GAMEPLAY_PROTOTYPE_ENABLED: "true" }), true);
});

test("disabled route and malformed requests do not query data", async () => {
  const loadAuthorizedSessions = async () => { assert.fail("Must not load data"); };
  assert.equal((await handler({ enabled: () => false, loadAuthorizedSessions })(request())).status, 404);
  for (const query of ["", "childId=bad", `childId=${childId}&score=1`, `childId=${childId}&childId=${otherId}`]) {
    assert.equal((await handler({ loadAuthorizedSessions })(request(query))).status, 400);
  }
});

test("authorization and database errors never become successful scores", async () => {
  for (const status of [401, 403, 500]) {
    const response = await handler({ loadAuthorizedSessions: async () => { throw { status }; } })(request());
    assert.equal(response.status, status);
    assert.equal(response.headers.get("Cache-Control"), "private, no-store");
    assert.equal((await response.json()).ok, false);
  }
});

test("authorized endpoint returns simulated classification and exact source session IDs", async () => {
  let access;
  const response = await handler({ loadAuthorizedSessions: async (...args) => { access = args; return sessions(); } })(request());
  assert.deepEqual(access, [childId, "2026-10-06T12:00:00.000Z"]);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  const { data } = await response.json();
  assert.equal(data.status, "ready");
  assert.equal(data.simulated, true);
  assert.equal(data.trainingSource, "synthetic");
  assert.equal(data.classification, "no_dyslexia");
  assert.deepEqual(data.sessionsIncluded, sessions().map((row) => row.id));
});

test("no completed games returns progress without any score or classification", async () => {
  const response = await handler({ loadAuthorizedSessions: async () => [] })(request());
  const { data } = await response.json();
  assert.equal(data.status, "needs_games");
  assert.equal("classification" in data, false);
  assert.equal("score" in data, false);
});

test("each individual game can return a provisional classification with selected-class confidence", async () => {
  for (const row of sessions()) {
    const response = await handler({ loadAuthorizedSessions: async () => [row] })(request());
    const { data } = await response.json();
    assert.equal(data.status, "ready");
    assert.equal(data.sessionsIncluded.length, 1);
    assert.deepEqual(data.sessionsIncluded, [row.id]);
    assert.equal(data.games.filter((game) => game.ready).length, 1);
    assert.ok(data.confidence >= .5 && data.confidence <= 1);
    assert.equal(data.confidence, data.classification === "dyslexia" ? data.score : 1 - data.score);
  }
});

test("completion result must include the just-finished session, never a cached previous one", async () => {
  const sessionId = "33333333-3333-4333-8333-333333333333";
  const query = `childId=${childId}&sessionId=${sessionId}`;
  const before = (await (await handler()(request(query))).json()).data;
  assert.equal(before.status, "needs_games");
  assert.equal(before.pendingSession, true);
  assert.equal("confidence" in before, false);
  const row = sessions()[0]; row.id = sessionId;
  const after = (await (await handler({ loadAuthorizedSessions: async () => [row] })(request(query))).json()).data;
  assert.equal(after.status, "ready");
  assert.equal(after.pendingSession, false);
  assert.deepEqual(after.sessionsIncluded, [sessionId]);
});

test("actual Next route checks child access before querying and scopes every database read", async () => {
  const calls = [];
  const rows = sessions();
  globalThis.__gameplayTest = {
    requireChildAccess: async (id) => {
      calls.push(["authorize", id]);
      if (id !== childId) throw { status: 403 };
      return { supabase: { from: (table) => {
        calls.push(["from", table]);
        const filters = {};
        const query = {
          select: () => query,
          eq: (key, value) => { filters[key] = value; return query; },
          gte: (key, value) => { filters[key] = value; return query; },
          order: () => query,
          limit: async (limit) => { calls.push(["query", filters, limit]); return { data: rows.filter((r) => r.game_id === filters.game_id), error: null }; },
        };
        return query;
      } } };
    },
  };
  const authUrl = jsUrl("export const requireChildAccess = (...args) => globalThis.__gameplayTest.requireChildAccess(...args);");
  const routeHelper = await moduleUrl("../lib/gameplay/route.ts", { zod: import.meta.resolve("zod"), "./features": featuresUrl, "./model": modelUrl });
  const endpointUrl = await moduleUrl("../app/api/experimental/gameplay/route.ts", {
    "@/lib/api/auth": authUrl,
    "@/lib/api/response": jsUrl("export class ApiRouteError extends Error {} export const toApiErrorResponse = e => Response.json({ok:false},{status:e.status ?? 500});"),
    "@/lib/gameplay/config": jsUrl("export const gameplayPrototypeEnabled=()=>true;"),
    "@/lib/gameplay/features": featuresUrl, "@/lib/gameplay/route": routeHelper,
  });
  try {
    const { GET } = await import(endpointUrl);
    assert.equal((await GET(request(`childId=${otherId}`))).status, 403);
    assert.deepEqual(calls, [["authorize", otherId]]);
    calls.length = 0;
    assert.equal((await GET(request())).status, 200);
    assert.deepEqual(calls[0], ["authorize", childId]);
    const queries = calls.filter((call) => call[0] === "query");
    assert.equal(queries.length, 5);
    for (const [, filters, limit] of queries) {
      assert.equal(filters.child_id, childId);
      assert.equal(filters.status, "completed");
      assert.ok(contract.games.some((game) => game.id === filters.game_id));
      assert.ok(filters.completed_at);
      assert.equal(limit, 1);
    }
  } finally { delete globalThis.__gameplayTest; }
});
