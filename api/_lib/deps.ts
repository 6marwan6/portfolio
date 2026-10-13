import { readEnv } from "./env";
import type { Deps } from "./handlers";
import { memoryStore, restStore } from "./store";

let shared: Deps | null = null;

/** Production dependencies, created once per server instance. */
export function defaultDeps(): Deps {
  if (shared) return shared;
  const env = readEnv();
  shared = {
    env,
    store: env.kvUrl && env.kvToken ? restStore(env.kvUrl, env.kvToken) : memoryStore(),
    fetch,
    now: Date.now,
    cache: new Map(),
    // Only abuse signals are logged: event names, never message content or personal data.
    log: (event) => console.warn(`[portfolio-api] ${event}`),
  };
  return shared;
}
