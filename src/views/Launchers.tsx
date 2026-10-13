import { t } from "../content";
import { ui } from "../i18n/ui";
import { useSite } from "../state/store";
import { AgentPanel } from "./AgentPanel";
import { RecruiterPanel } from "./RecruiterPanel";

/** The two AI entry points, available on both the 3D journey and the plain page, plus their panels. */
export function Launchers() {
  const lang = useSite((s) => s.lang);
  const { setAgentOpen, setRecruiterOpen } = useSite.getState();
  return (
    <>
      <div className="launchers">
        <button type="button" className="btn btn-solid" onClick={() => setAgentOpen(true)}>{t(ui.askMarwan, lang)}</button>
        <button type="button" className="btn" onClick={() => setRecruiterOpen(true)}>{t(ui.tailor, lang)}</button>
      </div>
      <AgentPanel />
      <RecruiterPanel />
    </>
  );
}
