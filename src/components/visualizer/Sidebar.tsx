"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Search,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Loader2,
  RefreshCw,
  Heart,
  LogOut,
  User,
} from "lucide-react";
import ProductCard from "./ProductCard";
import AuthModal from "./AuthModal";
import { ASSET_BASE } from "@/lib/constants";
import { isLoggedIn, logout } from "@/lib/auth";
import {
  addFavoriteAPI,
  removeFavoriteAPI,
  listFavoritesAPI,
} from "@/lib/favorites";
import {
  fetchFilterAvailableOptions,
  fetchFilterOptions,
  fetchFilterTileList,
  type TileFilterOptions,
  type TileListItem,
} from "@/lib/filterApi";
import {
  buildFilterRequestKey,
  sanitizeFilterSelections,
  type TileFilterSelections,
} from "@/lib/filterQuery";

type Product = {
  id: string | number;
  name: string;
  image: string;
  size: string;
};

const EMPTY_FILTERS: TileFilterSelections = {
  catNames: [],
  appNames: [],
  finishNames: [],
  sizeNames: [],
  colorNames: [],
};

const EMPTY_OPTIONS: TileFilterOptions = {
  categories: [],
  applications: [],
  finishes: [],
  sizes: [],
  colors: [],
};

function normalizeSpaceName(rawSpace: string | null | undefined): string {
  const normalized = String(rawSpace ?? "").trim().toLowerCase();

  switch (normalized) {
    case "kitchen":
      return "Kitchen";
    case "living":
    case "living room":
    case "living_room":
      return "Living Room";
    case "bedroom":
      return "Bedroom";
    case "bathroom":
      return "Bathroom";
    default:
      return "Kitchen";
  }
}

function resolveOptionValue(raw: string | null, options: string[]): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const direct = options.find((option) => option === trimmed);
  if (direct) return direct;

  const fallback = options.find(
    (option) => option.toLowerCase() === trimmed.toLowerCase()
  );

  return fallback ?? null;
}

function getInitialFiltersFromStorage(options: TileFilterOptions): TileFilterSelections {
  const initial = sanitizeFilterSelections(EMPTY_FILTERS);

  try {
    const storedApp = localStorage.getItem("selected_application");
    const storedColor = localStorage.getItem("selected_color");

    const resolvedApp = resolveOptionValue(storedApp, options.applications);
    const resolvedColor = resolveOptionValue(storedColor, options.colors);

    if (resolvedApp) initial.appNames = [resolvedApp];
    if (resolvedColor) initial.colorNames = [resolvedColor];
  } catch {
    // Ignore storage read errors.
  }

  return initial;
}

function syncPreferenceStorage(filters: TileFilterSelections): void {
  try {
    if (filters.appNames.length === 1) {
      localStorage.setItem("selected_application", filters.appNames[0]);
    } else {
      localStorage.removeItem("selected_application");
    }

    if (filters.colorNames.length === 1) {
      localStorage.setItem("selected_color", filters.colorNames[0]);
    } else {
      localStorage.removeItem("selected_color");
    }
  } catch {
    // Ignore storage write errors.
  }
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

function areStringArraysEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function areFilterSelectionsEqual(
  left: TileFilterSelections,
  right: TileFilterSelections
): boolean {
  return (
    areStringArraysEqual(left.catNames, right.catNames) &&
    areStringArraysEqual(left.appNames, right.appNames) &&
    areStringArraysEqual(left.finishNames, right.finishNames) &&
    areStringArraysEqual(left.sizeNames, right.sizeNames) &&
    areStringArraysEqual(left.colorNames, right.colorNames)
  );
}

function pruneSelectionsToAvailableOptions(
  filters: TileFilterSelections,
  options: TileFilterOptions
): TileFilterSelections {
  const categories = new Set(options.categories);
  const applications = new Set(options.applications);
  const finishes = new Set(options.finishes);
  const sizes = new Set(options.sizes);
  const colors = new Set(options.colors);

  return sanitizeFilterSelections({
    catNames: filters.catNames.filter((value) => categories.has(value)),
    appNames: filters.appNames.filter((value) => applications.has(value)),
    finishNames: filters.finishNames.filter((value) => finishes.has(value)),
    sizeNames: filters.sizeNames.filter((value) => sizes.has(value)),
    colorNames: filters.colorNames.filter((value) => colors.has(value)),
  });
}

function mapTilesToProducts(rows: TileListItem[]): Product[] {
  const assetBase = String(ASSET_BASE ?? "").trim();
  const normalizedAssetBase = assetBase.endsWith("/") ? assetBase : `${assetBase}/`;

  return rows.map((item) => ({
    id: item.tile_id,
    name: String(item.sku_name ?? ""),
    image: `${normalizedAssetBase}media/thumb/${String(item.sku_code ?? "")}.jpg`,
    size: String(item.size_name ?? ""),
  }));
}

export default function Sidebar() {
  const [grid, setGrid] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [favourites, setFavourites] = useState<(string | number)[]>([]);
  const [showFavourites, setShowFavourites] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingFavId, setPendingFavId] = useState<string | number | null>(null);
  const [currentSpace, setCurrentSpace] = useState("");
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [filterOptions, setFilterOptions] = useState<TileFilterOptions>(EMPTY_OPTIONS);
  const [tempFilters, setTempFilters] = useState<TileFilterSelections>(EMPTY_FILTERS);

  const debouncedTempFilters = useDebouncedValue(tempFilters, 300);
  const lastAppliedQueryKey = useRef("");
  const lastAvailableQueryKey = useRef("");
  const availableOptionsAbortRef = useRef<AbortController | null>(null);

  /**
   * Fetches favorites from backend and syncs local favorite ids.
   */
  const syncFavoritesFromServer = useCallback(async () => {
    if (!isLoggedIn()) return;
    try {
      const res = await listFavoritesAPI();
      const serverFavIds = res.data.map((item: { tile_id?: string | number; id?: string | number }) => item.tile_id || item.id || "");
      setFavourites(serverFavIds);
    } catch (err) {
      console.error("Failed to sync favorites from server:", err);
    }
  }, []);

  useEffect(() => {
    const loggedIn = isLoggedIn();
    setIsUserLoggedIn(loggedIn);

    const savedSpace = normalizeSpaceName(localStorage.getItem("selected_space_type"));
    setCurrentSpace(savedSpace);

    if (loggedIn) {
      syncFavoritesFromServer();
    } else {
      const saved = localStorage.getItem("favourites");
      if (saved) setFavourites(JSON.parse(saved));
    }
  }, [syncFavoritesFromServer]);

  const handleLoginSuccess = async () => {
    setIsUserLoggedIn(true);
    await syncFavoritesFromServer();

    if (pendingFavId) {
      try {
        await addFavoriteAPI(pendingFavId);
        setFavourites((prev) => (prev.includes(pendingFavId) ? prev : [...prev, pendingFavId]));
      } catch (err) {
        console.error("Auto favorite failed", err);
      } finally {
        setPendingFavId(null);
      }
    }
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    logout();
    setIsUserLoggedIn(false);
    setFavourites([]);
  };

  const fetchTilesAndOptions = useCallback(
    async (nextFilters: TileFilterSelections, options: { closePanel?: boolean } = {}) => {
      if (!currentSpace) return;

      const sanitized = sanitizeFilterSelections(nextFilters);
      const request = { spaceName: currentSpace, ...sanitized };
      const queryKey = buildFilterRequestKey(request);

      // Skip duplicate apply submissions to reduce unnecessary API traffic.
      if (queryKey === lastAppliedQueryKey.current) {
        if (options.closePanel) setShowFilters(false);
        return;
      }

      setLoading(true);
      try {
        const [tileRows, available] = await Promise.all([
          fetchFilterTileList(request),
          fetchFilterAvailableOptions(request),
        ]);

        const pruned = pruneSelectionsToAvailableOptions(sanitized, available);
        const shouldRetryWithPruned =
          tileRows.length === 0 && !areFilterSelectionsEqual(pruned, sanitized);

        let finalRows = tileRows;
        let finalOptions = available;
        let finalFilters = sanitized;
        let finalQueryKey = queryKey;

        if (shouldRetryWithPruned) {
          const retryRequest = { spaceName: currentSpace, ...pruned };
          const [retryRows, retryAvailable] = await Promise.all([
            fetchFilterTileList(retryRequest),
            fetchFilterAvailableOptions(retryRequest),
          ]);
          finalRows = retryRows;
          finalOptions = retryAvailable;
          finalFilters = pruned;
          finalQueryKey = buildFilterRequestKey(retryRequest);
        }

        setProducts(mapTilesToProducts(finalRows));
        setFilterOptions(finalOptions);
        setTempFilters(finalFilters);
        syncPreferenceStorage(finalFilters);
        lastAppliedQueryKey.current = finalQueryKey;
      } catch (error) {
        console.error("Filter apply error:", error);
        setProducts([]);
        setFilterOptions(EMPTY_OPTIONS);
      } finally {
        setLoading(false);
        if (options.closePanel) setShowFilters(false);
      }
    },
    [currentSpace]
  );

  // Initial data load for selected space.
  useEffect(() => {
    if (!currentSpace) return;

    let isMounted = true;
    setLoading(true);

    fetchFilterOptions(currentSpace)
      .then(async (options) => {
        if (!isMounted) return;

        const initialFilters = getInitialFiltersFromStorage(options);
        const request = {
          spaceName: currentSpace,
          ...initialFilters,
        };

        const [tileRows, available] = await Promise.all([
          fetchFilterTileList(request),
          fetchFilterAvailableOptions(request),
        ]);

        if (!isMounted) return;

        setFilterOptions(available);
        setProducts(mapTilesToProducts(tileRows));
        setTempFilters(initialFilters);
        syncPreferenceStorage(initialFilters);
        lastAppliedQueryKey.current = buildFilterRequestKey(request);
      })
      .catch((error) => {
        if (!isMounted) return;
        console.error("Initial filter bootstrap error:", error);
        setFilterOptions(EMPTY_OPTIONS);
        setProducts([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentSpace]);

  // Debounced dynamic available options update while user is changing selections.
  useEffect(() => {
    if (!showFilters || !currentSpace) return;

    const request = {
      spaceName: currentSpace,
      ...sanitizeFilterSelections(debouncedTempFilters),
    };
    const queryKey = buildFilterRequestKey(request);

    if (queryKey === lastAvailableQueryKey.current) {
      return;
    }

    if (availableOptionsAbortRef.current) {
      availableOptionsAbortRef.current.abort();
    }

    const controller = new AbortController();
    availableOptionsAbortRef.current = controller;

    fetchFilterAvailableOptions(request, controller.signal)
      .then((available) => {
        setFilterOptions(available);
        setTempFilters((previous) => {
          const pruned = pruneSelectionsToAvailableOptions(previous, available);
          return areFilterSelectionsEqual(previous, pruned) ? previous : pruned;
        });
        lastAvailableQueryKey.current = queryKey;
      })
      .catch((error) => {
        if ((error as Error)?.name !== "AbortError") {
          console.error("FilterAvailableOptions error:", error);
        }
      });

    return () => {
      controller.abort();
    };
  }, [debouncedTempFilters, currentSpace, showFilters]);

  const handleApplyFilters = useCallback(() => {
    fetchTilesAndOptions(tempFilters, { closePanel: true });
  }, [fetchTilesAndOptions, tempFilters]);

  const resetFilters = useCallback(() => {
    const cleared = sanitizeFilterSelections(EMPTY_FILTERS);
    setTempFilters(cleared);
    syncPreferenceStorage(cleared);
    fetchTilesAndOptions(cleared);
  }, [fetchTilesAndOptions]);

  const updateTempFilter = (key: keyof TileFilterSelections, value: string) => {
    setTempFilters((prev) => {
      const list = prev[key];
      const exists = list.includes(value);

      if (key === "colorNames") {
        return {
          ...prev,
          colorNames: exists ? [] : [value],
        };
      }

      return {
        ...prev,
        [key]: exists ? list.filter((v) => v !== value) : [...list, value],
      };
    });
  };

  const visibleProducts = useMemo(() => {
    if (!showFavourites) return products;
    return products.filter((product) => favourites.includes(product.id));
  }, [products, showFavourites, favourites]);

  return (
    <div className="h-full flex flex-col bg-transparent relative">
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
            onClick={() => setShowFavourites((prev) => !prev)}
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
        <div
          className={`h-full overflow-y-auto px-6 py-8 transition-opacity duration-300 ${
            showFilters ? "opacity-10 pointer-events-none" : "opacity-100"
          }`}
        >
          {loading ? (
            <div role="status" aria-live="polite">
              <div className="mb-5 flex items-center gap-2 text-[10px] uppercase font-bold text-slate-400">
                <Loader2 className="animate-spin text-amber-500" size={16} />
                Loading tiles
              </div>
              <div className={`grid gap-6 ${grid ? "grid-cols-2" : "grid-cols-1"}`}>
                {Array.from({ length: grid ? 6 : 4 }).map((_, index) => (
                  <div
                    key={`loading-${index}`}
                    className="rounded-3xl bg-white p-3 shadow-[0_30px_60px_-30px_rgba(15,23,42,0.15)]"
                  >
                    <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-slate-100">
                      <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-200/70 via-white to-amber-100/70" />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.12),transparent_45%)]" />
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="h-3 w-3/4 rounded-full bg-slate-200/80 animate-pulse" />
                      <div className="h-2 w-1/2 rounded-full bg-slate-100 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400">
                No tiles found
              </p>
            </div>
          ) : (
            <div className={`grid gap-6 ${grid ? "grid-cols-2" : "grid-cols-1"}`}>
              {visibleProducts.map((p) => (
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
                        setFavourites((prev) => prev.filter((f) => f !== id));
                      } else {
                        await addFavoriteAPI(id);
                        setFavourites((prev) => [...prev, id]);
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

        {showFilters && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-10 p-6 overflow-y-auto custom-scrollbar">
            <div className="space-y-6 pb-12">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-2">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Locked Space</p>
                <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">{currentSpace}</p>
              </div>

              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Category</h4>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => updateTempFilter("catNames", cat)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase border transition-all ${
                        tempFilters.catNames.includes(cat)
                          ? "bg-slate-900 border-slate-900 text-white"
                          : "border-slate-200 text-slate-500 bg-white"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Application</h4>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.applications.map((app) => (
                    <button
                      key={app}
                      onClick={() => updateTempFilter("appNames", app)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase border transition-all ${
                        tempFilters.appNames.includes(app)
                          ? "bg-slate-900 border-slate-900 text-white"
                          : "border-slate-200 text-slate-500 bg-white"
                      }`}
                    >
                      {app}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Finish</h4>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.finishes.map((finish) => (
                    <button
                      key={finish}
                      onClick={() => updateTempFilter("finishNames", finish)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase border transition-all ${
                        tempFilters.finishNames.includes(finish)
                          ? "bg-slate-900 border-slate-900 text-white"
                          : "border-slate-200 text-slate-500 bg-white"
                      }`}
                    >
                      {finish}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Size</h4>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => updateTempFilter("sizeNames", size)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase border transition-all ${
                        tempFilters.sizeNames.includes(size)
                          ? "bg-slate-900 border-slate-900 text-white"
                          : "border-slate-200 text-slate-500 bg-white"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Color</h4>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => updateTempFilter("colorNames", color)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase border transition-all ${
                        tempFilters.colorNames.includes(color)
                          ? "bg-slate-900 border-slate-900 text-white"
                          : "border-slate-200 text-slate-500 bg-white"
                      }`}
                    >
                      {color}
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
