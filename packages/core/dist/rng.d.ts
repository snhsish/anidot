/** Deterministic, seedable PRNG (mulberry32). Same seed => same sequence. */
export declare class Rng {
    private state;
    constructor(seed: number);
    /** Next float in [0, 1). */
    next(): number;
    /** Next integer in [min, max] inclusive. */
    int(min: number, max: number): number;
    /** Next float in [min, max). */
    range(min: number, max: number): number;
}
/** Convenience: build an Rng from any seed (number or string). */
export declare function makeRng(seed: number | string): Rng;
//# sourceMappingURL=rng.d.ts.map