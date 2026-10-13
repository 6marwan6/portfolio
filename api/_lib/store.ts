/** Counters for rate limits and the daily spend cap. Memory by default; Upstash/Vercel KV (REST) when configured. */
export interface Store {
  /** Adds `amount` to the counter (creating it with the given TTL) and returns the new value. */
  add(key: string, amount: number, ttlSec: number): Promise<number>;
  get(key: string): Promise<number>;
}

export function memoryStore(now: () => number = Date.now): Store {
  const data = new Map<string, { value: number; expires: number }>();
  const live = (key: string) => {
    const e = data.get(key);
    if (e && e.expires > now()) return e;
    data.delete(key);
    return undefined;
  };
  return {
    async add(key, amount, ttlSec) {
      const e = live(key);
      const value = (e?.value ?? 0) + amount;
      data.set(key, { value, expires: e?.expires ?? now() + ttlSec * 1000 });
      return value;
    },
    async get(key) {
      return live(key)?.value ?? 0;
    },
  };
}

export function restStore(url: string, token: string, fetchImpl: typeof fetch = fetch): Store {
  const call = async (command: (string | number)[]) => {
    const res = await fetchImpl(url, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(command) });
    if (!res.ok) throw new Error(`kv ${res.status}`);
    return ((await res.json()) as { result: unknown }).result;
  };
  return {
    async add(key, amount, ttlSec) {
      const value = Number(await call(["INCRBY", key, amount]));
      if (value === amount) await call(["EXPIRE", key, ttlSec]);
      return value;
    },
    async get(key) {
      const v = await call(["GET", key]);
      return v === null || v === undefined ? 0 : Number(v);
    },
  };
}
