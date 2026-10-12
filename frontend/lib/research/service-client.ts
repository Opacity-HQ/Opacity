import "server-only";

// These variables are deliberately server-only, never NEXT_PUBLIC_*.
export async function forwardResearchRequest(path: string, body?: unknown) {
  const url = new URL(process.env.ML_SERVICE_URL ?? "");
  const key = process.env.ML_SERVICE_API_KEY;
  const local = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
  if ((!local && url.protocol !== "https:") || !["https:", "http:"].includes(url.protocol)
      || url.username || url.password || url.pathname !== "/" || url.search || url.hash
      || !key || key.length < 24) {
    throw new Error("Invalid ML service configuration");
  }
  return fetch(new URL(path, url), {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json", "X-ML-API-Key": key },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(10_000),
  });
}
