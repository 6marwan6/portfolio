import { describe, expect, it } from "vitest";
import { activeChapterIndex, chapterScrollTop, progressToCurve, DWELL } from "../src/scene/progress";
import { shouldUseLite, type CapabilityEnv } from "../src/scene/capability";
import { chapters } from "../src/scene/chapters";
import { projects } from "../src/content";

const N = 6;

describe("scroll to journey math", () => {
  it("starts at the first station and ends at the last", () => {
    expect(progressToCurve(0, N)).toBe(0);
    expect(progressToCurve(1, N)).toBe(1);
    expect(progressToCurve(-5, N)).toBe(0);
    expect(progressToCurve(9, N)).toBe(1);
  });

  it("holds still near each station (dwell zones)", () => {
    for (let i = 0; i < N; i++) {
      const at = i / (N - 1);
      const eps = (DWELL * 0.5) / (N - 1);
      expect(progressToCurve(at, N)).toBeCloseTo(at, 6);
      if (i < N - 1) expect(progressToCurve(at + eps, N)).toBeCloseTo(at, 6);
      if (i > 0) expect(progressToCurve(at - eps, N)).toBeCloseTo(at, 6);
    }
  });

  it("never moves backwards as the visitor scrolls forward", () => {
    let prev = -1;
    for (let k = 0; k <= 1000; k++) {
      const u = progressToCurve(k / 1000, N);
      expect(u).toBeGreaterThanOrEqual(prev);
      prev = u;
    }
  });

  it("picks the nearest chapter and maps chapters back to scroll positions", () => {
    expect(activeChapterIndex(0, N)).toBe(0);
    expect(activeChapterIndex(1, N)).toBe(N - 1);
    expect(activeChapterIndex(0.5, N)).toBe(Math.round(0.5 * (N - 1)));
    expect(chapterScrollTop(0, N, 5000)).toBe(0);
    expect(chapterScrollTop(N - 1, N, 5000)).toBe(5000);
    expect(activeChapterIndex(chapterScrollTop(3, N, 5000) / 5000, N)).toBe(3);
  });
});

describe("lite mode decision", () => {
  const good: CapabilityEnv = { webgl: true, reducedMotion: false, width: 1440, saveData: false, cores: 8 };
  it("gives capable desktops the 3D journey", () => expect(shouldUseLite(good)).toBe(false));
  it("falls back to the plain page when 3D cannot or should not run", () => {
    expect(shouldUseLite({ ...good, webgl: false })).toBe(true);
    expect(shouldUseLite({ ...good, reducedMotion: true })).toBe(true);
    expect(shouldUseLite({ ...good, saveData: true })).toBe(true);
    expect(shouldUseLite({ ...good, width: 390 })).toBe(true);
    expect(shouldUseLite({ ...good, cores: 2 })).toBe(true);
  });
});

describe("chapters match the content", () => {
  it("has the agreed order: me, the four projects, then education and achievements", () => {
    expect(chapters.map((c) => c.id)).toEqual(["me", "rootx", "intelliroom", "mari", "shorts-maker", "education"]);
  });
  it("covers every project exactly once and in the same order as the content", () => {
    const projectChapters = chapters.filter((c) => c.kind === "project").map((c) => c.id);
    expect(projectChapters).toEqual(projects.map((p) => p.id));
  });
  it("places stations in a path that goes strictly forward", () => {
    for (let i = 1; i < chapters.length; i++) expect(chapters[i]!.position[2]).toBeLessThan(chapters[i - 1]!.position[2]);
  });
});
