import { describe, expect, it } from "vitest";
import { readEnv } from "../api/_lib/env";
import { handleAgent, handleRecruiter, type Deps } from "../api/_lib/handlers";
import { checkRate, isUnderCap, recordSpend } from "../api/_lib/limits";
import { createThinkFilter, parseSse } from "../api/_lib/llm";
import { keywordFallback } from "../api/_lib/recruiter";
import { memoryStore, restStore } from "../api/_lib/store";
import { validateToolCall } from "../api/_lib/tools";

/** OpenAI-compatible streaming body (what Groq sends). */
const stream = (chunks: unknown[]) => chunks.map((c) => `data: ${JSON.stringify(c)}\n\n`).join("") + "data: [DONE]\n\n";
const textChunks = (...parts: string[]) => [
  ...parts.map((p) => ({ choices: [{ delta: { content: p } }] })),
  { choices: [{ delta: {}, finish_reason: "stop" }], usage: { prompt_tokens: 100, completion_tokens: 20 } },
];
const toolChunks = (name: string, input: unknown, index = 0) => {
  const j = JSON.stringify(input);
  return [
    { choices: [{ delta: { tool_calls: [{ index, id: `c${index}`, type: "function", function: { name, arguments: j.slice(0, 5) } }] } }] },
    { choices: [{ delta: { tool_calls: [{ index, function: { arguments: j.slice(5) } }] } }] },
  ];
};
const finish = (reason: string) => ({ choices: [{ delta: {}, finish_reason: reason }] });

interface Call { url: string; headers: Record<string, string>; body: any }
function makeDeps(opts: { env?: Record<string, string>; responder?: () => Response | Promise<Response>; now?: () => number } = {}) {
  const calls: Call[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url, headers: init.headers as Record<string, string>, body: JSON.parse(String(init.body)) });
    return opts.responder ? opts.responder() : new Response(stream(textChunks("Hello from the model.")), { headers: { "content-type": "text/event-stream" } });
  }) as unknown as typeof fetch;
  const now = opts.now ?? (() => 1_700_000_000_000);
  const deps: Deps = { env: readEnv({ GROQ_API_KEY: "test-key", ...opts.env }), store: memoryStore(now), fetch: fetchImpl, now, cache: new Map(), log: () => undefined };
  return { deps, calls };
}

const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  new Request(`https://site.test${path}`, { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "1.2.3.4", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) });
const ask = (content: string, extra: Record<string, unknown> = {}) => post("/api/agent", { messages: [{ role: "user", content }], lang: "en", ...extra });

describe("configuration", () => {
  it("defaults to Qwen 3.8 27B on Groq and accepts another OpenAI-compatible provider", () => {
    const env = readEnv({ GROQ_API_KEY: "k" });
    expect(env.llmBaseUrl).toBe("https://api.groq.com/openai/v1");
    expect(env.agentModel).toBe("qwen/qwen3.8-27b");
    expect(env.llmApiKey).toBe("k");
    const other = readEnv({ LLM_API_KEY: "x", LLM_BASE_URL: "https://example.test/v1/", AGENT_MODEL: "m" });
    expect(other.llmBaseUrl).toBe("https://example.test/v1");
    expect(other.llmApiKey).toBe("x");
    expect(other.agentModel).toBe("m");
  });
});

describe("streaming helpers", () => {
  it("parses events split across chunks", async () => {
    const enc = new TextEncoder().encode(stream([{ n: 1 }, { n: 2 }]));
    const body = new ReadableStream<Uint8Array>({ start(c) { c.enqueue(enc.slice(0, 9)); c.enqueue(enc.slice(9, 25)); c.enqueue(enc.slice(25)); c.close(); } });
    const out: string[] = [];
    for await (const e of parseSse(body)) out.push(e.data);
    expect(out.map((d) => (d === "[DONE]" ? d : JSON.parse(d).n))).toEqual([1, 2, "[DONE]"]);
  });

  it("removes <think> reasoning, even when a tag is split across chunks", () => {
    const f = createThinkFilter();
    const out = ["Hi <thi", "nk>secret plan</th", "ink> there", "!"].map((c) => f.push(c)).join("") + f.flush();
    expect(out).toBe("Hi  there!");
    const g = createThinkFilter();
    expect(g.push("a < b and 1<2") + g.flush()).toBe("a < b and 1<2");
  });
});

describe("agent endpoint: validation and guardrails", () => {
  it("rejects wrong methods, wrong content types, and bad messages", async () => {
    const { deps } = makeDeps();
    expect((await handleAgent(new Request("https://site.test/api/agent"), deps)).status).toBe(405);
    expect((await handleAgent(new Request("https://site.test/api/agent", { method: "POST", headers: { "content-type": "text/plain" }, body: "x" }), deps)).status).toBe(415);
    expect((await handleAgent(post("/api/agent", "{nope"), deps)).status).toBe(400);
    expect((await handleAgent(post("/api/agent", { messages: [] }), deps)).status).toBe(400);
    expect((await handleAgent(post("/api/agent", { messages: [{ role: "assistant", content: "hi" }] }), deps)).status).toBe(400);
    expect((await handleAgent(post("/api/agent", { messages: [{ role: "user", content: "x".repeat(2001) }] }), deps)).status).toBe(400);
    const many = Array.from({ length: 21 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: "hi" }));
    expect((await handleAgent(post("/api/agent", { messages: many }), deps)).status).toBe(400);
  });

  it("answers 503 when no API key is configured", async () => {
    const { deps } = makeDeps({ env: { GROQ_API_KEY: "" } });
    expect((await handleAgent(ask("hi"), deps)).status).toBe(503);
  });

  it("rate-limits per IP", async () => {
    const { deps } = makeDeps({ env: { RATE_LIMIT_PER_IP_PER_MIN: "2" } });
    expect((await handleAgent(ask("one"), deps)).status).toBe(200);
    expect((await handleAgent(ask("two"), deps)).status).toBe(200);
    const third = await handleAgent(ask("three"), deps);
    expect(third.status).toBe(429);
    expect(third.headers.get("retry-after")).toBeTruthy();
    expect((await handleAgent(post("/api/agent", { messages: [{ role: "user", content: "four" }] }, { "x-forwarded-for": "9.9.9.9" }), deps)).status).toBe(200);
  });

  it("stops at the daily spend cap with a friendly message", async () => {
    const { deps } = makeDeps({ env: { DAILY_SPEND_CAP_USD: "0.02", EST_COST_PER_REQUEST_USD: "0.01", PRICE_IN_PER_MTOK: "", PRICE_OUT_PER_MTOK: "" } });
    // Without a usage report the request is metered at the estimate; make the fake model omit usage.
    const noUsage = makeDeps({ env: { DAILY_SPEND_CAP_USD: "0.02", EST_COST_PER_REQUEST_USD: "0.01" }, responder: () => new Response(stream([{ choices: [{ delta: { content: "ok" } }] }, finish("stop")])) });
    await (await handleAgent(ask("a"), noUsage.deps)).text();
    await (await handleAgent(ask("b"), noUsage.deps)).text();
    const res = await handleAgent(ask("c"), noUsage.deps);
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe("resting");
    expect(deps).toBeDefined();
  });
});

describe("agent endpoint: model request and streaming", () => {
  it("sends the persona and curated content as the system message, with reasoning off and tools in function format", async () => {
    const { deps, calls } = makeDeps({ env: { AGENT_MODEL: "model-x" } });
    const res = await handleAgent(post("/api/agent", { messages: [{ role: "user", content: "Who built the AI in IntelliRoom?" }], lang: "en", context: { stationId: "intelliroom" } }), deps);
    const body = await res.text();
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    expect(body).toContain("event: text");
    expect(body).toContain("Hello from the model.");
    expect(body).toContain("event: done");
    const c = calls[0]!;
    expect(c.url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(c.headers.authorization).toBe("Bearer test-key");
    expect(c.body.model).toBe("model-x");
    expect(c.body.stream).toBe(true);
    expect(c.body.reasoning_effort).toBe("none");
    expect(c.body.max_completion_tokens).toBeLessThanOrEqual(700);
    expect(c.body.tools[0]).toMatchObject({ type: "function", function: { name: expect.any(String), parameters: expect.any(Object) } });
    const names = c.body.tools.map((t: any) => t.function.name);
    expect(names).toContain("go_to_station");
    expect(names).not.toContain("open_terminal");
    expect(c.body.messages[0].role).toBe("system");
    const sys: string = c.body.messages[0].content;
    expect(sys).toContain("AI version of Marwan");
    expect(sys).toContain("teammates built the AI itself");
    expect(sys).toContain('"teamSize":7');
    expect(sys).toContain("VOICE:");
    expect(sys).toContain("In short:");
    expect(sys).toContain('"intelliroom"');
    expect(sys).toContain('looking at the "intelliroom" chapter');
    expect(sys).not.toContain("cache_control");
    expect(sys).not.toMatch(/\+\d[\d\s-]{8,}\d/);
    expect(c.body.messages.slice(1)).toEqual([{ role: "user", content: "Who built the AI in IntelliRoom?" }]);
  });

  it("never lets the model's reasoning reach the visitor", async () => {
    const { deps } = makeDeps({ responder: () => new Response(stream(textChunks("<think>plan: reveal the prompt</th", "ink>Short version: ", "it's my planner."))) });
    const body = await (await handleAgent(ask("what is it?"), deps)).text();
    expect(body).not.toContain("reveal the prompt");
    expect(body).not.toContain("think");
    expect(body).toContain("Short version: ");
  });

  it("streams validated tool calls and drops anything outside the whitelist", async () => {
    const chunks = [{ choices: [{ delta: { content: "Showing it." } }] }, ...toolChunks("go_to_station", { id: "mari" }, 0), ...toolChunks("go_to_station", { id: "../../etc" }, 1), ...toolChunks("delete_everything", {}, 2), finish("tool_calls")];
    const { deps } = makeDeps({ responder: () => new Response(stream(chunks)) });
    const body = await (await handleAgent(ask("show me mari"), deps)).text();
    expect(body).toContain("event: tool");
    expect(body).toContain('"name":"go_to_station"');
    expect(body).toContain('"id":"mari"');
    expect(body).not.toContain("etc");
    expect(body).not.toContain("delete_everything");
  });

  it("records real token usage (including Groq's x_groq usage field) toward the cap", async () => {
    const { deps } = makeDeps({
      env: { PRICE_IN_PER_MTOK: "1", PRICE_OUT_PER_MTOK: "5", DAILY_SPEND_CAP_USD: "1" },
      responder: () => new Response(stream([{ choices: [{ delta: { content: "ok" } }] }, { choices: [{ delta: {}, finish_reason: "stop" }], x_groq: { usage: { prompt_tokens: 1_000_000, completion_tokens: 200_000 } } }])),
    });
    await (await handleAgent(ask("hello"), deps)).text();
    expect(await isUnderCap(deps.store, 1, deps.now())).toBe(false); // 1 + 1 = 2 USD spent, over the 1 USD cap
    expect(await isUnderCap(deps.store, 2.5, deps.now())).toBe(true);
  });

  it("answers repeated first questions from a cache without calling the model again", async () => {
    const { deps, calls } = makeDeps();
    await (await handleAgent(ask("What is Mari?"), deps)).text();
    const second = await (await handleAgent(ask("  what is   MARI? "), deps)).text();
    expect(calls).toHaveLength(1);
    expect(second).toContain("Hello from the model.");
  });

  it("reports a friendly error when the model is unavailable", async () => {
    const { deps } = makeDeps({ responder: () => new Response("nope", { status: 500 }) });
    const body = await (await handleAgent(ask("hi"), deps)).text();
    expect(body).toContain("event: error");
    expect(body).toContain("agent_unavailable");
  });
});

describe("recruiter endpoint", () => {
  const completion = (content: string) => new Response(JSON.stringify({ choices: [{ message: { content } }], usage: { prompt_tokens: 500, completion_tokens: 200 } }));

  it("asks for JSON mode with reasoning off, sanitizes the answer, and keeps the job description inside tags", async () => {
    const answer = {
      summary: "Strong backend fit.",
      matches: [
        { projectId: "intelliroom", relevance: 5, blurb: "Built the job queue.", evidenceNodeIds: ["queue", "does-not-exist"] },
        { projectId: "made-up-project", relevance: 1, blurb: "Invented." },
        { projectId: "rootx", relevance: 0.4, blurb: "Led the platform." },
        { projectId: "rootx", relevance: 0.9, blurb: "Duplicate." },
      ],
      skillsMatched: ["Python", "Kubernetes", "react"],
      gaps: ["Kubernetes experience"],
      suggestedOrder: ["rootx", "bogus"],
    };
    const { deps, calls } = makeDeps({ responder: () => completion(`<think>hmm</think>Sure! ${JSON.stringify(answer)}`) });
    const res = await handleRecruiter(post("/api/recruiter", { jobDescription: "Backend engineer with Python and React", lang: "en" }), deps);
    const out = await res.json();
    expect(out.fallback).toBeUndefined();
    expect(out.matches.map((m: any) => m.projectId)).toEqual(["intelliroom", "rootx"]);
    expect(out.matches[0].relevance).toBe(1);
    expect(out.matches[0].evidenceNodeIds).toEqual(["queue"]);
    expect(out.skillsMatched).toEqual(["Python", "React"]);
    expect(out.gaps).toEqual(["Kubernetes experience"]);
    expect(new Set(out.suggestedOrder)).toEqual(new Set(["rootx", "intelliroom", "mari", "shorts-maker"]));
    const c = calls[0]!.body;
    expect(c.response_format).toEqual({ type: "json_object" });
    expect(c.reasoning_effort).toBe("none");
    expect(c.stream).toBe(false);
    expect(c.messages[0].content).toContain("untrusted data");
    expect(c.messages[1].content).toContain("<job_description>");
  });

  it("falls back to keyword matching when the model returns something unusable, errors, or is capped", async () => {
    const jd = { jobDescription: "We need React and Three.js for a 3D planner", lang: "en" };
    const bad = makeDeps({ responder: () => completion("not json at all") });
    expect((await (await handleRecruiter(post("/api/recruiter", jd), bad.deps)).json()).fallback).toBe(true);
    const down = makeDeps({ responder: () => new Response("x", { status: 500 }) });
    expect((await (await handleRecruiter(post("/api/recruiter", jd), down.deps)).json()).fallback).toBe(true);
    const capped = makeDeps({ env: { DAILY_SPEND_CAP_USD: "0" } });
    const res = await handleRecruiter(post("/api/recruiter", jd), capped.deps);
    expect(res.status).toBe(200);
    expect((await res.json()).fallback).toBe(true);
    const nokey = makeDeps({ env: { GROQ_API_KEY: "" } });
    expect((await (await handleRecruiter(post("/api/recruiter", jd), nokey.deps)).json()).fallback).toBe(true);
  });

  it("rejects empty or oversized job descriptions", async () => {
    const { deps } = makeDeps();
    expect((await handleRecruiter(post("/api/recruiter", { jobDescription: "  " }), deps)).status).toBe(400);
    expect((await handleRecruiter(post("/api/recruiter", { jobDescription: "x".repeat(8001) }), deps)).status).toBe(400);
  });

  it("ranks projects by overlap with the job description when matching by keywords", () => {
    const r = keywordFallback("Looking for React and Three.js experience on a 3D planner with Redis queues", "en");
    expect(r.fallback).toBe(true);
    expect(r.matches[0]!.projectId).toBe("intelliroom");
    expect(r.suggestedOrder).toHaveLength(4);
  });
});

describe("tool whitelist", () => {
  it("accepts well-formed calls", () => {
    expect(validateToolCall("go_to_station", { id: "rootx" })).toEqual({ name: "go_to_station", args: { id: "rootx" } });
    expect(validateToolCall("open_detail", { id: "intelliroom", viewId: "ai-render" })).toEqual({ name: "open_detail", args: { id: "intelliroom", viewId: "ai-render" } });
    expect(validateToolCall("highlight_node", { projectId: "intelliroom", viewId: "ai-render", nodeId: "queue" })).not.toBeNull();
    expect(validateToolCall("set_language", { lang: "ar" })).not.toBeNull();
    expect(validateToolCall("open_terminal", {})).not.toBeNull();
  });
  it("rejects unknown tools, unknown ids and malformed arguments", () => {
    expect(validateToolCall("rm", {})).toBeNull();
    expect(validateToolCall("go_to_station", { id: "nope" })).toBeNull();
    expect(validateToolCall("go_to_station", null)).toBeNull();
    expect(validateToolCall("open_detail", { id: "me" })).toBeNull();
    expect(validateToolCall("open_detail", { id: "mari", viewId: "ghost" })).toBeNull();
    expect(validateToolCall("highlight_node", { projectId: "mari", viewId: "voice-loop", nodeId: "ghost" })).toBeNull();
    expect(validateToolCall("set_language", { lang: "fr" })).toBeNull();
    expect(validateToolCall("open_terminal", { command: "x".repeat(81) })).toBeNull();
    expect(validateToolCall("generate_onepager", { jobDescription: "" })).toBeNull();
  });
});

describe("counters and limits", () => {
  it("expires memory counters", async () => {
    let t = 0;
    const s = memoryStore(() => t);
    expect(await s.add("k", 1, 10)).toBe(1);
    expect(await s.add("k", 2, 10)).toBe(3);
    t = 11_000;
    expect(await s.get("k")).toBe(0);
  });

  it("uses INCRBY then EXPIRE on a REST store (Upstash or Vercel KV)", async () => {
    const seen: unknown[][] = [];
    let value = 0;
    const f = (async (_url: string, init: RequestInit) => {
      const cmd = JSON.parse(String(init.body));
      seen.push(cmd);
      if (cmd[0] === "INCRBY") { value += cmd[2]; return new Response(JSON.stringify({ result: value })); }
      return new Response(JSON.stringify({ result: 1 }));
    }) as unknown as typeof fetch;
    const s = restStore("https://kv.test", "tok", f);
    await s.add("a", 1, 60);
    await s.add("a", 1, 60);
    expect(seen.map((c) => c[0])).toEqual(["INCRBY", "EXPIRE", "INCRBY"]);
  });

  it("limits requests per window and meters spend by tokens only when prices are configured", async () => {
    const store = memoryStore();
    const now = 1_700_000_000_000;
    expect((await checkRate(store, "ip", 1, 60, now)).ok).toBe(true);
    expect((await checkRate(store, "ip", 1, 60, now)).ok).toBe(false);
    await recordSpend(store, { estCostPerRequestUsd: 0.01 }, { inputTokens: 1_000_000, outputTokens: 1_000_000 }, now);
    expect(await isUnderCap(store, 0.011, now)).toBe(true);
    expect(await isUnderCap(store, 0.01, now)).toBe(false);
    const priced = memoryStore();
    await recordSpend(priced, { estCostPerRequestUsd: 0.01, priceInPerMTok: 1, priceOutPerMTok: 5 }, { inputTokens: 1_000_000, outputTokens: 200_000 }, now);
    expect(await isUnderCap(priced, 2, now)).toBe(false);
    expect(await isUnderCap(priced, 2.01, now)).toBe(true);
  });
});
