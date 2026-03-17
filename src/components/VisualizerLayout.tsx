
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import VisualizerIntro from "./VisualizerIntro";
import VisualizerOptions from "./VisualizerOptions";
import Sidebar from "./visualizer/Sidebar";
import PreviewArea from "./visualizer/PreviewArea";
import Preview3D from "./visualizer/Preview3D";
// import TopActions from "./visualizer/TopActions";
import { ChevronLeft, Menu } from "lucide-react";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function VisualizerLayout() {
  const [is3DMode, setIs3DMode] = useState(false);
  const [has3DRoomSelected, setHas3DRoomSelected] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  

  useEffect(() => {
    const checkMode = () => {
      setIs3DMode(localStorage.getItem("force_3d_mode") === "true");
    };

    const checkRoom = () => {
      const has3D = localStorage.getItem("selected_3d_sub_scene");
      setHas3DRoomSelected(!!has3D);
    };

    checkMode();
    checkRoom();

    const handleModeOrRoomChange = () => {
      checkMode();
      checkRoom();
    };

    window.addEventListener("storage", handleModeOrRoomChange);
    window.addEventListener("force3DMode", handleModeOrRoomChange);

    return () => {
      window.removeEventListener("storage", handleModeOrRoomChange);
      window.removeEventListener("force3DMode", handleModeOrRoomChange);
    };
  }, []);

  return (
    <section className="h-screen w-full relative bg-[#f8f8f6] overflow-hidden flex items-center justify-center p-4 lg:p-8">
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-amber-200/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-slate-200/40 rounded-full blur-[140px]" />

      {/* Toggle button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute top-6 left-6 z-[60] p-2 bg-white text-slate-700 rounded-xl shadow-lg border border-slate-200 hover:bg-slate-50 transition-all"
        aria-label={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
      >
        {isSidebarOpen ? <ChevronLeft size={22} /> : <Menu size={22} />}
      </button>

      <div className="relative max-w-[1400px] w-full h-full max-h-[900px] grid grid-cols-12 gap-6 lg:gap-8">
        {/* LEFT */}
        <AnimatePresence initial={false}>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4, ease: EASE_OUT }}
              className="col-span-12 lg:col-span-4 bg-white rounded-[32px] p-8 lg:p-12 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden"
            >
              {is3DMode && has3DRoomSelected ? <Sidebar /> : <VisualizerIntro />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* RIGHT */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: EASE_OUT }}
          className={`${isSidebarOpen ? "col-span-12 lg:col-span-8" : "col-span-12"} rounded-[32px] border border-white/60 shadow-inner relative overflow-hidden bg-[#f1f1ee]`}
        >
          {/* PREVIEW */}
          <div className="absolute inset-0 z-0">
            {is3DMode ? <Preview3D /> : <PreviewArea />}
          </div>

          {/* TOP ACTIONS
          {is3DMode && (
            <div className="absolute top-0 inset-x-0 z-10 bg-white/70 backdrop-blur-xl">
              <TopActions />
            </div>
          )} */}

          {/* MENU */}
          {!is3DMode && (
  <div className="relative z-10 h-full bg-[#f1f1ee] rounded-[32px] pt-2 px-6 pb-6 lg:pt-3 lg:px-10 lg:pb-10">
    <VisualizerOptions />
  </div>
)}

        </motion.div>
      </div>
    </section>
  );
}
