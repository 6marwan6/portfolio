import { site, projects, t, visibleLinks, visibleCost, creditLabel, skillYears, groupSkills, orderBySuggestion } from "../content";
import type { Lang, Project, SystemView } from "../content";
import { ui } from "../i18n/ui";
import { useSite } from "../state/store";
import { ViewExplorer } from "./SystemGraph";
import type { RecruiterResult } from "../agent/types";

export function Controls() {
  const { lang, setLang, mode, setMode, webgl } = useSite();
  const toJourney = mode === "plain";
  return (
    <div className="controls">
      <button
        type="button"
        className="btn"
        onClick={() => setMode(toJourney ? "journey" : "plain")}
        disabled={toJourney && !webgl}
        title={toJourney && !webgl ? t(ui.noWebgl, lang) : undefined}
      >
        {toJourney ? t(ui.openJourney, lang) : t(ui.openFastPath, lang)}
      </button>
      <button type="button" className="btn" onClick={() => setLang(lang === "en" ? "ar" : "en")} aria-label={t(ui.switchLabel, lang)} lang={lang === "en" ? "ar" : "en"}>
        {t(ui.switchTo, lang)}
      </button>
    </div>
  );
}

export function ViewBlock({ projectId, view, lang }: { projectId: string; view: SystemView; lang: Lang }) {
  return (
    <details className="view">
      <summary>
        {t(ui.howItWorks, lang)}: {t(view.title, lang)}
      </summary>
      <ViewExplorer projectId={projectId} view={view} lang={lang} />
    </details>
  );
}

export function ProjectBand({ p, lang, showViews = true, match }: { p: Project; lang: Lang; showViews?: boolean; match?: RecruiterResult["matches"][number] }) {
  const links = visibleLinks(p);
  const cost = visibleCost(p);
  const sep = lang === "ar" ? "، " : ", ";
  return (
    <article id={p.id} className="band" style={{ ["--accent" as string]: `var(--accent-${p.id})` }}>
      <h2>{t(p.title, lang)}</h2>
      <p className="status">
        <strong>{t(ui.statusLabel[p.status], lang)}.</strong> {p.statusNote ? t(p.statusNote, lang) : null}
        {p.teamSize ? ` ${t(ui.teamProject, lang)} ${p.teamSize}.` : null}
      </p>
      {match && <p className="match"><strong>{t(ui.whyFits, lang)}:</strong> {match.blurb}</p>}
      <p className="lede">{t(p.oneLiner, lang)}</p>
      <p>
        <strong>{t(ui.role, lang)}:</strong> {t(p.role, lang)}
      </p>

      {p.contribution && (
        <div className="split">
          <div>
            <h3>{t(ui.builtByMe, lang)}</h3>
            <ul>{p.contribution.mine.map((m, i) => <li key={i}>{t(m, lang)}</li>)}</ul>
          </div>
          <div>
            <h3>{t(ui.builtByTeam, lang)}</h3>
            <ul>{p.contribution.team.map((m, i) => <li key={i}>{t(m, lang)}</li>)}</ul>
          </div>
        </div>
      )}

      {p.teammates && p.teammates.length > 0 && (
        <p>
          <strong>{t(ui.teammates, lang)}:</strong>{" "}
          {p.teammates.map((m, i) => (
            <span key={m.linkedin}>
              {i > 0 && sep}
              <a href={m.linkedin} target="_blank" rel="noopener noreferrer">{m.name}</a>
            </span>
          ))}
        </p>
      )}

      <ul className="story">{p.story.map((s, i) => <li key={i}>{t(s, lang)}</li>)}</ul>

      {p.metrics.length > 0 && (
        <>
          <h3>{t(ui.metrics, lang)}</h3>
          <ul className="metrics">
            {p.metrics.map((m, i) => (
              <li key={i}><strong>{m.value}</strong> {t(m.label, lang)}</li>
            ))}
          </ul>
        </>
      )}

      {cost && (
        <p>
          <strong>{t(ui.cost, lang)}:</strong> {t(cost.value, lang)}
        </p>
      )}

      <p><strong>{t(ui.stack, lang)}:</strong> {p.stack.join(sep)}</p>

      {links.length > 0 && (
        <p>
          <strong>{t(ui.links, lang)}:</strong>{" "}
          {links.map((l, i) => (
            <span key={l.url}>
              {i > 0 && sep}
              <a href={l.url} target="_blank" rel="noopener noreferrer">{t(l.label, lang)}</a>
            </span>
          ))}
        </p>
      )}

      {p.credits?.map((c) => {
        const { name, href } = creditLabel(c);
        return <p key={c.name} className="note">{href ? <a href={href} target="_blank" rel="noopener noreferrer">{name}</a> : name}</p>;
      })}
      {p.disclaimers.map((d, i) => <p key={i} className="note">{t(d, lang)}</p>)}

      {showViews && p.views.map((v) => <ViewBlock key={v.id} projectId={p.id} view={v} lang={lang} />)}
    </article>
  );
}

/** The cost strip: only confirmed entries are shown (plan section 9.4). */
export function CostStrip({ lang }: { lang: Lang }) {
  const entries = projects.map((p) => ({ p, cost: visibleCost(p) })).filter((e) => e.cost);
  if (entries.length === 0) return null;
  return (
    <section id="cost" className="plain">
      <h2>{t(ui.costTitle, lang)}</h2>
      <ul>
        {entries.map(({ p, cost }) => (
          <li key={p.id}><strong>{t(p.title, lang)}:</strong> {t(cost!.value, lang)}</li>
        ))}
      </ul>
    </section>
  );
}

export function Hero({ lang }: { lang: Lang }) {
  const sep = lang === "ar" ? "، " : ", ";
  return (
    <header className="hero">
      <h1>{t(site.owner.name, lang)}</h1>
      <p className="headline">{t(site.owner.headline, lang).split(" · ").join(sep)}</p>
      <p className="lede">{t(site.owner.positioning, lang)}</p>
      <p>{t(site.owner.education, lang)}</p>
      <p>{t(site.owner.training, lang)}</p>
      <p>{t(site.owner.location, lang)}. {t(site.owner.languages, lang)}.</p>
    </header>
  );
}

export function SkillsSection({ lang }: { lang: Lang }) {
  const grouped = groupSkills(site.skills);
  const sep = lang === "ar" ? "، " : ", ";
  return (
    <section id="skills" className="plain">
      <h2>{t(ui.skills, lang)}</h2>
      {Object.entries(grouped).map(([group, list]) => (
        <p key={group}>
          <strong>{group}:</strong>{" "}
          {list
            .map((s) => {
              const y = skillYears(s);
              return s.level ? `${s.name} (${t(s.level, lang)})` : y ? `${s.name} (${y} ${t(ui.years, lang)})` : s.name;
            })
            .join(sep)}
        </p>
      ))}
    </section>
  );
}

export function AchievementsSection({ lang }: { lang: Lang }) {
  return (
    <section id="achievements" className="plain">
      <h2>{t(ui.achievements, lang)}</h2>
      <ul>{site.achievements.map((a) => <li key={a.id}>{t(a.text, lang)}</li>)}</ul>
    </section>
  );
}

export function ContactSection({ lang }: { lang: Lang }) {
  const sep = lang === "ar" ? "، " : ", ";
  return (
    <section id="contact" className="plain">
      <h2>{t(ui.contact, lang)}</h2>
      <p>
        <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
      </p>
      <p>
        <a href={site.contact.github} target="_blank" rel="noopener noreferrer">GitHub</a>
        {sep}
        <a href={site.contact.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
      </p>
    </section>
  );
}

/** The "fast path": the whole site as one plain, accessible page (also the lite mode). */
export function PlainPage() {
  const lang = useSite((s) => s.lang);
  const recruiter = useSite((s) => s.recruiter);
  const ordered = orderBySuggestion(projects, recruiter?.suggestedOrder);
  return (
    <>
      <a className="skip" href="#content">{t(ui.skip, lang)}</a>
      <div className="shell">
        <aside className="rail">
          <Controls />
          <nav aria-label={t(ui.chapters, lang)}>
            <ul>
              {ordered.map((p) => (
                <li key={p.id}><a href={`#${p.id}`}>{t(p.title, lang)}</a></li>
              ))}
              <li><a href="#skills">{t(ui.skills, lang)}</a></li>
              <li><a href="#achievements">{t(ui.achievements, lang)}</a></li>
              <li><a href="#contact">{t(ui.contact, lang)}</a></li>
            </ul>
          </nav>
        </aside>

        <main id="content">
          <Hero lang={lang} />
          {ordered.map((p) => <ProjectBand key={p.id} p={p} lang={lang} match={recruiter?.matches.find((m) => m.projectId === p.id)} />)}
          <SkillsSection lang={lang} />
          <AchievementsSection lang={lang} />
          <CostStrip lang={lang} />
          <ContactSection lang={lang} />
          <footer className="note">{t(ui.footer, lang)}</footer>
        </main>
      </div>
    </>
  );
}
