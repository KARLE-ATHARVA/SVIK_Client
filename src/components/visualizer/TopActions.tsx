"use client";

import { Share2, Download, Home, MessageCircle } from "lucide-react";

export default function TopActions() {
  
  const handleRoomsClick = (e: React.MouseEvent) => {
    // 1. Prevent any parent motion-divs from intercepting the click
    e.preventDefault();
    e.stopPropagation();

    // 2. Clear all room-specific data
    localStorage.removeItem("selected_space_type");
    localStorage.removeItem("selected_room_image");
    localStorage.removeItem("selected_variant");
    sessionStorage.clear();

    // 3. Force a full browser reload to the base visualizer screen
    // This destroys the current React state and forces Step 01 to mount fresh.
    window.location.href = "/visualizerScreen"; 
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link copied to clipboard!");
  };

  return (
    <div className="w-full px-8 py-6 flex items-center justify-between">
      <div className="flex flex-col">
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Main Visualization</h3>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex bg-white/50 backdrop-blur-md border border-white p-1 rounded-2xl">
          <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 text-[9px] font-bold text-slate-600 hover:bg-white rounded-xl transition-all uppercase tracking-widest">
            <span className="text-amber-500"><Share2 size={14} /></span> Share
          </button>

          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 text-[9px] font-bold text-slate-600 hover:bg-white rounded-xl transition-all uppercase tracking-widest">
            <span className="text-amber-500"><Download size={14} /></span> Export
          </button>

          {/* Rooms Button - THE RESET TRIGGER */}
          <button 
            onClick={handleRoomsClick}
            className="flex items-center gap-2 px-4 py-2 text-[9px] font-bold text-slate-600 hover:bg-white rounded-xl transition-all uppercase tracking-widest z-[50]"
          >
            <span className="text-amber-500"><Home size={14} /></span>
            Rooms
          </button>
        </div>
        
        <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-amber-600 transition-all">
          <MessageCircle size={14} className="text-amber-500" /> 
          Enquiry
        </button>
      </div>
    </div>
  );
}