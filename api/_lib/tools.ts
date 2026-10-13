import { projects } from "../../src/content";
import type { ToolCall } from "../../src/agent/types";
import { chapters } from "../../src/scene/chapters";

/** Site-control tools the agent may suggest. The browser executes them only after this whitelist validation. */
/** The hidden terminal arrives in milestone M5; until then the agent is not told it exists. */
export const TERMINAL_READY = false;

const ALL_TOOLS = [
  { name: "go_to_station", description: "Fly the camera to a chapter of the journey. Use when the visitor asks to see a chapter.", input_schema: { type: "object", properties: { id: { type: "string", enum: chapters.map((c) => c.id) } }, required: ["id"] } },
  { name: "open_detail", description: "Open the zoom-in for a project, optionally on a specific view.", input_schema: { type: "object", properties: { id: { type: "string", enum: projects.map((p) => p.id) }, viewId: { type: "string" } }, required: ["id"] } },
  { name: "highlight_node", description: "Highlight one step inside a project's architecture view.", input_schema: { type: "object", properties: { projectId: { type: "string" }, viewId: { type: "string" }, nodeId: { type: "string" } }, required: ["projectId", "viewId", "nodeId"] } },
  { name: "open_terminal", description: "Open the hidden terminal, optionally running a command.", input_schema: { type: "object", properties: { command: { type: "string" } } } },
  { name: "set_language", description: "Switch the site language.", input_schema: { type: "object", properties: { lang: { type: "string", enum: ["en", "ar"] } }, required: ["lang"] } },
  { name: "generate_onepager", description: "Tailor the site to a pasted job description and prepare a one-page summary.", input_schema: { type: "object", properties: { jobDescription: { type: "string" } }, required: ["jobDescription"] } },
] as const;

export const TOOL_DEFS = ALL_TOOLS.filter((t) => t.name !== "open_terminal" || TERMINAL_READY);

export type { ToolCall };

const isStr = (v: unknown): v is string => typeof v === "string";

/** Returns a clean tool call, or null if the name or arguments are not allowed. */
export function validateToolCall(name: string, raw: unknown): ToolCall | null {
  const a = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  switch (name) {
    case "go_to_station":
      return isStr(a.id) && chapters.some((c) => c.id === a.id) ? { name, args: { id: a.id } } : null;
    case "open_detail": {
      if (!isStr(a.id)) return null;
      const p = projects.find((x) => x.id === a.id);
      if (!p) return null;
      if (a.viewId !== undefined && (!isStr(a.viewId) || !p.views.some((v) => v.id === a.viewId))) return null;
      return { name, args: { id: a.id, ...(isStr(a.viewId) ? { viewId: a.viewId } : {}) } };
    }
    case "highlight_node": {
      if (!isStr(a.projectId) || !isStr(a.viewId) || !isStr(a.nodeId)) return null;
      const v = projects.find((p) => p.id === a.projectId)?.views.find((x) => x.id === a.viewId);
      return v && v.nodes.some((n) => n.id === a.nodeId) ? { name, args: { projectId: a.projectId, viewId: a.viewId, nodeId: a.nodeId } } : null;
    }
    case "open_terminal":
      if (a.command === undefined) return { name, args: {} };
      return isStr(a.command) && a.command.length <= 80 ? { name, args: { command: a.command } } : null;
    case "set_language":
      return a.lang === "en" || a.lang === "ar" ? { name, args: { lang: a.lang } } : null;
    case "generate_onepager":
      return isStr(a.jobDescription) && a.jobDescription.trim().length > 0 && a.jobDescription.length <= 8000 ? { name, args: { jobDescription: a.jobDescription } } : null;
    default:
      return null;
  }
}
