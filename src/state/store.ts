import { create } from "zustand";
import type { Lang } from "../content/types";
import type { ChapterId } from "../scene/chapters";
import { detectEnv, shouldUseLite } from "../scene/capability";
import { zoomClock } from "../scene/zoomClock";
import type { RecruiterResult } from "../agent/types";

export type Mode = "journey" | "plain";

export interface ZoomState {
  id: ChapterId;
  /** Id of the system view shown in the stage. */
  view: string;
  phase: "entering" | "open" | "leaving";
  /** True once the graph and side panel are visible (from 1.0 s of the timeline). */
  ui: boolean;
}

interface SiteState {
  lang: Lang;
  mode: Mode;
  /** Index of the chapter the visitor is nearest to in the journey. */
  active: number;
  /** Chapter whose detail panel is open (stands in for the M2 zoom-in). */
  panel: ChapterId | null;
  /** The zoom-in currently shown (null when idle). */
  zoom: ZoomState | null;
  webgl: boolean;
  agentOpen: boolean;
  recruiterOpen: boolean;
  /** Job description pre-filled by the agent (generate_onepager tool). */
  recruiterJd: string;
  recruiter: RecruiterResult | null;
  /** A step the agent asked to highlight inside a system view. */
  highlight: { projectId: string; viewId: string; nodeId: string } | null;
  setAgentOpen: (open: boolean) => void;
  setRecruiterOpen: (open: boolean, jd?: string) => void;
  setRecruiter: (r: RecruiterResult | null) => void;
  setHighlight: (h: SiteState["highlight"]) => void;
  setLang: (l: Lang) => void;
  setMode: (m: Mode) => void;
  setActive: (i: number) => void;
  openPanel: (id: ChapterId) => void;
  closePanel: () => void;
  setZoom: (z: ZoomState | null) => void;
  setZoomView: (view: string) => void;
}

const env = detectEnv();

export const useSite = create<SiteState>((set) => ({
  lang: typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("ar") ? "ar" : "en",
  mode: shouldUseLite(env) ? "plain" : "journey",
  active: 0,
  panel: null,
  zoom: null,
  webgl: env.webgl,
  agentOpen: false,
  recruiterOpen: false,
  recruiterJd: "",
  recruiter: null,
  highlight: null,
  setAgentOpen: (agentOpen) => set({ agentOpen }),
  setRecruiterOpen: (recruiterOpen, jd) => set((st) => ({ recruiterOpen, recruiterJd: jd ?? st.recruiterJd })),
  setRecruiter: (recruiter) => set({ recruiter }),
  setHighlight: (highlight) => set({ highlight }),
  setLang: (lang) => set({ lang }),
  setMode: (mode) => {
    zoomClock.t = 0;
    set({ mode, panel: null, zoom: null });
  },
  setActive: (active) => set({ active }),
  openPanel: (panel) => set({ panel }),
  closePanel: () => set({ panel: null }),
  setZoom: (zoom) => {
    if (zoom === null) zoomClock.t = 0;
    set({ zoom });
  },
  setZoomView: (view) => set((s) => (s.zoom ? { zoom: { ...s.zoom, view } } : s)),
}));
