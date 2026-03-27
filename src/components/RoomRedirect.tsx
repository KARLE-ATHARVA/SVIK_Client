"use client";

import { useEffect } from "react";

type RoomRedirectProps = {
  roomId: string;
};

export default function RoomRedirect({ roomId }: RoomRedirectProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash || "";
    let design = "";
    if (hash.startsWith("#design-data:")) {
      design = hash.substring("#design-data:".length);
    }
    const target = design
      ? `/visualizer#room=${roomId}&design=${design}`
      : `/visualizer#room=${roomId}`;
    window.location.replace(target);
  }, [roomId]);

  return null;
}
