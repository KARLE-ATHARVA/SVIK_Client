"use client";

import { useParams, useRouter } from "next/navigation";
import { ROOM_MAP } from "";
import { useEffect, useState } from "react";

export default function VisualizerPage() {
  const params = useParams();
  const router = useRouter();

  const [roomId, setRoomId] = useState<number | null>(null);

  useEffect(() => {
    const slug = params.slug as string;

    const mappedRoom = ROOM_MAP[slug];

    if (!mappedRoom) {
      router.replace("/visualiser"); // fallback
      return;
    }

    setRoomId(mappedRoom);
  }, [params, router]);

  if (!roomId) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        Loading visualizer...
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