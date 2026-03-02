"use client";

import { useEffect, useState } from "react";
import { Maximize2, RotateCcw, MousePointer2, Plus } from "lucide-react";
import { CONCEPT_IMAGE_BASE_URL } from "@/lib/constants";

export default function PreviewArea() {
  const [bgImage, setBgImage] = useState(`${CONCEPT_IMAGE_BASE_URL}kitchen1.png`);

  useEffect(() => {
    // Check if a specific variant was selected
    const savedImage = localStorage.getItem("selected_room_image");
    if (savedImage) {
      setBgImage(savedImage);
    }
  }, []);

  return (
    <div className="absolute inset-0 bg-[#F9F7F2] flex items-center justify-center">
      {/* Background Room - Dynamically updated from localStorage */}
      <img
        src={bgImage}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        alt="Room"
      />

      {/* Architectural frame */}
      <div className="absolute inset-0 border border-white/10 pointer-events-none z-20" />

      {/* Hotspots */}
      <div className="absolute top-[45%] left-[48%] z-30">
        <button className="relative group/hotspot">
          <span className="absolute inset-0 bg-amber-400/40 rounded-full animate-ping" />
          <div className="relative flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full text-[10px] uppercase tracking-widest shadow-2xl border border-amber-500/20 group-hover/hotspot:bg-amber-500 transition-colors">
            <Plus size={12} /> Wall Surface
          </div>
        </button>
      </div>

      {/* Tool Dock */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-30">
        {[Maximize2, RotateCcw, MousePointer2].map((Icon, i) => (
          <button
            key={i}
            className="p-4 rounded-2xl bg-white shadow-xl hover:bg-slate-900 hover:text-white transition-all transform active:scale-95"
          >
            <Icon size={18} />
          </button>
        ))}
      </div>
    </div>
  );
}