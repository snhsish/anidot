/** Deterministic, seedable PRNG (mulberry32). Same seed => same sequence. */
export class Rng {
  private state: number;

  constructor(seed: number) {
    // Ensure a non-zero 32-bit integer state.
    this.state = (Math.floor(seed) || 1) >>> 0;
  }

  /** Next float in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Next integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** Next float in [min, max). */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}

/** Convenience: build an Rng from any seed (number or string). */
export function makeRng(seed: number | string): Rng {
  if (typeof seed === "number") return new Rng(seed);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return new Rng(h >>> 0);
}
