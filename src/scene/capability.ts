/** Decides whether the visitor gets the 3D journey or the plain "fast path" page by default (plan section 6.5). */
export interface CapabilityEnv {
  webgl: boolean;
  reducedMotion: boolean;
  width: number;
  saveData: boolean;
  cores?: number;
}

/** Lite when 3D cannot or should not run: no WebGL, reduced motion, data saver, a narrow screen, or a very weak CPU. */
export function shouldUseLite(env: CapabilityEnv): boolean {
  if (!env.webgl) return true;
  if (env.reducedMotion) return true;
  if (env.saveData) return true;
  if (env.width < 900) return true;
  if (env.cores !== undefined && env.cores <= 2) return true;
  return false;
}

export function detectEnv(): CapabilityEnv {
  if (typeof window === "undefined") return { webgl: false, reducedMotion: false, width: 0, saveData: false };
  let webgl = false;
  try {
    const canvas = document.createElement("canvas");
    webgl = !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    webgl = false;
  }
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  return {
    webgl,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    width: window.innerWidth,
    saveData: !!nav.connection?.saveData,
    cores: navigator.hardwareConcurrency,
  };
}
