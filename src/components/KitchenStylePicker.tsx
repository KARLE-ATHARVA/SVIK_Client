"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { FiChevronRight } from "react-icons/fi";
import StyleFilterOptions from "./StyleFilterOptions";
import { CONCEPT_IMAGE_BASE_URL } from "@/lib/constants";

const SPACE_FILE_PREFIX: Record<string, string> = {
  kitchen: "kitchen",
  living: "Living_Room",
  bedroom: "Bedroom",
  bathroom: "Bathroom"
};

const styleVariants = [
  { id: 1, name: "Minimal", index: 1, tag: "Clean & Sleek" },
  { id: 2, name: "Classic Elegance", index: 2, tag: "Timeless Craft" },
  { id: 3, name: "Modern Industrial", index: 3, tag: "Raw & Bold" },
];

export default function KitchenStylePicker({ onBack }: { onBack: () => void }) {
  const [showFilters, setShowFilters] = useState(false);
  const [spaceType, setSpaceType] = useState("kitchen");

  useEffect(() => {
    const savedSpace = localStorage.getItem("selected_space_type");
    if (savedSpace) {
      setSpaceType(savedSpace);
    } else {
      // Default fallback if nothing is in storage
      localStorage.setItem("selected_space_type", "kitchen");
    }
  }, []);

  const handleStyleSelect = (index: number) => {
  const prefix = SPACE_FILE_PREFIX[spaceType] || spaceType;
  const filename = `${prefix}${index}.png`;
  const fullUrl = `${CONCEPT_IMAGE_BASE_URL}${filename}`;

  localStorage.setItem("selected_room_image", fullUrl);
  setShowFilters(true);
};


  if (showFilters) {
    return (
      <StyleFilterOptions 
        onBack={() => setShowFilters(false)} 
        onComplete={() => console.log("Preferences set")} 
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full flex flex-col justify-between"
    >
      <div className="flex items-start justify-between shrink-0 pt-2">
        <div className="space-y-1">
          <h3 className="text-3xl font-light text-slate-900 tracking-tight">
            Select <span className="font-bold text-slate-900 capitalize">{spaceType}</span> Environment
          </h3>
          <div className="w-12 h-[2px] bg-amber-500 rounded-full" />
        </div>
        
        <button 
          onClick={onBack}
          className="group flex items-center gap-3 text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-all uppercase tracking-[0.2em]"
        >
          <span className="w-8 h-[1px] bg-slate-200 group-hover:w-12 group-hover:bg-amber-500 transition-all duration-500" />
          Back to Rooms
        </button>
      </div>

      <div className="flex-grow flex items-center py-8">
        <div className="grid grid-cols-3 gap-8 w-full h-[85%] items-stretch">
          {styleVariants.map((style, i) => (
            <motion.div
              key={style.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.8 }}
              onClick={() => handleStyleSelect(style.index)}
              className="group relative flex flex-col cursor-pointer"
            >
              <div className="mb-4 text-center">
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">
                  {style.tag}
                </span>
              </div>

              <div className="relative flex-grow rounded-[32px] overflow-hidden border border-white/50 shadow-2xl shadow-slate-200/40 transition-all duration-700 group-hover:shadow-amber-900/10 group-hover:border-amber-500/30">
                <Image 
  src={`${CONCEPT_IMAGE_BASE_URL}${SPACE_FILE_PREFIX[spaceType] || spaceType}${style.index}.png`} 
  alt={style.name} 
  fill 
  className="object-cover transition-transform duration-1000 group-hover:scale-110" 
  unoptimized 
/>
                
                <div className="absolute bottom-6 right-6 overflow-hidden">
                   <div className="bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-xl translate-y-20 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">Select</span>
                      <FiChevronRight className="text-amber-600" />
                   </div>
                </div>
              </div>

              <div className="mt-5 text-center">
                <h4 className="text-sm font-black text-slate-800 group-hover:text-amber-600 transition-colors uppercase tracking-widest">
                  {style.name}
                </h4>
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.1em] mt-1">
                  Style 0{style.id}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="pt-6 border-t border-slate-200/50 shrink-0">
        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          <span className="w-10 h-[1px] bg-amber-500" />
          <span className="opacity-80">Step 02: Choose Your {spaceType} Style</span>
        </div>
      </div>
    </motion.div>
  );
}