
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaBath, FaBed, FaCouch, FaHeart, FaHome, FaUtensils } from "react-icons/fa";
import StyleFilterOptions from "./StyleFilterOptions";
import { useSearchParams } from "next/navigation";
import livingRoom3D from "@/assets/living_room_3d.png";
import kitchen3D from "@/assets/kitchen_3d.png";
import bedroom3D from "@/assets/bedroom_3d.png";
import bathroom3D from "@/assets/bathroom_3d.png";
import AuthModal from "./visualizer/AuthModal";

type RoomCategory = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roomIds: number[];
  sceneType: string;
  has3D: boolean;
};

type SavedRoom = {
  id: number;
  preview_image: string;
  redirect_url: string;
  created_at?: string;
  local_only?: boolean;
};

const CATEGORIES: RoomCategory[] = [
  { key: "living", label: "Living Rooms", icon: FaCouch, roomIds: [6, 20, 21, 22, 30, 33, 47], sceneType: "living_room", has3D: true },
  { key: "kitchen", label: "Kitchens", icon: FaUtensils, roomIds: [8, 26, 29, 34, 35, 45, 46], sceneType: "kitchen", has3D: true },
  { key: "bedroom", label: "Bedrooms", icon: FaBed, roomIds: [36, 37, 38, 39], sceneType: "bedroom", has3D: true },
  { key: "bathroom", label: "Bathrooms", icon: FaBath, roomIds: [12, 23, 24, 25, 40, 42, 44], sceneType: "bathroom", has3D: true },
  { key: "outdoor", label: "Indoor / Outdoor", icon: FaHome, roomIds: [27, 28, 31, 32], sceneType: "living_room", has3D: false },
  { key: "saved", label: "Saved", icon: FaHeart, roomIds: [], sceneType: "living_room", has3D: false },
];

const THUMBNAIL_3D: Record<string, string> = {
  living: livingRoom3D.src,
  kitchen: kitchen3D.src,
  bedroom: bedroom3D.src,
  bathroom: bathroom3D.src,
};

const SAVED_PLACEHOLDER = "/app/images/saved_placeholder.svg";

export default function VisualizerOptions() {
  const searchParams = useSearchParams();
  const queryCategory = (searchParams.get("category") || "").toLowerCase();
  let initialCategory = queryCategory;
  if (!initialCategory && typeof window !== "undefined") {
    const sticky = localStorage.getItem("visualizer_category_sticky") === "1";
    const intent = sessionStorage.getItem("visualizer_category_intent") === "1";
    if (sticky || intent) {
      initialCategory = (localStorage.getItem("selected_space_type") || "").toLowerCase();
    }
  }
  const validInitialCategory = CATEGORIES.some((c) => c.key === initialCategory) ? initialCategory : "";

  const [showPicker, setShowPicker] = useState(validInitialCategory !== "");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(validInitialCategory);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [savedRooms, setSavedRooms] = useState<SavedRoom[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [roomView, setRoomView] = useState<"2d" | "3d">("2d");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const active = useMemo(
    () => CATEGORIES.find((c) => c.key === selectedCategory) ?? CATEGORIES[0],
    [selectedCategory]
  );

  const fetchSaved = useCallback(async () => {
    const token = sessionStorage.getItem("pgatoken");
    if (!token) return;

    const apiBase = String(process.env.NEXT_PUBLIC_API_BASE ?? "").trim();
    if (!apiBase) return;

    const loadLocal = () => {
      try {
        const raw = localStorage.getItem("visualizer_saved_local_v1") || "[]";
        const data = JSON.parse(raw);
        return Array.isArray(data) ? (data as SavedRoom[]) : [];
      } catch {
        return [];
      }
    };

    try {
      setLoadingSaved(true);
      const res = await fetch(`${apiBase}saved_rooms/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load saved rooms");
      const data = await res.json();
      const fromApi = Array.isArray(data) ? (data as SavedRoom[]) : [];
      const fromLocal = loadLocal();
      const merged = [...fromApi, ...fromLocal].filter(
        (it, idx, all) =>
          it?.redirect_url &&
          all.findIndex((x) => x?.redirect_url === it.redirect_url) === idx
      );
      setSavedRooms(merged);
    } catch (err) {
      console.error("Saved rooms fetch error:", err);
      const fromLocal = loadLocal();
      if (fromLocal.length) setSavedRooms(fromLocal);
    } finally {
      setLoadingSaved(false);
    }
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem("pgatoken");
    const loggedIn = !!token;
    setIsLoggedIn(loggedIn);
    if (loggedIn) {
      fetchSaved();
    }
  }, [fetchSaved]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const categoryIntent = sessionStorage.getItem("visualizer_category_intent") === "1";
    const sticky = localStorage.getItem("visualizer_category_sticky") === "1";
    if (!categoryIntent && !sticky) return;
    const stored = (localStorage.getItem("selected_space_type") || "").toLowerCase();
    if (CATEGORIES.some((c) => c.key === stored)) {
      setSelectedCategory(stored);
      setShowPicker(true);
      setShowFilters(false);
      setSelectedRoomId(null);
    }
    if (categoryIntent) {
      sessionStorage.removeItem("visualizer_category_intent");
    }
  }, []);

  useEffect(() => {
    const handleAuthChange = () => {
      const token = sessionStorage.getItem("pgatoken");
      const loggedIn = !!token;
      setIsLoggedIn(loggedIn);
      if (loggedIn) {
        fetchSaved();
      } else {
        setSavedRooms([]);
      }
    };
    window.addEventListener("auth-changed", handleAuthChange);
    const handleLocalSaved = () => fetchSaved();
    window.addEventListener("visualizer-saved-local-updated", handleLocalSaved);
    return () => {
      window.removeEventListener("auth-changed", handleAuthChange);
      window.removeEventListener("visualizer-saved-local-updated", handleLocalSaved);
    };
  }, [fetchSaved]);

  const handleCategorySelect = (spaceKey: string) => {
    setSelectedCategory(spaceKey);
    if (typeof window !== "undefined") {
      localStorage.setItem("selected_space_type", spaceKey.toLowerCase());
      localStorage.removeItem("visualizer_category_sticky");
    }
    setShowPicker(true);
    setShowFilters(false);
    setSelectedRoomId(null);
    setRoomView("2d");
  };

  const handleRoomSelect = (roomId: number) => {
    setSelectedRoomId(roomId);
    setShowFilters(true);
  };

  const handleSavedClick = (url: string) => {
    const normalized = url
      .replace("/visualizer_old", "/visualizer")
      .replace("/visualiser", "/visualizer");
    window.location.href = normalized;
  };

  const handle3DSelect = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("force_3d_mode", "true");
      localStorage.setItem("selected_3d_sub_scene", active.sceneType);
      localStorage.setItem("selected_space_type", active.key);

      // Push a history entry so back button returns here
      window.history.pushState({ visualizer3D: true }, "");

      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("force3DMode"));
    }
  };

  // All room ids + 1 slot for 3D thumbnail, fit into one unified grid
  const tight3DGap = active.key === "bedroom";

  const isSavedCategory = active.key === "saved";
  const has3D = isSavedCategory ? true : active.has3D && !!THUMBNAIL_3D[active.key];

  const isSaved3DLink = (url: string) => {
    try {
      const parsed = new URL(url, window.location.origin);
      const view = (parsed.searchParams.get("view") || parsed.searchParams.get("mode") || "").toLowerCase();
      return view === "3d";
    } catch {
      return false;
    }
  };

  const isSaved3DByHash = (url: string) => {
    try {
      const parsed = new URL(url, window.location.origin);
      const hash = parsed.hash || "";
      if (!hash.startsWith("#design-data:")) return false;
      const encoded = hash.substring("#design-data:".length);
      if (!encoded) return false;
      const decoded = JSON.parse(decodeURIComponent(escape(atob(encoded))));
      return !!decoded && typeof decoded === "object" && (!!decoded.scene || decoded.kind === "svik-3d-v1");
    } catch {
      return false;
    }
  };

  const isSaved3DByDesignId = (url: string) => {
    try {
      const parsed = new URL(url, window.location.origin);
      const designId = (parsed.searchParams.get("d") || "").trim();
      if (!designId) return false;
      const encoded = (localStorage.getItem(`visualizer_design_payload_${designId}`) || "").trim();
      if (!encoded) return false;
      const decoded = JSON.parse(decodeURIComponent(escape(atob(encoded))));
      return !!decoded && typeof decoded === "object" && (!!decoded.scene || decoded.kind === "svik-3d-v1");
    } catch {
      return false;
    }
  };

  const isSaved3D = (url: string) =>
    isSaved3DLink(url) || isSaved3DByHash(url) || isSaved3DByDesignId(url);

  const getSaved3DSceneKey = (url: string): string | null => {
    const tryPayloadToKey = (payload: any): string | null => {
      const scene = String(payload?.scene ?? "").toLowerCase();
      if (!scene) return null;
      if (scene.includes("kitchen")) return "kitchen";
      if (scene.includes("bed")) return "bedroom";
      if (scene.includes("bath")) return "bathroom";
      if (scene.includes("living")) return "living";
      return null;
    };

    try {
      const parsed = new URL(url, window.location.origin);
      const hash = parsed.hash || "";
      if (hash.startsWith("#design-data:")) {
        const encoded = hash.substring("#design-data:".length);
        if (encoded) {
          const decoded = JSON.parse(decodeURIComponent(escape(atob(encoded))));
          const key = tryPayloadToKey(decoded);
          if (key) return key;
        }
      }
      const designId = (parsed.searchParams.get("d") || "").trim();
      if (designId) {
        const encoded = (localStorage.getItem(`visualizer_design_payload_${designId}`) || "").trim();
        if (encoded) {
          const decoded = JSON.parse(decodeURIComponent(escape(atob(encoded))));
          const key = tryPayloadToKey(decoded);
          if (key) return key;
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  const getSavedPreviewSrc = (item: SavedRoom) => {
    if (item.preview_image) return item.preview_image;
    if (isSaved3D(item.redirect_url)) {
      const key = getSaved3DSceneKey(item.redirect_url);
      if (key && THUMBNAIL_3D[key]) return THUMBNAIL_3D[key];
    }
    return SAVED_PLACEHOLDER;
  };

  useEffect(() => {
    if (!isSavedCategory && roomView === "3d" && !has3D) {
      setRoomView("2d");
    }
  }, [roomView, has3D, isSavedCategory]);

  return (
    <div className="w-full h-full flex flex-col">
      <AnimatePresence mode="wait">
        {!showPicker ? (
          <motion.div
            key="room-selection"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 15 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full flex flex-col justify-center h-full"
          >
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Select Your Space</h3>
              <div className="w-8 h-[2px] bg-amber-500 mt-2" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
              {CATEGORIES.map((item, index) => (
                <motion.div
                  key={index}
                  onClick={() => handleCategorySelect(item.key)}
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
        ) : showFilters && selectedRoomId !== null ? (
          <StyleFilterOptions
            key={`filters-${selectedRoomId}`}
            onBack={() => setShowFilters(false)}
            onComplete={() => {}}
            targetPath={`/visualizer#room=${selectedRoomId}`}
            spaceType={selectedCategory}
          />
        ) : (
          <motion.div
            key="room-thumbnails"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="w-full h-full flex flex-col px-2 pt-2"
          >
            <div className="flex items-start justify-between shrink-0 mb-4">
              <div className="space-y-1">
                <h3 className="text-2xl font-light text-slate-900 tracking-tight leading-none">
                  Select <span className="font-bold">{active.label}</span>
                </h3>
                <div className="w-12 h-[2px] bg-amber-500 rounded-full" />
              </div>

              <button
                onClick={() => {
                  setShowPicker(false);
                  if (typeof window !== "undefined") {
                    localStorage.removeItem("visualizer_category_sticky");
                  }
                }}
                className="group flex items-center gap-3 text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-all uppercase tracking-[0.2em]"
              >
                <span className="w-6 h-[1px] bg-slate-200 group-hover:w-10 group-hover:bg-amber-500 transition-all" />
                Back
              </button>
            </div>

            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setRoomView("2d")}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${
                    roomView === "2d"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  2D
                </button>
                <button
                  type="button"
                  onClick={() => setRoomView("3d")}
                  disabled={!has3D}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${
                    roomView === "3d"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-400 hover:text-slate-700"
                  } ${!has3D ? "opacity-40 cursor-not-allowed hover:text-slate-400" : ""}`}
                >
                  3D
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0">
              {roomView === "2d" ? (
                <div className="flex flex-col gap-2 min-h-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 shrink-0">
                    <span className="w-5 h-[1px] bg-slate-300" />
                    {active.key === "saved" ? "Saved Designs" : "2D Rooms"}
                  </p>

                  {active.key === "saved" ? (
                    !isLoggedIn ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-sm font-semibold text-slate-500 flex flex-col items-center gap-4">
                        <div>
                          Login to view your saved designs.
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAuthModal(true)}
                          className="px-6 py-2 rounded-full bg-slate-900 text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-slate-800 transition-colors"
                        >
                          Login
                        </button>
                      </div>
                    ) : loadingSaved ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-sm font-semibold text-slate-500">
                        Loading saved rooms...
                      </div>
                    ) : savedRooms.filter((r) => !isSaved3D(r.redirect_url)).length > 0 ? (
                      <div className="grid grid-cols-4 gap-2 lg:gap-3">
                        {savedRooms
                          .filter((r) => !isSaved3D(r.redirect_url))
                          .map((item, index) => (
                          <motion.button
                            type="button"
                            key={`saved-${item.id}`}
                            onClick={() => handleSavedClick(item.redirect_url)}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.02 }}
                            className="group block rounded-xl border border-slate-200 bg-white/90 p-1.5 hover:border-amber-400 hover:shadow-md text-left"
                          >
                            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">
                              <img
                                src={getSavedPreviewSrc(item)}
                                alt="Saved room preview"
                                className="absolute inset-0 w-full h-full object-cover"
                                onError={(event) => {
                                  const target = event.currentTarget;
                                  target.src = SAVED_PLACEHOLDER;
                                }}
                              />
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-sm font-semibold text-slate-500">
                        No saved designs yet.
                      </div>
                    )
                  ) : active.roomIds.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-sm font-semibold text-slate-500">
                      No rooms available.
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 lg:gap-3">
                      {active.roomIds.map((roomId, index) => (
                        <motion.button
                          type="button"
                          key={`${active.key}-${roomId}`}
                          onClick={() => handleRoomSelect(roomId)}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.02 }}
                          className="group block rounded-xl border border-slate-200 bg-white/90 p-1.5 hover:border-amber-400 hover:shadow-md text-left"
                        >
                          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">
                            <img
                              src={`/app/images/room_background_${roomId}_thumb.png`}
                              alt={`Room ${roomId} background`}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                            <img
                              src={`/app/images/room_foreground_${roomId}_thumb.png`}
                              alt={`Room ${roomId} foreground`}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className={`flex flex-col gap-2 ${tight3DGap ? "pt-1" : "pt-3"}`}>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-5 h-[1px] bg-slate-300" />
                    {isSavedCategory ? "Saved Designs" : "3D Room"}
                  </p>
                  {isSavedCategory ? (
                    !isLoggedIn ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-sm font-semibold text-slate-500 flex flex-col items-center gap-4">
                        <div>
                          Login to view your saved designs.
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAuthModal(true)}
                          className="px-6 py-2 rounded-full bg-slate-900 text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-slate-800 transition-colors"
                        >
                          Login
                        </button>
                      </div>
                    ) : loadingSaved ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-sm font-semibold text-slate-500">
                        Loading saved rooms...
                      </div>
                    ) : savedRooms.filter((r) => isSaved3D(r.redirect_url)).length > 0 ? (
                      <div className="grid grid-cols-4 gap-2 lg:gap-3">
                        {savedRooms
                          .filter((r) => isSaved3D(r.redirect_url))
                          .map((item, index) => (
                            <motion.button
                              type="button"
                              key={`saved-3d-${item.id}`}
                              onClick={() => handleSavedClick(item.redirect_url)}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2, delay: index * 0.02 }}
                              className="group block rounded-xl border border-slate-200 bg-white/90 p-1.5 hover:border-amber-500 hover:shadow-md text-left relative"
                            >
                              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">
                                <img
                                  src={getSavedPreviewSrc(item)}
                                  alt="Saved 3D design preview"
                                  className="absolute inset-0 w-full h-full object-cover"
                                  onError={(event) => {
                                    const target = event.currentTarget;
                                    target.src = SAVED_PLACEHOLDER;
                                  }}
                                />
                                {isSaved3D(item.redirect_url) && (
                                  <span className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full tracking-wide">
                                    3D
                                  </span>
                                )}
                              </div>
                            </motion.button>
                          ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-sm font-semibold text-slate-500">
                        No saved 3D designs yet.
                      </div>
                    )
                  ) : (
                    <div className="grid grid-cols-4 gap-2 lg:gap-3">
                      <motion.button
                        type="button"
                        onClick={handle3DSelect}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="group block rounded-xl border border-slate-200 bg-white/90 p-1.5 hover:border-amber-500 hover:shadow-md text-left relative"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">
                          <img
                            src={THUMBNAIL_3D[active.key]}
                            alt={`${active.label} 3D`}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <span className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full tracking-wide">
                            3D
                          </span>
                        </div>
                      </motion.button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          setIsLoggedIn(true);
          fetchSaved();
        }}
      />
    </div>
  );
}


