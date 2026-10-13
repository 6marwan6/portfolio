import type { Store } from "./store";

export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  const first = fwd?.split(",")[0]?.trim();
  return first || request.headers.get("x-real-ip") || "unknown";
}

/** Fixed-window per-IP rate limit. */
export async function checkRate(store: Store, ip: string, limit: number, windowSec = 60, now = Date.now()): Promise<{ ok: boolean; retryAfter: number }> {
  const window = Math.floor(now / 1000 / windowSec);
  const count = await store.add(`rate:${ip}:${window}`, 1, windowSec + 5);
  const retryAfter = windowSec - (Math.floor(now / 1000) % windowSec);
  return { ok: count <= limit, retryAfter };
}

const day = (now: number) => new Date(now).toISOString().slice(0, 10);
const MICRO = 1_000_000;

/** Daily spend cap in micro-USD. Meters real tokens when prices are configured, otherwise by request. */
export async function isUnderCap(store: Store, capUsd: number, now = Date.now()): Promise<boolean> {
  return (await store.get(`spend:${day(now)}`)) < capUsd * MICRO;
}

export async function recordSpend(
  store: Store,
  cfg: { priceInPerMTok?: number; priceOutPerMTok?: number; estCostPerRequestUsd: number },
  usage: { inputTokens: number; outputTokens: number } | undefined,
  now = Date.now(),
): Promise<void> {
  let usd = cfg.estCostPerRequestUsd;
  if (usage && cfg.priceInPerMTok !== undefined && cfg.priceOutPerMTok !== undefined && Number.isFinite(cfg.priceInPerMTok) && Number.isFinite(cfg.priceOutPerMTok)) {
    usd = (usage.inputTokens * cfg.priceInPerMTok + usage.outputTokens * cfg.priceOutPerMTok) / 1_000_000;
  }
  await store.add(`spend:${day(now)}`, Math.max(1, Math.round(usd * MICRO)), 60 * 60 * 36);
}
