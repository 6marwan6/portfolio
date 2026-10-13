import { parseSse } from "../../src/agent/sse";
import type { ApiEnv } from "./env";

const URL = "https://api.anthropic.com/v1/messages";
const VERSION = "2023-06-01";

export interface Usage {
  inputTokens: number;
  outputTokens: number;
}

export { parseSse };

export type AgentEvent =
  | { type: "text"; delta: string }
  | { type: "tool"; name: string; input: unknown }
  | { type: "usage"; usage: Usage }
  | { type: "error"; message: string };

interface Body {
  model: string;
  max_tokens: number;
  system: unknown;
  messages: { role: "user" | "assistant"; content: string }[];
  tools?: readonly unknown[];
}

const headers = (env: ApiEnv) => ({ "x-api-key": env.anthropicApiKey, "anthropic-version": VERSION, "content-type": "application/json" });

/** Streams a model turn as simple events: text deltas, completed tool calls, usage. */
export async function* streamMessages(env: ApiEnv, body: Body, fetchImpl: typeof fetch = fetch): AsyncGenerator<AgentEvent> {
  const res = await fetchImpl(URL, { method: "POST", headers: headers(env), body: JSON.stringify({ ...body, stream: true }) });
  if (!res.ok || !res.body) {
    yield { type: "error", message: `upstream ${res.status}` };
    return;
  }
  const blocks = new Map<number, { type: string; name?: string; json: string }>();
  const usage: Usage = { inputTokens: 0, outputTokens: 0 };
  for await (const { event, data } of parseSse(res.body)) {
    let payload: any;
    try {
      payload = JSON.parse(data);
    } catch {
      continue;
    }
    if (event === "message_start") usage.inputTokens = (payload.message?.usage?.input_tokens ?? 0) + (payload.message?.usage?.cache_creation_input_tokens ?? 0) + (payload.message?.usage?.cache_read_input_tokens ?? 0);
    else if (event === "content_block_start") blocks.set(payload.index, { type: payload.content_block?.type, name: payload.content_block?.name, json: "" });
    else if (event === "content_block_delta") {
      if (payload.delta?.type === "text_delta") yield { type: "text", delta: String(payload.delta.text ?? "") };
      else if (payload.delta?.type === "input_json_delta") {
        const b = blocks.get(payload.index);
        if (b) b.json += String(payload.delta.partial_json ?? "");
      }
    } else if (event === "content_block_stop") {
      const b = blocks.get(payload.index);
      if (b?.type === "tool_use" && b.name) {
        let input: unknown = {};
        try {
          input = b.json ? JSON.parse(b.json) : {};
        } catch {
          input = null;
        }
        yield { type: "tool", name: b.name, input };
      }
    } else if (event === "message_delta") usage.outputTokens = payload.usage?.output_tokens ?? usage.outputTokens;
    else if (event === "error") {
      yield { type: "error", message: String(payload.error?.type ?? "error") };
      return;
    }
  }
  yield { type: "usage", usage };
}

/** One non-streaming model call; returns the text and usage. */
export async function completeMessages(env: ApiEnv, body: Body, fetchImpl: typeof fetch = fetch): Promise<{ text: string; usage: Usage } | { error: string }> {
  const res = await fetchImpl(URL, { method: "POST", headers: headers(env), body: JSON.stringify(body) });
  if (!res.ok) return { error: `upstream ${res.status}` };
  const json = (await res.json()) as { content?: { type: string; text?: string }[]; usage?: { input_tokens?: number; output_tokens?: number; cache_creation_input_tokens?: number; cache_read_input_tokens?: number } };
  const text = (json.content ?? []).filter((c) => c.type === "text").map((c) => c.text ?? "").join("");
  return { text, usage: { inputTokens: (json.usage?.input_tokens ?? 0) + (json.usage?.cache_creation_input_tokens ?? 0) + (json.usage?.cache_read_input_tokens ?? 0), outputTokens: json.usage?.output_tokens ?? 0 } };
}
