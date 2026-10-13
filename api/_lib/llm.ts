import { parseSse } from "../../src/agent/sse";
import type { ApiEnv } from "./env";

export { parseSse };

export interface Usage {
  inputTokens: number;
  outputTokens: number;
}

export interface ChatBody {
  model: string;
  max_tokens: number;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  /** Tools in the neutral shape used by tools.ts; converted to the OpenAI function format here. */
  tools?: readonly { name: string; description: string; input_schema: unknown }[];
  /** "none" = instruct mode with no reasoning tokens (fast and cheap), which is what a chat agent needs. */
  reasoningEffort?: "none" | "low" | "medium" | "high";
  json?: boolean;
}

export type AgentEvent =
  | { type: "text"; delta: string }
  | { type: "tool"; name: string; input: unknown }
  | { type: "usage"; usage: Usage }
  | { type: "error"; message: string };

/**
 * Removes <think>...</think> blocks from streamed text, even when a tag is split across chunks.
 * Qwen models can emit their reasoning inline; visitors must never see it.
 */
export function createThinkFilter() {
  let inside = false;
  let pending = "";
  const OPEN = "<think>";
  const CLOSE = "</think>";
  const partial = (text: string, tag: string) => {
    for (let k = Math.min(tag.length - 1, text.length); k > 0; k--) if (tag.startsWith(text.slice(-k))) return k;
    return 0;
  };
  return {
    push(chunk: string): string {
      let text = pending + chunk;
      pending = "";
      let out = "";
      for (;;) {
        if (inside) {
          const end = text.indexOf(CLOSE);
          if (end === -1) {
            pending = text.slice(text.length - partial(text, CLOSE));
            return out;
          }
          text = text.slice(end + CLOSE.length);
          inside = false;
        } else {
          const start = text.indexOf(OPEN);
          if (start === -1) {
            const keep = partial(text, OPEN);
            out += text.slice(0, text.length - keep);
            pending = text.slice(text.length - keep);
            return out;
          }
          out += text.slice(0, start);
          text = text.slice(start + OPEN.length);
          inside = true;
        }
      }
    },
    /** Text held back while waiting to see whether a tag was starting (released at the end of the stream). */
    flush(): string {
      const rest = inside ? "" : pending;
      pending = "";
      return rest;
    },
  };
}

const url = (env: ApiEnv) => `${env.llmBaseUrl}/chat/completions`;
const headers = (env: ApiEnv) => ({ authorization: `Bearer ${env.llmApiKey}`, "content-type": "application/json" });

function payload(body: ChatBody, stream: boolean) {
  return {
    model: body.model,
    messages: body.messages,
    max_completion_tokens: body.max_tokens,
    stream,
    ...(body.reasoningEffort ? { reasoning_effort: body.reasoningEffort } : {}),
    ...(body.tools?.length ? { tools: body.tools.map((t) => ({ type: "function", function: { name: t.name, description: t.description, parameters: t.input_schema } })), tool_choice: "auto" } : {}),
    ...(body.json ? { response_format: { type: "json_object" } } : {}),
  };
}

const usageOf = (chunk: any): Usage | undefined => {
  const u = chunk?.usage ?? chunk?.x_groq?.usage;
  return u && typeof u.prompt_tokens === "number" ? { inputTokens: u.prompt_tokens, outputTokens: u.completion_tokens ?? 0 } : undefined;
};

/** Streams one model turn as simple events: text deltas, completed tool calls, usage. */
export async function* streamChat(env: ApiEnv, body: ChatBody, fetchImpl: typeof fetch = fetch): AsyncGenerator<AgentEvent> {
  const res = await fetchImpl(url(env), { method: "POST", headers: headers(env), body: JSON.stringify(payload(body, true)) });
  if (!res.ok || !res.body) {
    yield { type: "error", message: `upstream ${res.status}` };
    return;
  }
  const think = createThinkFilter();
  const calls = new Map<number, { name: string; args: string }>();
  let usage: Usage | undefined;
  const flushCalls = function* (): Generator<AgentEvent> {
    const pending = [...calls.entries()].sort((a, b) => a[0] - b[0]);
    calls.clear();
    for (const [, c] of pending) {
      if (!c.name) continue;
      let input: unknown = {};
      try {
        input = c.args ? JSON.parse(c.args) : {};
      } catch {
        input = null;
      }
      yield { type: "tool", name: c.name, input };
    }
  };
  for await (const { data } of parseSse(res.body)) {
    if (data.trim() === "[DONE]") break;
    let chunk: any;
    try {
      chunk = JSON.parse(data);
    } catch {
      continue;
    }
    if (chunk.error) {
      yield { type: "error", message: String(chunk.error.message ?? "error") };
      return;
    }
    usage = usageOf(chunk) ?? usage;
    const choice = chunk.choices?.[0];
    const delta = choice?.delta;
    if (typeof delta?.content === "string" && delta.content) {
      const visible = think.push(delta.content);
      if (visible) yield { type: "text", delta: visible };
    }
    for (const tc of delta?.tool_calls ?? []) {
      const i = typeof tc.index === "number" ? tc.index : 0;
      const cur = calls.get(i) ?? { name: "", args: "" };
      if (tc.function?.name) cur.name = tc.function.name;
      if (typeof tc.function?.arguments === "string") cur.args += tc.function.arguments;
      calls.set(i, cur);
    }
    if (choice?.finish_reason) yield* flushCalls();
  }
  const tail = think.flush();
  if (tail) yield { type: "text", delta: tail };
  yield* flushCalls();
  yield { type: "usage", usage: usage ?? { inputTokens: 0, outputTokens: 0 } };
}

/** One non-streaming call; returns the visible text (reasoning removed) and usage. */
export async function completeChat(env: ApiEnv, body: ChatBody, fetchImpl: typeof fetch = fetch): Promise<{ text: string; usage: Usage } | { error: string }> {
  const res = await fetchImpl(url(env), { method: "POST", headers: headers(env), body: JSON.stringify(payload(body, false)) });
  if (!res.ok) return { error: `upstream ${res.status}` };
  const json = (await res.json()) as any;
  const raw = String(json?.choices?.[0]?.message?.content ?? "");
  const filter = createThinkFilter();
  const text = filter.push(raw) + filter.flush();
  return { text, usage: usageOf(json) ?? { inputTokens: 0, outputTokens: 0 } };
}
