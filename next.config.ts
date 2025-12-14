import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 👇 VERY IMPORTANT: disable Turbopack
  experimental: {
    turbo: false,
  },

  // 👇 Keep heavy Node-only packages out of client bundles
  serverExternalPackages: [
    "pdf2json",
    "chromadb",
    "pdf-parse",
    "@chroma-core/default-embed",
  ],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
