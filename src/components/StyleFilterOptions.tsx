"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FiChevronRight, FiCheck } from "react-icons/fi";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ASSET_BASE } from "@/lib/constants";

const applications = ["Floor", "Wall"];

const colors = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Grey", hex: "#808080" },
  { name: "Beige", hex: "#F5F5DC" },
  { name: "Blue", hex: "#1E3A8A" },
];

type StyleFilterOptionsProps = {
  onBack: () => void;
  onComplete: () => void;
  targetPath?: string;
  spaceType?: string;
};

export default function StyleFilterOptions({
  onBack,
  onComplete,
  targetPath = "/visualizerScreen",
  spaceType,
}: StyleFilterOptionsProps) {
  const [selectedApp, setSelectedApp] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const storedApp = localStorage.getItem("selected_application");
    if (!storedApp) return null;
    return (
      applications.find(
        (app) => app.toLowerCase() === storedApp.toLowerCase()
      ) ?? null
    );
  });
  const [selectedColor, setSelectedColor] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const storedColor = localStorage.getItem("selected_color");
    if (!storedColor) return null;
    return (
      colors.find(
        (color) => color.name.toLowerCase() === storedColor.toLowerCase()
      )?.name ?? null
    );
  });
  const router = useRouter();

  const navigateTo = (path: string) => {
    if (typeof window !== "undefined" && path.startsWith("/visualizer#")) {
      const rawHash = path.split("#")[1] || "";
      const parts = rawHash.split("&");
      let room: string | null = null;
      let design: string | null = null;
      for (const part of parts) {
        if (!part) continue;
        const eq = part.indexOf("=");
        const key = eq >= 0 ? part.slice(0, eq) : part;
        const val = eq >= 0 ? part.slice(eq + 1) : "";
        if (key === "room") {
          room = val || null;
        } else if (key === "design") {
          design = val || null;
        }
      }
      if (room) {
        localStorage.setItem("visualizer_room_id", room);
        if (design) {
          localStorage.setItem("visualizer_design_hash", design);
        } else {
          localStorage.removeItem("visualizer_design_hash");
        }
        sessionStorage.setItem("visualizer_intent", "1");
        localStorage.setItem("visualizer_intent_once", "1");
        window.dispatchEvent(
          new CustomEvent("visualizer-room-select", {
            detail: { room, design },
          })
        );
      }
      window.history.replaceState({}, "", "/visualizer");
      return;
    }
    router.push(path);
  };

  const handleProceed = () => {
    onComplete();
    const assetBase = String(ASSET_BASE ?? "").trim();
    if (assetBase) {
      localStorage.setItem("visualizer_asset_base", assetBase);
    }

    if (spaceType) {
      localStorage.setItem("selected_space_type", spaceType.toLowerCase());
    }

    // Keep storage in sync with current UI selection.
    if (selectedApp) {
      localStorage.setItem("selected_application", selectedApp);
    } else {
      localStorage.removeItem("selected_application");
    }

    if (selectedColor) {
      localStorage.setItem("selected_color", selectedColor);
    } else {
      localStorage.removeItem("selected_color");
    }

    navigateTo(targetPath);
  };

  const handleSkip = () => {
    const assetBase = String(ASSET_BASE ?? "").trim();
    if (assetBase) {
      localStorage.setItem("visualizer_asset_base", assetBase);
    }
    if (spaceType) {
      localStorage.setItem("selected_space_type", spaceType.toLowerCase());
    }
    localStorage.removeItem("selected_application");
    localStorage.removeItem("selected_color");
    navigateTo(targetPath);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full h-full flex flex-col justify-between overflow-hidden px-2 pt-2"
    >
      {/* HEADER */}
      <header className="flex items-start justify-between shrink-0 mb-4">
        <div className="space-y-1">
          <h3 className="text-2xl font-light text-slate-900 tracking-tight leading-none">
            Refine <span className="font-bold">Preferences</span>
          </h3>
          <div className="w-12 h-[2px] bg-amber-500 rounded-full" />
        </div>

        <div className="flex gap-6 items-center">
          <button
            onClick={handleSkip}
            className="text-[10px] font-bold text-slate-400 hover:text-amber-600 uppercase tracking-[0.2em]"
          >
            Skip
          </button>

          <button
            onClick={onBack}
            className="group flex items-center gap-3 text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-all uppercase tracking-[0.2em]"
          >
            <span className="w-6 h-[1px] bg-slate-200 group-hover:w-10 group-hover:bg-amber-500 transition-all" />
            Back
          </button>
        </div>
      </header>

      <div className="flex-grow flex flex-col justify-evenly py-2">
        {/* QUESTION 1 */}
        <section className="space-y-3">
          <p className="text-[8px] font-black text-amber-500 uppercase tracking-[0.4em] text-center">
            Question 01
          </p>

          <h4 className="text-lg font-bold text-slate-800 text-center uppercase">
            Where will it be applied?
          </h4>

          <div className="flex flex-wrap justify-center gap-2">
            {applications.map((app) => (
              <button
                key={app}
                onClick={() =>
                  setSelectedApp(selectedApp === app ? null : app)
                }
                className={`px-6 py-2.5 rounded-xl border-2 text-[10px] font-bold uppercase transition-all ${
                  selectedApp === app
                    ? "border-amber-500 bg-amber-50 text-amber-700"
                    : "border-slate-100 text-slate-500 bg-white"
                }`}
              >
                {app}
              </button>
            ))}
          </div>
        </section>

        {/* QUESTION 2 */}
        <section className="space-y-3">
          <p className="text-[8px] font-black text-amber-500 uppercase tracking-[0.4em] text-center">
            Question 02
          </p>

          <h4 className="text-lg font-bold text-slate-800 text-center uppercase">
            Preferred Color Tone?
          </h4>

          <div className="flex justify-center gap-4">
            {colors.map((color) => (
              <div key={color.name} className="flex flex-col items-center gap-2">
                <button
                  onClick={() =>
                    setSelectedColor(
                      selectedColor === color.name ? null : color.name
                    )
                  }
                  style={{ backgroundColor: color.hex }}
                  className={`relative w-10 h-10 rounded-full border-4 transition-all ${
                    selectedColor === color.name
                      ? "border-amber-500 scale-110 shadow-lg"
                      : "border-white"
                  }`}
                >
                  <AnimatePresence>
                    {selectedColor === color.name && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <FiCheck
                          className={
                            color.name === "Blue"
                              ? "text-white"
                              : "text-slate-900"
                          }
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>

                <span
                  className={`text-[8px] font-bold uppercase ${
                    selectedColor === color.name
                      ? "text-amber-600"
                      : "text-slate-400"
                  }`}
                >
                  {color.name}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* PROCEED BUTTON */}
        <div className="flex justify-center mt-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleProceed}
            className="group flex items-center gap-4 bg-slate-900 text-white px-8 py-3.5 rounded-full"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              Proceed to Visualizer
            </span>
            <FiChevronRight />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
