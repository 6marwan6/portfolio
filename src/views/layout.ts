import { layouts } from "../content/layouts.generated";
import { layoutKey, viewSignature } from "../content/signature";
import type { GraphLayout } from "../content/layout-types";
import type { SystemView } from "../content/types";
import { fallbackLayout } from "./graphGeometry";

/** The build-time layout when it matches the view's structure, otherwise a simple fallback (never crashes on stale data). */
export function getLayout(projectId: string, view: SystemView): GraphLayout {
  const generated = layouts[layoutKey(projectId, view.id)];
  return generated && generated.sig === viewSignature(view) ? generated : fallbackLayout(view);
}
