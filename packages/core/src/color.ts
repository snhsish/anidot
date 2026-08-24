/** Parse a hex color (#rgb or #rrggbb) into [r, g, b] (0..255). */
export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  const num = parseInt(h, 16);
  return [(num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff];
}

/** Parse any supported color string into [r, g, b]; falls back to black. */
export function parseColor(color: string): [number, number, number] {
  if (color.startsWith("#")) return hexToRgb(color);
  // rgb()/rgba()
  const m = color.match(/rgba?\(([^)]+)\)/i);
  if (m) {
    const parts = m[1].split(/[,\s/]+/).map(Number);
    return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
  }
  return [0, 0, 0];
}
