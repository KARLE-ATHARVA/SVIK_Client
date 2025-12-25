"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/visualizer/Sidebar";
import PreviewArea from "@/components/visualizer/PreviewArea";
import TopActions from "@/components/visualizer/TopActions";
import { ChevronLeft, Menu } from "lucide-react";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function VisualizerLayout() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen w-screen bg-[#f8f8f6] overflow-hidden flex items-center justify-center p-6"
    >
      <div className="relative w-full max-w-[1600px] h-full flex gap-8">

        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute top-10 z-[100] p-2 bg-slate-900 text-amber-500 rounded-full shadow-xl border border-amber-500/30 hover:scale-110 transition-all"
        >
          {isOpen ? <ChevronLeft size={24} /> : <Menu size={24} />}
        </button>

        {/* Sidebar */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0, x: -20 }}
              animate={{ width: "25%", opacity: 1, x: 0 }}
              exit={{ width: 0, opacity: 0, x: -20 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="h-full overflow-hidden shrink-0"
            >
              <Sidebar />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Preview Stage */}
        <div className="relative flex-1 flex items-center justify-center overflow-hidden">

          <motion.div
            animate={{ x: isOpen ? 5 : 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="w-[1200px] h-full relative rounded-[36px] bg-white
                       shadow-[0_40px_90px_-20px_rgba(0,0,0,0.15)] overflow-hidden"
          >
            {/* Top Actions */}
            <div className="absolute top-0 inset-x-0 z-10 bg-white/70 backdrop-blur-xl">
              <TopActions />
            </div>

            {/* Preview */}
            <div className="h-full pt-[96px]">
              <PreviewArea />
            </div>

          </motion.div>

        </div>
      </div>
    </motion.section>
  );
}
