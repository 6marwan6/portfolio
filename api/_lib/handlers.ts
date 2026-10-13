import { projects } from "../../src/content";
import { chapters } from "../../src/scene/chapters";
import { agentSystem, recruiterSystem } from "./prompt";
import { completeChat, streamChat, type Usage } from "./llm";
import type { ApiEnv } from "./env";
import { checkRate, clientIp, isUnderCap, recordSpend } from "./limits";
import { extractJson, keywordFallback, sanitizeRecruiter } from "./recruiter";
import type { Store } from "./store";
import { TOOL_DEFS, validateToolCall } from "./tools";

export interface Deps {
  env: ApiEnv;
  store: Store;
  fetch: typeof fetch;
  now: () => number;
  /** Small response cache for repeated first questions. */
  cache: Map<string, { text: string; expires: number }>;
  log: (event: string) => void;
}

const MAX_BODY = 24_000;
const MAX_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 2000;
const MAX_TOTAL_CHARS = 12_000;
const MAX_JD = 8000;
const CACHE_TTL_MS = 10 * 60 * 1000;

const json = (status: number, body: unknown, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store", ...extra } });

async function readJson(request: Request): Promise<{ ok: true; body: any } | { ok: false; response: Response }> {
  if (request.method !== "POST") return { ok: false, response: json(405, { error: "method_not_allowed" }, { allow: "POST" }) };
  if (!(request.headers.get("content-type") ?? "").includes("application/json")) return { ok: false, response: json(415, { error: "unsupported_media_type" }) };
  const text = await request.text();
  if (text.length > MAX_BODY) return { ok: false, response: json(413, { error: "too_large" }) };
  try {
    return { ok: true, body: JSON.parse(text) };
  } catch {
    return { ok: false, response: json(400, { error: "invalid_json" }) };
  }
}

/** Shared gate: rate limit, daily cap, and a configured key. Returns a response to send, or null to continue. */
async function gate(request: Request, deps: Deps): Promise<Response | null> {
  if (!deps.env.llmApiKey) return json(503, { error: "not_configured", message: "The AI is not configured yet." });
  const rate = await checkRate(deps.store, clientIp(request), deps.env.rateLimitPerMin, 60, deps.now());
  if (!rate.ok) {
    deps.log("rate_limited");
    return json(429, { error: "rate_limited", message: "Too many requests. Please wait a moment.", retryAfter: rate.retryAfter }, { "retry-after": String(rate.retryAfter) });
  }
  if (!(await isUnderCap(deps.store, deps.env.dailySpendCapUsd, deps.now()))) {
    deps.log("cap_reached");
    return json(503, { error: "resting", message: "The AI is resting for today. The rest of the site works as usual." });
  }
  return null;
}

const sse = (event: string, data: unknown) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

export async function handleAgent(request: Request, deps: Deps): Promise<Response> {
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const b = parsed.body as { messages?: unknown; lang?: unknown; context?: { stationId?: unknown } };
  const lang: "en" | "ar" = b.lang === "ar" ? "ar" : "en";
  const messages = Array.isArray(b.messages) ? b.messages : [];
  const clean: { role: "user" | "assistant"; content: string }[] = [];
  let total = 0;
  for (const m of messages) {
    const role = (m as any)?.role;
    const content = (m as any)?.content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string" || !content.trim() || content.length > MAX_MESSAGE_CHARS) {
      deps.log("invalid_input");
      return json(400, { error: "invalid_messages" });
    }
    total += content.length;
    clean.push({ role, content: content.trim() });
  }
  if (clean.length === 0 || clean.length > MAX_MESSAGES || total > MAX_TOTAL_CHARS || clean[clean.length - 1]!.role !== "user" || clean[0]!.role !== "user") {
    deps.log("invalid_input");
    return json(400, { error: "invalid_messages" });
  }
  const gated = await gate(request, deps);
  if (gated) return gated;

  const cacheKey = clean.length === 1 ? `${lang}:${normalize(clean[0]!.content)}` : null;
  const hit = cacheKey ? deps.cache.get(cacheKey) : undefined;
  if (hit && hit.expires > deps.now()) {
    return new Response(sse("text", { delta: hit.text }) + sse("done", {}), { headers: { "content-type": "text/event-stream", "cache-control": "no-store" } });
  }

  const stationId = typeof b.context?.stationId === "string" && chapters.some((c) => c.id === b.context!.stationId) ? (b.context!.stationId as string) : undefined;
  const system = agentSystem(lang, stationId);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => controller.enqueue(encoder.encode(sse(event, data)));
      let usage: Usage | undefined;
      let text = "";
      let usedTools = false;
      try {
        for await (const ev of streamChat(deps.env, { model: deps.env.agentModel, max_tokens: 700, messages: [{ role: "system", content: system }, ...clean], tools: TOOL_DEFS, reasoningEffort: "none" }, deps.fetch)) {
          if (ev.type === "text") {
            text += ev.delta;
            send("text", { delta: ev.delta });
          } else if (ev.type === "tool") {
            const call = validateToolCall(ev.name, ev.input);
            if (call) {
              usedTools = true;
              send("tool", call);
            } else deps.log("tool_rejected");
          } else if (ev.type === "usage") usage = ev.usage;
          else if (ev.type === "error") {
            send("error", { error: "agent_unavailable", message: "The AI is unavailable right now. The rest of the site works as usual." });
            break;
          }
        }
        if (cacheKey && text && !usedTools) deps.cache.set(cacheKey, { text, expires: deps.now() + CACHE_TTL_MS });
        send("done", {});
      } catch {
        send("error", { error: "agent_unavailable", message: "The AI is unavailable right now. The rest of the site works as usual." });
      } finally {
        await recordSpend(deps.store, deps.env, usage, deps.now()).catch(() => undefined);
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "content-type": "text/event-stream", "cache-control": "no-store" } });
}

export async function handleRecruiter(request: Request, deps: Deps): Promise<Response> {
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const b = parsed.body as { jobDescription?: unknown; lang?: unknown };
  const lang: "en" | "ar" = b.lang === "ar" ? "ar" : "en";
  const jd = typeof b.jobDescription === "string" ? b.jobDescription.trim() : "";
  if (!jd || jd.length > MAX_JD) {
    deps.log("invalid_input");
    return json(400, { error: "invalid_job_description" });
  }
  const gated = await gate(request, deps);
  if (gated) {
    // Recruiter mode still works without the AI: fall back to keyword matching instead of failing.
    const status = gated.status;
    if (status === 503) return json(200, keywordFallback(jd, lang));
    return gated;
  }
  const out = await completeChat(
    deps.env,
    {
      model: deps.env.recruiterModel,
      max_tokens: 1500,
      messages: [
        { role: "system", content: recruiterSystem(lang) },
        { role: "user", content: `<job_description>\n${jd}\n</job_description>\nReturn the JSON object now.` },
      ],
      reasoningEffort: "none",
      json: true,
    },
    deps.fetch,
  ).catch(() => ({ error: "network" }) as { error: string });
  if ("error" in out) return json(200, keywordFallback(jd, lang));
  await recordSpend(deps.store, deps.env, out.usage, deps.now()).catch(() => undefined);
  const result = sanitizeRecruiter(extractJson(out.text));
  return json(200, result ?? keywordFallback(jd, lang));
}

export function knownProjectIds(): string[] {
  return projects.map((p) => p.id);
}
