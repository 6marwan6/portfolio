import { chapters, type ChapterId } from "./chapters";
import { chapterScrollTop } from "./progress";

const reduced = () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Scrolls the journey so that chapter i is centered. */
export function scrollToChapterIndex(i: number): void {
  const el = document.documentElement;
  const max = el.scrollHeight - window.innerHeight;
  const n = chapters.length;
  window.scrollTo({ top: chapterScrollTop(Math.min(n - 1, Math.max(0, i)), n, max), behavior: reduced() ? "auto" : "smooth" });
}

export function scrollToChapter(id: ChapterId): void {
  const i = chapters.findIndex((c) => c.id === id);
  if (i >= 0) scrollToChapterIndex(i);
}
