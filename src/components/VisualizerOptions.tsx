// "use client";

// import { useMemo, useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { FaBath, FaBed, FaCouch, FaHeart, FaHome, FaUtensils } from "react-icons/fa";
// import StyleFilterOptions from "./StyleFilterOptions";
// import { useSearchParams } from "next/navigation";

// type RoomCategory = {
//   key: string;
//   label: string;
//   icon: React.ComponentType<{ className?: string }>;
//   roomIds: number[];
// };

// const CATEGORIES: RoomCategory[] = [
//   { key: "living", label: "Living Rooms", icon: FaCouch, roomIds: [6, 20, 21, 22, 30, 33, 47] },
//   { key: "kitchen", label: "Kitchens", icon: FaUtensils, roomIds: [8, 26, 29, 34, 35, 45, 46] },
//   { key: "bedroom", label: "Bedrooms", icon: FaBed, roomIds: [37, 38, 39] },
//   { key: "bathroom", label: "Bathrooms", icon: FaBath, roomIds: [12, 23, 24, 25, 40, 42, 44] },
//   { key: "outdoor", label: "Indoor / Outdoor", icon: FaHome, roomIds: [27, 28, 31, 32] },
//   { key: "saved", label: "Saved", icon: FaHeart, roomIds: [] },
// ];

// export default function VisualizerOptions() {
//   const searchParams = useSearchParams();
//   const initialCategory = (searchParams.get("category") || "").toLowerCase();
//   const validInitialCategory = CATEGORIES.some((c) => c.key === initialCategory) ? initialCategory : "";

//   const [showPicker, setShowPicker] = useState(validInitialCategory !== "");
//   const [showFilters, setShowFilters] = useState(false);
//   const [selectedCategory, setSelectedCategory] = useState<string>(validInitialCategory);
//   const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

//   const active = useMemo(
//     () => CATEGORIES.find((c) => c.key === selectedCategory) ?? CATEGORIES[0],
//     [selectedCategory]
//   );

//   const handleCategorySelect = (spaceKey: string) => {
//     setSelectedCategory(spaceKey);
//     if (typeof window !== "undefined") {
//       localStorage.setItem("selected_space_type", spaceKey.toLowerCase());
//     }
//     setShowPicker(true);
//     setShowFilters(false);
//     setSelectedRoomId(null);
//   };

//   const handleRoomSelect = (roomId: number) => {
//     setSelectedRoomId(roomId);
//     setShowFilters(true);
//   };

//   return (
//     <div className="w-full h-full flex flex-col justify-center">
//       <AnimatePresence mode="wait">
//         {!showPicker ? (
//           <motion.div
//             key="room-selection"
//             initial={{ opacity: 0, x: -15 }}
//             animate={{ opacity: 1, x: 0 }}
//             exit={{ opacity: 0, x: 15 }}
//             transition={{ duration: 0.4, ease: "easeOut" }}
//             className="w-full"
//           >
//             <div className="mb-8">
//               <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Select Your Space</h3>
//               <div className="w-8 h-[2px] bg-amber-500 mt-2" />
//             </div>

//             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
//               {CATEGORIES.map((item, index) => (
//                 <motion.div
//                   key={index}
//                   onClick={() => handleCategorySelect(item.key)}
//                   whileHover={{ backgroundColor: "rgba(255, 255, 255, 1)" }}
//                   className="group cursor-pointer bg-white/60 backdrop-blur-md rounded-2xl border border-slate-200/50 p-6 flex flex-col items-center justify-center gap-3 transition-all duration-500 hover:shadow-xl hover:border-amber-500/40"
//                 >
//                   <div className="p-3 rounded-full bg-slate-50 group-hover:bg-amber-50 transition-colors duration-500">
//                     <item.icon className="text-xl text-slate-400 group-hover:text-amber-600 transition-colors duration-500" />
//                   </div>
//                   <span className="text-[13px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors duration-500 text-center">
//                     {item.label}
//                   </span>
//                 </motion.div>
//               ))}
//             </div>

//             <div className="mt-12 flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
//               <span className="w-8 h-[1px] bg-amber-500" />
//               <span>Step 01: Choose a Room to Begin</span>
//             </div>
//           </motion.div>
//         ) : showFilters && selectedRoomId !== null ? (
//           <StyleFilterOptions
//             key={`filters-${selectedRoomId}`}
//             onBack={() => setShowFilters(false)}
//             onComplete={() => {}}
//             targetPath={`/${selectedRoomId}`}
//             spaceType={selectedCategory}
//           />
//         ) : (
//           <motion.div
//             key="room-thumbnails"
//             initial={{ opacity: 0, x: 15 }}
//             animate={{ opacity: 1, x: 0 }}
//             exit={{ opacity: 0, x: -15 }}
//             transition={{ duration: 0.35, ease: "easeOut" }}
//             className="w-full h-full flex flex-col"
//           >
//             <div className="flex items-start justify-between shrink-0 pt-2 mb-6">
//               <div className="space-y-1">
//                 <h3 className="text-3xl font-light text-slate-900 tracking-tight">
//                   Select <span className="font-bold text-slate-900 capitalize">{active.key}</span> Room
//                 </h3>
//                 <div className="w-12 h-[2px] bg-amber-500 rounded-full" />
//               </div>

//               <button
//                 onClick={() => setShowPicker(false)}
//                 className="group flex items-center gap-3 text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-all uppercase tracking-[0.2em]"
//               >
//                 <span className="w-8 h-[1px] bg-slate-200 group-hover:w-12 group-hover:bg-amber-500 transition-all duration-500" />
//                 Back to Rooms
//               </button>
//             </div>

//             <div className="flex-1 overflow-auto pr-1">
//               {active.roomIds.length === 0 ? (
//                 <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center text-sm font-semibold text-slate-500">
//                   No saved rooms yet.
//                 </div>
//               ) : (
//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
//                 {active.roomIds.map((roomId, index) => (
//                   <motion.button
//                     type="button"
//                     key={`${active.key}-${roomId}`}
//                     onClick={() => handleRoomSelect(roomId)}
//                     initial={{ opacity: 0, y: 10 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     transition={{ duration: 0.25, delay: index * 0.02 }}
//                     className="group block rounded-2xl border border-slate-200 bg-white/90 p-2 hover:border-amber-400 hover:shadow-md text-left"
//                   >
//                     <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
//                       <img
//                         src={`/app/images/room_background_${roomId}_thumb.png`}
//                         alt={`Room ${roomId} background`}
//                         className="absolute inset-0 w-full h-full object-cover"
//                       />
//                       <img
//                         src={`/app/images/room_foreground_${roomId}_thumb.png`}
//                         alt={`Room ${roomId} foreground`}
//                         className="absolute inset-0 w-full h-full object-cover"
//                       />
//                     </div>
//                   </motion.button>
//                 ))}
//                 </div>
//               )}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaBath, FaBed, FaCouch, FaHeart, FaHome, FaUtensils } from "react-icons/fa";
import StyleFilterOptions from "./StyleFilterOptions";
import { useSearchParams } from "next/navigation";
import livingRoom3D from "@/assets/living_room_3d.png";
import kitchen3D from "@/assets/kitchen_3d.png";
import bedroom3D from "@/assets/bedroom_3d.png";
import bathroom3D from "@/assets/bathroom_3d.png";

type RoomCategory = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roomIds: number[];
  sceneType: string;
  has3D: boolean;
};

type SavedRoom = {
  id: number;
  preview_image: string;
  redirect_url: string;
  created_at?: string;
};

const CATEGORIES: RoomCategory[] = [
  { key: "living", label: "Living Rooms", icon: FaCouch, roomIds: [6, 20, 21, 22, 30, 33, 47], sceneType: "living_room", has3D: true },
  { key: "kitchen", label: "Kitchens", icon: FaUtensils, roomIds: [8, 26, 29, 34, 35, 45, 46], sceneType: "kitchen", has3D: true },
  { key: "bedroom", label: "Bedrooms", icon: FaBed, roomIds: [36, 37, 38, 39], sceneType: "bedroom", has3D: true },
  { key: "bathroom", label: "Bathrooms", icon: FaBath, roomIds: [12, 23, 24, 25, 40, 42, 44], sceneType: "bathroom", has3D: true },
  { key: "outdoor", label: "Indoor / Outdoor", icon: FaHome, roomIds: [27, 28, 31, 32], sceneType: "living_room", has3D: false },
  { key: "saved", label: "Saved", icon: FaHeart, roomIds: [], sceneType: "living_room", has3D: false },
];

const THUMBNAIL_3D: Record<string, string> = {
  living: livingRoom3D.src,
  kitchen: kitchen3D.src,
  bedroom: bedroom3D.src,
  bathroom: bathroom3D.src,
};

const SAVED_FALLBACK_ROOMS = [6, 20, 21, 22, 30, 33, 47];

export default function VisualizerOptions() {
  const searchParams = useSearchParams();
  const initialCategory = (searchParams.get("category") || "").toLowerCase();
  const validInitialCategory = CATEGORIES.some((c) => c.key === initialCategory) ? initialCategory : "";

  const [showPicker, setShowPicker] = useState(validInitialCategory !== "");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(validInitialCategory);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [savedRooms, setSavedRooms] = useState<SavedRoom[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  const active = useMemo(
    () => CATEGORIES.find((c) => c.key === selectedCategory) ?? CATEGORIES[0],
    [selectedCategory]
  );

  useEffect(() => {
    const fetchSaved = async () => {
      const token = sessionStorage.getItem("pgatoken");
      if (!token) return;

      const apiBase = String(process.env.NEXT_PUBLIC_API_BASE ?? "").trim();
      if (!apiBase) return;

      try {
        setLoadingSaved(true);
        const res = await fetch(`${apiBase}saved_rooms/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load saved rooms");
        const data = await res.json();
        setSavedRooms(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Saved rooms fetch error:", err);
      } finally {
        setLoadingSaved(false);
      }
    };

    fetchSaved();
  }, []);

  const handleCategorySelect = (spaceKey: string) => {
    setSelectedCategory(spaceKey);
    if (typeof window !== "undefined") {
      localStorage.setItem("selected_space_type", spaceKey.toLowerCase());
    }
    setShowPicker(true);
    setShowFilters(false);
    setSelectedRoomId(null);
  };

  const handleRoomSelect = (roomId: number) => {
    setSelectedRoomId(roomId);
    setShowFilters(true);
  };

  const handleSavedClick = (url: string) => {
    const normalized = url
      .replace("/visualizer_old", "/visualizer")
      .replace("/visualiser", "/visualizer");
    window.location.href = normalized;
  };

  // const handle3DSelect = () => {
  //   if (typeof window !== "undefined") {
  //     localStorage.setItem("force_3d_mode", "true");
  //     localStorage.setItem("selected_3d_sub_scene", active.sceneType);
  //     localStorage.setItem("selected_space_type", active.key);
  //     window.dispatchEvent(new Event("storage"));
  //     window.dispatchEvent(new CustomEvent("force3DMode"));
  //   }
  // };
  const handle3DSelect = () => {
  if (typeof window !== "undefined") {
    localStorage.setItem("force_3d_mode", "true");
    localStorage.setItem("selected_3d_sub_scene", active.sceneType);
    localStorage.setItem("selected_space_type", active.key);

    // ← Push a history entry so back button returns here
    window.history.pushState({ visualizer3D: true }, "");

    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("force3DMode"));
  }
};

  // All room ids + 1 slot for 3D thumbnail, fit into one unified grid
  const tight3DGap = active.key === "bedroom";

  const has3D = active.has3D && !!THUMBNAIL_3D[active.key];

  return (
    <div className="w-full h-full flex flex-col">
      <AnimatePresence mode="wait">
        {!showPicker ? (
          <motion.div
            key="room-selection"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 15 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full flex flex-col justify-center h-full"
          >
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Select Your Space</h3>
              <div className="w-8 h-[2px] bg-amber-500 mt-2" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
              {CATEGORIES.map((item, index) => (
                <motion.div
                  key={index}
                  onClick={() => handleCategorySelect(item.key)}
                  whileHover={{ backgroundColor: "rgba(255, 255, 255, 1)" }}
                  className="group cursor-pointer bg-white/60 backdrop-blur-md rounded-2xl border border-slate-200/50 p-6 flex flex-col items-center justify-center gap-3 transition-all duration-500 hover:shadow-xl hover:border-amber-500/40"
                >
                  <div className="p-3 rounded-full bg-slate-50 group-hover:bg-amber-50 transition-colors duration-500">
                    <item.icon className="text-xl text-slate-400 group-hover:text-amber-600 transition-colors duration-500" />
                  </div>
                  <span className="text-[13px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors duration-500 text-center">
                    {item.label}
                  </span>
                </motion.div>
              ))}
            </div>

            <div className="mt-12 flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              <span className="w-8 h-[1px] bg-amber-500" />
              <span>Step 01: Choose a Room to Begin</span>
            </div>
          </motion.div>
        ) : showFilters && selectedRoomId !== null ? (
          <StyleFilterOptions
            key={`filters-${selectedRoomId}`}
            onBack={() => setShowFilters(false)}
            onComplete={() => {}}
            targetPath={`/visualizer#room=${selectedRoomId}`}
            spaceType={selectedCategory}
          />
        ) : (
          <motion.div
            key="room-thumbnails"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="w-full h-full flex flex-col"
          >
            {/* Header */}
<div className="flex items-start justify-between shrink-0 pt-0 mb-2 -mt-2">
  <div className="space-y-1">
    <h3 className="text-2xl font-light text-slate-900 tracking-tight">
      Select <span className="font-bold text-slate-900 capitalize">{active.label}</span>
    </h3>
    <div className="w-12 h-[2px] bg-amber-500 rounded-full" />
  </div>

  <button
    onClick={() => setShowPicker(false)}
    className="group flex items-center gap-3 text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-all uppercase tracking-[0.2em]"
  >
    <span className="w-8 h-[1px] bg-slate-200 group-hover:w-12 group-hover:bg-amber-500 transition-all duration-500" />
    Back to Rooms
  </button>
</div>


            {/* Single unified grid — 2D rooms + 3D thumbnail, no scroll */}
             <div className={`flex-1 flex flex-col ${tight3DGap ? "justify-start" : "justify-between"} gap-4 min-h-0`}>

              {/* 2D / Saved section */}
              <div className="flex flex-col gap-2 min-h-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 shrink-0">
                  <span className="w-5 h-[1px] bg-slate-300" />
                  {active.key === "saved" ? "Saved Designs" : "2D Rooms"}
                </p>

                {active.key === "saved" ? (
                  loadingSaved ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-sm font-semibold text-slate-500">
                      Loading saved rooms...
                    </div>
                  ) : savedRooms.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2 lg:gap-3">
                      {savedRooms.map((item, index) => (
                        <motion.button
                          type="button"
                          key={`saved-${item.id}`}
                          onClick={() => handleSavedClick(item.redirect_url)}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.02 }}
                          className="group block rounded-xl border border-slate-200 bg-white/90 p-1.5 hover:border-amber-400 hover:shadow-md text-left"
                        >
                          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">
                            <img
                              src={item.preview_image}
                              alt="Saved room preview"
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 lg:gap-3">
                      {SAVED_FALLBACK_ROOMS.map((roomId, index) => (
                        <motion.button
                          type="button"
                          key={`fallback-${roomId}`}
                          onClick={() => handleRoomSelect(roomId)}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.02 }}
                          className="group block rounded-xl border border-slate-200 bg-white/90 p-1.5 hover:border-amber-400 hover:shadow-md text-left"
                        >
                          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">
                            <img
                              src={`/app/images/room_background_${roomId}_thumb.png`}
                              alt={`Room ${roomId} background`}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                            <img
                              src={`/app/images/room_foreground_${roomId}_thumb.png`}
                              alt={`Room ${roomId} foreground`}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )
                ) : active.roomIds.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-sm font-semibold text-slate-500">
                    No rooms available.
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 lg:gap-3">
                    {active.roomIds.map((roomId, index) => (
                      <motion.button
                        type="button"
                        key={`${active.key}-${roomId}`}
                        onClick={() => handleRoomSelect(roomId)}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.02 }}
                        className="group block rounded-xl border border-slate-200 bg-white/90 p-1.5 hover:border-amber-400 hover:shadow-md text-left"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">
                          <img
                            src={`/app/images/room_background_${roomId}_thumb.png`}
                            alt={`Room ${roomId} background`}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <img
                            src={`/app/images/room_foreground_${roomId}_thumb.png`}
                            alt={`Room ${roomId} foreground`}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>

              {/* 3D section */}
              {has3D && (
                // <div className="flex flex-col gap-2 shrink-0 mt-3">
                <div className={`flex flex-col gap-2 shrink-0 ${tight3DGap ? "mt-1" : "mt-3"}`}>

                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-5 h-[1px] bg-slate-300" />
                    3D Room
                  </p>
                  <div className="grid grid-cols-4 gap-2 lg:gap-3">
                    <motion.button
                      type="button"
                      onClick={handle3DSelect}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="group block rounded-xl border border-slate-200 bg-white/90 p-1.5 hover:border-amber-500 hover:shadow-md text-left relative"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">
                        <img
                          src={THUMBNAIL_3D[active.key]}
                          alt={`${active.label} 3D`}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <span className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full tracking-wide">
                          3D
                        </span>
                      </div>
                    </motion.button>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
