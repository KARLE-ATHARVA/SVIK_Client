import { Share2, Download, Home, Settings, MessageCircle } from "lucide-react";

export default function TopActions() {
  return (
    <div className="w-full px-8 py-6 flex items-center justify-between">
      <div className="flex flex-col">
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Main Visualization</h3>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex bg-white/50 backdrop-blur-md border border-white p-1 rounded-2xl">
          {[
            { icon: <Share2 size={14} />, label: "Share" },
            { icon: <Download size={14} />, label: "Export" },
            { icon: <Home size={14} />, label: "Rooms" },
          ].map((item, i) => (
            <button key={i} className="flex items-center gap-2 px-4 py-2 text-[9px] font-bold text-slate-600 hover:bg-white rounded-xl transition-all uppercase tracking-widest">
              <span className="text-amber-500">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
        
        <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-amber-600 transition-all">
          <MessageCircle size={14} className="text-amber-500" /> 
          Enquiry
        </button>
      </div>
    </div>
  );
}