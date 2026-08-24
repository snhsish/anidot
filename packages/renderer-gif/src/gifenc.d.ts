declare module "gifenc" {
  export interface GifFrameOptions {
    palette?: number[][];
    delay?: number;
    transparent?: boolean;
    transparentIndex?: number;
    repeat?: number;
    dispose?: number;
    first?: boolean;
  }
  export interface GifEncoder {
    writeFrame(
      index: Uint8Array | number[],
      width: number,
      height: number,
      options?: GifFrameOptions
    ): void;
    finish(): void;
    bytes(): Uint8Array;
    bytesView(): Uint8Array;
    reset(): void;
  }
  export function GIFEncoder(options?: {
    auto?: boolean;
    initialCapacity?: number;
  }): GifEncoder;
  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    options?: {
      format?: "rgb565" | "rgba4444" | "rgb444";
      oneBitAlpha?: boolean | number;
      clearAlpha?: boolean;
      clearAlphaThreshold?: number;
      useCaching?: boolean;
    }
  ): number[][];
  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: number[][],
    format?: "rgb565" | "rgba4444" | "rgb444"
  ): Uint8Array;
  const _default: typeof GIFEncoder;
  export default _default;
}
