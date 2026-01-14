import { Suspense } from "react";
import VisualizerClient from "./VisualizerClient";

export default function VisualizerPage() {
  return (
    <Suspense fallback={<div className="h-screen w-screen" />}>
      <VisualizerClient />
    </Suspense>
  );
}
