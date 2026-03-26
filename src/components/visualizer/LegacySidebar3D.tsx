
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
import { ASSET_BASE } from "@/lib/constants";
import { isLoggedIn, logout } from "@/lib/auth";
import { addFavoriteAPI, removeFavoriteAPI, listFavoritesAPI } from "@/lib/favorites";
import AuthModal from "./AuthModal";
import { Loader2 } from "lucide-react";

type Product = { id: string | number; name: string; image: string; size: string; skuCode: string };

type Handlers = {
  onSelectRoom?: () => void;
  onProductInfo?: () => void;
  onSave?: () => void;
  onPrint?: () => void;
  onEmail?: () => void;
  onShare?: () => void;
  onFullscreen?: () => void;
  onClear?: () => void;
};

const EMPTY_FILTERS: TileFilterSelections = { catNames: [], appNames: [], finishNames: [], sizeNames: [], colorNames: [] };
const EMPTY_OPTIONS: TileFilterOptions = { categories: [], applications: [], finishes: [], sizes: [], colors: [] };

const COLOR_WHITELIST = [
  "BROWN", "BEIGE", "WHITE", "GREY", "BLUE", "GREEN", "CREAM",
  "ORANGE", "RED", "BLACK", "IVORY", "PINK", "MULTICOLOR", "YELLOW"
] as const;

const COLOR_WHITELIST_SET = new Set<string>(COLOR_WHITELIST);

function normalizeColorToken(value: string): string {
  return String(value ?? "").trim().toUpperCase().replace(/\s+/g, " ");
}

function splitColorTokens(raw: string): string[] {
  return String(raw ?? "").split(",").map(normalizeColorToken).filter(Boolean);
}

function getUiColorOptions(rawColors: string[]): string[] {
  const found = new Set<string>();
  rawColors.forEach((raw) => {
    splitColorTokens(raw).forEach((token) => {
      if (COLOR_WHITELIST_SET.has(token)) found.add(token);
    });
  });
  return COLOR_WHITELIST.filter((c) => found.has(c));
}

function expandSelectedColorsForApi(selectedBase: string[], rawColors: string[]): string[] {
  if (!selectedBase.length) return [];
  const base = normalizeColorToken(selectedBase[0]);
  if (!base) return [];
  const expanded = rawColors.filter((raw) => splitColorTokens(raw).includes(base));
  return expanded.length ? expanded : [base];
}

function pruneBaseColorSelection(selectedBase: string[], rawColors: string[]): string[] {
  if (!selectedBase.length) return [];
  const base = normalizeColorToken(selectedBase[0]);
  if (!base) return [];
  const exists = rawColors.some((raw) => splitColorTokens(raw).includes(base));
  return exists ? [base] : [];
}

function resolveOptionValue(raw: string | null, options: string[]): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const direct = options.find((o) => o === trimmed);
  if (direct) return direct;
  const fallback = options.find((o) => o.toLowerCase() === trimmed.toLowerCase());
  return fallback ?? null;
}

function getInitialFiltersFromStorage(options: TileFilterOptions): TileFilterSelections {
  const initial = sanitizeFilterSelections(EMPTY_FILTERS);
  try {
    const storedApp = localStorage.getItem("selected_application");
    const storedColor = localStorage.getItem("selected_color");
    const resolvedApp = resolveOptionValue(storedApp, options.applications);
    const resolvedColor = resolveOptionValue(storedColor, getUiColorOptions(options.colors));
    if (resolvedApp) initial.appNames = [resolvedApp];
    if (resolvedColor) initial.colorNames = [resolvedColor];
  } catch {}
  return initial;
}

function syncPreferenceStorage(filters: TileFilterSelections): void {
  try {
    if (filters.appNames.length === 1) localStorage.setItem("selected_application", filters.appNames[0]);
    else localStorage.removeItem("selected_application");
    if (filters.colorNames.length === 1) localStorage.setItem("selected_color", filters.colorNames[0]);
    else localStorage.removeItem("selected_color");
  } catch {}
}

function mapTilesToProducts(rows: TileListItem[]): Product[] {
  const base = String(ASSET_BASE ?? "https://vyr.svikinfotech.in/assets/").trim();
  const assetBase = base.endsWith("/") ? base : `${base}/`;
  return rows.map((item) => {
    const skuCode = String(item.sku_code ?? "").trim();
    const rawName = String(item.sku_name ?? item.name ?? item.product_name ?? "").trim();
    const name = rawName || skuCode || "Tile";
    const size = String(item.size_name ?? item.size ?? "").trim();
    return {
      id: item.tile_id,
      name,
      image: `${assetBase}media/thumb/${skuCode}.jpg`,
      size,
      skuCode,
    };
  });
}

export default function LegacySidebar3D({
  onSelectRoom,
  onProductInfo,
  onSave,
  onPrint,
  onEmail,
  onShare,
  onFullscreen,
  onClear,
}: Handlers) {
  const [open, setOpen] = useState(true);
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
  const [debouncedTempFilters, setDebouncedTempFilters] = useState(tempFilters);
  const [searchTerm, setSearchTerm] = useState("");
  const [rotation, setRotation] = useState("0");
  const [selectedTileId, setSelectedTileId] = useState<string | number | null>(null);


  const lastAppliedQueryKey = useRef("");
  const lastAvailableQueryKey = useRef("");
  const availableOptionsAbortRef = useRef<AbortController | null>(null);

  const uiColorOptions = useMemo(() => getUiColorOptions(filterOptions.colors), [filterOptions.colors]);
  const uiApplicationOptions = useMemo(() => {
    return filterOptions.applications.filter(
      (a) => a.trim().toLowerCase() !== "bathroom floor"
    );
  }, [filterOptions.applications]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedTempFilters(tempFilters), 300);
    return () => clearTimeout(t);
  }, [tempFilters]);
  useEffect(() => {
  const loadSelected = () => {
    try {
      const raw = localStorage.getItem("selected_tile");
      const parsed = raw ? JSON.parse(raw) : null;
      setSelectedTileId(parsed?.id ?? null);
    } catch {
      setSelectedTileId(null);
    }
  };

  loadSelected();
  window.addEventListener("storage", loadSelected);
  window.addEventListener("selectedTileUpdated", loadSelected as EventListener);

  return () => {
    window.removeEventListener("storage", loadSelected);
    window.removeEventListener("selectedTileUpdated", loadSelected as EventListener);
  };
}, []);


  const syncFavoritesFromServer = useCallback(async () => {
    if (!isLoggedIn()) return;
    try {
      const res = await listFavoritesAPI();
      const ids = res.data.map((item: any) => item.tile_id || item.id || "");
      setFavourites(ids);
    } catch (err) {
      console.error("Failed to sync favorites:", err);
    }
  }, []);
//   const syncFavoritesFromServer = useCallback(async () => {
//   if (!isLoggedIn()) return;

//   try {
//     const res = await listFavoritesAPI();

//     // legacy-friendly: backend may return [] OR { data: [] }
//     const rows = Array.isArray(res.data) ? res.data : res.data?.data;
//     const ids = (rows || [])
//       .map((item: any) => String(item?.tile_id ?? item?.tileId ?? item?.id ?? ""))
//       .filter(Boolean);

//     setFavourites(ids);
//   } catch (err) {
//     console.error("Failed to sync favorites:", err);
//   }
// }, []);


  useEffect(() => {
    const loggedIn = isLoggedIn();
    setIsUserLoggedIn(loggedIn);
    const savedSpace = localStorage.getItem("selected_space_type") || "Kitchen";
    setCurrentSpace(savedSpace);
    if (loggedIn) syncFavoritesFromServer();
    else {
      const saved = localStorage.getItem("favourites");
      if (saved) setFavourites(JSON.parse(saved));
    }
//     else {
//   // legacy 2D uses this key
//   const saved = localStorage.getItem("visualizer_favorites_v1");
//   if (saved) {
//     try {
//       const parsed = JSON.parse(saved);
//       const ids = Array.isArray(parsed) ? parsed.map((x) => String(x)) : [];
//       setFavourites(ids);
//     } catch {}
//   }
// }

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
//   const handleLoginSuccess = async () => {
//   setIsUserLoggedIn(true);

//   // immediately refresh from server (legacy behavior)
//   await syncFavoritesFromServer();

//   // if user tried to fav while logged out, auto-fav after login
//   if (pendingFavId) {
//     const favKey = String(pendingFavId);
//     try {
//       await addFavoriteAPI(favKey);
//       setFavourites((prev) => (prev.includes(favKey) ? prev : [...prev, favKey]));

//       // keep local copy too (legacy key) so it persists for UI
//       try {
//         const next = (prev: string[]) => (prev.includes(favKey) ? prev : [...prev, favKey]);
//         const saved = localStorage.getItem("visualizer_favorites_v1");
//         const parsed = saved ? JSON.parse(saved) : [];
//         const list = Array.isArray(parsed) ? parsed.map(String) : [];
//         localStorage.setItem("visualizer_favorites_v1", JSON.stringify(next(list)));
//       } catch {}
//     } catch (err) {
//       console.error("Auto favorite failed", err);
//     } finally {
//       setPendingFavId(null);
//     }
//   }

//   setShowAuthModal(false);
// };


  const handleLogout = () => {
    logout();
    setIsUserLoggedIn(false);
    setFavourites([]);
  };

//   const handleLogout = () => {
//   logout(); // removes pgatoken + reload (your auth.ts does reload)
//   setIsUserLoggedIn(false);
//   setShowFavourites(false);
//   setFavourites([]);
//   try {
//     localStorage.setItem("visualizer_favorites_v1", JSON.stringify([]));
//   } catch {}
// };

  const handleProductApply = (product: Product) => {
    const tile = { id: product.id, name: product.name, image: product.image, skuCode: product.skuCode };
    localStorage.setItem("selected_tile", JSON.stringify(tile));
    localStorage.setItem("selected_tile_size", product.size);
    window.dispatchEvent(new StorageEvent("storage", { key: "selected_tile", newValue: JSON.stringify(tile) }));
    setSelectedTileId(product.id);
  };

  const handleFavouriteToggle = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (!isLoggedIn()) {
      setPendingFavId(product.id);
      setShowAuthModal(true);
      return;
    }
    const isFav = favourites.includes(product.id);
    try {
      if (isFav) {
        await removeFavoriteAPI(product.id);
        setFavourites((prev) => prev.filter((id) => id !== product.id));
      } else {
        await addFavoriteAPI(product.id);
        setFavourites((prev) => (prev.includes(product.id) ? prev : [...prev, product.id]));
      }
    } catch (err) {
      console.error("Favourite toggle failed:", err);
    }
  };

  const fetchTilesAndOptions = useCallback(
    async (nextFilters: TileFilterSelections, options: { closePanel?: boolean } = {}) => {
      if (!currentSpace) return;
      const sanitized = sanitizeFilterSelections(nextFilters);
      const baseRequest = { spaceName: currentSpace, ...sanitized };
      const queryKey = buildFilterRequestKey(baseRequest);
      if (queryKey === lastAppliedQueryKey.current) {
        if (options.closePanel) setShowFilters(false);
        return;
      }
      const request = {
        ...baseRequest,
        colorNames: expandSelectedColorsForApi(sanitized.colorNames, filterOptions.colors),
      };
      setLoading(true);
      try {
        const [rows, available] = await Promise.all([
          fetchFilterTileList(request),
          fetchFilterAvailableOptions(request),
        ]);
        const pruned: TileFilterSelections = {
          catNames: sanitized.catNames.filter((v) => available.categories.includes(v)),
          appNames: sanitized.appNames.filter((v) => available.applications.includes(v)),
          finishNames: sanitized.finishNames.filter((v) => available.finishes.includes(v)),
          sizeNames: sanitized.sizeNames.filter((v) => available.sizes.includes(v)),
          colorNames: pruneBaseColorSelection(sanitized.colorNames, available.colors),
        };
        let finalRows = rows;
        let finalOptions = available;
        let finalFilters = sanitized;
        let finalKey = queryKey;
        if (rows.length === 0 && JSON.stringify(pruned) !== JSON.stringify(sanitized)) {
          const retryReq = {
            spaceName: currentSpace,
            ...pruned,
            colorNames: expandSelectedColorsForApi(pruned.colorNames, available.colors),
          };
          const [retryRows, retryAvail] = await Promise.all([
            fetchFilterTileList(retryReq),
            fetchFilterAvailableOptions(retryReq),
          ]);
          finalRows = retryRows;
          finalOptions = retryAvail;
          finalFilters = pruned;
          finalKey = buildFilterRequestKey({ spaceName: currentSpace, ...pruned });
        }
        setProducts(mapTilesToProducts(finalRows));
        setFilterOptions(finalOptions);
        setTempFilters(finalFilters);
        syncPreferenceStorage(finalFilters);
        lastAppliedQueryKey.current = finalKey;
      } catch (error) {
        console.error("Filter apply error:", error);
        setProducts([]);
        setFilterOptions(EMPTY_OPTIONS);
      } finally {
        setLoading(false);
        if (options.closePanel) setShowFilters(false);
      }
    },
    [currentSpace, filterOptions.colors]
  );

  const resetFilters = useCallback(() => {
    const cleared = sanitizeFilterSelections(EMPTY_FILTERS);
    setTempFilters(cleared);
    syncPreferenceStorage(cleared);
    localStorage.removeItem("selected_tile");
    localStorage.removeItem("selected_tile_size");
    if (currentSpace) fetchTilesAndOptions(cleared);
  }, [currentSpace, fetchTilesAndOptions]);

  useEffect(() => {
    if (!currentSpace) return;
    let isMounted = true;
    setLoading(true);
    fetchFilterOptions(currentSpace)
      .then(async (options) => {
        if (!isMounted) return;
        const initialFilters = getInitialFiltersFromStorage(options);
        const baseReq = { spaceName: currentSpace, ...initialFilters };
        const req = {
          ...baseReq,
          colorNames: expandSelectedColorsForApi(initialFilters.colorNames, options.colors),
        };
        const [rows, available] = await Promise.all([
          fetchFilterTileList(req),
          fetchFilterAvailableOptions(req),
        ]);
        if (!isMounted) return;
        setFilterOptions(available);
        setProducts(mapTilesToProducts(rows));
        setTempFilters(initialFilters);
        syncPreferenceStorage(initialFilters);
        lastAppliedQueryKey.current = buildFilterRequestKey(baseReq);
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
    return () => { isMounted = false; };
  }, [currentSpace]);

  useEffect(() => {
    if (!showFilters || !currentSpace) return;
    const sanitized = sanitizeFilterSelections(debouncedTempFilters);
    const baseReq = { spaceName: currentSpace, ...sanitized };
    const key = buildFilterRequestKey(baseReq);
    const request = {
      ...baseReq,
      colorNames: expandSelectedColorsForApi(sanitized.colorNames, filterOptions.colors),
    };
    if (key === lastAvailableQueryKey.current) return;
    availableOptionsAbortRef.current?.abort();
    const controller = new AbortController();
    availableOptionsAbortRef.current = controller;
    fetchFilterAvailableOptions(request, controller.signal)
      .then((available) => {
        setFilterOptions(available);
        setTempFilters((prev) => {
          const next = sanitizeFilterSelections(prev);
          return { ...next, colorNames: pruneBaseColorSelection(next.colorNames, available.colors) };
        });
        lastAvailableQueryKey.current = key;
      })
      .catch((error) => {
        if ((error as Error)?.name !== "AbortError") console.error("FilterAvailableOptions error:", error);
      });
    return () => controller.abort();
  }, [debouncedTempFilters, currentSpace, showFilters, filterOptions.colors]);

  const handleApplyFilters = useCallback(() => {
    fetchTilesAndOptions(tempFilters, { closePanel: true });
  }, [fetchTilesAndOptions, tempFilters]);

  const updateTempFilter = (key: keyof TileFilterSelections, value: string) => {
    setTempFilters((prev) => {
      const list = prev[key];
      const exists = list.includes(value);
      if (key === "colorNames") return { ...prev, colorNames: exists ? [] : [value] };
      return { ...prev, [key]: exists ? list.filter((v) => v !== value) : [...list, value] };
    });
  };

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((p) =>
      (p.name || p.skuCode || "").toLowerCase().includes(searchTerm.trim().toLowerCase())
    );
    if (!showFavourites) return filtered;
    return filtered.filter((p) => favourites.includes(p.id));
  }, [products, showFavourites, favourites, searchTerm]);

  const handleRotationChange = (v: string) => {
    setRotation(v);
    localStorage.setItem("tile_rotation_deg", v);
    window.dispatchEvent(new CustomEvent("tile-rotation", { detail: { degrees: Number(v) } }));
  };

  return (
    <div className="legacy3d-root">
      <style>{css}</style>

      <button id="legacy3d-hamburger" className="legacy3d-hamburger" onClick={() => setOpen((v) => !v)}>
        <span />
        <span />
        <span />
      </button>

      <div className={`legacy3d-sidebar ${open ? "" : "collapsed"}`}>
        <div className="legacy3d-body">
          <div className="sb-topbar">
            <div className="sb-logo">TI<span>VI</span></div>

            {/* Top heart — toggles show favourites only, or prompts login */}
            <button
              className={`sb-heart ${showFavourites ? "on" : ""}`}
              aria-label="Favourites"
              onClick={() => {
                if (!isLoggedIn()) { setShowAuthModal(true); return; }
                setShowFavourites((p) => !p);
              }}
            >
              <svg viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>

            {isUserLoggedIn ? (
              <button className="sb-login" onClick={handleLogout}>LOGOUT</button>
            ) : (
              <button className="sb-login" onClick={() => setShowAuthModal(true)}>LOGIN</button>
            )}
          </div>

          <div className="sb-controls">
            <button className="sb-ctrl-btn" onClick={() => setShowFilters(true)}>FILTERS</button>
            <button className="sb-ctrl-btn" onClick={() => { resetFilters(); onClear?.(); }}>CLEAR TILES</button>
          </div>

          <div className="sb-search-row">
            <span className="sb-rotate-label">Rotate</span>
            <select className="sb-rotate-select" value={rotation} onChange={(e) => handleRotationChange(e.target.value)}>
              <option value="0">0°</option>
              <option value="90">90°</option>
            </select>
            <input
              className="sb-search"
              placeholder="Search by tile names"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="sb-tiles-scroll">
            <div className="sb-tile-grid">
              {loading ? (
                <div className="tile-loading"><Loader2 className="spin" size={22} /></div>
              ) : visibleProducts.length === 0 ? (
                <div className="tile-empty">No products found</div>
              ) : (
                visibleProducts.map((p) => {
                  const isFav = favourites.includes(p.id);
                  return (
                    // <div key={p.id} className="tile" onClick={() => handleProductApply(p)}>
                    <div
                      key={p.id}
                      className={`tile ${selectedTileId === p.id ? "tile-selected" : ""}`}
                      onClick={() => handleProductApply(p)}
                    >

                      <div className="tile-img">
                        <img
                          src={`/api/tile-image?url=${encodeURIComponent(p.image)}`}
                          alt={p.name}
                          loading="lazy"
                        />
                        {/* ── Per-tile heart ── */}
                        <button
                          type="button"
                          className={`tile-heart ${isFav ? "on" : ""}`}
                          title="Favourite"
                          onClick={(e) => handleFavouriteToggle(e, p)}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                        </button>
                      </div>
                      <div className="tile-name">{p.name || p.skuCode || "Tile"}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="top-right">
        <button className="tr-btn" onClick={onSelectRoom}>Select Room</button>
        <button className="tr-btn" onClick={onProductInfo}>Product Info</button>
      </div>

      <div className="right-toolbar">
        <button className="rt-btn" title="Save" onClick={onSave}>
          <img src="/app/visualizer/images/save_icon.png" alt="Save" />
        </button>
        <button className="rt-btn" title="Print" onClick={onPrint}>
          <img src="/app/visualizer/images/print_icon.png" alt="Print" />
        </button>
        <button className="rt-btn" title="Email" onClick={onEmail}>
          <img src="/app/visualizer/images/mail_icon.png" alt="Email" />
        </button>
        <button className="rt-btn" title="Share" onClick={onShare}>
          <img src="/app/visualizer/images/share_icon.png" alt="Share" />
        </button>
        <button className="rt-btn" title="Fullscreen" onClick={onFullscreen}>
          <img src="/app/visualizer/images/full_screen_icon.png" alt="Fullscreen" />
        </button>
      </div>

      {showFilters && (
        <div className="modal-overlay" onClick={() => setShowFilters(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <span className="modal-head-title">FILTER</span>
              <button className="modal-x" onClick={() => setShowFilters(false)}>✕</button>
            </div>
            <div className="modal-scroll">
              <FilterBlock
                title="Size"
                options={filterOptions.sizes}
                active={tempFilters.sizeNames}
                onToggle={(v) => updateTempFilter("sizeNames", v)}
                onSetActive={(next) => setTempFilters((prev) => ({ ...prev, sizeNames: next }))}
              />
              <FilterBlock
                title="Finish"
                options={filterOptions.finishes}
                active={tempFilters.finishNames}
                onToggle={(v) => updateTempFilter("finishNames", v)}
                onSetActive={(next) => setTempFilters((prev) => ({ ...prev, finishNames: next }))}
              />
              <FilterBlock
                title="Category"
                options={filterOptions.categories}
                active={tempFilters.catNames}
                onToggle={(v) => updateTempFilter("catNames", v)}
                onSetActive={(next) => setTempFilters((prev) => ({ ...prev, catNames: next }))}
              />
              <FilterBlock
                title="Application"
                options={uiApplicationOptions}
                active={tempFilters.appNames.filter((a) => a.trim().toLowerCase() !== "bathroom floor")}
                onToggle={(v) => {
                  if (v.trim().toLowerCase() === "bathroom floor") return;
                  updateTempFilter("appNames", v);
                }}
                onSetActive={(next) =>
                  setTempFilters((prev) => ({
                    ...prev,
                    appNames: next.filter((a) => a.trim().toLowerCase() !== "bathroom floor"),
                  }))
                }
              />
              <FilterBlock
                title="Color"
                options={uiColorOptions}
                active={tempFilters.colorNames}
                single
                onToggle={(v) => updateTempFilter("colorNames", v)}
                onSetActive={(next) =>
                  setTempFilters((prev) => ({ ...prev, colorNames: next.slice(0, 1) }))
                }
              />
            </div>
            <div className="modal-foot">
              <button className="foot-close" onClick={() => setShowFilters(false)}>CLOSE</button>
              <button className="foot-apply" onClick={handleApplyFilters}>APPLY FILTER</button>
            </div>
          </div>
        </div>
      )}

      <AuthModal
        open={showAuthModal}
        onClose={() => { setShowAuthModal(false); setPendingFavId(null); }}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}

function FilterBlock({
  title,
  options,
  active,
  onToggle,
  onSetActive,
  single = false,
}: {
  title: string;
  options: string[];
  active: string[];
  onToggle: (v: string) => void;
  onSetActive?: (next: string[]) => void;
  single?: boolean;
}) {
  const handleAll = () => {
    if (!onSetActive) return;
    if (single) return onSetActive([]);
    onSetActive(options.slice());
  };
  const handleNone = () => { onSetActive?.([]); };
  const handleInvert = () => {
    if (!onSetActive) return;
    if (single) return onSetActive([]);
    onSetActive(options.filter((opt) => !active.includes(opt)));
  };

  return (
    <div className="filter-block">
      <div className="filter-block-title">{title}</div>
      <div className="filter-bulk">
        <button type="button" className="bulk-pill" onClick={handleAll}>All</button>
        <button type="button" className="bulk-pill" onClick={handleNone}>None</button>
        <button type="button" className="bulk-pill" onClick={handleInvert}>Invert</button>
      </div>
      <div className="filter-divider" />
      <div className="chip-row">
        {options.map((opt) => (
          <button
            type="button"
            key={opt}
            className={`fchip ${active.includes(opt) ? "on" : ""}`}
            onClick={() => onToggle(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

const css = `
  @font-face {
    font-family: 'UbuntuM';
    src: url('/app/visualizer/fonts/UbuntuM.woff2') format('woff2'),
         url('/app/visualizer/fonts/UbuntuM.woff') format('woff'),
         url('/app/visualizer/fonts/UbuntuM.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }

  .tile-selected {
  outline: 2px solid #f59e0b !important;
  outline-offset: -2px;
  box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.18) !important;
}


  .legacy3d-root {
    position:absolute;
    inset:0;
    pointer-events:none;
    z-index:60;
    font-family:'UbuntuM', sans-serif;
    color:#0f172a;
    font-size:14px;
  }

  .legacy3d-root button {
    pointer-events:auto;
    -webkit-appearance:none;
    appearance:none;
    border:0;
    padding:0;
    margin:0;
    font:inherit;
    color:inherit;
    line-height:inherit;
  }

  #legacy3d-hamburger {
    position:absolute; top:10px; left:10px; width:46px; height:46px;
    background:#fff; border:none; border-radius:10px;
    display:flex; flex-direction:column; align-items:center; justify-content:center; gap:5px;
    box-shadow:0 4px 12px rgba(0,0,0,0.14); cursor:pointer; z-index:300;
    pointer-events:auto;
  }
  #legacy3d-hamburger span { width:20px; height:2.5px; background:#444; border-radius:2px; }

  .legacy3d-sidebar {
    position: absolute;
    top: 78px;
    left: 12px;
    width: 325px;
    height: calc(100vh - 140px);
    max-height: calc(100vh - 140px);
    background: #f1f3f5;
    border: 1px solid #cfd6df;
    border-radius: 16px;
    box-shadow: 0 16px 34px rgba(2, 6, 23, 0.2);
    overflow: hidden;
    pointer-events: auto;
    transform: translateX(0);
    transition: transform .28s cubic-bezier(.4, 0, .2, 1);
  }
  .legacy3d-sidebar.collapsed { transform:translateX(-360px); }

  .legacy3d-body {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 10px 10px 12px;
    overflow: hidden;
  }

  .sb-topbar {
    display:flex;
    align-items:center;
    gap:10px;
    padding:10px 6px 12px;
    border-bottom:1px solid #d7dde6;
    margin-bottom:12px;
  }

  .sb-logo {
    font-size:18px;
    font-weight:400;
    letter-spacing:0.2em;
    text-transform:uppercase;
    color:#0f172a;
    flex:1;
  }
  .sb-logo span { color:#f59e0b; }

  /* Top heart button */
  .sb-heart {
    width:38px; height:38px;
    border-radius:12px;
    border:1px solid #cfd6df;
    background:#fff;
    display:flex; align-items:center; justify-content:center;
    cursor:pointer;
    transition: background 0.15s, border-color 0.15s;
  }
  .sb-heart svg {
    width:16px; height:16px;
    stroke:#64748b;
    fill: #94a3b8;;
    stroke-width:2;
    transition: stroke 0.15s, fill 0.15s;
  }
  /* Active state — favourites filter is ON */
  .sb-heart.on {
    background:#ef4444;
    border-color:#ef4444;
  }
  .sb-heart.on svg {
    stroke:#ffffff;
    fill:#ffffff;
  }

  .sb-login {
    background:#0f172a !important;
    color:#ffffff !important;
    border:0 !important;
    border-radius:999px !important;
    padding:10px 18px !important;
    font-size:12px !important;
    font-weight:800 !important;
    letter-spacing:0.14em !important;
    text-transform:uppercase !important;
    line-height:1 !important;
    white-space:nowrap !important;
    box-shadow:0 8px 20px rgba(2,6,23,0.14) !important;
    cursor:pointer;
  }
  .sb-login:hover { background:#020617 !important; }

  .sb-controls {
    display:grid;
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:8px;
    margin-bottom:10px;
  }

  .sb-ctrl-btn {
    background:#fff !important;
    border:1px solid #cfd6df !important;
    border-radius:12px !important;
    min-height:40px;
    padding:8px 10px !important;
    font-size:11px !important;
    font-weight:700 !important;
    letter-spacing:0.10em !important;
    text-transform:uppercase !important;
    color:#0f172a !important;
    display:flex !important;
    align-items:center !important;
    justify-content:center !important;
    cursor:pointer;
  }
  .sb-ctrl-btn:hover { border-color:#cbd5e1 !important; }

  .sb-search-row {
    display:flex;
    align-items:center;
    gap:10px;
    margin-bottom:10px;
  }

  .sb-rotate-label { font-size:14px; font-weight:700; color:#0f172a; }

  .sb-rotate-select {
    height:30px;
    min-width:56px;
    border:1px solid #b8c3d1;
    border-radius:8px;
    background:#f2f5f8;
    color:#334155;
    padding:0 8px;
    font-size:13px;
    cursor:pointer;
  }

  .sb-search {
    flex:1 1 auto;
    height:32px;
    min-width:0;
    width:100%;
    border:2px solid #b8c3d1;
    border-radius:10px;
    background:#f2f5f8;
    color:#334155;
    padding:6px 10px;
    font-size:13px;
  }
  .sb-search::placeholder { color:#64748b; }

  /* ── Tile scroll area ── */
  .sb-tiles-scroll {
    flex: 1 1 0;
    min-height: 0;
    overflow-y: auto;
    padding: 2px 2px 6px;
  }
  .sb-tiles-scroll::-webkit-scrollbar { width: 4px; }
  .sb-tiles-scroll::-webkit-scrollbar-track { background: transparent; }
  .sb-tiles-scroll::-webkit-scrollbar-thumb { background: #c8cdd6; border-radius: 999px; }
  .sb-tiles-scroll::-webkit-scrollbar-thumb:hover { background: #a0a8b4; }

/*
  .sb-tile-grid {
  max-width: 294px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
  padding-bottom: 10px;
}
  */
 .sb-tile-grid {
  max-width: 294px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  padding-bottom: 10px;
}
  /*
 .tile {
  border-radius: 0;
  border: none;
  background: transparent;
  overflow: hidden;
  cursor: pointer;
  box-shadow: none;
}
.tile:hover { opacity: 0.85; }
*/
.tile {
  border-radius: 16px;
  border: none;
  background: #fff;
  overflow: hidden;
  cursor: pointer;
  box-shadow: none;
}
.tile:hover { opacity: 0.88; }

  /* tile-img must be relative so heart can sit on top 
.tile-img {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  background: #f0f0f0;
  overflow: hidden;
  border-radius: 6px;
}
.tile-img img { width: 100%; height: 100%; object-fit: cover; display: block; } */
.tile-img {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  background: #f0f0f0;
  overflow: hidden;
  border-radius: 0;
}
.tile-img img { width: 100%; height: 100%; object-fit: cover; display: block; }

  /* ── Per-tile heart button — hidden by default, shown on tile hover ── */
  .tile-heart {
    position: absolute;
    top: 5px;
    right: 5px;
    width: 22px;
    height: 22px;
    border-radius: 999px;
    border: 1px solid rgba(203,213,225,0.85) !important;
    background: rgba(255,255,255,0.90) !important;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(2,6,23,0.10);
    opacity: 0;
    transition: opacity 0.15s, background 0.15s, border-color 0.15s, transform 0.15s;
    z-index: 2;
  }
  /* Show heart when the parent tile is hovered */
  .tile:hover .tile-heart { opacity: 1; }
  /* Always show if already favourited */
  .tile-heart.on { opacity: 1; }
  .tile-heart:hover { transform: scale(1.15); }
  .tile-heart svg {
    width: 11px;
    height: 11px;
    stroke: #94a3b8;
    fill: #94a3b8;
    stroke-width: 2;
    transition: stroke 0.15s, fill 0.15s;
  }
 .tile-heart.on {
  background: rgba(255,255,255,0.90) !important;
  border: 1px solid rgba(203,213,225,0.85) !important;
}

.tile-heart.on svg {
  stroke: #ef4444;
  fill: #ef4444;
}

 .tile-name {
  padding: 3px 4px 5px;
  font-size: 8.5px;
  font-weight: 400;
  color: #64748b;
  text-align: center;
  white-space: normal;
  word-break: break-word;
  line-height: 1.3;
  background: #fff;
  border-top: 1px solid #f0f2f5;
}

  .tile-loading, .tile-empty {
    grid-column:1/-1;
    display:flex;
    align-items:center;
    justify-content:center;
    min-height:200px;
    font-size:13px;
    font-weight:700;
    color:#64748b;
  }

  .spin { animation:spin 1s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }

  .top-right {
    position:absolute;
    top:14px;
    right:10px;
    display:flex;
    gap:12px;
    z-index:300001;
    pointer-events:auto;
  }

  .tr-btn {
    background:rgba(255,255,255,0.94) !important;
    border:1px solid #dbe3ec !important;
    color:#0f172a !important;
    border-radius:12px !important;
    box-shadow:0 8px 20px rgba(2,6,23,0.08);
    font-family:'UbuntuM', sans-serif;
    font-size:14px !important;
    font-weight:400 !important;
    line-height:1.1 !important;
    padding:6px 12px !important;
    cursor:pointer;
  }
  .tr-btn:hover { background:#fff !important; border-color:#cbd5e1 !important; }

  .right-toolbar {
    position:fixed;
    right:0;
    top:50%;
    transform:translateY(-50%);
    width:50px;
    background:rgba(241,243,245,0.98);
    border:1px solid #cfd6df;
    border-radius:6px 0 0 6px;
    box-shadow:0 10px 22px rgba(2,6,23,0.16);
    overflow:hidden;
    z-index:1200;
    pointer-events:auto;
    display:flex;
    flex-direction:column;
  }

  .rt-btn {
    width:50px !important;
    height:52px !important;
    display:flex !important;
    align-items:center !important;
    justify-content:center !important;
    border-bottom:1px solid #d7dde6 !important;
    background:transparent !important;
    cursor:pointer;
    transition:background-color .2s ease, transform .2s ease;
  }
  .rt-btn:last-child { border-bottom:0 !important; }
  .rt-btn:hover { background:#e7edf1 !important; transform:translateY(-1px); }
  .rt-btn img { width:20px; height:20px; opacity:0.95; stroke:#3b4250; fill:none; stroke-width:1.9; }

  /* ── Filter Modal ── */
  .modal-overlay {
    position:absolute;
    inset:0;
    background:rgba(0,0,0,0.45);
    z-index:500;
    display:flex;
    align-items:center;
    justify-content:center;
    pointer-events:auto;
  }

  .modal {
    background:#fff;
    border-radius:8px;
    width:680px;
    max-width:96vw;
    max-height:92vh;
    display:flex;
    flex-direction:column;
    box-shadow:0 5px 15px rgba(0,0,0,0.5);
    overflow:hidden;
    border:1px solid rgba(0,0,0,0.2);
  }

  .modal-head {
    display:flex;
    align-items:center;
    justify-content:space-between;
    padding:16px 22px;
    border-bottom:1px solid #e5e5e5;
    background:#fff;
  }

  .modal-head-title {
    font-size:14px;
    font-weight:700;
    letter-spacing:0.12em;
    color:#333;
    text-transform:uppercase;
    font-family:'UbuntuM', sans-serif;
  }

  .modal-x {
    background:none !important;
    border:none !important;
    padding:0 !important;
    font-size:21px !important;
    cursor:pointer;
    color:#000 !important;
    font-weight:700 !important;
    opacity:0.5;
    line-height:1 !important;
  }
  .modal-x:hover { opacity:1; }

  .modal-scroll {
    flex:1;
    overflow-y:auto;
    padding:16px 20px;
    display:flex;
    flex-direction:column;
    gap:12px;
    background:#f5f6f8;
  }
  .modal-scroll::-webkit-scrollbar { width:7px; }
  .modal-scroll::-webkit-scrollbar-thumb { background:#ccc; border-radius:4px; }

  .filter-block {
    background:#fff;
    border-radius:10px;
    padding:16px 18px;
    border:1px solid #e3e6ee;
  }

  .filter-block-title {
    font-size:11px;
    font-weight:700;
    letter-spacing:0.16em;
    color:#8a90a0;
    text-transform:uppercase;
    margin-bottom:12px;
    font-family:'UbuntuM', sans-serif;
  }

  .filter-bulk {
    display:flex;
    align-items:center;
    gap:2px;
    margin-bottom:12px;
  }

  .filter-bulk-sep {
    color:#b0b5c0;
    font-size:13px;
    padding:0 2px;
    user-select:none;
    line-height:1;
  }

  .bulk-pill {
    background:#fff !important;
    border:1px solid #d2d6e0 !important;
    border-radius:999px !important;
    padding:4px 13px !important;
    font-size:12px !important;
    font-weight:600 !important;
    color:#555 !important;
    cursor:pointer;
    letter-spacing:0.02em !important;
    line-height:1.5 !important;
    font-family:'UbuntuM', sans-serif;
    transition:background 0.15s, border-color 0.15s;
  }
  .bulk-pill:hover { border-color:#9aa0ae !important; background:#f4f5f8 !important; }

  .filter-divider { height:1px; background:#eaecf2; margin:0 0 14px 0; }

  .chip-row { display:flex; flex-wrap:wrap; gap:8px; }

  .fchip {
    background:#fff !important;
    border:1.5px solid #d2d6e0 !important;
    border-radius:6px !important;
    padding:6px 14px !important;
    font-size:11.5px !important;
    font-weight:700 !important;
    color:#3a3f4a !important;
    cursor:pointer;
    letter-spacing:0.05em !important;
    text-transform:uppercase !important;
    line-height:1.5 !important;
    white-space:nowrap;
    font-family:'UbuntuM', sans-serif;
    transition:background 0.15s, border-color 0.15s, color 0.15s;
  }
  .fchip:hover { border-color:#9aa0ae !important; background:#f4f5f8 !important; }
  .fchip.on { background:#1a2035 !important; color:#fff !important; border-color:#1a2035 !important; }

  .modal-foot {
    display:flex;
    align-items:center;
    justify-content:flex-end;
    gap:10px;
    padding:14px 22px;
    border-top:1px solid #e5e5e5;
    background:#fff;
  }

  .foot-close {
    background:#fff !important;
    border:1.5px solid #d0d4de !important;
    border-radius:8px !important;
    padding:8px 22px !important;
    font-size:12px !important;
    font-weight:700 !important;
    color:#333 !important;
    cursor:pointer;
    letter-spacing:0.08em !important;
    text-transform:uppercase !important;
    line-height:1.5 !important;
    font-family:'UbuntuM', sans-serif;
    transition:background 0.15s;
  }
  .foot-close:hover { background:#f4f5f8 !important; border-color:#aaa !important; }

  .foot-apply {
    background:#f0a020 !important;
    border:none !important;
    border-radius:8px !important;
    padding:8px 22px !important;
    font-size:12px !important;
    font-weight:700 !important;
    color:#fff !important;
    cursor:pointer;
    letter-spacing:0.08em !important;
    text-transform:uppercase !important;
    line-height:1.5 !important;
    font-family:'UbuntuM', sans-serif;
    transition:background 0.15s;
  }
  .foot-apply:hover { background:#d98e10 !important; }
`;