// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
