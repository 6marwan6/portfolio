import { describe, expect, it } from "vitest";
import { validate, ALLOWED_METRIC_VALUES } from "../scripts/validate-content";
import { projects, site, visibleLinks, visibleCost, skillYears, creditLabel } from "../src/content";

describe("content validator", () => {
  it("has no errors in development mode", () => {
    expect(validate(false).errors).toEqual([]);
  });

  it("blocks launch while Arabic is unreviewed (production mode)", () => {
    const { errors } = validate(true);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.every((e) => e.includes("Arabic not reviewed"))).toBe(true);
  });

  it("only uses allowed metric values", () => {
    for (const p of projects) for (const m of p.metrics) expect(ALLOWED_METRIC_VALUES).toContain(m.value);
  });
});

describe("truth rules in the data", () => {
  it("credits IntelliRoom as a team project of 7 with teammates owning the AI", () => {
    const p = projects.find((x) => x.id === "intelliroom")!;
    expect(p.teamSize).toBe(7);
    expect(p.contribution?.team.map((t) => t.en).join(" ")).toMatch(/AI itself/);
    const ai = p.views.find((v) => v.id === "ai-render")!;
    expect(ai.credit).toBe("shared");
    expect(ai.nodes.find((n) => n.id === "gpu")?.credit).toBe("team");
    expect(ai.nodes.find((n) => n.id === "queue")?.credit).toBe("me");
  });

  it("names the six teammates with LinkedIn profiles only (no emails or phones)", () => {
    const p = projects.find((x) => x.id === "intelliroom")!;
    expect(p.teammates).toHaveLength(6);
    expect(p.teammates!.length).toBe((p.teamSize ?? 1) - 1);
    for (const m of p.teammates!) expect(m.linkedin).toMatch(/^https:\/\/(www\.)?linkedin\.com\/in\//);
    expect(JSON.stringify(p)).not.toMatch(/@[a-z0-9-]+\.[a-z]{2,}/i);
  });

  it("never claims unfinished work as shipped", () => {
    expect(projects.find((p) => p.id === "shorts-maker")!.status).toBe("in-progress");
  });

  it("marks the Shorts Maker pipeline view as illustrative", () => {
    expect(projects.find((p) => p.id === "shorts-maker")!.views.find((v) => v.id === "pipeline")!.illustrative).toBe(true);
  });

  it("hides unverified links, unconfirmed costs and unverified credit links", () => {
    const rootx = projects.find((p) => p.id === "rootx")!;
    expect(visibleLinks(rootx).map((l) => l.url)).not.toContain("https://portal.rootx.solutions/");
    expect(visibleCost(rootx)).toBeUndefined();
    expect(visibleCost(projects.find((p) => p.id === "mari")!)?.value.en).toBe("Zero");
    expect(creditLabel(projects.find((p) => p.id === "intelliroom")!.credits![0]!).href).toBeUndefined();
  });

  it("shows skill years only above one year", () => {
    for (const s of site.skills) {
      const y = skillYears(s);
      if (y !== undefined) expect(y).toBeGreaterThan(1);
    }
    expect(skillYears({ group: "x", name: "TypeScript", years: 1 })).toBeUndefined();
  });
});
