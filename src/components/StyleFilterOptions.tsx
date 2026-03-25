"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FiChevronRight, FiCheck } from "react-icons/fi";
import { useState } from "react";
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
  spaceType?: string;
};

export default function StyleFilterOptions({
  onBack,
  onComplete,
  spaceType,
}: StyleFilterOptionsProps) {

  const [selectedApp, setSelectedApp] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("selected_application");
  });

  const [selectedColor, setSelectedColor] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("selected_color");
  });

  // ✅ FINAL FIXED FUNCTION
  const handleProceed = () => {
    // 🔥 Save everything (same as before)
    const assetBase = String(ASSET_BASE ?? "").trim();
    if (assetBase) {
      localStorage.setItem("visualizer_asset_base", assetBase);
    }

    if (spaceType) {
      localStorage.setItem("selected_space_type", spaceType.toLowerCase());
    }

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

    // 🔥 IMPORTANT: NO ROUTING
    onComplete();
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

    // 🔥 IMPORTANT: NO ROUTING
    onComplete();
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
            className="group flex items-center gap-3 text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-[0.2em]"
          >
            Back
          </button>
        </div>
      </header>

      {/* QUESTIONS */}
      <div className="flex-grow flex flex-col justify-evenly py-2">

        {/* Q1 */}
        <section className="space-y-3">
          <p className="text-[8px] font-black text-amber-500 uppercase text-center">
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
                className={`px-6 py-2.5 rounded-xl border-2 text-[10px] font-bold uppercase ${
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

        {/* Q2 */}
        <section className="space-y-3">
          <p className="text-[8px] font-black text-amber-500 uppercase text-center">
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
                  className={`w-10 h-10 rounded-full border-4 ${
                    selectedColor === color.name
                      ? "border-amber-500"
                      : "border-white"
                  }`}
                />
                <span className="text-[8px] font-bold uppercase">
                  {color.name}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* PROCEED */}
        <div className="flex justify-center mt-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleProceed}
            className="bg-slate-900 text-white px-8 py-3.5 rounded-full"
          >
            Proceed to Visualizer
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}