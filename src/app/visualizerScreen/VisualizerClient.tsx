// // "use client";

// // import { useEffect, useState } from "react";
// // import { motion, AnimatePresence } from "framer-motion";
// // import Sidebar from "@/components/visualizer/Sidebar";
// // import PreviewArea from "@/components/visualizer/PreviewArea";
// // import Preview3D from "@/components/visualizer/Preview3D";
// // import TopActions from "@/components/visualizer/TopActions";
// // import { ChevronLeft, Menu } from "lucide-react";

// // const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

// // export default function VisualizerClient() {
// //   const [isOpen, setIsOpen] = useState(true);
// //   const [is3DMode, setIs3DMode] = useState(false);

// //   useEffect(() => {
// //     const sync3DMode = () => {
// //       if (typeof window === "undefined") return;
// //       const forced = localStorage.getItem("force_3d_mode") === "true";
// //       const hasScene = !!localStorage.getItem("selected_3d_sub_scene");
// //       setIs3DMode(forced || hasScene);
// //     };

// //     sync3DMode();
// //     window.addEventListener("storage", sync3DMode);
// //     window.addEventListener("force3DMode", sync3DMode as EventListener);

// //     return () => {
// //       window.removeEventListener("storage", sync3DMode);
// //       window.removeEventListener("force3DMode", sync3DMode as EventListener);
// //     };
// //   }, []);

// //   return (
// //     <motion.section
// //       initial={{ opacity: 0 }}
// //       animate={{ opacity: 1 }}
// //       className="h-screen w-screen bg-[#f8f8f6] overflow-hidden flex items-center justify-center p-6"
// //     >
// //       <div className="relative w-full max-w-[1600px] h-full flex gap-8">

// //         {/* Toggle Button */}
// //         <button
// //           onClick={() => setIsOpen(!isOpen)}
// //           className="absolute top-10 z-[100] p-2 bg-slate-900 text-amber-500 rounded-full shadow-xl border border-amber-500/30 hover:scale-110 transition-all"
// //         >
// //           {isOpen ? <ChevronLeft size={24} /> : <Menu size={24} />}
// //         </button>

// //         {/* Sidebar */}
// //         <AnimatePresence initial={false}>
// //           {isOpen && (
// //             <motion.aside
// //               initial={{ width: 0, opacity: 0, x: -20 }}
// //               animate={{ width: "25%", opacity: 1, x: 0 }}
// //               exit={{ width: 0, opacity: 0, x: -20 }}
// //               transition={{ duration: 0.6, ease: EASE }}
// //               className="h-full overflow-hidden shrink-0"
// //             >
// //               <Sidebar />
// //             </motion.aside>
// //           )}
// //         </AnimatePresence>

// //         {/* Preview Stage */}
// //         <div className="relative flex-1 flex items-center justify-center overflow-hidden">

// //           <motion.div
// //             animate={{ x: isOpen ? 5 : 0 }}
// //             transition={{ duration: 0.6, ease: EASE }}
// //             className="w-[1200px] h-full relative rounded-[36px] bg-white
// //                        shadow-[0_40px_90px_-20px_rgba(0,0,0,0.15)] overflow-hidden"
// //           >
// //             {/* Top Actions */}
// //             <div className="absolute top-0 inset-x-0 z-10 bg-white/70 backdrop-blur-xl">
// //               <TopActions />
// //             </div>

// //             {/* Preview */}
// //             <div className="h-full pt-[96px]">
// //               {is3DMode ? <Preview3D /> : <PreviewArea />}
// //             </div>

// //           </motion.div>

// //         </div>
// //       </div>
// //     </motion.section>
// //   );
// // }
// "use client";

// import { useEffect, useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import Sidebar from "@/components/visualizer/Sidebar";
// import PreviewArea from "@/components/visualizer/PreviewArea";
// import Preview3D from "@/components/visualizer/Preview3D";
// import TopActions from "@/components/visualizer/TopActions";
// import { ChevronLeft, Menu } from "lucide-react";

// const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

// export default function VisualizerClient() {
//   const [isOpen, setIsOpen] = useState(true);
//   const [is3DMode, setIs3DMode] = useState(false);

//   useEffect(() => {
//     const sync3DMode = () => {
//       if (typeof window === "undefined") return;
//       const forced = localStorage.getItem("force_3d_mode") === "true";
//       const hasScene = !!localStorage.getItem("selected_3d_sub_scene");
//       setIs3DMode(forced || hasScene);
//     };

//     sync3DMode();
//     window.addEventListener("storage", sync3DMode);
//     window.addEventListener("force3DMode", sync3DMode as EventListener);

//     return () => {
//       window.removeEventListener("storage", sync3DMode);
//       window.removeEventListener("force3DMode", sync3DMode as EventListener);
//     };
//   }, []);

//   return (
//     <motion.section
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       className="h-screen w-screen bg-[#f8f8f6] overflow-hidden flex items-center justify-center p-6"
//     >
//       <div className="relative w-full max-w-[1600px] h-full flex gap-8">

//         {/* Toggle Button */}
//         <button
//           onClick={() => setIsOpen(!isOpen)}
//           className="absolute top-10 z-[100] p-2 bg-slate-900 text-amber-500 rounded-full shadow-xl border border-amber-500/30 hover:scale-110 transition-all"
//         >
//           {isOpen ? <ChevronLeft size={24} /> : <Menu size={24} />}
//         </button>

//         {/* Sidebar */}
//         <AnimatePresence initial={false}>
//           {isOpen && (
//             <motion.aside
//               initial={{ width: 0, opacity: 0, x: -20 }}
//               animate={{ width: "25%", opacity: 1, x: 0 }}
//               exit={{ width: 0, opacity: 0, x: -20 }}
//               transition={{ duration: 0.6, ease: EASE }}
//               className="h-full overflow-hidden shrink-0"
//             >
//               <Sidebar />
//             </motion.aside>
//           )}
//         </AnimatePresence>

//         {/* Preview Stage */}
//         <div className="relative flex-1 flex items-center justify-center overflow-hidden">
//           <motion.div
//             animate={{ x: isOpen ? 5 : 0 }}
//             transition={{ duration: 0.6, ease: EASE }}
//             className="w-[1200px] h-full relative rounded-[36px] bg-white
//                        shadow-[0_40px_90px_-20px_rgba(0,0,0,0.15)] overflow-hidden"
//           >
//             {/* Top Actions */}
//             <div className="absolute top-0 inset-x-0 z-10 bg-white/70 backdrop-blur-xl">
//               <TopActions />
//             </div>

//             {/* Preview */}
//             <div className="h-full pt-[96px]">
//               {is3DMode ? <Preview3D /> : <PreviewArea />}
//             </div>
//           </motion.div>
//         </div>
//       </div>
//     </motion.section>
//   );
// }
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/visualizer/Sidebar";
import PreviewArea from "@/components/visualizer/PreviewArea";
import Preview3D from "@/components/visualizer/Preview3D";
import TopActions from "@/components/visualizer/TopActions";
import { ChevronLeft, Menu } from "lucide-react";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function VisualizerClient() {
  const [isOpen, setIsOpen] = useState(true);
  const [is3DMode, setIs3DMode] = useState(false);

  useEffect(() => {
    const sync3DMode = () => {
      if (typeof window === "undefined") return;
      const forced = localStorage.getItem("force_3d_mode") === "true";
      const hasScene = !!localStorage.getItem("selected_3d_sub_scene");
      setIs3DMode(forced || hasScene);
    };

    sync3DMode();
    window.addEventListener("storage", sync3DMode);
    window.addEventListener("force3DMode", sync3DMode as EventListener);

    return () => {
      window.removeEventListener("storage", sync3DMode);
      window.removeEventListener("force3DMode", sync3DMode as EventListener);
    };
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen w-screen bg-[#f8f8f6] overflow-hidden flex items-center justify-center p-6"
    >
      <div className="relative w-full max-w-[1600px] h-full">
        {/* Preview Stage */}
        <motion.div
          animate={{ x: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="w-full h-full relative rounded-[36px] bg-white
                     shadow-[0_40px_90px_-20px_rgba(0,0,0,0.15)] overflow-hidden"
        >
          {/* Top Actions */}
          {is3DMode && (
            <div className="absolute top-0 inset-x-0 z-10 bg-white/70 backdrop-blur-xl">
              <TopActions />
            </div>
          )}

          {/* Preview */}
          <div className="h-full pt-[96px]">
            {is3DMode ? <Preview3D /> : <PreviewArea />}
          </div>
        </motion.div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute top-6 left-6 z-[60] p-2 bg-white text-slate-700 rounded-xl shadow-lg border border-slate-200 hover:bg-slate-50 transition-all"
          aria-label={isOpen ? "Hide sidebar" : "Show sidebar"}
        >
          {isOpen ? <ChevronLeft size={22} /> : <Menu size={22} />}
        </button>

        {/* Sidebar (compact overlay like legacy UI) */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="absolute left-6 top-20 z-50 w-[360px] max-w-[90vw] h-[calc(100%-110px)]"
            >
              <div className="h-full rounded-[28px] bg-[#f5f6f8] border border-slate-200 shadow-2xl overflow-hidden">
                <Sidebar />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
