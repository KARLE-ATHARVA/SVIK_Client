"use client";

import { useState, useEffect } from "react";
import { Search, LayoutGrid, List, SlidersHorizontal, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import ProductCard from "./ProductCard";
import { API_BASE } from "@/lib/constants";
type DBMap = Record<string, string>;

export default function Sidebar() {
  const [grid, setGrid] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Array<{ id: string | number; name: string; image: string; size: string }>>([]);
  const searchParams = useSearchParams();

  // Filter options available for the current space
  const [filterOptions, setFilterOptions] = useState({
    categories: [] as string[],
    applications: [] as string[],
    finishes: [] as string[],
    sizes: [] as string[],
    colors: [] as string[]
  });

  // Permanent state (used for API calls)
  const [activeFilters, setActiveFilters] = useState({
  catNames: [] as string[],
  appNames: [] as string[],
  finishNames: [] as string[],
  sizeNames: [] as string[],
  colorNames: [] as string[]
});


  // Dynamic options based on current selection
  const [availableOptions, setAvailableOptions] = useState({
    categories: [] as string[],
    applications: [] as string[],
    finishes: [] as string[],
    sizes: [] as string[],
    colors: [] as string[]
  });

  // Temporary UI state (holds values while the user clicks buttons)
  const [tempFilters, setTempFilters] = useState({ ...activeFilters });
  const [currentSpace, setCurrentSpace] = useState("");

  useEffect(() => {
    const savedSpace = localStorage.getItem("selected_space_type") || "Kitchen";
    setCurrentSpace(savedSpace);
  }, []);

  // Fetch all possible options for this space
  useEffect(() => {
    if (!currentSpace) return;
    fetch(`${API_BASE}/FilterOptions?spaceName=${currentSpace}`)
      .then(r => r.json())
      .then(data => setFilterOptions(data))
      .catch(err => console.error("FilterOptions error", err));
  }, [currentSpace]);

  // Fetch which options are "available" (not disabled) based on temp selection
  useEffect(() => {
    if (!currentSpace) return;
    const params = new URLSearchParams();
    params.append("spaceName", currentSpace);
    Object.entries(tempFilters).forEach(([k, v]) => {
  if (v.length) params.append(k, v.join(","));
});


    fetch(`${API_BASE}/FilterAvailableOptions?${params.toString()}`)
      .then(r => r.json())
      .then(setAvailableOptions)
      .catch(err => console.error("AvailableOptions error", err));
  }, [tempFilters, currentSpace]);

  const fetchProducts = async () => {
    if (!currentSpace) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("spaceName", currentSpace);
      Object.entries(tempFilters).forEach(([k, v]) => {
  if (v.length) params.append(k, v.join(","));
});

      const response = await fetch(`${API_BASE}/FilterTileList?${params.toString()}`);
      if (!response.ok) throw new Error("API request failed");
      const data = await response.json();
      
      const mappedProducts = (data || []).map((item: any) => ({
        id: item.tile_id,
        name: item.sku_name,
        image: `https://vyr.svikinfotech.in/assets/media/thumb/${item.sku_code}.jpg`,
        size: item.size_name
      }));
      setProducts(mappedProducts);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [activeFilters, currentSpace]);

  const handleApplyFilters = () => {
    setActiveFilters({ ...tempFilters });
    setShowFilters(false);
  };

  const updateTempFilter = (key: keyof typeof tempFilters, value: string) => {
  setTempFilters(prev => {
    const list = prev[key];
    return {
      ...prev,
      [key]: list.includes(value)
        ? list.filter(v => v !== value)
        : [...list, value]
    };
  });
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
              setTempFilters({ ...activeFilters });
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
                <p className="text-sm font-bold text-slate-900 uppercase tracking-tight ">{currentSpace}</p>
              </div>

              {/* Categories */}
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Category</h4>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.categories.map(cat => {
                    const isEnabled = availableOptions.categories.includes(cat);
                    return (
                      <button 
                        key={cat} 
                        onClick={() => updateTempFilter("catNames", cat)}
                        disabled={!isEnabled}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase border transition-all ${
                          !isEnabled ? "opacity-30 pointer-events-none" : 
                          tempFilters.catNames.includes(cat) ? "bg-slate-900 border-slate-900 text-white" : "border-slate-200 text-slate-500 bg-white"
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Applications */}
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Application</h4>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.applications.map(app => (
                    <button 
                      key={app} 
                      onClick={() => updateTempFilter("appNames", app)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase border transition-all ${tempFilters.appNames.includes(app) ? "bg-slate-900 border-slate-900 text-white" : "border-slate-200 text-slate-500 bg-white"}`}
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
                  {filterOptions.finishes.map(f => {
                    const isEnabled = availableOptions.finishes.includes(f);
                    return (
                      <button 
                        key={f} 
                        disabled={!isEnabled}
                        onClick={() => updateTempFilter("finishNames", f)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase border transition-all ${
                          !isEnabled ? "opacity-30 pointer-events-none" :
                          tempFilters.finishNames.includes(f) ? "bg-slate-900 border-slate-900 text-white" : "border-slate-200 text-slate-500 bg-white"
                        }`}
                      >
                        {f}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sizes */}
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Size</h4>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.sizes.map(s => {
                    const isEnabled = availableOptions.sizes.includes(s);
                    return (
                      <button
                        key={s}
                        disabled={!isEnabled}
                        onClick={() => updateTempFilter("sizeNames", s)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase border transition-all ${
                          !isEnabled ? "opacity-30 pointer-events-none" : 
                          tempFilters.sizeNames.includes(s) ? "bg-slate-900 border-slate-900 text-white" : "border-slate-200 text-slate-500 bg-white"
                        }`}
                      >
                        {s}
                      </button>
                    ); 
                  })}
                </div>
              </div>
              
              {/* Colors */}
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Color</h4>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.colors.map(c => (
                    <button
                      key={c}
                      onClick={() => updateTempFilter("colorNames", c)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase border transition-all ${
                        tempFilters.colorNames.includes(c) ? "bg-slate-900 border-slate-900 text-white" : "border-slate-200 text-slate-500 bg-white"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

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