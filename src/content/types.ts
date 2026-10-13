export type Lang = "en" | "ar";

/** Every user-facing string. `arReviewed` must be true before launch (see scripts/validate-content.ts --production). */
export interface Localized {
  en: string;
  ar: string;
  arReviewed: boolean;
}

export type Status = "shipped" | "in-progress" | "specified";
export type Confidentiality = "public" | "redacted" | "private";
export type Credit = "me" | "team" | "shared";
export type ProjectId = "rootx" | "intelliroom" | "mari" | "shorts-maker";

export interface SystemNode {
  id: string;
  label: Localized;
  detail?: Localized;
  group?: string;
  /** Required on every node of a "shared" view. */
  credit?: "me" | "team";
}

export interface SystemView {
  id: string;
  title: Localized;
  credit: Credit;
  /** true renders a visible "Illustrative, sample data" ribbon. */
  illustrative: boolean;
  nodes: SystemNode[];
  edges: { from: string; to: string; label?: Localized }[];
  flows?: { id: string; label: Localized; path: string[] }[];
  callouts?: { nodeId: string; text: Localized }[];
}

export interface StationConfig {
  model: string;
  cameraPose: { position: [number, number, number]; target: [number, number, number] };
  accent: string;
  fallbackImage: string;
}

export interface Project {
  id: ProjectId;
  order: number;
  status: Status;
  statusNote?: Localized;
  confidentiality: Confidentiality;
  title: Localized;
  /** Marwan's precise role. */
  role: Localized;
  teamSize?: number;
  /** Teammates named with their LinkedIn profile (Marwan authorized sharing). Never emails or phone numbers. */
  teammates?: { name: string; linkedin: string }[];
  /** Required whenever teamSize > 1: who built what. */
  contribution?: { mine: Localized[]; team: Localized[] };
  oneLiner: Localized;
  story: Localized[];
  stack: string[];
  /** Links with verified=false are never rendered. */
  links: { label: Localized; url: string; verified: boolean }[];
  metrics: { label: Localized; value: string; source: "marwan" | "cv" | "plan" }[];
  /** Entries with confirmed=false are hidden. */
  cost?: { label: Localized; value: Localized; confirmed: boolean };
  /** Open-source credits. The link is rendered only when verified=true. */
  credits?: { name: string; url: string; license?: string; verified: boolean }[];
  disclaimers: Localized[];
  views: SystemView[];
  /** M1: 3D station configuration. */
  station?: StationConfig;
  /** Recruiter matching. Must reflect what Marwan personally built. */
  tags: string[];
  /** Extra grounding for the agent. Never shown to visitors. */
  agentNotes?: string;
}

export interface Skill {
  group: string;
  name: string;
  /** Shown only when the skill has been used for more than one year. */
  years?: number;
  level?: Localized;
}

export interface Site {
  owner: {
    name: Localized;
    headline: Localized;
    positioning: Localized;
    location: Localized;
    languages: Localized;
    education: Localized;
    training: Localized;
  };
  /** No phone number, by rule. */
  contact: { email: string; github: string; linkedin: string };
  skills: Skill[];
  achievements: { id: string; text: Localized; source: "marwan" | "cv" }[];
  disclaimers: Localized[];
}

export const L = (en: string, ar: string): Localized => ({ en, ar, arReviewed: false });
