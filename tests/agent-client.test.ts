import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import gsap from "gsap";
import { matchJob, streamAgent } from "../src/agent/client";
import { buildOnePagerHtml } from "../src/agent/onepager";
import { runTool } from "../src/agent/tools";
import type { RecruiterResult } from "../src/agent/types";
import { App } from "../src/App";
import { orderBySuggestion, projects } from "../src/content";
import { ProjectBand } from "../src/views/Plain";
import { zoomClock } from "../src/scene/zoomClock";
import { useSite } from "../src/state/store";

const sse = (events: [string, unknown][]) => events.map(([e, d]) => `event: ${e}\ndata: ${JSON.stringify(d)}\n\n`).join("");
const okStream = (events: [string, unknown][]) => (async () => new Response(sse(events))) as unknown as typeof fetch;

afterEach(() => {
  gsap.globalTimeline.clear();
  vi.unstubAllGlobals();
  useSite.setState({ zoom: null, panel: null, recruiter: null, recruiterOpen: false, agentOpen: false, highlight: null, mode: "plain", lang: "en" });
  zoomClock.t = 0;
});

describe("agent client", () => {
  it("collects streamed text and tool calls", async () => {
    let text = "";
    const tools: unknown[] = [];
    await streamAgent([{ role: "user", content: "hi" }], "en", undefined, { onText: (d) => (text += d), onTool: (c) => tools.push(c), onError: () => { throw new Error("no error expected"); } }, undefined,
      okStream([["text", { delta: "Hel" }], ["text", { delta: "lo" }], ["tool", { name: "go_to_station", args: { id: "mari" } }], ["done", {}]]));
    expect(text).toBe("Hello");
    expect(tools).toEqual([{ name: "go_to_station", args: { id: "mari" } }]);
  });

  it("surfaces friendly errors from the server and from the network", async () => {
    const errors: string[] = [];
    const h = { onText: () => undefined, onTool: () => undefined, onError: (m: string) => errors.push(m) };
    await streamAgent([{ role: "user", content: "hi" }], "en", undefined, h, undefined, (async () => new Response(JSON.stringify({ message: "The AI is resting for today." }), { status: 503 })) as unknown as typeof fetch);
    await streamAgent([{ role: "user", content: "hi" }], "en", undefined, h, undefined, (async () => { throw new Error("offline"); }) as unknown as typeof fetch);
    await streamAgent([{ role: "user", content: "hi" }], "en", undefined, h, undefined, okStream([["error", { message: "boom" }]]));
    expect(errors).toEqual(["The AI is resting for today.", expect.stringContaining("unavailable"), "boom"]);
  });

  it("matches a job description or returns an error message", async () => {
    const ok = await matchJob("jd", "en", (async () => new Response(JSON.stringify({ summary: "s", matches: [], skillsMatched: [], gaps: [], suggestedOrder: [] }))) as unknown as typeof fetch);
    expect("summary" in ok).toBe(true);
    const bad = await matchJob("jd", "en", (async () => new Response(JSON.stringify({ message: "Too many requests." }), { status: 429 })) as unknown as typeof fetch);
    expect(bad).toEqual({ error: "Too many requests." });
  });
});

describe("tool runner (the site decides what actually happens)", () => {
  const stubBrowser = () => {
    const scrollTo = vi.fn();
    const scrollIntoView = vi.fn();
    vi.stubGlobal("window", { innerHeight: 800, scrollTo, matchMedia: () => ({ matches: true }) });
    vi.stubGlobal("document", { documentElement: { scrollHeight: 6000 }, getElementById: () => ({ scrollIntoView, querySelectorAll: () => [] }) });
    return { scrollTo, scrollIntoView };
  };

  it("flies the camera to a chapter in the journey and scrolls on the plain page", () => {
    const { scrollTo, scrollIntoView } = stubBrowser();
    useSite.setState({ mode: "journey" });
    expect(runTool({ name: "go_to_station", args: { id: "mari" } })).toContain("Mari");
    expect(scrollTo).toHaveBeenCalled();
    useSite.setState({ mode: "plain" });
    runTool({ name: "go_to_station", args: { id: "rootx" } });
    expect(scrollIntoView).toHaveBeenCalled();
  });

  it("opens the zoom-in on a chosen view and highlights a step", () => {
    stubBrowser();
    useSite.setState({ mode: "journey" });
    runTool({ name: "open_detail", args: { id: "intelliroom", viewId: "ai-render" } });
    expect(useSite.getState().zoom).toMatchObject({ id: "intelliroom", view: "ai-render" });
    runTool({ name: "highlight_node", args: { projectId: "intelliroom", viewId: "ai-render", nodeId: "queue" } });
    expect(useSite.getState().highlight).toEqual({ projectId: "intelliroom", viewId: "ai-render", nodeId: "queue" });
  });

  it("switches language, prepares recruiter mode, and ignores the terminal until it exists", () => {
    stubBrowser();
    runTool({ name: "set_language", args: { lang: "ar" } });
    expect(useSite.getState().lang).toBe("ar");
    runTool({ name: "generate_onepager", args: { jobDescription: "Backend role" } });
    expect(useSite.getState().recruiterOpen).toBe(true);
    expect(useSite.getState().recruiterJd).toBe("Backend role");
    expect(runTool({ name: "open_terminal", args: {} })).toBe("");
  });
});

describe("one-page summary", () => {
  const result: RecruiterResult = {
    summary: "Strong backend fit <b>bold</b>.",
    matches: [{ projectId: "intelliroom", relevance: 0.9, blurb: "Built the job queue <script>alert(1)</script>.", evidenceNodeIds: [] }],
    skillsMatched: ["Python"],
    gaps: ["Kubernetes experience"],
    suggestedOrder: ["intelliroom", "rootx", "mari", "shorts-maker"],
  };

  it("escapes text, keeps the honest role and team size, and never includes a phone number", () => {
    const html = buildOnePagerHtml(result, "en");
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("Team of 7");
    expect(html).toContain("Planner environment, backend, frontend and storage");
    expect(html).toContain("Kubernetes experience");
    expect(html).toContain("marwanstar2003@hotmail.com");
    expect(html.replace(/<[^>]+>/g, " ")).not.toMatch(/\+?\d[\d\s-]{8,}\d/);
    expect(html).toContain("A team project of 7 people.");
  });

  it("switches to right-to-left for Arabic and notes when the match was keyword-only", () => {
    const html = buildOnePagerHtml({ ...result, fallback: true }, "ar");
    expect(html).toContain('dir="rtl"');
    expect(html).toContain("بالكلمات المفتاحية");
  });
});

describe("AI entry points and recruiter effects on the page", () => {
  it("shows both AI entry points, labeled, and the cost strip with only confirmed entries", () => {
    const html = renderToString(createElement(App));
    expect(html).toContain("Ask Marwan (AI)");
    expect(html).toContain("Tailor this site to a job");
    expect(html).toContain("What it costs to run");
    expect(html).toContain("Zero");
    expect(html).not.toContain("About 30 per month");
  });

  it("orders projects by the recruiter's suggestion and keeps unlisted ones after the listed ones", () => {
    const ids = projects.map((p) => p.id);
    expect(orderBySuggestion(projects, undefined).map((p) => p.id)).toEqual(ids);
    expect(orderBySuggestion(projects, ["mari", "rootx"]).map((p) => p.id)).toEqual(["mari", "rootx", "intelliroom", "shorts-maker"]);
    expect(orderBySuggestion(projects, ["shorts-maker"]).map((p) => p.id)[0]).toBe("shorts-maker");
  });

  it("explains why a project fits when a recruiter match is present", () => {
    const mari = projects.find((p) => p.id === "mari")!;
    const html = renderToString(createElement(ProjectBand, { p: mari, lang: "en", match: { projectId: "mari", relevance: 1, blurb: "Matches the personalization requirement.", evidenceNodeIds: [] } }));
    expect(html).toContain("Why this fits");
    expect(html).toContain("Matches the personalization requirement.");
  });
});
