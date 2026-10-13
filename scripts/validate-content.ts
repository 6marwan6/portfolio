import { site, projects } from "../src/content";
import { persona } from "../src/content/persona";
import type { Localized } from "../src/content";
import { layouts } from "../src/content/layouts.generated";
import { layoutKey, viewSignature } from "../src/content/signature";
import { NODE_H, NODE_W } from "../src/content/layout-types";

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

// Values allowed in `metrics` (plan section 3.3). Nothing else may be shown as a metric.
export const ALLOWED_METRIC_VALUES = ["80+", "300+ GB", "679", "3,500+", "7,000+"];

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PHONE = /\+?\d[\d\s-]{8,}\d/g;

const isLocalized = (v: unknown): v is Localized =>
  typeof v === "object" && v !== null && "en" in v && "ar" in v && "arReviewed" in v;

function walk(value: unknown, path: string, visit: (v: unknown, path: string) => void) {
  visit(value, path);
  if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${path}[${i}]`, visit));
  else if (typeof value === "object" && value !== null) {
    for (const [k, v] of Object.entries(value)) walk(v, `${path}.${k}`, visit);
  }
}

export function validate(production = false): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const data = { site, projects, persona };

  // Rule 1: both languages present; Arabic reviewed in production.
  walk(data, "content", (v, path) => {
    if (!isLocalized(v)) return;
    if (!v.en.trim()) errors.push(`${path}: empty English text`);
    if (!v.ar.trim()) errors.push(`${path}: empty Arabic text`);
    if (!v.arReviewed) (production ? errors : warnings).push(`${path}: Arabic not reviewed by Marwan`);
  });

  for (const p of projects) {
    const at = `project ${p.id}`;
    // Rule 2: status, confidentiality, at least one view, each view has credit and illustrative.
    if (!p.status) errors.push(`${at}: missing status`);
    if (!p.confidentiality) errors.push(`${at}: missing confidentiality`);
    if (p.views.length === 0) errors.push(`${at}: needs at least one view`);
    for (const v of p.views) {
      if (!v.credit) errors.push(`${at}/${v.id}: missing credit`);
      if (typeof v.illustrative !== "boolean") errors.push(`${at}/${v.id}: missing illustrative flag`);
      // Rule 3: shared views credit every node.
      if (v.credit === "shared") {
        for (const n of v.nodes) if (!n.credit) errors.push(`${at}/${v.id}/${n.id}: node in a shared view needs a credit`);
      }
      // Structural sanity: edges and flows reference real nodes.
      const ids = new Set(v.nodes.map((n) => n.id));
      for (const e of v.edges) {
        if (!ids.has(e.from) || !ids.has(e.to)) errors.push(`${at}/${v.id}: edge ${e.from}->${e.to} references a missing node`);
      }
      for (const f of v.flows ?? []) {
        for (const id of f.path) if (!ids.has(id)) errors.push(`${at}/${v.id}/${f.id}: flow references missing node ${id}`);
      }
      for (const c of v.callouts ?? []) if (!ids.has(c.nodeId)) errors.push(`${at}/${v.id}: callout references missing node ${c.nodeId}`);
      // A flow animates a dot along edges, so consecutive steps must be connected by an edge.
      for (const f of v.flows ?? []) {
        for (let i = 0; i < f.path.length - 1; i++) {
          if (!v.edges.some((e) => e.from === f.path[i] && e.to === f.path[i + 1])) errors.push(`${at}/${v.id}/${f.id}: no edge between ${f.path[i]} and ${f.path[i + 1]}`);
        }
      }
      // The generated layout must exist, match the current structure, and keep nodes from overlapping.
      const layout = layouts[layoutKey(p.id, v.id)];
      if (!layout) errors.push(`${at}/${v.id}: no generated layout (run npm run layout:graphs)`);
      else {
        if (layout.sig !== viewSignature(v)) errors.push(`${at}/${v.id}: generated layout is stale (run npm run layout:graphs)`);
        const placed = v.nodes.map((n) => ({ id: n.id, ...layout.nodes[n.id]! }));
        for (const n of placed) if (n.x === undefined) errors.push(`${at}/${v.id}/${n.id}: node missing from the generated layout`);
        for (let i = 0; i < placed.length; i++) {
          for (let j = i + 1; j < placed.length; j++) {
            const a = placed[i]!;
            const b = placed[j]!;
            if (Math.abs(a.x - b.x) < NODE_W && Math.abs(a.y - b.y) < NODE_H) errors.push(`${at}/${v.id}: nodes ${a.id} and ${b.id} overlap in the layout`);
          }
        }
      }
    }
    // Rule 4: metrics allowed and sourced.
    for (const m of p.metrics) {
      if (!ALLOWED_METRIC_VALUES.includes(m.value)) errors.push(`${at}: metric value "${m.value}" is not in the allowed list`);
      if (!m.source) errors.push(`${at}: metric "${m.value}" has no source`);
    }
    // Rule 6: team projects need a contribution block.
    if ((p.teamSize ?? 1) > 1 && !p.contribution) errors.push(`${at}: team project needs a contribution block`);
    // Teammates: the named list must match the team size (the owner plus the teammates), with public LinkedIn links only.
    if (p.teammates) {
      if (p.teammates.length !== (p.teamSize ?? 1) - 1) errors.push(`${at}: teammates (${p.teammates.length}) must equal teamSize - 1`);
      for (const m of p.teammates) {
        if (!/^https:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9._%-]+\/?$/.test(m.linkedin)) errors.push(`${at}: teammate ${m.name} needs a https LinkedIn profile URL`);
      }
    }
  }

  const orders = projects.map((p) => p.order);
  if (new Set(orders).size !== orders.length) errors.push("project order values must be unique");

  // Rule 5: skill years only when more than one year.
  for (const s of site.skills) {
    if (s.years !== undefined && s.years <= 1) errors.push(`skill ${s.name}: years must be omitted unless more than 1`);
  }

  // Rule 7: no phone numbers anywhere; the only email is the owner's.
  walk(data, "content", (v, path) => {
    if (typeof v !== "string") return;
    if (PHONE.test(v)) errors.push(`${path}: looks like a phone number`);
    PHONE.lastIndex = 0;
    for (const m of v.matchAll(EMAIL)) {
      if (m[0].toLowerCase() !== site.contact.email.toLowerCase()) errors.push(`${path}: unexpected email address ${m[0]}`);
    }
  });

  // The personality is a voice spec, not a source of facts: its examples must not contain numbers or claim the AI work.
  for (const [i, e] of persona.examples.entries()) {
    for (const lang of ["en", "ar"] as const) {
      // "2D" and "3D" are fine; any other digit would be a number claim.
      if (/[0-9\u0660-\u0669]/.test(e.a[lang].replace(/[23]D/g, ""))) errors.push(`persona example ${i} (${lang}): examples must not contain numbers (facts come from the content)`);
    }
    if (/\bI (built|wrote|made|trained) (the|its) (ai|generation|model)/i.test(e.a.en)) errors.push(`persona example ${i}: must not claim the AI work that teammates did`);
    for (const bad of persona.phrases.avoid) if (e.a.en.toLowerCase().includes(bad.toLowerCase())) errors.push(`persona example ${i}: uses an avoided phrase "${bad}"`);
  }

  // Rule 9: required disclaimers.
  const text = (arr: Localized[]) => arr.map((d) => d.en).join(" ");
  const mari = projects.find((p) => p.id === "mari");
  const intelli = projects.find((p) => p.id === "intelliroom");
  if (!mari || !/not affiliated with or endorsed by Riot Games/i.test(text(mari.disclaimers))) errors.push("Mari: Riot Games non-affiliation disclaimer is required");
  if (!intelli || !/react-planner/i.test(text(intelli.disclaimers))) errors.push("IntelliRoom: react-planner credit disclaimer is required");
  if (!intelli || intelli.teamSize !== 7) errors.push("IntelliRoom: team size must be 7");

  return { errors, warnings };
}

// CLI entry
if (import.meta.url === `file://${process.argv[1]}`) {
  const production = process.argv.includes("--production");
  const { errors, warnings } = validate(production);
  if (warnings.length) {
    console.warn(`\n${warnings.length} warning(s) (Arabic review is required before launch):`);
    console.warn(warnings.slice(0, 5).map((w) => `  - ${w}`).join("\n") + (warnings.length > 5 ? `\n  ...and ${warnings.length - 5} more` : ""));
  }
  if (errors.length) {
    console.error(`\n${errors.length} content error(s):\n` + errors.map((e) => `  - ${e}`).join("\n"));
    process.exit(1);
  }
  console.log(`\nContent valid (${projects.length} projects${production ? ", production mode" : ""}).`);
}
