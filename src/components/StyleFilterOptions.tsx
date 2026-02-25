"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FiChevronRight, FiCheck } from "react-icons/fi";
import { useState } from "react";
import { useRouter } from "next/navigation";

const applications = ["Floor", "Wall", "Backsplash", "Countertop"];
const colors = [
  { name: "Cream", hex: "#F5F5DC" },
  { name: "Slate", hex: "#708090" },
  { name: "Ash", hex: "#B2BEB5" },
  { name: "Ebony", hex: "#28282B" },
  { name: "Amber", hex: "#FFBF00" },
];

type StyleFilterOptionsProps = {
  onBack: () => void;
  onComplete: () => void;
  targetPath?: string;
};

export default function StyleFilterOptions({ onBack, onComplete, targetPath = "/visualizerScreen" }: StyleFilterOptionsProps) {
  const [selectedApp, setSelectedApp] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const router = useRouter();

  const handleProceed = () => {
    onComplete();
    localStorage.setItem("selected_application", selectedApp.toUpperCase());
    localStorage.setItem("selected_color", selectedColor);
    router.push(`${targetPath}?app=${selectedApp.toUpperCase()}&color=${selectedColor}`);
  };

  const handleSkip = () => {
    router.push(targetPath);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full h-full flex flex-col justify-between overflow-hidden px-2 pt-2"
    >
      <header className="flex items-start justify-between shrink-0 mb-4">
        <div className="space-y-1">
          <h3 className="text-2xl font-light text-slate-900 tracking-tight leading-none">
            Refine <span className="font-bold">Preferences</span>
          </h3>
          <div className="w-12 h-[2px] bg-amber-500 rounded-full" />
        </div>

        <div className="flex gap-6 items-center">
          <button onClick={handleSkip} className="text-[10px] font-bold text-slate-400 hover:text-amber-600 uppercase tracking-[0.2em]">
            Skip
          </button>
          <button onClick={onBack} className="group flex items-center gap-3 text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-all uppercase tracking-[0.2em]">
            <span className="w-6 h-[1px] bg-slate-200 group-hover:w-10 group-hover:bg-amber-500 transition-all" />
            Back
          </button>
        </div>
      </header>

      <div className="flex-grow flex flex-col justify-evenly py-2">
        <section className="space-y-3">
          <p className="text-[8px] font-black text-amber-500 uppercase tracking-[0.4em] text-center">Question 01</p>
          <h4 className="text-lg font-bold text-slate-800 text-center uppercase">What is your application?</h4>
          <div className="flex flex-wrap justify-center gap-2">
            {applications.map((app) => (
              <button
                key={app}
                onClick={() => setSelectedApp(app)}
                className={`px-6 py-2.5 rounded-xl border-2 text-[10px] font-bold uppercase transition-all ${
                  selectedApp === app ? "border-amber-500 bg-amber-50 text-amber-700" : "border-slate-100 text-slate-500 bg-white"
                }`}
              >
                {app}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-[8px] font-black text-amber-500 uppercase tracking-[0.4em] text-center">Question 02</p>
          <h4 className="text-lg font-bold text-slate-800 text-center uppercase">Preferred Color Tone?</h4>
          <div className="flex justify-center gap-4">
            {colors.map((color) => (
              <div key={color.name} className="flex flex-col items-center gap-2">
                <button
                  onClick={() => setSelectedColor(color.name)}
                  style={{ backgroundColor: color.hex }}
                  className={`relative w-10 h-10 rounded-full border-4 transition-all ${selectedColor === color.name ? "border-amber-500 scale-110 shadow-lg" : "border-white"}`}
                >
                  <AnimatePresence>
                    {selectedColor === color.name && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <FiCheck className={color.name === "Ebony" ? "text-white" : "text-slate-900"} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
                <span className={`text-[8px] font-bold uppercase ${selectedColor === color.name ? "text-amber-600" : "text-slate-400"}`}>{color.name}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-center mt-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleProceed}
            disabled={!selectedApp || !selectedColor}
            className="group flex items-center gap-4 bg-slate-900 text-white px-8 py-3.5 rounded-full disabled:opacity-30"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Proceed to Visualizer</span>
            <FiChevronRight />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
