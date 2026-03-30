// next.config.ts
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  /* =========================
     STATIC EXPORT
     ========================= */
  output: "export",
  distDir: "dist",

  /* =========================
     IMAGE HANDLING (STATIC)
     ========================= */
  images: {
    unoptimized: true,
  },

  /* =========================
     PERFORMANCE
     ========================= */
  reactCompiler: true,
  async rewrites() {
    if (!isDev) {
      return [];
    }

    const remoteAssetBase = String(
      process.env.NEXT_PUBLIC_REMOTE_ASSET_BASE ||
        process.env.NEXT_PUBLIC_ASSET_BASE ||
        ""
    ).trim();

    if (!remoteAssetBase) {
      return [];
    }

    return [
      {
        source: "/__asset_proxy__/:path*",
        destination: `${remoteAssetBase.replace(/\/+$/, "")}/:path*`,
      },
    ];
  },
};

if (!isDev) {
  nextConfig.output = "export";
  nextConfig.distDir = "dist";
}

export default nextConfig;
