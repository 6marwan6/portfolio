import { projects, site, t } from "../content";
import type { Lang } from "../content";
import { ui } from "../i18n/ui";
import type { RecruiterResult } from "./types";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * A printable one-page summary tailored to a job description (recruiter mode).
 * Opened in a new tab; the visitor uses the browser's Print, then "Save as PDF" (this handles Arabic correctly).
 * Facts come only from the site content; the page never contains a phone number.
 */
export function buildOnePagerHtml(result: RecruiterResult, lang: Lang): string {
  const dir = lang === "ar" ? "rtl" : "ltr";
  const rows = result.matches
    .map((m) => {
      const p = projects.find((x) => x.id === m.projectId);
      if (!p) return "";
      const team = p.teamSize ? ` ${t(ui.teamProject, lang)} ${p.teamSize}.` : "";
      return `<section><h3>${esc(t(p.title, lang))}</h3><p class="meta">${esc(t(ui.statusLabel[p.status], lang))}.${esc(team)} ${esc(t(ui.role, lang))}: ${esc(t(p.role, lang))}</p><p>${esc(m.blurb)}</p></section>`;
    })
    .join("");
  const list = (items: string[]) => (items.length ? `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : "");
  const disclaimers = projects.flatMap((p) => (result.matches.some((m) => m.projectId === p.id) ? p.disclaimers.map((d) => t(d, lang)) : []));
  return `<!doctype html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8"><title>${esc(t(site.owner.name, lang))}</title>
<style>
body{font-family:"Readex Pro",system-ui,"Segoe UI",Tahoma,Arial,sans-serif;color:#0e1b2b;margin:2rem auto;max-width:48rem;padding:0 1.25rem;line-height:1.55;font-size:14px}
h1{font-weight:300;font-size:2rem;margin:0}h2{font-size:1rem;margin:1.25rem 0 .25rem;border-block-end:1px solid #d6dee7;padding-block-end:.2rem}h3{margin:.75rem 0 0;font-size:1rem}
.meta,.note{color:#52627a;margin:.1rem 0}ul{margin:.25rem 0;padding-inline-start:1.2rem}button{margin-block-end:1rem;font:inherit;padding:.3rem .9rem}
@media print{button{display:none}body{margin:0}}
</style></head><body>
<button onclick="window.print()">${esc(t(ui.recruiterOnePager, lang))}</button>
<h1>${esc(t(site.owner.name, lang))}</h1>
<p class="meta">${esc(t(site.owner.headline, lang).split(" · ").join(lang === "ar" ? "، " : ", "))}</p>
<p>${esc(t(site.owner.positioning, lang))}</p>
<p class="meta">${esc(site.contact.email)} · ${esc(site.contact.github)} · ${esc(site.contact.linkedin)}</p>
<h2>${esc(t(ui.recruiterFit, lang))}</h2><p>${esc(result.summary)}</p>${rows}
${result.skillsMatched.length ? `<h2>${esc(t(ui.recruiterSkills, lang))}</h2><p>${esc(result.skillsMatched.join(lang === "ar" ? "، " : ", "))}</p>` : ""}
${result.gaps.length ? `<h2>${esc(t(ui.recruiterGaps, lang))}</h2>${list(result.gaps)}` : ""}
<h2>${esc(t(ui.education, lang))}</h2><p>${esc(t(site.owner.education, lang))}</p><p>${esc(t(site.owner.training, lang))}</p>
${disclaimers.map((d) => `<p class="note">${esc(d)}</p>`).join("")}
${result.fallback ? `<p class="note">${esc(t(ui.recruiterFallback, lang))}</p>` : ""}
</body></html>`;
}

export function openOnePager(result: RecruiterResult, lang: Lang): void {
  const url = URL.createObjectURL(new Blob([buildOnePagerHtml(result, lang)], { type: "text/html;charset=utf-8" }));
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
