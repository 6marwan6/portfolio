/** Server configuration. Everything comes from environment variables; nothing secret is ever sent to the browser. */
export interface ApiEnv {
  /** Key for the OpenAI-compatible provider (Groq by default). */
  llmApiKey: string;
  /** Base URL of the OpenAI-compatible API. */
  llmBaseUrl: string;
  agentModel: string;
  recruiterModel: string;
  /** Daily spend ceiling in USD. */
  dailySpendCapUsd: number;
  /** Used when real prices are not configured: assumed cost of one request in USD. */
  estCostPerRequestUsd: number;
  /** Optional real prices per million tokens, in USD. Set both to meter real usage; leave unset to meter by request. */
  priceInPerMTok?: number;
  priceOutPerMTok?: number;
  rateLimitPerMin: number;
  kvUrl?: string;
  kvToken?: string;
}

const num = (v: string | undefined, d: number) => {
  const n = v === undefined || v === "" ? NaN : Number(v);
  return Number.isFinite(n) && n >= 0 ? n : d;
};

export function readEnv(source: Record<string, string | undefined> = process.env): ApiEnv {
  return {
    llmApiKey: source.LLM_API_KEY || source.GROQ_API_KEY || "",
    llmBaseUrl: (source.LLM_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/+$/, ""),
    // Qwen 3.8 27B on Groq (a preview model: check the Groq models page, since preview models can change or be retired).
    agentModel: source.AGENT_MODEL || "qwen/qwen3.8-27b",
    recruiterModel: source.RECRUITER_MODEL || "qwen/qwen3.8-27b",
    dailySpendCapUsd: num(source.DAILY_SPEND_CAP_USD, 2),
    estCostPerRequestUsd: num(source.EST_COST_PER_REQUEST_USD, 0.002),
    priceInPerMTok: source.PRICE_IN_PER_MTOK ? num(source.PRICE_IN_PER_MTOK, NaN) : undefined,
    priceOutPerMTok: source.PRICE_OUT_PER_MTOK ? num(source.PRICE_OUT_PER_MTOK, NaN) : undefined,
    rateLimitPerMin: Math.max(1, Math.floor(num(source.RATE_LIMIT_PER_IP_PER_MIN, 8))),
    kvUrl: source.KV_REST_API_URL || source.KV_URL || undefined,
    kvToken: source.KV_REST_API_TOKEN || source.KV_TOKEN || undefined,
  };
}
