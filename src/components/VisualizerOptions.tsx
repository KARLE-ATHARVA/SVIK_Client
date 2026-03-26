"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBath,
  FaBed,
  FaCouch,
  FaHeart,
  FaHome,
  FaUtensils,
} from "react-icons/fa";
import StyleFilterOptions from "./StyleFilterOptions";

type Props = {
  onComplete: (roomId: number) => void;
};

type SavedRoom = {
  id: number;
  preview_image: string;
  redirect_url: string;
  created_at: string;
};

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

export default function VisualizerOptions({ onComplete }: Props) {
  
  const [showPicker, setShowPicker] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  const [savedRooms, setSavedRooms] = useState<SavedRoom[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  const active = useMemo(
    () => CATEGORIES.find((c) => c.key === selectedCategory) ?? CATEGORIES[0],
    [selectedCategory]
  );

  // 🔥 FETCH SAVED ROOMS
  useEffect(() => {
    const fetchSaved = async () => {
      const token = sessionStorage.getItem("pgatoken");
      if (!token) return;

      try {
        setLoadingSaved(true);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE}saved_rooms/list`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("Failed");

        const data = await res.json();
        setSavedRooms(data || []);
      } catch (err) {
        console.error("Saved fetch error:", err);
      } finally {
        setLoadingSaved(false);
      }
    };

    fetchSaved();
  }, []);

  const handleCategorySelect = (spaceKey: string) => {
    setSelectedCategory(spaceKey);
    localStorage.setItem("selected_space_type", spaceKey.toLowerCase());
    setShowPicker(true);
    setShowFilters(false);
    setSelectedRoomId(null);
  };

  const handleRoomSelect = (roomId: number) => {
    setSelectedRoomId(roomId);
    setShowFilters(true);
  };

  const handleSavedClick = (url: string) => {
    window.location.href = url;
  };

  return (
    <div className="w-full h-full flex flex-col justify-center">
      <AnimatePresence mode="wait">

        {/* STEP 1 */}
        {!showPicker ? (
          <motion.div
            key="room-selection"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 15 }}
          >
            <div className="mb-8">
              <h3 className="text-2xl font-bold">Select Your Space</h3>
              <div className="w-8 h-[2px] bg-amber-500 mt-2" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {CATEGORIES.map((item, index) => (
                <motion.div
                  key={index}
                  onClick={() => handleCategorySelect(item.key)}
                  className="cursor-pointer bg-white rounded-2xl p-6 flex flex-col items-center gap-3 hover:shadow-lg"
                >
                  <item.icon className="text-xl text-slate-400" />
                  <span className="text-sm font-semibold text-slate-600">
                    {item.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : showFilters && selectedRoomId !== null ? (

          <StyleFilterOptions
            key={`filters-${selectedRoomId}`}
            onBack={() => setShowFilters(false)}
            onComplete={() => {
              if (selectedRoomId) onComplete(selectedRoomId);
            }}
            spaceType={selectedCategory}
          />

        ) : (

          <motion.div key="room-thumbnails" className="flex flex-col">
            <div className="flex justify-between mb-6">
              <h3 className="text-2xl font-bold">
                Select {active.label}
              </h3>

              <button
                onClick={() => setShowPicker(false)}
                className="text-sm text-gray-500"
              >
                Back
              </button>
            </div>

            {/* 🔥 SAVED CATEGORY LOGIC */}
            {active.key === "saved" ? (
              loadingSaved ? (
                <p>Loading...</p>
              ) : savedRooms.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {savedRooms.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSavedClick(item.redirect_url)}
                      className="rounded-xl overflow-hidden border hover:border-amber-400"
                    >
                      <img
                        src={item.preview_image}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                // 🔥 FALLBACK (IMPORTANT)
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[6, 20, 21, 22, 30, 33, 47].map((roomId) => (
                    <button
                      key={roomId}
                      onClick={() => handleRoomSelect(roomId)}
                      className="rounded-xl overflow-hidden border hover:border-amber-400"
                    >
                      <img
                        src={`/app/images/room_background_${roomId}_thumb.png`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {active.roomIds.map((roomId) => (
                  <button
                    key={roomId}
                    onClick={() => handleRoomSelect(roomId)}
                    className="rounded-xl overflow-hidden border hover:border-amber-400"
                  >
                    <img
                      src={`/app/images/room_background_${roomId}_thumb.png`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}