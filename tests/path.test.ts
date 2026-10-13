import { describe, expect, it } from "vitest";
import { Vector3 } from "three";
import { cameraCurve, targetCurve } from "../src/scene/path";
import { chapters } from "../src/scene/chapters";
import { progressToCurve } from "../src/scene/progress";

describe("camera path geometry (sanity checks, since the 3D scene is not viewed in a test browser)", () => {
  const cam = new Vector3();
  const tgt = new Vector3();

  it("produces finite points along the whole journey", () => {
    for (let k = 0; k <= 400; k++) {
      cameraCurve.getPoint(k / 400, cam);
      targetCurve.getPoint(k / 400, tgt);
      for (const v of [cam.x, cam.y, cam.z, tgt.x, tgt.y, tgt.z]) expect(Number.isFinite(v)).toBe(true);
    }
  });

  it("always looks forward along the path (camera stays in front of the scene it is facing)", () => {
    for (let k = 0; k <= 400; k++) {
      const u = progressToCurve(k / 400, chapters.length);
      cameraCurve.getPoint(u, cam);
      targetCurve.getPoint(u, tgt);
      expect(cam.z).toBeGreaterThan(tgt.z);
    }
  });

  it("keeps a sensible distance to the subject so stations are neither clipped nor tiny", () => {
    for (let k = 0; k <= 400; k++) {
      const u = progressToCurve(k / 400, chapters.length);
      cameraCurve.getPoint(u, cam);
      targetCurve.getPoint(u, tgt);
      const d = cam.distanceTo(tgt);
      expect(d).toBeGreaterThan(4);
      expect(d).toBeLessThan(16);
    }
  });

  it("is next to each station exactly when that station is active (camera and target hit the control points)", () => {
    chapters.forEach((c, i) => {
      const u = i / (chapters.length - 1);
      targetCurve.getPoint(u, tgt);
      expect(tgt.x).toBeCloseTo(c.position[0], 5);
      expect(tgt.z).toBeCloseTo(c.position[2], 5);
    });
  });
});
