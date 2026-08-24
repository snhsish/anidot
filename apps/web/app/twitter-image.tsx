import { buildOgImage, ogSize, ogContentType, ogAlt } from "@/lib/og-image";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = ogAlt;

export default function Image() {
  return buildOgImage();
}
