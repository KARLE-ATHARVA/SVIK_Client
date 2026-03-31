// next.config.ts
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const remoteAssetBase = String(
  process.env.NEXT_PUBLIC_REMOTE_ASSET_BASE ||
    process.env.NEXT_PUBLIC_REMOTE_ASSET_BASE_URL ||
    process.env.NEXT_PUBLIC_ASSET_BASE ||
    process.env.NEXT_PUBLIC_ASSET_BASE_URL ||
    ""
).trim();
const normalizedRemoteAssetBase = remoteAssetBase
  ? remoteAssetBase.replace(/\/+$/, "") + "/"
  : "";

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
    if (!isDev || !/^https?:\/\//i.test(normalizedRemoteAssetBase)) {
      return [];
    }

    return [
      {
        source: "/__asset_proxy__/:path*",
        destination: `${normalizedRemoteAssetBase}:path*`,
      },
    ];
  },
};

export default nextConfig;
