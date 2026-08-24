import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AniDot — Animated Dot-Matrix Converter",
  description: "Turn any image into a flickering dot-matrix bitmap.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased font-manrope">{children}</body>
    </html>
  );
}
