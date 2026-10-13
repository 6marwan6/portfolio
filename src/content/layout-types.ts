export interface GraphLayout {
  /** Total layout size in layout units. */
  width: number;
  height: number;
  /** Signature of the view structure this layout was computed for (see signature.ts). */
  sig: string;
  /** Node centers in layout units (left-to-right as authored; mirrored at render time for right-to-left). */
  nodes: Record<string, { x: number; y: number }>;
}

export const NODE_W = 176;
export const NODE_H = 68;
export const NODE_SEP = 48;
export const RANK_SEP = 64;
export const MARGIN = 16;
