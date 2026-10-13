import { useEffect } from "react";
import { site, projects, t } from "../content";
import type { Lang } from "../content";
import { ui } from "../i18n/ui";
import { chapters, type ChapterId } from "../scene/chapters";
import { chapterScrollTop } from "../scene/progress";
import { dive } from "../scene/zoomController";
import { useSite } from "../state/store";
import { useDialog } from "./useDialog";
import { ZoomOverlay } from "./ZoomOverlay";
import { AchievementsSection, ContactSection, Controls, CostStrip, Hero, ProjectBand, SkillsSection } from "./Plain";

const N = chapters.length;

function chapterTitle(id: ChapterId, lang: Lang): string {
  const c = chapters.find((x) => x.id === id)!;
  if (c.title) return t(c.title, lang);
  const p = projects.find((x) => x.id === id);
  return p ? t(p.title, lang) : id;
}

function ChapterPanel({ id, lang, onClose }: { id: ChapterId; lang: Lang; onClose: () => void }) {
  const { container, firstFocus } = useDialog(onClose);
  const project = projects.find((p) => p.id === id);
  return (
    <div className="panel-backdrop" onClick={onClose}>
      <div className="panel" role="dialog" aria-modal="true" aria-label={chapterTitle(id, lang)} ref={container} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="btn panel-close" ref={firstFocus} onClick={onClose}>{t(ui.close, lang)}</button>
        {id === "me" && (
          <>
            <Hero lang={lang} />
            <SkillsSection lang={lang} />
            <ContactSection lang={lang} />
          </>
        )}
        {project && <ProjectBand p={project} lang={lang} />}
        {id === "education" && (
          <>
            <section className="plain">
              <h2>{t(ui.education, lang)}</h2>
              <p>{t(site.owner.education, lang)}</p>
              <p>{t(site.owner.training, lang)}</p>
            </section>
            <AchievementsSection lang={lang} />
            <CostStrip lang={lang} />
            <ContactSection lang={lang} />
            <p className="flows">
              <button type="button" className="btn btn-solid" onClick={() => { onClose(); useSite.getState().setAgentOpen(true); }}>{t(ui.finaleTalk, lang)}</button>
              <button type="button" className="btn" onClick={() => { onClose(); useSite.getState().setRecruiterOpen(true); }}>{t(ui.tailor, lang)}</button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export function JourneyUI() {
  const { lang, active, panel, zoom, closePanel, recruiter } = useSite();
  const matchOf = (id: string) => recruiter?.matches.find((m) => m.projectId === id);
  const chapter = chapters[active]!;
  const project = projects.find((p) => p.id === chapter.id);
  const oneLiner = project ? t(project.oneLiner, lang) : chapter.id === "me" ? t(site.owner.positioning, lang) : t(site.owner.education, lang);

  const goTo = (i: number) => {
    const el = document.documentElement;
    const max = el.scrollHeight - window.innerHeight;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: chapterScrollTop(Math.min(N - 1, Math.max(0, i)), N, max), behavior: reduce ? "auto" : "smooth" });
  };

  useEffect(() => {
    if (panel || zoom) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const cur = useSite.getState().active;
      if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); goTo(cur + 1); }
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); goTo(cur - 1); }
      else if (e.key === "Home") { e.preventDefault(); goTo(0); }
      else if (e.key === "End") { e.preventDefault(); goTo(N - 1); }
      else if (/^[1-9]$/.test(e.key) && Number(e.key) <= N) { e.preventDefault(); goTo(Number(e.key) - 1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel, zoom]);

  return (
    <>
      <div className="topbar">
        <span className="topbar-name">{t(site.owner.name, lang)}</span>
        <Controls />
      </div>

      <nav className="progress" aria-label={t(ui.chapters, lang)}>
        <ol>
          {chapters.map((c, i) => (
            <li key={c.id}>
              <button type="button" onClick={() => goTo(i)} aria-current={i === active ? "step" : undefined} style={{ ["--dot" as string]: c.accentHex }}>
                <span className="dot" aria-hidden="true" />
                <span className="progress-label">{chapterTitle(c.id, lang)}{matchOf(c.id) ? ` (${t(ui.matchBadge, lang)})` : ""}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <section className="caption" aria-live="polite" style={{ ["--accent" as string]: chapter.accentHex }}>
        <p className="caption-count">{t(ui.chapterOf, lang)} {active + 1} / {N}</p>
        <h2>{chapterTitle(chapter.id, lang)}</h2>
        {project && <p className="status"><strong>{t(ui.statusLabel[project.status], lang)}.</strong></p>}
        {matchOf(chapter.id) && <p className="match"><strong>{t(ui.matchBadge, lang)}.</strong> {matchOf(chapter.id)!.blurb}</p>}
        <p>{oneLiner}</p>
        <button type="button" className="btn btn-solid" onClick={() => dive(chapter.id)}>{t(ui.dive, lang)}</button>
      </section>

      <p className="hint">{t(ui.hint, lang)}</p>

      {panel && <ChapterPanel id={panel} lang={lang} onClose={closePanel} />}
      <ZoomOverlay />
    </>
  );
}
