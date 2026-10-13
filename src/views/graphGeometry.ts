import type { SystemView } from "../content/types";
import { MARGIN, NODE_H, NODE_SEP, NODE_W, RANK_SEP, type GraphLayout } from "../content/layout-types";
import { viewSignature } from "../content/signature";

export interface Pt {
  x: number;
  y: number;
}

/** Node centers, mirrored horizontally for right-to-left languages. */
export function placeNodes(layout: GraphLayout, rtl: boolean): Record<string, Pt> {
  const out: Record<string, Pt> = {};
  for (const [id, p] of Object.entries(layout.nodes)) out[id] = { x: rtl ? layout.width - p.x : p.x, y: p.y };
  return out;
}

/** A smooth connector between two node boxes: vertical when B is clearly below A, otherwise side to side. */
export function edgePath(a: Pt, b: Pt): string {
  const hw = NODE_W / 2;
  const hh = NODE_H / 2;
  if (b.y - a.y >= NODE_H + 8) {
    const y1 = a.y + hh;
    const y2 = b.y - hh;
    const my = (y1 + y2) / 2;
    return `M ${a.x} ${y1} C ${a.x} ${my}, ${b.x} ${my}, ${b.x} ${y2}`;
  }
  const dir = b.x >= a.x ? 1 : -1;
  const x1 = a.x + dir * hw;
  const x2 = b.x - dir * hw;
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${x2} ${b.y}`;
}

/** One continuous path through consecutive nodes (used to animate a dot along a flow). */
export function flowPath(ids: string[], pos: Record<string, Pt>): string {
  const segments: string[] = [];
  for (let i = 0; i < ids.length - 1; i++) {
    const a = pos[ids[i]!];
    const b = pos[ids[i + 1]!];
    if (a && b) segments.push(edgePath(a, b));
  }
  return segments.map((s, i) => (i === 0 ? s : s.replace(/^M/, "L"))).join(" ");
}

/** Where the graph sits on screen inside the stage; shared by the DOM graph and the 3D particles so they line up. */
export function graphScreenRect(stage: { left: number; top: number; width: number }, layout: GraphLayout, pad = 24, padTop = 80) {
  const scale = Math.max(0.1, Math.min(1, (stage.width - pad * 2) / layout.width));
  return { scale, left: stage.left + (stage.width - layout.width * scale) / 2, top: stage.top + padTop };
}

export function nodeScreenCenter(rect: { scale: number; left: number; top: number }, p: Pt): Pt {
  return { x: rect.left + p.x * rect.scale, y: rect.top + p.y * rect.scale };
}

/** Used when no generated layout matches the view (for example right after editing content): a simple layered layout. */
export function fallbackLayout(view: Pick<SystemView, "nodes" | "edges">): GraphLayout {
  const ids = view.nodes.map((n) => n.id);
  const indeg = new Map(ids.map((id) => [id, 0]));
  for (const e of view.edges) indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1);
  const rank = new Map<string, number>();
  const queue = ids.filter((id) => (indeg.get(id) ?? 0) === 0);
  queue.forEach((id) => rank.set(id, 0));
  const remaining = new Map(indeg);
  while (queue.length) {
    const id = queue.shift()!;
    for (const e of view.edges.filter((x) => x.from === id)) {
      rank.set(e.to, Math.max(rank.get(e.to) ?? 0, (rank.get(id) ?? 0) + 1));
      remaining.set(e.to, (remaining.get(e.to) ?? 1) - 1);
      if ((remaining.get(e.to) ?? 0) === 0) queue.push(e.to);
    }
  }
  for (const id of ids) if (!rank.has(id)) rank.set(id, 0);
  const rows = new Map<number, string[]>();
  for (const id of ids) {
    const r = rank.get(id)!;
    rows.set(r, [...(rows.get(r) ?? []), id]);
  }
  const maxK = Math.max(1, ...[...rows.values()].map((r) => r.length));
  const width = maxK * NODE_W + (maxK - 1) * NODE_SEP + MARGIN * 2;
  const nodes: GraphLayout["nodes"] = {};
  let maxRank = 0;
  for (const [r, row] of rows) {
    maxRank = Math.max(maxRank, r);
    const rowWidth = row.length * NODE_W + (row.length - 1) * NODE_SEP;
    const start = (width - rowWidth) / 2 + NODE_W / 2;
    row.forEach((id, i) => {
      nodes[id] = { x: start + i * (NODE_W + NODE_SEP), y: MARGIN + NODE_H / 2 + r * (NODE_H + RANK_SEP) };
    });
  }
  return { width, height: MARGIN * 2 + (maxRank + 1) * NODE_H + maxRank * RANK_SEP, sig: viewSignature(view), nodes };
}
