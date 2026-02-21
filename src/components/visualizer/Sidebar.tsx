"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Search, 
  LayoutGrid, 
  List, 
  SlidersHorizontal, 
  Loader2, 
  RefreshCw, 
  Heart, 
  LogOut, 
  User 
} from "lucide-react";
import ProductCard from "./ProductCard";
import AuthModal from "./AuthModal";
import { API_BASE } from "@/lib/constants";
import { isLoggedIn, logout } from "@/lib/auth";
import {
  addFavoriteAPI,
  removeFavoriteAPI,
  listFavoritesAPI,
} from "@/lib/favorites";

export default function Sidebar() {
  const [grid, setGrid] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Array<{ id: string | number; name: string; image: string; size: string }>>([]);
  const [favourites, setFavourites] = useState<(string | number)[]>([]);
  const [showFavourites, setShowFavourites] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingFavId, setPendingFavId] = useState<string | number | null>(null);
  const [currentSpace, setCurrentSpace] = useState("");
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  const [filterOptions, setFilterOptions] = useState({
    categories: [] as string[],
    applications: [] as string[],
    finishes: [] as string[],
    sizes: [] as string[],
    colors: [] as string[]
  });

  const [activeFilters, setActiveFilters] = useState({
    catNames: [] as string[],
    appNames: [] as string[],
    finishNames: [] as string[],
    sizeNames: [] as string[],
    colorNames: [] as string[]
  });

  const [tempFilters, setTempFilters] = useState({ ...activeFilters });

  /**
   * Fetches favorites from the backend database
   */
  const syncFavoritesFromServer = useCallback(async () => {
    if (!isLoggedIn()) return;
    try {
      const res = await listFavoritesAPI();
      const serverFavIds = res.data.map((item: any) => item.tile_id || item.id);
      setFavourites(serverFavIds);
    } catch (err) {
      console.error("Failed to sync favorites from server:", err);
    }
  }, []);

  // Initial Load: Check auth and sync data
  useEffect(() => {
    const loggedIn = isLoggedIn();
    setIsUserLoggedIn(loggedIn);
    
    const savedSpace = localStorage.getItem("selected_space_type") || "Kitchen";
    setCurrentSpace(savedSpace);

    if (loggedIn) {
      syncFavoritesFromServer();
    } else {
      const saved = localStorage.getItem("favourites");
      if (saved) setFavourites(JSON.parse(saved));
    }
  }, [syncFavoritesFromServer]);

  /**
   * Handle logic after successful login/signup
   */
  const handleLoginSuccess = async () => {
    setIsUserLoggedIn(true);
    await syncFavoritesFromServer();
    
    if (pendingFavId) {
      try {
        await addFavoriteAPI(pendingFavId);
        setFavourites(prev => prev.includes(pendingFavId) ? prev : [...prev, pendingFavId]);
      } catch (err) {
        console.error("Auto favorite failed", err);
      } finally {
        setPendingFavId(null);
      }
    }
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    logout(); // Now using sessionStorage.clear() via lib/auth.ts
    setIsUserLoggedIn(false);
    setFavourites([]);
  };

  // Fetch filter options based on space
  useEffect(() => {
    if (!currentSpace) return;
    fetch(`${API_BASE}/FilterOptions?spaceName=${currentSpace}`)
      .then(r => r.json())
      .then(data => setFilterOptions(data))
      .catch(err => console.error("FilterOptions error", err));
  }, [currentSpace]);

  // Fetch product list based on space and active filters
  useEffect(() => {
    const fetchProducts = async () => {
      if (!currentSpace) return;
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append("spaceName", currentSpace);
        Object.entries(activeFilters).forEach(([k, v]) => {
          if (v.length) params.append(k, v.join(","));
        });

        const response = await fetch(`${API_BASE}/FilterTileList?${params.toString()}`);
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

    fetchProducts();
  }, [activeFilters, currentSpace]);

  const handleApplyFilters = () => {
    setActiveFilters({ ...tempFilters });
    setShowFilters(false);
  };

  const resetFilters = () => {
    const emptyFilters = { catNames: [], appNames: [], finishNames: [], sizeNames: [], colorNames: [] };
    setTempFilters(emptyFilters);
    setActiveFilters(emptyFilters);
  };

  const updateTempFilter = (key: keyof typeof tempFilters, value: string) => {
    setTempFilters(prev => {
      const list = prev[key];
      return {
        ...prev,
        [key]: list.includes(value) ? list.filter(v => v !== value) : [...list, value]
      };
    });
  };

  return (
    <div className="h-full flex flex-col bg-transparent relative">
      {/* Auth Header */}
      <div className="px-6 pt-4 pb-2 flex justify-between items-center shrink-0">
        <div className="flex flex-col">
          <h2 className="text-xl tracking-[0.35em] uppercase text-slate-900">
            Ti<span className="font-bold">Vi</span>
          </h2>
          <p className="text-[9px] mt-1 font-black text-amber-500 tracking-[0.4em] uppercase">
            {currentSpace}
          </p>
        </div>

        <div>
          {isUserLoggedIn ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-[9px] font-bold uppercase text-slate-600">
                <User size={12} className="text-amber-500" /> Account
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="px-4 py-2 rounded-full bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest hover:bg-amber-600 transition-all"
            >
              Login
            </button>
          )}
        </div>
      </div>

      <div className="px-6 space-y-4 shrink-0 mt-4">
        <div className="relative">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
          <input
            placeholder={`Search in ${currentSpace}...`}
            className="w-full pl-11 pr-4 py-4 rounded-2xl bg-white shadow-sm text-[11px] uppercase font-semibold outline-none"
          />
        </div>

        <div className="flex justify-between items-center gap-3">
          <button
            onClick={() => setShowFavourites(prev => !prev)}
            className={`p-3 rounded-xl border transition shadow-sm ${
              showFavourites ? "bg-red-500 text-white border-red-500" : "bg-white text-slate-400 border-slate-200"
            }`}
          >
            <Heart size={16} />
          </button>

          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all"
          >
            <SlidersHorizontal size={14} /> {showFilters ? "Close" : "Filters"}
          </button>

          <button onClick={() => setGrid(!grid)} className="p-3 rounded-xl border bg-white text-slate-400">
            {grid ? <List size={16} /> : <LayoutGrid size={16} />}
          </button>
          
          <button onClick={resetFilters} className="p-3 rounded-xl border bg-white text-slate-400">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <div className={`h-full overflow-y-auto px-6 py-8 transition-opacity duration-300 ${showFilters ? "opacity-10 pointer-events-none" : "opacity-100"}`}>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 className="animate-spin text-amber-500" size={24} />
              <p className="text-[10px] uppercase font-bold text-slate-400">Loading Tiles</p>
            </div>
          ) : (
            <div className={`grid gap-6 ${grid ? "grid-cols-2" : "grid-cols-1"}`}>
              {(showFavourites ? products.filter(p => favourites.includes(p.id)) : products).map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  isFavourite={favourites.includes(p.id)}
                  onToggleFavourite={async (id) => {
                    if (!isLoggedIn()) {
                      setPendingFavId(id);
                      setShowAuthModal(true);
                      return;
                    }
                    try {
                      const alreadyFav = favourites.includes(id);
                      if (alreadyFav) {
                        await removeFavoriteAPI(id);
                        setFavourites(prev => prev.filter(f => f !== id));
                      } else {
                        await addFavoriteAPI(id);
                        setFavourites(prev => [...prev, id]);
                      }
                    } catch (err) {
                      console.error("Favorite toggle failed:", err);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Filters Overlay */}
        {showFilters && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-10 p-6 overflow-y-auto custom-scrollbar">
            <div className="space-y-6 pb-12">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-2">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Locked Space</p>
                <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">{currentSpace}</p>
              </div>

              {/* Category Filter */}
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Category</h4>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.categories.map(cat => (
                    <button 
                      key={cat} 
                      onClick={() => updateTempFilter("catNames", cat)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase border transition-all ${tempFilters.catNames.includes(cat) ? "bg-slate-900 border-slate-900 text-white" : "border-slate-200 text-slate-500 bg-white"}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Application Filter */}
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

              {/* Finish Filter */}
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Finish</h4>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.finishes.map(f => (
                    <button 
                      key={f} 
                      onClick={() => updateTempFilter("finishNames", f)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase border transition-all ${tempFilters.finishNames.includes(f) ? "bg-slate-900 border-slate-900 text-white" : "border-slate-200 text-slate-500 bg-white"}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Filter */}
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Size</h4>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.sizes.map(s => (
                    <button
                      key={s}
                      onClick={() => updateTempFilter("sizeNames", s)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase border transition-all ${tempFilters.sizeNames.includes(s) ? "bg-slate-900 border-slate-900 text-white" : "border-slate-200 text-slate-500 bg-white"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Color Filter */}
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Color</h4>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.colors.map(c => (
                    <button
                      key={c}
                      onClick={() => updateTempFilter("colorNames", c)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase border transition-all ${tempFilters.colorNames.includes(c) ? "bg-slate-900 border-slate-900 text-white" : "border-slate-200 text-slate-500 bg-white"}`}
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

      <AuthModal
        open={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setPendingFavId(null);
        }}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}