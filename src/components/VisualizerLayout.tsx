// // src/components/VisualizerLayout.tsx
// "use client";

// import { motion } from "framer-motion";
// import VisualizerIntro from "./VisualizerIntro";
// import VisualizerOptions from "./VisualizerOptions";

// const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

// export default function VisualizerLayout() {
//   return (
//     <section className="h-screen w-full relative bg-[#f8f8f6] overflow-hidden flex items-center justify-center p-4 lg:p-8">
      
//       {/* Background Decorative Elements */}
//       <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-amber-200/20 rounded-full blur-[120px] pointer-events-none" />
//       <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-slate-200/40 rounded-full blur-[140px] pointer-events-none" />

//       <div className="relative max-w-[1400px] w-full h-full max-h-[900px] grid grid-cols-12 gap-6 lg:gap-8 items-stretch">
        
//         {/* LEFT PANEL */}
//         <motion.div
//           initial={{ opacity: 0, x: -30 }}
//           animate={{ opacity: 1, x: 0 }}
//           transition={{ duration: 0.8, ease: EASE_OUT }}
//           className="col-span-12 lg:col-span-4 bg-white rounded-[32px] p-8 lg:p-12 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] flex flex-col border border-slate-100 overflow-hidden"
//         >
//           <VisualizerIntro />
//         </motion.div>

//         {/* RIGHT PANEL */}
//         <motion.div
//           initial={{ opacity: 0, x: 30 }}
//           animate={{ opacity: 1, x: 0 }}
//           transition={{ duration: 0.8, delay: 0.2, ease: EASE_OUT }}
//           className="col-span-12 lg:col-span-8 bg-slate-900/5 backdrop-blur-sm rounded-[32px] p-6 lg:p-10 border border-white/50 shadow-inner flex flex-col justify-center overflow-hidden"
//         >
//           <VisualizerOptions />
//         </motion.div>
//       </div>
//     </section>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import VisualizerIntro from "./VisualizerIntro";
import VisualizerOptions from "./VisualizerOptions";
import PreviewArea from "./visualizer/PreviewArea";
import Preview3D from "./visualizer/Preview3D";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];


export default function VisualizerLayout() {
  const [is3DMode, setIs3DMode] = useState(false);
  const [has3DRoomSelected, setHas3DRoomSelected] = useState(false);

  

  useEffect(() => {
    const checkMode = () => {
      setIs3DMode(localStorage.getItem("force_3d_mode") === "true");
    };
    const checkRoom = () => {
      const has3D = localStorage.getItem("selected_3d_sub_scene");
      setHas3DRoomSelected(!!has3D);
    };

    const handleChange = () => {
      checkMode();
      checkRoom();
    };

    checkMode();
    checkRoom();
    window.addEventListener("storage", handleChange);
    window.addEventListener("force3DMode", handleChange);

    return () => {
      window.removeEventListener("storage", handleChange);
      window.removeEventListener("force3DMode", handleChange);
    };
  }, []);

  const sectionClass = is3DMode
    ? "h-screen w-screen relative overflow-hidden bg-[#f8f8f6]"
    : "min-h-screen w-full relative bg-[#f8f8f6] overflow-hidden flex items-center justify-center p-4 lg:p-8";

  const gridClass = is3DMode
    ? "w-full h-full grid grid-cols-12 gap-0"
    : "relative max-w-[1400px] w-full h-full max-h-[900px] grid grid-cols-12 gap-6 lg:gap-8";

  const rightPanelClass = is3DMode
    ? "col-span-12 relative w-full h-full overflow-hidden bg-[#f1f1ee]"
    : "col-span-12 lg:col-span-8 rounded-[32px] border border-white/60 shadow-inner relative overflow-hidden bg-[#f1f1ee]";

  return (
    <section className={sectionClass}>
      {/* Decorative blobs only in intro/2D */}
      {!is3DMode && (
        <>
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-amber-200/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-slate-200/40 rounded-full blur-[140px]" />
        </>
      )}

      <div className={gridClass}>
        {/* LEFT INTRO PANEL — ALWAYS visible in 2D mode (Image 2 style) */}
        {!is3DMode && (
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
            className="col-span-12 lg:col-span-4 bg-white rounded-[32px] p-8 lg:p-12 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden"
          >
            <VisualizerIntro />
          </motion.div>
        )}

        {/* RIGHT PANEL */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: EASE_OUT }}
          className={rightPanelClass}
        >
          {/* PREVIEW AREA */}
          <div className="absolute inset-0 z-0">
            {is3DMode ? <Preview3D /> : <PreviewArea />}
          </div>

          {/* 2D OPTIONS MENU (thumbnails etc.) */}
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