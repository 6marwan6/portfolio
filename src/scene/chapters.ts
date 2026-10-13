import type { Localized } from "../content/types";
import { ui } from "../i18n/ui";

export type ChapterId = "me" | "rootx" | "intelliroom" | "mari" | "shorts-maker" | "education";

export interface Chapter {
  id: ChapterId;
  kind: "me" | "project" | "education";
  /** Title for chapters that are not projects; projects use their content title. */
  title?: Localized;
  accentHex: string;
  /** Station position in the studio (x, y, z). */
  position: [number, number, number];
}

/** Journey order is fixed (plan section 4). */
export const chapters: Chapter[] = [
  { id: "me", kind: "me", title: ui.me, accentHex: "#0E1B2B", position: [0, 0, 0] },
  { id: "rootx", kind: "project", accentHex: "#1F4BFF", position: [6, 0, -9] },
  { id: "intelliroom", kind: "project", accentHex: "#E8912D", position: [-3, 0, -19] },
  { id: "mari", kind: "project", accentHex: "#F0485F", position: [5, 0, -29] },
  { id: "shorts-maker", kind: "project", accentHex: "#6B4DFF", position: [-4, 0, -39] },
  { id: "education", kind: "education", title: ui.education, accentHex: "#0E1B2B", position: [0, 0, -49] },
];

export const chapterIndex = (id: ChapterId): number => chapters.findIndex((c) => c.id === id);
