import type { SystemView } from "./types";

/** Identifies the graph structure (nodes and edges). If it changes, the generated layout is stale. */
export const viewSignature = (view: Pick<SystemView, "nodes" | "edges">): string =>
  `${view.nodes.map((n) => n.id).join(",")}|${view.edges.map((e) => `${e.from}>${e.to}`).join(",")}`;

export const layoutKey = (projectId: string, viewId: string): string => `${projectId}/${viewId}`;
