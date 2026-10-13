import { useEffect, useRef } from "react";

/** Accessible dialog behavior: focus moves in, Tab is trapped, Escape closes, page scroll is locked, focus returns on close. */
export function useDialog(onClose: () => void) {
  const container = useRef<HTMLDivElement>(null);
  const firstFocus = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    firstFocus.current?.focus();
    document.body.classList.add("locked");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && container.current) {
        const f = container.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"])');
        if (f.length === 0) return;
        const first = f[0]!;
        const last = f[f.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("locked");
      previous?.focus();
    };
  }, [onClose]);

  return { container, firstFocus };
}
