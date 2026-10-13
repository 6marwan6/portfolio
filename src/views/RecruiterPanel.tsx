import { useState } from "react";
import { projects, t } from "../content";
import { matchJob } from "../agent/client";
import { openOnePager } from "../agent/onepager";
import { ui } from "../i18n/ui";
import { chapters } from "../scene/chapters";
import { scrollToChapter } from "../scene/navigation";
import { useSite } from "../state/store";
import { useDialog } from "./useDialog";

function Recruiter() {
  const { lang, mode, recruiterJd, recruiter, setRecruiter } = useSite();
  const close = () => useSite.getState().setRecruiterOpen(false);
  const { container, firstFocus } = useDialog(close);
  const [jd, setJd] = useState(recruiterJd);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const title = (id: string) => (chapters.find((c) => c.id === id)?.title ? t(chapters.find((c) => c.id === id)!.title!, lang) : t(projects.find((p) => p.id === id)!.title, lang));

  const run = async () => {
    if (!jd.trim() || busy) return;
    setBusy(true);
    setError(null);
    const out = await matchJob(jd, lang);
    setBusy(false);
    if ("error" in out && !("matches" in out)) setError(out.error);
    else setRecruiter(out as Exclude<typeof out, { error: string }>);
  };

  const first = recruiter?.suggestedOrder[0];
  return (
    <div className="chat" role="dialog" aria-modal="true" aria-label={t(ui.recruiterTitle, lang)} ref={container}>
      <header className="chat-head">
        <div>
          <h2>{t(ui.recruiterTitle, lang)}</h2>
          <p className="note">{t(ui.recruiterHelp, lang)}</p>
        </div>
        <button type="button" className="btn btn-small" ref={firstFocus} onClick={close}>{t(ui.close, lang)}</button>
      </header>

      <div className="chat-log">
        <label htmlFor="jd">{t(ui.recruiterField, lang)}</label>
        <textarea id="jd" value={jd} onChange={(e) => setJd(e.target.value)} rows={7} maxLength={8000} />
        <p>
          <button type="button" className="btn btn-solid" onClick={run} disabled={busy || !jd.trim()}>{busy ? `${t(ui.recruiterBusy, lang)}…` : t(ui.recruiterGo, lang)}</button>
        </p>
        {error && <p className="chat-error" role="alert">{error}</p>}

        {recruiter && (
          <div aria-live="polite">
            {recruiter.fallback && <p className="note">{t(ui.recruiterFallback, lang)}</p>}
            <h3>{t(ui.recruiterFit, lang)}</h3>
            <p>{recruiter.summary}</p>
            <ul>
              {recruiter.matches.map((m) => (
                <li key={m.projectId}><strong>{title(m.projectId)}:</strong> {m.blurb}</li>
              ))}
            </ul>
            {recruiter.skillsMatched.length > 0 && <p><strong>{t(ui.recruiterSkills, lang)}:</strong> {recruiter.skillsMatched.join(lang === "ar" ? "، " : ", ")}</p>}
            {recruiter.gaps.length > 0 && (
              <>
                <h3>{t(ui.recruiterGaps, lang)}</h3>
                <ul>{recruiter.gaps.map((g, i) => <li key={i}>{g}</li>)}</ul>
              </>
            )}
            <p className="flows">
              <button type="button" className="btn btn-small" onClick={() => openOnePager(recruiter, lang)}>{t(ui.recruiterOnePager, lang)}</button>
              {first && mode === "journey" && (
                <button type="button" className="btn btn-small" onClick={() => { close(); scrollToChapter(first as never); }}>{t(ui.startWith, lang)}: {title(first)}</button>
              )}
              <button type="button" className="btn btn-small" onClick={() => setRecruiter(null)}>{t(ui.recruiterClear, lang)}</button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function RecruiterPanel() {
  const open = useSite((s) => s.recruiterOpen);
  return open ? <Recruiter /> : null;
}
