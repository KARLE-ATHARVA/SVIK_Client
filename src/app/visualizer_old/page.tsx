// src/app/visualizer/page.tsx
"use client";

import dynamic from "next/dynamic";

// ✅ Framer Motion MUST be loaded client-side only for static export
const VisualizerLayout = dynamic(
  () => import("@/components/VisualizerLayout"),
  { ssr: false }
);

export default function VisualizerPage() {
  return <VisualizerLayout />;
}
