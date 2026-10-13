/** Pure scroll-to-journey math (no three.js), so it can be unit tested. */

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smoothstep = (x: number) => x * x * (3 - 2 * x);

/** Fraction of each segment where the camera holds still next to a station, at each end. */
export const DWELL = 0.2;

/**
 * Maps scroll progress p (0..1) to a curve parameter u (0..1) for a path through n stations.
 * The camera nearly holds at each station (dwell zones) and eases between them.
 */
export function progressToCurve(p: number, n: number, dwell = DWELL): number {
  if (n < 2) return 0;
  const x = clamp01(p) * (n - 1);
  const seg = Math.min(Math.floor(x), n - 2);
  const local = x - seg;
  let eased: number;
  if (local < dwell) eased = 0;
  else if (local > 1 - dwell) eased = 1;
  else eased = smoothstep((local - dwell) / (1 - 2 * dwell));
  return (seg + eased) / (n - 1);
}

/** The station the visitor is currently nearest to. */
export function activeChapterIndex(p: number, n: number): number {
  return Math.min(n - 1, Math.max(0, Math.round(clamp01(p) * (n - 1))));
}

/** Scroll position (px) that centers station i. */
export function chapterScrollTop(i: number, n: number, maxScroll: number): number {
  if (n < 2) return 0;
  return (i / (n - 1)) * Math.max(0, maxScroll);
}
