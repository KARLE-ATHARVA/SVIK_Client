"use client";

import dynamic from "next/dynamic";

const VisualizerLayout = dynamic(
  () => import("@/components/VisualizerLayout"),
  { ssr: false }
);

export default function VisualizerPage() {
  return <VisualizerLayout />;
}
