"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function VisualizerPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [roomId, setRoomId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get("room");

    if (!id) {
      // If no room → redirect back (safe fallback)
      router.replace("/visualiser");
      return;
    }

    // Optional: validation (only numbers allowed)
    if (!/^\d+$/.test(id)) {
      router.replace("/visualiser");
      return;
    }

    setRoomId(id);
  }, [searchParams, router]);

  if (!roomId) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading visualizer...</p>
      </div>
    );
  }

  return (
    <iframe
      src={`/app/${roomId}.html#`}
      style={{
        width: "100%",
        height: "100vh",
        border: "none",
      }}
    />
  );
}