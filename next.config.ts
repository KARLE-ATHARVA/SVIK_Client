// next.config.ts
import type { NextConfig } from "next";

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
};

export default nextConfig;
