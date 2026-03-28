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
    localStorage.setItem("visualizer_room_id", roomId);
    if (design) {
      localStorage.setItem("visualizer_design_hash", design);
    } else {
      localStorage.removeItem("visualizer_design_hash");
    }
    sessionStorage.setItem("visualizer_intent", "1");
    localStorage.setItem("visualizer_intent_once", "1");
    window.dispatchEvent(new CustomEvent("visualizer-room-change"));
    window.location.replace("/visualizer");
  }, [roomId]);

  return null;
}
