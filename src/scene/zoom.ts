/** Timeline of the signature zoom-in (plan section 6.3), about 1.6 seconds, all values eased 0..1. */
export const ZOOM_DURATION = 1.6;
/** The graph and side panel become visible from this moment. */
export const UI_AT = 1.0;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => x * x * (3 - 2 * x);

export function zoomPhases(t: number) {
  return {
    /** 0 to 0.5 s: the camera dollies in on the station. */
    push: ease(clamp01(t / 0.5)),
    /** 0.5 to 1.0 s: the station dissolves into points that fly to the graph nodes. */
    dissolve: ease(clamp01((t - 0.5) / 0.5)),
    /** 1.0 to 1.6 s: nodes settle and the side panel slides in. */
    ui: ease(clamp01((t - UI_AT) / (ZOOM_DURATION - UI_AT))),
  };
}

/** The close-up pose in front of a station. */
export function closePose(pos: [number, number, number]) {
  return {
    camera: [pos[0], 1.5, pos[2] + 3.6] as [number, number, number],
    target: [pos[0], 1.3, pos[2]] as [number, number, number],
  };
}
