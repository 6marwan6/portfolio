import { describe, expect, it } from "vitest";
import { buildAgentPayload } from "../api/_lib/confidentiality";
import { projects, site } from "../src/content";
import type { Project } from "../src/content";

// Words that would indicate a leaked security detail. agentNotes only holds prohibitions that mention these
// topics by name, so the word scan runs on the payload with agentNotes removed; phones and emails are scanned everywhere.
const FORBIDDEN_WORDS = [/cookie name/i, /lockout/i, /token lifetime/i, /rate[- ]limit(ing)? (of|at|to) \d/i, /CREST/i];
const PHONE = /\+?\d[\d\s-]{8,}\d/;
const stripNotes = (key: string, value: unknown) => (key === "agentNotes" ? undefined : value);

describe("agent payload (confidentiality filter)", () => {
  const payload = JSON.stringify(buildAgentPayload("en"));
  const payloadWithoutNotes = JSON.stringify(buildAgentPayload("en"), stripNotes);

  it("contains no phone numbers, teammate emails or forbidden security details", () => {
    for (const re of FORBIDDEN_WORDS) expect(payloadWithoutNotes).not.toMatch(re);
    expect(payload).not.toMatch(PHONE);
    const emails = payload.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) ?? [];
    expect(emails.every((e) => e.toLowerCase() === site.contact.email.toLowerCase())).toBe(true);
  });

  it("excludes private projects entirely", () => {
    const secret: Project = { ...projects[0]!, id: "mari", title: { en: "TOP-SECRET-PROJECT", ar: "x", arReviewed: true }, confidentiality: "private" };
    const out = JSON.stringify(buildAgentPayload("en", { site, projects: [...projects, secret] }));
    expect(out).not.toContain("TOP-SECRET-PROJECT");
  });

  it("strips node details from redacted projects and never sends unverified links or station configs", () => {
    const out = buildAgentPayload("en");
    const rootx = out.projects.find((p) => p.id === "rootx")!;
    expect(rootx.views.every((v) => v.nodes.every((n) => n.detail === undefined))).toBe(true);
    expect(rootx.links.map((l) => l.url)).not.toContain("https://portal.rootx.solutions/");
    expect(payload).not.toContain("fallbackImage");
  });

  it("keeps team credit information so the agent can attribute work correctly", () => {
    const out = buildAgentPayload("en");
    const intelli = out.projects.find((p) => p.id === "intelliroom")!;
    expect(intelli.teamSize).toBe(7);
    expect(intelli.views.find((v) => v.id === "ai-render")!.nodes.find((n) => n.id === "gpu")!.credit).toBe("team");
  });
});
