import type { Lang, Localized, Project, Skill } from "./types";

export const t = (value: Localized, lang: Lang): string => value[lang];

/** Links with verified=false are never rendered. */
export const visibleLinks = (p: Project) => p.links.filter((l) => l.verified);

/** The cost strip renders only confirmed entries. */
export const visibleCost = (p: Project) => (p.cost && p.cost.confirmed ? p.cost : undefined);

/** Credits link only when the URL is verified; the name is always shown. */
export const creditLabel = (c: NonNullable<Project["credits"]>[number]) => ({ name: c.name, href: c.verified ? c.url : undefined });

/** Years are shown only for skills used for more than a year. */
export const skillYears = (s: Skill): number | undefined => (s.years !== undefined && s.years > 1 ? s.years : undefined);

/** Orders projects by a suggested order of ids (recruiter mode); anything not listed keeps its place after the listed ones. */
export function orderBySuggestion<T extends { id: string }>(items: T[], order: string[] | undefined): T[] {
  if (!order || order.length === 0) return items;
  const rank = (id: string) => (order.indexOf(id) === -1 ? Number.MAX_SAFE_INTEGER : order.indexOf(id));
  return [...items].sort((a, b) => rank(a.id) - rank(b.id));
}

export const groupSkills = (skills: Skill[]): Record<string, Skill[]> =>
  skills.reduce<Record<string, Skill[]>>((acc, s) => {
    (acc[s.group] ||= []).push(s);
    return acc;
  }, {});
