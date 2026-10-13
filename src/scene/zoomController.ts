import gsap from "gsap";
import { projects } from "../content";
import { useSite } from "../state/store";
import type { ChapterId } from "./chapters";
import { UI_AT, ZOOM_DURATION } from "./zoom";
import { zoomClock } from "./zoomClock";

const reducedMotion = () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let tween: gsap.core.Tween | null = null;

/**
 * The signature zoom-in. Projects with system views zoom into the station and open the graph;
 * the Me and Education chapters just open their detail panel. Reduced motion skips the animation.
 * Interruptible: calling dive/surface mid-flight continues from the current moment of the timeline.
 */
export function dive(id: ChapterId): void {
  const store = useSite.getState();
  const project = projects.find((p) => p.id === id);
  if (!project || project.views.length === 0) {
    store.openPanel(id);
    return;
  }
  const view = project.views[0]!.id;
  tween?.kill();
  if (reducedMotion()) {
    zoomClock.t = ZOOM_DURATION;
    store.setZoom({ id, view, phase: "open", ui: true });
    return;
  }
  store.setZoom({ id, view, phase: "entering", ui: zoomClock.t >= UI_AT });
  tween = gsap.to(zoomClock, {
    t: ZOOM_DURATION,
    duration: Math.max(0.2, ZOOM_DURATION - zoomClock.t),
    ease: "none",
    onUpdate: () => {
      const z = useSite.getState().zoom;
      if (z && !z.ui && zoomClock.t >= UI_AT) useSite.getState().setZoom({ ...z, ui: true });
    },
    onComplete: () => {
      const z = useSite.getState().zoom;
      if (z) useSite.getState().setZoom({ ...z, phase: "open", ui: true });
    },
  });
}

export function surface(): void {
  const store = useSite.getState();
  const z = store.zoom;
  if (!z) return;
  tween?.kill();
  if (reducedMotion()) {
    zoomClock.t = 0;
    store.setZoom(null);
    return;
  }
  store.setZoom({ ...z, phase: "leaving", ui: false });
  tween = gsap.to(zoomClock, {
    t: 0,
    duration: Math.max(0.25, zoomClock.t * 0.75),
    ease: "none",
    onComplete: () => useSite.getState().setZoom(null),
  });
}
