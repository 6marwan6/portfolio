import { Component, lazy, Suspense, useEffect, type ReactNode } from "react";
import { t } from "./content";
import { ui } from "./i18n/ui";
import { useSite } from "./state/store";
import { PlainPage } from "./views/Plain";
import { JourneyUI } from "./views/JourneyUI";
import { Launchers } from "./views/Launchers";

// The 3D bundle (three.js and friends) is loaded only when the journey is shown.
const JourneyScene = lazy(() => import("./scene/JourneyScene"));

/** If anything in the 3D scene throws (for example a lost WebGL context), fall back to the plain page. */
class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function JourneyPage() {
  const lang = useSite((s) => s.lang);
  const setMode = useSite((s) => s.setMode);
  return (
    <div className="journey">
      <SceneBoundary onError={() => setMode("plain")}>
        <Suspense fallback={<p className="loading" role="status">{t(ui.loading, lang)}</p>}>
          <JourneyScene />
        </Suspense>
      </SceneBoundary>
      <div className="spacer" aria-hidden="true" />
      <JourneyUI />
    </div>
  );
}

export function App() {
  const lang = useSite((s) => s.lang);
  const mode = useSite((s) => s.mode);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [mode]);

  return (
    <>
      {mode === "journey" ? <JourneyPage /> : <PlainPage />}
      <Launchers />
    </>
  );
}
