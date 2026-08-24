export const siteConfig = {
  name: "AniDot",
  title: "AniDot — Animated Dot-Matrix Converter",
  description:
    "Turn any image into a flickering, animated dot-matrix bitmap. Convert photos and logos into dot-grid art and export as static/animated SVG, GIF, PNG frames, or WebM — all in the browser.",
  keywords: [
    "dot matrix",
    "dot grid",
    "pixel art",
    "animated svg",
    "gif maker",
    "image to svg",
    "LED matrix",
    "flicker animation",
    "dot art",
    "bitmap converter",
  ],
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://anidot.vercel.app",
  ogImageAlt: "AniDot — Animated Dot-Matrix Converter",
  twitterHandle: "@anidot",
  creator: "AniDot",
  locale: "en_US",
} as const;
