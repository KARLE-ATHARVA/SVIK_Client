// src/app/visualizer/page.tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";

// ✅ Framer Motion MUST be loaded client-side only for static export
const VisualizerLayout = dynamic(
  () => import("@/components/VisualizerLayout"),
  { ssr: false }
);

export default function VisualizerPage() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash || "";
    window.location.replace(`/visualizer${hash}`);
  }, []);

  return <VisualizerLayout />;
}
