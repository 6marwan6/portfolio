export interface RecruiterResult {
  summary: string;
  matches: { projectId: string; relevance: number; blurb: string; evidenceNodeIds: string[] }[];
  skillsMatched: string[];
  gaps: string[];
  suggestedOrder: string[];
  /** True when the AI was unavailable and the result comes from simple keyword matching. */
  fallback?: boolean;
}

export type ToolCall =
  | { name: "go_to_station"; args: { id: string } }
  | { name: "open_detail"; args: { id: string; viewId?: string } }
  | { name: "highlight_node"; args: { projectId: string; viewId: string; nodeId: string } }
  | { name: "open_terminal"; args: { command?: string } }
  | { name: "set_language"; args: { lang: "en" | "ar" } }
  | { name: "generate_onepager"; args: { jobDescription: string } };

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
