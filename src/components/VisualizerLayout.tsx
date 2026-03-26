
"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import VisualizerIntro from "./VisualizerIntro";
import VisualizerOptions from "./VisualizerOptions";
import AuthModal from "./visualizer/AuthModal";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function VisualizerLayout() {
  const [roomId, setRoomId] = useState<number | null>(null);

  const [savedDesign, setSavedDesign] = useState<{
    link: string;
    image: string;
    designId: string;
  } | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [designHash, setDesignHash] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingSave, setPendingSave] = useState<any>(null);

  const lastSavedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.replace("#", ""));

    const room = params.get("room");
    const design = params.get("design");

    if (room) setRoomId(Number(room));
    if (design) setDesignHash(design);

    window.history.replaceState({}, document.title, "/visualiser");
  }, []);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "SAVE_DESIGN") {
        const { link, image, designId } = event.data.payload;

        setSavedDesign({ link, image, designId });
        setShowModal(true);
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const handleSaveToBackend = async (design: any) => {
    try {
      if (isSaving) return;

      const token = sessionStorage.getItem("pgatoken");

      if (!token) {
        setPendingSave(design);
        setShowAuthModal(true);
        return;
      }

      if (lastSavedIdRef.current === design.designId) {
        alert("⚠️ Design already saved!");
        return;
      }

      setIsSaving(true);

      const blob = await fetch(design.image).then((res) => res.blob());

      const formData = new FormData();
      formData.append("image", blob, "design.jpg");
      formData.append("redirectUrl", design.link);

      // 🔥 CLEAN PROFESSIONAL FILENAME

      const roomMatch = design.link.match(/room=(\d+)/);
      const roomName = roomMatch ? `room${roomMatch[1]}` : "room";

      const now = new Date();

      const datePart =
        now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, "0") +
        String(now.getDate()).padStart(2, "0");

      const timePart =
        String(now.getHours()).padStart(2, "0") +
        String(now.getMinutes()).padStart(2, "0");

      const timestamp = `${datePart}_${timePart}`;

      const fileName = `${roomName}_${timestamp}`;

      formData.append("imageName", fileName);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}saved_rooms/save`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error("Save failed");

      if (data.message === "Already exists") {
        alert("⚠️ Design already saved!");
        lastSavedIdRef.current = design.designId;
        return;
      }

      lastSavedIdRef.current = design.designId;
      alert("✅ Design saved successfully!");

    } catch (err) {
      console.error(err);
      alert("❌ Failed to save design");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoginSuccess = () => {
    setShowAuthModal(false);

    if (pendingSave) {
      handleSaveToBackend(pendingSave);
      setPendingSave(null);
    }
  };

  if (roomId !== null) {
    return (
      <>
        <iframe
          src={`/app/${roomId}.html${
            designHash ? `#design-data:${designHash}` : ""
          }`}
          style={{ width: "100%", height: "100vh", border: "none" }}
        />

        {showModal && savedDesign && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-[420px] shadow-xl">
              <h2 className="text-lg font-semibold mb-4">
                Design Saved
              </h2>

              <img
                src={savedDesign.image}
                className="rounded-md border mb-4"
              />

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
                  onClick={() => handleSaveToBackend(savedDesign)}
                  disabled={isSaving}
                  className="bg-green-600 text-white px-4 py-2 rounded"
                >
                  {isSaving ? "Saving..." : "Save"}
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

        <AuthModal
          open={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleLoginSuccess}
        />
      </>
    );
  }

  return (
    <section className="h-screen w-full relative bg-[#f8f8f6] overflow-hidden flex items-center justify-center p-4 lg:p-8">
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-amber-200/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-slate-200/40 rounded-full blur-[140px]" />

      <div className="relative max-w-[1400px] w-full h-full max-h-[900px] grid grid-cols-12 gap-6 lg:gap-8 items-stretch">
        
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: EASE_OUT }}
          className="col-span-12 lg:col-span-4 bg-white rounded-[32px] p-8 lg:p-12 shadow flex flex-col"
        >
          <VisualizerIntro />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: EASE_OUT }}
          className="col-span-12 lg:col-span-8 bg-slate-900/5 rounded-[32px] p-6 lg:p-10 flex flex-col justify-center"
        >
          <VisualizerOptions onComplete={setRoomId} />
        </motion.div>
      </div>
    </section>
  );
}

