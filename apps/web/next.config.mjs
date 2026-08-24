/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@bitmapper/core",
    "@bitmapper/renderer-svg",
    "@bitmapper/renderer-gif",
    "@bitmapper/renderer-canvas",
    "@bitmapper/ui",
  ],
};

export default nextConfig;
