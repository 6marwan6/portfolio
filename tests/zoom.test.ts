import { describe, expect, it } from "vitest";
import { ZOOM_DURATION, UI_AT, closePose, zoomPhases } from "../src/scene/zoom";
import { makeParticles, particlePosition, PARTICLES_PER_NODE } from "../src/scene/particles";

describe("zoom-in timeline (plan section 6.3)", () => {
  it("runs about 1.6 seconds in three beats: push, dissolve, then the interface", () => {
    expect(ZOOM_DURATION).toBeCloseTo(1.6);
    expect(UI_AT).toBeCloseTo(1.0);
    expect(zoomPhases(0)).toEqual({ push: 0, dissolve: 0, ui: 0 });
    const half = zoomPhases(0.5);
    expect(half.push).toBe(1);
    expect(half.dissolve).toBe(0);
    const one = zoomPhases(1.0);
    expect(one.dissolve).toBe(1);
    expect(one.ui).toBe(0);
    expect(zoomPhases(ZOOM_DURATION).ui).toBe(1);
  });

  it("only ever moves forward as time advances and stays within 0..1", () => {
    let prev = { push: 0, dissolve: 0, ui: 0 };
    for (let k = 0; k <= 160; k++) {
      const p = zoomPhases(k / 100);
      for (const key of ["push", "dissolve", "ui"] as const) {
        expect(p[key]).toBeGreaterThanOrEqual(prev[key]);
        expect(p[key]).toBeGreaterThanOrEqual(0);
        expect(p[key]).toBeLessThanOrEqual(1);
      }
      prev = p;
    }
  });

  it("puts the close-up camera in front of the station, looking at it", () => {
    const pose = closePose([5, 0, -29]);
    expect(pose.camera[2]).toBeGreaterThan(pose.target[2]);
    expect(pose.camera[0]).toBe(pose.target[0]);
    expect(pose.camera[2] - pose.target[2]).toBeCloseTo(3.6);
  });
});

describe("dissolve particles", () => {
  const count = 5 * PARTICLES_PER_NODE;
  const { start, delay } = makeParticles(count, [6, 0, -9], 7);
  const target = new Float32Array(count * 3).map((_, i) => i * 0.01);

  it("is deterministic for a given seed", () => {
    const again = makeParticles(count, [6, 0, -9], 7);
    expect(Array.from(again.start)).toEqual(Array.from(start));
    expect(Array.from(again.delay)).toEqual(Array.from(delay));
  });

  it("starts around the station and ends exactly on the graph nodes", () => {
    for (let i = 0; i < count; i += 17) {
      expect(particlePosition(i, start, target, delay, 0)).toEqual([start[i * 3], start[i * 3 + 1], start[i * 3 + 2]]);
      const end = particlePosition(i, start, target, delay, 1);
      expect(end[0]).toBeCloseTo(target[i * 3]!, 5);
      expect(end[1]).toBeCloseTo(target[i * 3 + 1]!, 5);
      expect(end[2]).toBeCloseTo(target[i * 3 + 2]!, 5);
    }
  });
});
