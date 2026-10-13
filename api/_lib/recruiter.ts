import type { RecruiterResult } from "../../src/agent/types";
import { projects, site } from "../../src/content";

export type { RecruiterResult };

const clip = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Extracts the first JSON object from model text (tolerates stray prose or fences). */
export function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

/** Validates and sanitizes the model's answer so it can never contain unknown projects, nodes or skills. */
export function sanitizeRecruiter(raw: unknown): RecruiterResult | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const known = new Map(projects.map((p) => [p.id as string, p]));
  const seen = new Set<string>();
  const matches: RecruiterResult["matches"] = [];
  for (const m of Array.isArray(r.matches) ? r.matches : []) {
    if (typeof m !== "object" || m === null) continue;
    const o = m as Record<string, unknown>;
    const id = typeof o.projectId === "string" ? o.projectId : "";
    const project = known.get(id);
    if (!project || seen.has(id)) continue;
    const nodeIds = new Set(project.views.flatMap((v) => v.nodes.map((n) => n.id)));
    const relevance = typeof o.relevance === "number" && Number.isFinite(o.relevance) ? Math.min(1, Math.max(0, o.relevance)) : 0;
    const blurb = clip(o.blurb, 400);
    if (!blurb) continue;
    seen.add(id);
    matches.push({ projectId: id, relevance, blurb, evidenceNodeIds: (Array.isArray(o.evidenceNodeIds) ? o.evidenceNodeIds : []).filter((n): n is string => typeof n === "string" && nodeIds.has(n)).slice(0, 6) });
  }
  const summary = clip(r.summary, 500);
  if (!summary && matches.length === 0) return null;
  matches.sort((a, b) => b.relevance - a.relevance);
  const skillNames = new Map(site.skills.map((s) => [s.name.toLowerCase(), s.name]));
  const skillsMatched = [...new Set((Array.isArray(r.skillsMatched) ? r.skillsMatched : []).map((s) => (typeof s === "string" ? skillNames.get(s.trim().toLowerCase()) : undefined)).filter((s): s is string => !!s))].slice(0, 12);
  const gaps = (Array.isArray(r.gaps) ? r.gaps : []).map((g) => clip(g, 200)).filter(Boolean).slice(0, 8);
  const proposed = (Array.isArray(r.suggestedOrder) ? r.suggestedOrder : []).filter((id): id is string => typeof id === "string" && known.has(id));
  const order = [...new Set([...matches.map((m) => m.projectId), ...proposed])];
  for (const p of projects) if (!order.includes(p.id)) order.push(p.id);
  return { summary, matches, skillsMatched, gaps, suggestedOrder: order };
}

const tokens = (text: string) => new Set(text.toLowerCase().split(/[^a-z0-9+#.]+/).filter((t) => t.length > 1));

/** Deterministic fallback when the AI is unavailable: overlap between the job description and each project's tags and stack. */
export function keywordFallback(jobDescription: string, lang: "en" | "ar"): RecruiterResult {
  const words = tokens(jobDescription);
  const scored = projects.map((p) => {
    const terms = [...p.tags, ...p.stack].flatMap((t) => t.toLowerCase().split(/[^a-z0-9+#.]+/)).filter((t) => t.length > 1);
    const hits = new Set(terms.filter((t) => words.has(t)));
    return { p, hits: hits.size, relevance: Math.min(1, hits.size / 6) };
  });
  scored.sort((a, b) => b.hits - a.hits);
  const matches = scored.filter((s) => s.hits > 0).map((s) => ({ projectId: s.p.id as string, relevance: s.relevance, blurb: s.p.oneLiner[lang], evidenceNodeIds: [] as string[] }));
  const skillsMatched = site.skills.filter((s) => words.has(s.name.toLowerCase())).map((s) => s.name).slice(0, 12);
  const order = [...matches.map((m) => m.projectId), ...projects.map((p) => p.id).filter((id) => !matches.some((m) => m.projectId === id))];
  return {
    summary: lang === "ar" ? "الذكاء الاصطناعي غير متاح الآن، لذلك جرت المطابقة بالكلمات المفتاحية فقط." : "The AI is unavailable right now, so this match uses keywords only.",
    matches,
    skillsMatched,
    gaps: [],
    suggestedOrder: order,
    fallback: true,
  };
}
