import { site, projects } from "../../src/content";
import type { Project, Site } from "../../src/content";

/**
 * Builds the only content the AI agent may ever see.
 * - "private" projects are excluded entirely.
 * - "redacted" projects drop node details and agentNotes' extra grounding stays (it only contains rules).
 * - Unverified links, station configs and Arabic review flags are never sent.
 * The private plan documents are never loaded here.
 */
export interface AgentProject
  extends Omit<Project, "station" | "links" | "credits" | "views"> {
  links: { label: string; url: string }[];
  credits?: { name: string; url?: string }[];
  views: { id: string; title: string; credit: string; illustrative: boolean; nodes: { id: string; label: string; detail?: string; credit?: string }[]; edges: { from: string; to: string }[] }[];
}

export interface AgentPayload {
  site: Pick<Site, "contact" | "skills" | "achievements" | "disclaimers"> & { owner: Record<string, string> };
  projects: AgentProject[];
}

export function buildAgentPayload(lang: "en" | "ar" = "en", source = { site, projects }): AgentPayload {
  const pick = (l: { en: string; ar: string }) => l[lang];
  const owner = Object.fromEntries(Object.entries(source.site.owner).map(([k, v]) => [k, pick(v)]));
  const ps = source.projects
    .filter((p) => p.confidentiality !== "private")
    .map((p) => {
      const redacted = p.confidentiality === "redacted";
      const { station: _station, links, credits, views, ...rest } = p;
      void _station;
      return {
        ...rest,
        links: links.filter((l) => l.verified).map((l) => ({ label: pick(l.label), url: l.url })),
        credits: credits?.map((c) => ({ name: c.name, url: c.verified ? c.url : undefined })),
        views: views.map((v) => ({
          id: v.id,
          title: pick(v.title),
          credit: v.credit,
          illustrative: v.illustrative,
          nodes: v.nodes.map((n) => ({
            id: n.id,
            label: pick(n.label),
            detail: redacted || !n.detail ? undefined : pick(n.detail),
            credit: n.credit,
          })),
          edges: v.edges.map((e) => ({ from: e.from, to: e.to })),
        })),
      } as unknown as AgentProject;
    });
  return {
    site: {
      owner,
      contact: source.site.contact,
      skills: source.site.skills,
      achievements: source.site.achievements,
      disclaimers: source.site.disclaimers,
    },
    projects: ps,
  };
}
