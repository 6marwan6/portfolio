import { projects, t } from "../content";
import { ui } from "../i18n/ui";
import { surface } from "../scene/zoomController";
import { useSite } from "../state/store";
import { ProjectBand } from "./Plain";
import { ViewExplorer } from "./SystemGraph";
import { useDialog } from "./useDialog";

function ZoomDialog() {
  const lang = useSite((s) => s.lang);
  const zoom = useSite((s) => s.zoom)!;
  const setZoomView = useSite((s) => s.setZoomView);
  const recruiter = useSite((s) => s.recruiter);
  const { container, firstFocus } = useDialog(surface);
  const project = projects.find((p) => p.id === zoom.id)!;
  const view = project.views.find((v) => v.id === zoom.view) ?? project.views[0]!;

  return (
    <div className={`zoom zoom-${zoom.phase}${zoom.ui ? " zoom-ui" : ""}`} role="dialog" aria-modal="true" aria-label={t(project.title, lang)} ref={container} style={{ ["--accent" as string]: `var(--accent-${project.id})` }}>
      <div className="bar bar-top" aria-hidden="true" />
      <div className="bar bar-bottom" aria-hidden="true" />
      <section className="zoom-stage">{zoom.ui && <ViewExplorer key={view.id} projectId={project.id} view={view} lang={lang} />}</section>
      <aside className="zoom-side">
        <button type="button" className="btn zoom-close" ref={firstFocus} onClick={surface}>
          {t(ui.backToJourney, lang)}
        </button>
        {zoom.ui && (
          <>
            {project.views.length > 1 && (
              <div className="flows" role="group" aria-label={t(ui.views, lang)}>
                {project.views.map((v) => (
                  <button key={v.id} type="button" className="btn btn-small" aria-pressed={v.id === view.id} onClick={() => setZoomView(v.id)}>
                    {t(v.title, lang)}
                  </button>
                ))}
              </div>
            )}
            <ProjectBand p={project} lang={lang} showViews={false} match={recruiter?.matches.find((m) => m.projectId === project.id)} />
          </>
        )}
      </aside>
    </div>
  );
}

export function ZoomOverlay() {
  const zoom = useSite((s) => s.zoom);
  return zoom ? <ZoomDialog /> : null;
}
