import { site } from "./site";
import { rootx } from "./rootx";
import { intelliroom } from "./intelliroom";
import { mari } from "./mari";
import { shortsMaker } from "./shorts-maker";
import type { Project } from "./types";

export { site };
export const projects: Project[] = [rootx, intelliroom, mari, shortsMaker].sort((a, b) => a.order - b.order);
export * from "./types";
export * from "./selectors";
