import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

async function moduleUrl(path, replacements = {}) {
  let source = await readFile(new URL(path, import.meta.url), "utf8");
  for (const [from, to] of Object.entries(replacements)) source = source.replaceAll(`"${from}"`, JSON.stringify(to));
  const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
  return `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
}

const contractUrl = await moduleUrl("../lib/research/rello-contract.ts", { zod: import.meta.resolve("zod") });
const { RELLO_QUESTIONS, relloInputSchema } = await import(contractUrl);
const { createRelloHandlers } = await import(await moduleUrl("../lib/research/rello-route.ts", { "./rello-contract": contractUrl }));
const { forwardResearchRequest } = await import(await moduleUrl("../lib/research/service-client.ts", {
  "server-only": "data:text/javascript,export {};",
}));

function input() {
  return { schema_version: "rello-counts-v1", tasks: Object.fromEntries(RELLO_QUESTIONS.map((q) => [q, { clicks: 20, hits: 16, misses: 4 }])) };
}
function request(payload = input(), headers = {}) {
  return new Request("http://localhost:3000/api/research/rello", {
    method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(payload),
  });
}
function harness(overrides = {}) {
  const calls = [];
  const handlers = createRelloHandlers({
    enabled: () => true,
    authenticate: async () => ({ user: { id: "test-user" } }),
    forward: async (path, body) => { calls.push({ path, body }); return Response.json({ deliberately: "incompatible" }); },
    authError: () => Response.json({ ok: false, error: { code: "unauthorized", message: "Sign in required." } }, { status: 401 }),
    ...overrides,
  });
  return { ...handlers, calls };
}

test("disabled and signed-out requests never reach Python", async () => {
  for (const overrides of [{ enabled: () => false }, { authenticate: async () => { throw new Error("No session"); } }]) {
    const routes = harness(overrides);
    const expected = overrides.enabled ? 404 : 401;
    assert.equal((await routes.GET()).status, expected);
    assert.equal((await routes.POST(request())).status, expected);
    assert.deepEqual(routes.calls, []);
  }
});

test("rejects malformed, foreign, and oversized input before forwarding", async () => {
  const routes = harness();
  const invalid = [];
  for (const value of [-1, 1.5, "20", true, 1_000_001]) { const payload = input(); payload.tasks.Q1.clicks = value; invalid.push(payload); }
  const labeled = input(); labeled.Dyslexia = "Yes"; invalid.push(labeled);
  const opacity = input(); opacity.schema_version = "opacity-games-v1"; invalid.push(opacity);
  const missing = input(); delete missing.tasks.Q30; invalid.push(missing);
  const overflow = input(); overflow.tasks.Q1.hits = 21; invalid.push(overflow);
  const empty = input(); Object.values(empty.tasks).forEach((v) => Object.assign(v, { clicks: 0, hits: 0, misses: 0 })); invalid.push(empty);
  for (const payload of invalid) assert.equal((await routes.POST(request(payload))).status, 422);
  assert.equal((await routes.POST(request(input(), { origin: "https://other.example" }))).status, 403);
  assert.equal((await routes.POST(request(input(), { "content-type": "text/plain" }))).status, 415);
  assert.equal((await routes.POST(new Request("http://localhost:3000/api/research/rello", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" }))).status, 400);
  assert.equal((await routes.POST(request({ extra: "x".repeat(17000) }))).status, 413);
  assert.deepEqual(routes.calls, []);
});

test("missing counts are retained and never converted to zero", async () => {
  const payload = input(); payload.tasks.Q22 = { clicks: null, hits: null, misses: null };
  const routes = harness();
  await routes.POST(request(payload));
  assert.equal(routes.calls.length, 1);
  assert.deepEqual(routes.calls[0].body.tasks.Q22, payload.tasks.Q22);
  assert.equal(routes.calls[0].path, "/v1/research/rello/predict");
  assert.equal(relloInputSchema.safeParse(payload).success, true);
});

test("upstream failures and incompatible replies are safe and uncached", async () => {
  for (const forward of [
    async () => { throw new Error("secret should never reach browser"); },
    async () => new Response("Internal credential problem", { status: 401 }),
    async () => Response.json({ score: .5 }),
  ]) {
    const routes = harness({ forward });
    const response = await routes.POST(request());
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    const body = await response.text();
    assert.ok(!body.includes("secret") && !body.includes("credential problem"));
  }
  const rejected = harness({ forward: async () => new Response("Bad counts", { status: 422 }) });
  assert.equal((await rejected.POST(request())).status, 422);
});

test("server forwarding sends only the server key and refuses redirects", async () => {
  const savedFetch = globalThis.fetch;
  const savedUrl = process.env.ML_SERVICE_URL;
  const savedKey = process.env.ML_SERVICE_API_KEY;
  let options;
  try {
    process.env.ML_SERVICE_URL = "http://127.0.0.1:8000";
    process.env.ML_SERVICE_API_KEY = "test-service-key-not-for-deployment";
    globalThis.fetch = async (url, init) => { options = { url: url.toString(), ...init }; return Response.json({}); };
    await forwardResearchRequest("/v1/research/rello/predict", input());
    assert.equal(options.url, "http://127.0.0.1:8000/v1/research/rello/predict");
    assert.equal(options.headers["X-ML-API-Key"], process.env.ML_SERVICE_API_KEY);
    assert.equal(options.redirect, "error");
    assert.equal(options.cache, "no-store");
    process.env.ML_SERVICE_URL = "http://remote.example";
    await assert.rejects(() => forwardResearchRequest("/v1/research/rello/predict", input()));
  } finally {
    globalThis.fetch = savedFetch;
    if (savedUrl === undefined) delete process.env.ML_SERVICE_URL; else process.env.ML_SERVICE_URL = savedUrl;
    if (savedKey === undefined) delete process.env.ML_SERVICE_API_KEY; else process.env.ML_SERVICE_API_KEY = savedKey;
  }
});

test("Next handler forwards to the real fitted Python service", { skip: !process.env.ML_TEST_SERVICE_URL }, async () => {
  const forward = (path, body) => fetch(new URL(path, process.env.ML_TEST_SERVICE_URL), {
    method: body ? "POST" : "GET", headers: { "Content-Type": "application/json", "X-ML-API-Key": process.env.ML_TEST_SERVICE_KEY },
    body: body ? JSON.stringify(body) : undefined,
  });
  const routes = harness({ forward });
  const metadataResponse = await routes.GET();
  assert.equal(metadataResponse.status, 200);
  const metadata = (await metadataResponse.json()).data;
  for (const example of Object.values(metadata.examples)) {
    const response = await routes.POST(request(example));
    assert.equal(response.status, 200);
    const prediction = (await response.json()).data;
    const direct = await (await forward("/v1/research/rello/predict", example)).json();
    assert.deepEqual(prediction, direct);
    assert.equal(prediction.above_threshold, prediction.score >= metadata.threshold);
  }
});
