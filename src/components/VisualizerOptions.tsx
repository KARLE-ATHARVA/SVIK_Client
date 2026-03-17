"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaBath, FaBed, FaCouch, FaHeart, FaHome, FaUtensils } from "react-icons/fa";
import StyleFilterOptions from "./StyleFilterOptions";
import { useSearchParams } from "next/navigation";

type RoomCategory = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roomIds: number[];
};

const CATEGORIES: RoomCategory[] = [
  { key: "living", label: "Living Rooms", icon: FaCouch, roomIds: [6, 20, 21, 22, 30, 33, 47] },
  { key: "kitchen", label: "Kitchens", icon: FaUtensils, roomIds: [8, 26, 29, 34, 35, 45, 46] },
  { key: "bedroom", label: "Bedrooms", icon: FaBed, roomIds: [37, 38, 39] },
  { key: "bathroom", label: "Bathrooms", icon: FaBath, roomIds: [12, 23, 24, 25, 40, 42, 44] },
  { key: "outdoor", label: "Indoor / Outdoor", icon: FaHome, roomIds: [27, 28, 31, 32] },
  { key: "saved", label: "Saved", icon: FaHeart, roomIds: [] },
];

export default function VisualizerOptions() {
  const searchParams = useSearchParams();
  const initialCategory = (searchParams.get("category") || "").toLowerCase();
  const validInitialCategory = CATEGORIES.some((c) => c.key === initialCategory) ? initialCategory : "";

  const [showPicker, setShowPicker] = useState(validInitialCategory !== "");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(validInitialCategory);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  const active = useMemo(
    () => CATEGORIES.find((c) => c.key === selectedCategory) ?? CATEGORIES[0],
    [selectedCategory]
  );

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

  return (
    <div className="w-full h-full flex flex-col justify-center">
      <AnimatePresence mode="wait">
        {!showPicker ? (
          <motion.div
            key="room-selection"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 15 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full"
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
            targetPath={`/${selectedRoomId}`}
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
            <div className="flex items-start justify-between shrink-0 pt-2 mb-6">
              <div className="space-y-1">
                <h3 className="text-3xl font-light text-slate-900 tracking-tight">
                  Select <span className="font-bold text-slate-900 capitalize">{active.key}</span> Room
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

            <div className="flex-1 overflow-auto pr-1">
              {active.roomIds.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center text-sm font-semibold text-slate-500">
                  No saved rooms yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
                {active.roomIds.map((roomId, index) => (
                  <motion.button
                    type="button"
                    key={`${active.key}-${roomId}`}
                    onClick={() => handleRoomSelect(roomId)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.02 }}
                    className="group block rounded-2xl border border-slate-200 bg-white/90 p-2 hover:border-amber-400 hover:shadow-md text-left"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
