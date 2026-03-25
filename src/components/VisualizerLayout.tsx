// src/components/VisualizerLayout.tsx
"use client";

import { motion } from "framer-motion";
import { useState,useEffect } from "react";
import VisualizerIntro from "./VisualizerIntro";
import VisualizerOptions from "./VisualizerOptions";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function VisualizerLayout() {
  const [roomId, setRoomId] = useState<number | null>(null);

  // ✅ NEW STATE (for save functionality)
  const [savedDesign, setSavedDesign] = useState<{
    link: string;
    image: string;
  } | null>(null);

  const [showModal, setShowModal] = useState(false);

  // ✅ STORE DESIGN FROM URL
  const [designHash, setDesignHash] = useState<string | null>(null);

  // =========================================
  // ✅ READ URL HASH (IMPORTANT)
  // =========================================
  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.replace("#", ""));

    const room = params.get("room");
    const design = params.get("design");

    if (room) {
      setRoomId(Number(room));
    }

    if (design) {
      setDesignHash(design);
    }
    //clean url after reading
      window.history.replaceState(
    {},
    document.title,
    "/visualiser"
  );
  }, []);

  // =========================================
  // ✅ LISTEN TO IFRAME EVENTS (SAVE)
  // =========================================
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "SAVE_DESIGN") {
        const { link, image } = event.data.payload;

        setSavedDesign({ link, image });
        setShowModal(true);
      }
    };

    window.addEventListener("message", handler);

    return () => {
      window.removeEventListener("message", handler);
    };
  }, []);

  // =========================================
  // ✅ IFRAME VIEW
  // =========================================
  if (roomId !== null) {
    return (
      <>
        <iframe
          src={`/app/${roomId}.html${
            designHash ? `#design-data:${designHash}` : ""
          }`}
          style={{
            width: "100%",
            height: "100vh",
            border: "none",
          }}
        />

        {/* ✅ SAVE MODAL */}
        {showModal && savedDesign && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-[420px] shadow-xl">

              <h2 className="text-lg font-semibold mb-4">
                Design Saved
              </h2>

              {/* Preview Image */}
              <img
                src={savedDesign.image}
                className="rounded-md border mb-4"
              />

              {/* Link */}
              <input
                value={savedDesign.link}
                readOnly
                className="w-full border p-2 rounded mb-3 text-sm"
              />

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(savedDesign.link)
                  }
                  className="bg-black text-white px-4 py-2 rounded"
                >
                  Copy
                </button>

                <button
                  onClick={() => setShowModal(false)}
                  className="border px-4 py-2 rounded"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}
      </>
    );
  }


  return (
    <section className="h-screen w-full relative bg-[#f8f8f6] overflow-hidden flex items-center justify-center p-4 lg:p-8">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-amber-200/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-slate-200/40 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative max-w-[1400px] w-full h-full max-h-[900px] grid grid-cols-12 gap-6 lg:gap-8 items-stretch">
        
        {/* LEFT PANEL */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: EASE_OUT }}
          className="col-span-12 lg:col-span-4 bg-white rounded-[32px] p-8 lg:p-12 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] flex flex-col border border-slate-100 overflow-hidden"
        >
          <VisualizerIntro />
        </motion.div>

        {/* RIGHT PANEL */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: EASE_OUT }}
          className="col-span-12 lg:col-span-8 bg-slate-900/5 backdrop-blur-sm rounded-[32px] p-6 lg:p-10 border border-white/50 shadow-inner flex flex-col justify-center overflow-hidden"
        >
        <VisualizerOptions onComplete={setRoomId} />
        </motion.div>
      </div>
    </section>
  );
}
