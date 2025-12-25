// src/components/VisualizerLayout.tsx
"use client";

import { motion } from "framer-motion";
import VisualizerIntro from "./VisualizerIntro";
import VisualizerOptions from "./VisualizerOptions";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function VisualizerLayout() {
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
          <VisualizerOptions />
        </motion.div>
      </div>
    </section>
  );
}
