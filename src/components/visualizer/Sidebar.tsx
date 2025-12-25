"use client";

import { useState, useEffect } from "react";
import { Search, LayoutGrid, List, SlidersHorizontal, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import ProductCard from "./ProductCard";

const FILTER_DATA = {
  categories: ["Floor Tiles", "Wall Tiles", "Floor+Wall"],
  applications: ["Indoor", "Outdoor", "Kitchen", "Bathroom", "Living Room"],
  finishes: ["Matte", "Glossy", "Satin", "Sugar", "High Gloss"],
  sizes: ["600x600", "300x600", "800x800", "600x1200", "200x1200"]
};

export default function Sidebar() {
  const [grid, setGrid] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Array<{ id: string | number; name: string; image: string; size: string }>>([]);
  const searchParams = useSearchParams();

  // 1. Permanent state (used for API calls)
  const [activeFilters, setActiveFilters] = useState({
    catNames: "Floor Tiles",
    appNames: searchParams.get("app") || "Indoor",
    finishNames: "Matte",
    sizeNames: "600x600"
  });

  // 2. Temporary UI state (holds values while the user clicks buttons)
  const [tempFilters, setTempFilters] = useState({ ...activeFilters });

  const [currentSpace, setCurrentSpace] = useState("");

  useEffect(() => {
    const savedSpace = localStorage.getItem("selected_space_type") || "Kitchen";
    setCurrentSpace(savedSpace);
  }, []);

  const fetchProducts = async () => {
    if (!currentSpace) return;
    
    setLoading(true);
    try {
      const baseUrl = "https://vyr.svikinfotech.in/api/FilterTileList";
      const params = new URLSearchParams({
        spaceName: currentSpace.charAt(0).toUpperCase() + currentSpace.slice(1),
        catNames: activeFilters.catNames,
        appNames: activeFilters.appNames,
        finishNames: activeFilters.finishNames,
        sizeNames: activeFilters.sizeNames
      });

      const response = await fetch(`${baseUrl}?${params.toString()}`);
      if (!response.ok) throw new Error("API request failed");
      
      const data = await response.json();
      
      const mappedProducts = (data || []).map((item: any) => ({
        id: item.id || item.productCode || Math.random(),
        name: item.productName || item.name || "Untitled Product",
        image: item.imagePath || item.image || "/placeholder.jpg",
        size: item.size || activeFilters.sizeNames
      }));

      setProducts(mappedProducts);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // 3. Trigger fetch ONLY when activeFilters or currentSpace changes
  useEffect(() => {
    fetchProducts();
  }, [activeFilters, currentSpace]);

  // Handle the Apply button click
  const handleApplyFilters = () => {
    setActiveFilters({ ...tempFilters }); // Push temp changes to active state to trigger fetch
    setShowFilters(false);
  };

  const updateTempFilter = (key: string, value: string) => {
    setTempFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="h-full flex flex-col bg-transparent relative">
      <div className="px-6 pt-4 pb-6 text-center shrink-0">
        <h2 className="text-xl tracking-[0.35em] uppercase text-slate-900">
          Ti<span className="font-bold">Vi</span>
        </h2>
        <p className="text-[9px] mt-2 font-black text-amber-500 tracking-[0.4em] uppercase">
          {currentSpace} Collections
        </p>
      </div>

      <div className="px-6 space-y-4 shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
          <input
            placeholder={`Search in ${currentSpace}...`}
            className="w-full pl-11 pr-4 py-4 rounded-2xl bg-white shadow-sm text-[11px] uppercase tracking-widest font-semibold focus:ring-2 focus:ring-amber-500/20 outline-none"
          />
        </div>

        <div className="flex justify-between items-center gap-3">
          <button 
            onClick={() => {
              setTempFilters({ ...activeFilters }); // Reset temp UI to match current active data
              setShowFilters(!showFilters);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
              showFilters ? "bg-amber-500 text-white" : "bg-slate-900 text-white hover:bg-amber-600"
            }`}
          >
            <SlidersHorizontal size={14} /> {showFilters ? "Close" : "Filters"}
          </button>

          <button
            onClick={() => setGrid(!grid)}
            className="p-3 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-900 transition shadow-sm"
          >
            {grid ? <List size={16} /> : <LayoutGrid size={16} />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <div className={`h-full overflow-y-auto px-6 py-8 custom-scrollbar transition-opacity duration-300 ${showFilters ? "opacity-10 pointer-events-none" : "opacity-100"}`}>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 className="animate-spin text-amber-500" size={24} />
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Loading {currentSpace} Tiles</p>
            </div>
          ) : products.length > 0 ? (
            <div className={`grid gap-6 ${grid ? "grid-cols-2" : "grid-cols-1"}`}>
              {products.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
               <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">No results found</p>
            </div>
          )}
        </div>

        {showFilters && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-10 p-6 overflow-y-auto custom-scrollbar">
            <div className="space-y-6 pb-12">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-2">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Locked Space</p>
                <p className="text-sm font-bold text-slate-900 uppercase tracking-tight capitalize">{currentSpace}</p>
              </div>

              {/* Categories */}
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Category</h4>
                <div className="flex flex-wrap gap-2">
                  {FILTER_DATA.categories.map(cat => (
                    <button 
                      key={cat} 
                      onClick={() => updateTempFilter("catNames", cat)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase border transition-all ${tempFilters.catNames === cat ? "bg-slate-900 border-slate-900 text-white" : "border-slate-200 text-slate-500 bg-white"}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Applications */}
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Application</h4>
                <div className="flex flex-wrap gap-2">
                  {FILTER_DATA.applications.map(app => (
                    <button 
                      key={app} 
                      onClick={() => updateTempFilter("appNames", app)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase border transition-all ${tempFilters.appNames === app ? "bg-slate-900 border-slate-900 text-white" : "border-slate-200 text-slate-500 bg-white"}`}
                    >
                      {app}
                    </button>
                  ))}
                </div>
              </div>

              {/* Finishes */}
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Finish</h4>
                <div className="flex flex-wrap gap-2">
                  {FILTER_DATA.finishes.map(f => (
                    <button 
                      key={f} 
                      onClick={() => updateTempFilter("finishNames", f)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase border transition-all ${tempFilters.finishNames === f ? "bg-slate-900 border-slate-900 text-white" : "border-slate-200 text-slate-500 bg-white"}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sizes */}
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Size</h4>
                <div className="flex flex-wrap gap-2">
                  {FILTER_DATA.sizes.map(s => (
                    <button 
                      key={s} 
                      onClick={() => updateTempFilter("sizeNames", s)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase border transition-all ${tempFilters.sizeNames === s ? "bg-slate-900 border-slate-900 text-white" : "border-slate-200 text-slate-500 bg-white"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* THE APPLY BUTTON - Only trigger fetch here */}
              <button 
                onClick={handleApplyFilters}
                className="w-full bg-amber-500 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-amber-500/20 active:scale-95 transition-transform mt-4"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}