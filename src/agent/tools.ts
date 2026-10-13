import { projects, t } from "../content";
import { ui } from "../i18n/ui";
import { chapters } from "../scene/chapters";
import { scrollToChapter } from "../scene/navigation";
import { dive } from "../scene/zoomController";
import { useSite } from "../state/store";
import type { ToolCall } from "./types";

/** Opens the "How it works" section for a project view on the plain page and scrolls to it. */
function showInPlainPage(projectId: string, viewId?: string): void {
  const band = document.getElementById(projectId);
  band?.scrollIntoView({ block: "start" });
  if (!band || !viewId) return;
  const view = projects.find((p) => p.id === projectId)?.views.find((v) => v.id === viewId);
  if (!view) return;
  const idx = projects.find((p) => p.id === projectId)!.views.findIndex((v) => v.id === viewId);
  band.querySelectorAll("details.view")[idx]?.setAttribute("open", "");
}

/**
 * Executes a whitelisted, already-validated tool call against the site and returns a short description for the chat.
 * The model only suggests; this is where the site decides what actually happens.
 */
export function runTool(call: ToolCall): string {
  const s = useSite.getState();
  const lang = s.lang;
  switch (call.name) {
    case "go_to_station": {
      const chapter = chapters.find((c) => c.id === call.args.id);
      if (!chapter) return "";
      if (s.zoom) s.setZoom(null);
      if (s.mode === "journey") scrollToChapter(chapter.id);
      else document.getElementById(chapter.id === "me" ? "content" : chapter.id === "education" ? "achievements" : chapter.id)?.scrollIntoView({ block: "start" });
      const title = chapter.title ? t(chapter.title, lang) : t(projects.find((p) => p.id === chapter.id)!.title, lang);
      return `${t(ui.chatShowing, lang)}: ${title}`;
    }
    case "open_detail": {
      const project = projects.find((p) => p.id === call.args.id);
      if (!project) return "";
      if (s.mode === "journey") {
        scrollToChapter(project.id);
        dive(project.id);
        if (call.args.viewId) useSite.getState().setZoomView(call.args.viewId);
      } else showInPlainPage(project.id, call.args.viewId);
      return `${t(ui.chatShowing, lang)}: ${t(project.title, lang)}`;
    }
    case "highlight_node": {
      const { projectId, viewId, nodeId } = call.args;
      const project = projects.find((p) => p.id === projectId);
      const view = project?.views.find((v) => v.id === viewId);
      const node = view?.nodes.find((n) => n.id === nodeId);
      if (!project || !view || !node) return "";
      if (s.mode === "journey") {
        if (!useSite.getState().zoom) {
          scrollToChapter(project.id);
          dive(project.id);
        }
        useSite.getState().setZoomView(viewId);
      } else showInPlainPage(projectId, viewId);
      useSite.getState().setHighlight({ projectId, viewId, nodeId });
      return `${t(ui.chatShowing, lang)}: ${t(node.label, lang)}`;
    }
    case "set_language":
      s.setLang(call.args.lang);
      return "";
    case "generate_onepager":
      s.setRecruiterOpen(true, call.args.jobDescription);
      return t(ui.recruiterTitle, lang);
    case "open_terminal":
      return ""; // The terminal arrives in milestone M5; the agent is not told it exists yet.
  }
}
