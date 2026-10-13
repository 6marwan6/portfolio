import { describe, expect, it } from "vitest";
import { projects } from "../src/content";
import { layouts } from "../src/content/layouts.generated";
import { NODE_H, NODE_SEP, NODE_W, RANK_SEP } from "../src/content/layout-types";
import { layoutKey, viewSignature } from "../src/content/signature";
import { edgePath, fallbackLayout, flowPath, graphScreenRect, nodeScreenCenter, placeNodes } from "../src/views/graphGeometry";
import { getLayout } from "../src/views/layout";

const allViews = projects.flatMap((p) => p.views.map((v) => ({ p, v })));
const overlaps = (nodes: Record<string, { x: number; y: number }>) => {
  const ids = Object.keys(nodes);
  for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++) {
      const a = nodes[ids[i]!]!;
      const b = nodes[ids[j]!]!;
      if (Math.abs(a.x - b.x) < NODE_W && Math.abs(a.y - b.y) < NODE_H) return true;
    }
  return false;
};

describe("generated graph layouts", () => {
  it("exist, are fresh, cover every node and never overlap", () => {
    for (const { p, v } of allViews) {
      const l = layouts[layoutKey(p.id, v.id)];
      expect(l, `${p.id}/${v.id}`).toBeDefined();
      expect(l!.sig).toBe(viewSignature(v));
      expect(Object.keys(l!.nodes).sort()).toEqual(v.nodes.map((n) => n.id).sort());
      expect(overlaps(l!.nodes)).toBe(false);
    }
  });

  it("fit the stage without shrinking much (widest layout is 880 units)", () => {
    for (const l of Object.values(layouts)) expect(l.width).toBeLessThanOrEqual(880);
  });

  it("lay long chains out as a snake whose consecutive steps are always neighbours", () => {
    const shorts = projects.find((p) => p.id === "shorts-maker")!.views.find((v) => v.id === "pipeline")!;
    const l = layouts["shorts-maker/pipeline"]!;
    for (let i = 0; i < shorts.nodes.length - 1; i++) {
      const a = l.nodes[shorts.nodes[i]!.id]!;
      const b = l.nodes[shorts.nodes[i + 1]!.id]!;
      const side = Math.abs(a.y - b.y) === 0 && Math.abs(a.x - b.x) === NODE_W + NODE_SEP;
      const down = a.x === b.x && b.y - a.y === NODE_H + RANK_SEP;
      expect(side || down, `${shorts.nodes[i]!.id} to ${shorts.nodes[i + 1]!.id}`).toBe(true);
    }
  });

  it("fall back to a valid layout when the generated one is stale", () => {
    const view = projects[0]!.views[0]!;
    const stale = { ...view, nodes: [...view.nodes, { id: "extra", label: view.nodes[0]!.label }] };
    const l = getLayout(projects[0]!.id, stale);
    expect(Object.keys(l.nodes)).toHaveLength(stale.nodes.length);
    expect(overlaps(l.nodes)).toBe(false);
  });

  it("has a valid fallback layout for every view", () => {
    for (const { v } of allViews) {
      const l = fallbackLayout(v);
      expect(Object.keys(l.nodes).sort()).toEqual(v.nodes.map((n) => n.id).sort());
      expect(overlaps(l.nodes)).toBe(false);
    }
  });
});

describe("graph geometry", () => {
  const pos = { a: { x: 100, y: 50 }, b: { x: 100, y: 200 }, c: { x: 330, y: 50 } };

  it("draws a vertical connector when the target is clearly below and a side connector on the same row", () => {
    expect(edgePath(pos.a, pos.b)).toMatch(/^M 100 84 C/);
    expect(edgePath(pos.a, pos.b).endsWith("100 166")).toBe(true);
    expect(edgePath(pos.a, pos.c)).toMatch(/^M 188 50 C/);
    expect(edgePath(pos.c, pos.a).startsWith("M 242 50")).toBe(true);
  });

  it("joins a flow into one continuous path (a single move command)", () => {
    const d = flowPath(["a", "b", "c"], pos);
    expect(d.match(/M/g)).toHaveLength(1);
    expect(d).toContain(" L ");
  });

  it("mirrors node positions for right-to-left", () => {
    const layout = { width: 400, height: 300, sig: "", nodes: { a: { x: 100, y: 50 } } };
    expect(placeNodes(layout, false).a).toEqual({ x: 100, y: 50 });
    expect(placeNodes(layout, true).a).toEqual({ x: 300, y: 50 });
  });

  it("places the graph centered in the stage and never scales it up", () => {
    const layout = { width: 400, height: 300, sig: "", nodes: {} };
    const wide = graphScreenRect({ left: 0, top: 0, width: 1000 }, layout);
    expect(wide.scale).toBe(1);
    expect(wide.left).toBeCloseTo(300);
    const narrow = graphScreenRect({ left: 10, top: 20, width: 300 }, layout);
    expect(narrow.scale).toBeLessThan(1);
    const c = nodeScreenCenter(wide, { x: 200, y: 100 });
    expect(c).toEqual({ x: 500, y: 180 });
  });
});
