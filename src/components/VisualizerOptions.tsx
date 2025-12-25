"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaBath, 
  FaUtensils, 
  FaCouch, 
  FaBed, 
  FaHome, 
  FaBuilding, 
  FaCheckSquare, 
  FaHeart 
} from "react-icons/fa";
import KitchenStylePicker from "./KitchenStylePicker";

const options = [
  { label: "Living Rooms", icon: FaCouch, spaceKey: "living" },
  { label: "Kitchens", icon: FaUtensils, spaceKey: "kitchen" },
  { label: "Bedrooms", icon: FaBed, spaceKey: "bedroom" }, 
  { label: "Bathrooms", icon: FaBath, spaceKey: "bathroom" },
  { label: "Commercial", icon: FaBuilding, spaceKey: "commercial" },
  { label: "Indoor / Outdoor", icon: FaHome, spaceKey: "outdoor" },
  { label: "Saved", icon: FaHeart, spaceKey: "saved" },
];

export default function VisualizerOptions() {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState("");

  const handleSpaceSelect = (spaceKey: string) => {
    setSelectedSpace(spaceKey);
    // Store the space type so the picker knows which images to load
    localStorage.setItem("selected_space_type", spaceKey);
    setShowPicker(true);
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
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                Select Your Space
              </h3>
              <div className="w-8 h-[2px] bg-amber-500 mt-2" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
              {options.map((item, index) => (
                <motion.div
                  key={index}
                  onClick={() => handleSpaceSelect(item.spaceKey)}
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
        ) : (
          <KitchenStylePicker onBack={() => setShowPicker(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}