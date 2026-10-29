import "server-only";

// Local npm run dev works immediately. Hosted/production builds require an
// explicit opt-in; an explicit false also disables the local prototype.
export function gameplayPrototypeEnabled(env: Record<string, string | undefined> = process.env) {
  return env.OPACITY_GAMEPLAY_PROTOTYPE_ENABLED === "true"
    || (env.NODE_ENV === "development" && env.OPACITY_GAMEPLAY_PROTOTYPE_ENABLED === undefined);
}
