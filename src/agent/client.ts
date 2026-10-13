import type { Lang } from "../content";
import { parseSse } from "./sse";
import type { ChatMessage, RecruiterResult, ToolCall } from "./types";

export interface StreamHandlers {
  onText: (delta: string) => void;
  onTool: (call: ToolCall) => void;
  onError: (message: string) => void;
}

const FRIENDLY = "The AI is unavailable right now. The rest of the site works as usual.";

/** Streams one agent turn. Only plain text of earlier turns is sent; tool calls are never replayed. */
export async function streamAgent(messages: ChatMessage[], lang: Lang, stationId: string | undefined, h: StreamHandlers, signal?: AbortSignal, fetchImpl: typeof fetch = fetch): Promise<void> {
  let res: Response;
  try {
    res = await fetchImpl("/api/agent", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages, lang, context: stationId ? { stationId } : undefined }), signal });
  } catch {
    h.onError(FRIENDLY);
    return;
  }
  if (!res.ok || !res.body) {
    const info = (await res.json().catch(() => ({}))) as { message?: string };
    h.onError(info.message ?? FRIENDLY);
    return;
  }
  for await (const { event, data } of parseSse(res.body)) {
    let payload: any;
    try {
      payload = JSON.parse(data);
    } catch {
      continue;
    }
    if (event === "text") h.onText(String(payload.delta ?? ""));
    else if (event === "tool") h.onTool(payload as ToolCall);
    else if (event === "error") h.onError(String(payload.message ?? FRIENDLY));
  }
}

export async function matchJob(jobDescription: string, lang: Lang, fetchImpl: typeof fetch = fetch): Promise<RecruiterResult | { error: string }> {
  try {
    const res = await fetchImpl("/api/recruiter", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jobDescription, lang }) });
    const body = (await res.json()) as RecruiterResult & { message?: string; error?: string };
    if (!res.ok) return { error: body.message ?? FRIENDLY };
    return body;
  } catch {
    return { error: FRIENDLY };
  }
}
