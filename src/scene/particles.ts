/** Deterministic particles for the "station dissolves into the graph" effect (pure, so it can be unit tested). */
export const PARTICLES_PER_NODE = 28;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => x * x * (3 - 2 * x);

export function makeParticles(count: number, origin: [number, number, number], seed = 7) {
  const rnd = mulberry32(seed);
  const start = new Float32Array(count * 3);
  const delay = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    start[i * 3] = origin[0] + (rnd() - 0.5) * 4.4;
    start[i * 3 + 1] = origin[1] + 0.2 + rnd() * 2.4;
    start[i * 3 + 2] = origin[2] + (rnd() - 0.5) * 1.6;
    delay[i] = rnd();
  }
  return { start, delay };
}

/** Position of particle i for a dissolve value 0..1; each particle leaves at its own moment. */
export function particlePosition(i: number, start: Float32Array, target: Float32Array, delay: Float32Array, dissolve: number): [number, number, number] {
  const q = ease(clamp01(dissolve * 1.5 - delay[i]! * 0.5));
  const sx = start[i * 3]!;
  const sy = start[i * 3 + 1]!;
  const sz = start[i * 3 + 2]!;
  return [sx + (target[i * 3]! - sx) * q, sy + (target[i * 3 + 1]! - sy) * q, sz + (target[i * 3 + 2]! - sz) * q];
}
