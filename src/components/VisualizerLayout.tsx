

"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import VisualizerIntro from "./VisualizerIntro";
import VisualizerOptions from "./VisualizerOptions";
import PreviewArea from "./visualizer/PreviewArea";
import Preview3D from "./visualizer/Preview3D";
import AuthModal from "./visualizer/AuthModal";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];


export default function VisualizerLayout() {
  const readUrlIntent = () => {
    if (typeof window === "undefined") {
      return { room: null as string | null, design: null as string | null, loading: false };
    }
    const search = new URLSearchParams(window.location.search);
    const shortId = search.get("d");
    const hash = window.location.hash || "";
    if (shortId) {
      return { room: null, design: null, loading: true };
    }
    if (hash.startsWith("#design-data:")) {
      const design = hash.substring("#design-data:".length) || null;
      return { room: null, design, loading: !!design };
    }
    if (hash) {
      const rawHash = hash.replace(/^#/, "");
      let room: string | null = null;
      let design: string | null = null;
      const parts = rawHash.split("&");
      for (const part of parts) {
        if (!part) continue;
        const eq = part.indexOf("=");
        const key = eq >= 0 ? part.slice(0, eq) : part;
        const val = eq >= 0 ? part.slice(eq + 1) : "";
        if (key === "room") {
          room = val || null;
        } else if (key === "design") {
          if (val.includes("%")) {
            try {
              design = decodeURIComponent(val);
            } catch {
              design = val;
            }
          } else {
            design = val.replace(/ /g, "+");
          }
        }
      }
      return { room, design, loading: !!design };
    }
    const sessionIntent = sessionStorage.getItem("visualizer_intent") === "1";
    const localIntent = localStorage.getItem("visualizer_intent_once") === "1";
    if (sessionIntent || localIntent) {
      const storedRoom = localStorage.getItem("visualizer_room_id");
      const storedDesign = localStorage.getItem("visualizer_design_hash");
      if (storedRoom) {
        return { room: storedRoom, design: storedDesign || null, loading: false };
      }
    }
    return { room: null, design: null, loading: false };
  };

  const initialIntent = readUrlIntent();

  const [is3DMode, setIs3DMode] = useState(false);
  const [has3DRoomSelected, setHas3DRoomSelected] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(initialIntent.room);
  const [designHash, setDesignHash] = useState<string | null>(initialIntent.design);
  const [designLoading, setDesignLoading] = useState<boolean>(initialIntent.loading);
  const [designApplied, setDesignApplied] = useState(false);

  const [savedDesign, setSavedDesign] = useState<{
    link: string;
    image: string | null;
    designId?: string;
    designData?: string;
    roomId?: string | null;
  } | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">("idle");
  const copyTimeoutRef = useRef<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingSave, setPendingSave] = useState<{
    link: string;
    image: string | null;
    designId?: string;
    designData?: string;
    roomId?: string | null;
  } | null>(null);
  const lastSavedIdRef = useRef<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const getApiBase = () => {
    const fromEnv = String(process.env.NEXT_PUBLIC_API_BASE ?? "").trim();
    const fromWindow =
      typeof window !== "undefined"
        ? String((window as any).NEXT_PUBLIC_API_BASE ?? "").trim()
        : "";
    const raw = fromEnv || fromWindow;
    if (!raw) return "";
    return raw.endsWith("/") ? raw : `${raw}/`;
  };

  const decodeBase64Json = (encoded: string) => {
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const decoded = new TextDecoder("utf-8").decode(bytes);
    return JSON.parse(decoded);
  };

  const tryParse3DDesignPayload = (encoded: string) => {
    try {
      const obj = decodeBase64Json(encoded);
      if (!obj || typeof obj !== "object") return null;
      if ((obj as any).kind === "svik-3d-v1") return obj;
      if ((obj as any).scene && ((obj as any).wallTiles || (obj as any).wallBySurface))
        return obj;
      return null;
    } catch {
      return null;
    }
  };

  const apply3DDesign = (encoded: string, roomHint?: string | null) => {
    const payload = tryParse3DDesignPayload(encoded);
    if (!payload) return false;

    const scene = String((payload as any).scene ?? roomHint ?? "living_room").toLowerCase();
    try {
      localStorage.removeItem("visualizer_room_id");
      localStorage.removeItem("visualizer_design_hash");
      localStorage.setItem("force_3d_mode", "true");
      localStorage.setItem("selected_3d_sub_scene", scene);
      localStorage.setItem("visualizer_3d_design_hash", encoded);
      sessionStorage.setItem("visualizer_intent", "1");
      localStorage.setItem("visualizer_intent_once", "1");
      window.dispatchEvent(new CustomEvent("force3DMode"));
      window.dispatchEvent(new CustomEvent("selected3DSceneUpdated"));
      window.dispatchEvent(new CustomEvent("visualizer-3d-design", { detail: payload }));
    } catch {
      // ignore
    }

    setRoomId(null);
    setDesignHash(null);
    setDesignApplied(false);
    setDesignLoading(false);
    window.history.replaceState({}, "", "/visualizer");
    return true;
  };

  

  useEffect(() => {
    const checkMode = () => {
      setIs3DMode(localStorage.getItem("force_3d_mode") === "true");
    };
    const checkRoom = () => {
      const has3D = localStorage.getItem("selected_3d_sub_scene");
      setHas3DRoomSelected(!!has3D);
    };

    const handleChange = () => {
      checkMode();
      checkRoom();
    };

    checkMode();
    checkRoom();
    // Ensure iframe can read asset base via localStorage
    try {
      const assetFromEnv = String(process.env.NEXT_PUBLIC_ASSET_BASE ?? "").trim();
      const assetFromWindow =
        typeof window !== "undefined"
          ? String((window as any).NEXT_PUBLIC_ASSET_BASE ?? "").trim()
          : "";
      const assetBase = assetFromEnv || assetFromWindow;
      if (assetBase) {
        localStorage.setItem(
          "visualizer_asset_base",
          assetBase.endsWith("/") ? assetBase : `${assetBase}/`
        );
      }
    } catch {
      // ignore
    }
    window.addEventListener("storage", handleChange);
    window.addEventListener("force3DMode", handleChange);

    return () => {
      window.removeEventListener("storage", handleChange);
      window.removeEventListener("force3DMode", handleChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    const updateFromUrl = async () => {
      const search = new URLSearchParams(window.location.search);
      const shortId = search.get("d");
      if (shortId) {
        setDesignLoading(true);
        const apiBase = getApiBase();
        const loadFromBase = async (base: string) => {
          const res = await fetch(`${base}saved_rooms/designs/${shortId}`);
          if (!res.ok) return null;
          const data = await res.json();
          return data;
        };

        if (apiBase) {
          try {
            const data = await loadFromBase(apiBase);
            if (data) {
              if (cancelled) return;
              const room = data?.roomId ? String(data.roomId) : null;
              const design = (data?.designData || "").trim() || null;
              localStorage.setItem(
                `visualizer_design_payload_${shortId}`,
                design || ""
              );
              if (room) {
                localStorage.setItem(
                  `visualizer_design_room_${shortId}`,
                  room
                );
              }
              sessionStorage.setItem("visualizer_intent", "1");
              localStorage.setItem("visualizer_intent_once", "1");
              if (design && apply3DDesign(design, room)) return;
              if (room) setRoomId(room);
              if (design) setDesignHash(design);
              if (room) {
                localStorage.setItem("visualizer_room_id", room);
              }
              if (design) {
                localStorage.setItem("visualizer_design_hash", design);
              }
              setDesignLoading(false);
              window.history.replaceState({}, "", "/visualizer");
              return;
            }
          } catch {
            // ignore and fall through
          }
        }

        // try http fallback for localhost https cert issues
        const maybeHttpsLocalhost = apiBase || String((window as any).NEXT_PUBLIC_API_BASE ?? "").trim();
        if (maybeHttpsLocalhost.startsWith("https://localhost")) {
          const httpBase = maybeHttpsLocalhost.replace("https://", "http://");
          try {
            const data = await loadFromBase(
              httpBase.endsWith("/") ? httpBase : httpBase + "/"
            );
            if (data) {
              if (cancelled) return;
              const room = data?.roomId ? String(data.roomId) : null;
              const design = (data?.designData || "").trim() || null;
              localStorage.setItem(
                `visualizer_design_payload_${shortId}`,
                design || ""
              );
              if (room) {
                localStorage.setItem(
                  `visualizer_design_room_${shortId}`,
                  room
                );
              }
              sessionStorage.setItem("visualizer_intent", "1");
              localStorage.setItem("visualizer_intent_once", "1");
              if (design && apply3DDesign(design, room)) return;
              if (room) setRoomId(room);
              if (design) setDesignHash(design);
              if (room) {
                localStorage.setItem("visualizer_room_id", room);
              }
              if (design) {
                localStorage.setItem("visualizer_design_hash", design);
              }
              setDesignLoading(false);
              window.history.replaceState({}, "", "/visualizer");
              return;
            }
          } catch {
            // ignore
          }
        }
        // fallback to local cache if present
        const cachedDesign = localStorage.getItem(
          `visualizer_design_payload_${shortId}`
        );
        const cachedRoom = localStorage.getItem(
          `visualizer_design_room_${shortId}`
        );
        if (cachedDesign && apply3DDesign(cachedDesign.trim(), cachedRoom)) return;
        if (cachedDesign) {
          setDesignHash(cachedDesign.trim() || null);
        }
        if (cachedRoom) {
          setRoomId(cachedRoom);
        }
        setDesignLoading(false);
        window.history.replaceState({}, "", "/visualizer");
        return;
      }

      const hash = window.location.hash || "";
      if (hash.startsWith("#design-data:")) {
        const encoded = hash.substring("#design-data:".length);
        if (encoded && apply3DDesign(encoded, null)) return;
        setRoomId(null);
        setDesignHash(encoded);
        setDesignLoading(false);
        return;
      }
      const rawHash = hash.replace(/^#/, "");
      let room: string | null = null;
      let design: string | null = null;
      if (rawHash) {
        const parts = rawHash.split("&");
        for (const part of parts) {
          if (!part) continue;
          const eq = part.indexOf("=");
          const key = eq >= 0 ? part.slice(0, eq) : part;
          const val = eq >= 0 ? part.slice(eq + 1) : "";
          if (key === "room") {
            room = val || null;
          } else if (key === "design") {
            // Keep raw value; decode if URL-encoded, and fix '+' -> ' '
            if (val.includes("%")) {
              try {
                design = decodeURIComponent(val);
              } catch {
                design = val;
              }
            } else {
              design = val.replace(/ /g, "+");
            }
          }
        }
      }
      if (design && apply3DDesign(design, room)) return;
      setRoomId(room);
      setDesignHash(design);
      setDesignLoading(false);
      if (room) {
        localStorage.setItem("visualizer_room_id", room);
        if (design) {
          localStorage.setItem("visualizer_design_hash", design);
        } else {
          localStorage.removeItem("visualizer_design_hash");
        }
        sessionStorage.setItem("visualizer_intent", "1");
        localStorage.setItem("visualizer_intent_once", "1");
        window.history.replaceState({}, "", "/visualizer");
      }
    };

    updateFromUrl();
    window.addEventListener("hashchange", updateFromUrl);
    window.addEventListener("popstate", updateFromUrl);
    return () => {
      cancelled = true;
      window.removeEventListener("hashchange", updateFromUrl);
      window.removeEventListener("popstate", updateFromUrl);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hasExplicitVisualizerIntent = () => {
      const search = new URLSearchParams(window.location.search);
      const shortId = search.get("d");
      if (shortId) return true;
      const hash = window.location.hash || "";
      if (!hash) return false;
      if (hash.startsWith("#design-data:")) return true;
      return hash.includes("room=") || hash.includes("design=");
    };

    const loadFromStorage = () => {
      const sessionIntent = sessionStorage.getItem("visualizer_intent") === "1";
      const localIntent = localStorage.getItem("visualizer_intent_once") === "1";
      const hasIntent = sessionIntent || localIntent;
      if (!hasExplicitVisualizerIntent() && !hasIntent) {
        localStorage.removeItem("visualizer_room_id");
        localStorage.removeItem("visualizer_design_hash");
        localStorage.removeItem("visualizer_3d_design_hash");
        localStorage.removeItem("force_3d_mode");
        localStorage.removeItem("selected_3d_sub_scene");
        setIs3DMode(false);
        setHas3DRoomSelected(false);
        return;
      }
      const storedRoom = localStorage.getItem("visualizer_room_id");
      const storedDesign = localStorage.getItem("visualizer_design_hash");
      if (storedRoom) {
        setRoomId(storedRoom);
        setDesignHash(storedDesign || null);
        window.history.replaceState({}, "", "/visualizer");
      }
      if (sessionIntent) {
        sessionStorage.removeItem("visualizer_intent");
      }
      if (localIntent) {
        localStorage.removeItem("visualizer_intent_once");
      }
    };

    loadFromStorage();

    const handleRoomChange = () => loadFromStorage();
    const handleRoomSelect = (event: Event) => {
      const detail = (event as CustomEvent).detail as
        | { room?: string; design?: string | null }
        | undefined;
      const room = detail?.room ?? localStorage.getItem("visualizer_room_id");
      const design =
        detail?.design ?? localStorage.getItem("visualizer_design_hash");
      if (room) {
        setRoomId(room);
        setDesignHash(design || null);
        window.history.replaceState({}, "", "/visualizer");
      }
    };
    window.addEventListener("visualizer-room-change", handleRoomChange as EventListener);
    window.addEventListener("visualizer-room-select", handleRoomSelect as EventListener);
    return () => {
      window.removeEventListener("visualizer-room-change", handleRoomChange as EventListener);
      window.removeEventListener("visualizer-room-select", handleRoomSelect as EventListener);
    };
  }, []);

  useEffect(() => {
      const handler = async (event: MessageEvent) => {
        if (event?.data?.type !== "SAVE_DESIGN") return;
        const payload = event.data.payload;
        if (!payload?.link) return;
        const apiBase = getApiBase();
        if (payload.designData && apiBase) {
          try {
            const token = sessionStorage.getItem("pgatoken");
            const headers: Record<string, string> = {
              "Content-Type": "application/json",
            };
            if (token) {
              headers.Authorization = `Bearer ${token}`;
            }
            const res = await fetch(`${apiBase}saved_rooms/designs`, {
              method: "POST",
              headers,
              body: JSON.stringify({
                designData: payload.designData,
                roomId: payload.roomId ?? null,
              }),
            });
          const data = await res.json().catch(() => null);
          if (res.ok && data?.designId) {
            payload.designId = data.designId;
            const is3D = !!tryParse3DDesignPayload(String(payload.designData ?? ""));
            payload.link = `${window.location.origin}/visualizer?d=${data.designId}${
              is3D ? "&view=3d" : ""
            }`;
            localStorage.setItem(
              `visualizer_design_payload_${data.designId}`,
              payload.designData
            );
            if (payload.roomId) {
              localStorage.setItem(
                `visualizer_design_room_${data.designId}`,
                String(payload.roomId)
              );
            }
          }
        } catch {
          // fall back to existing link
        }
      }

      setSavedDesign({
        link: payload.link,
        image: payload.image ?? null,
        designId: payload.designId,
        designData: payload.designData,
        roomId: payload.roomId ?? null,
      });
      setCopyStatus("idle");
      setShowModal(true);
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const normalizeApiBase = (raw: string | undefined) => {
    const base = String(raw ?? "").trim();
    if (!base) return "";
    return base.endsWith("/") ? base : `${base}/`;
  };

  const pushLocalSavedRoom = (design: {
    link: string;
    image: string | null;
    designId?: string;
    designData?: string;
    roomId?: string | null;
  }) => {
    try {
      const key = "visualizer_saved_local_v1";
      const existingRaw = localStorage.getItem(key) || "[]";
      const existing = JSON.parse(existingRaw);
      const arr = Array.isArray(existing) ? existing : [];
      const next = {
        id: Date.now(),
        preview_image: design.image ?? "",
        redirect_url: design.link,
        created_at: new Date().toISOString(),
        local_only: true,
      };
      const deduped = [next, ...arr].filter(
        (it, idx, all) =>
          it?.redirect_url &&
          all.findIndex((x) => x?.redirect_url === it.redirect_url) === idx
      );
      localStorage.setItem(key, JSON.stringify(deduped.slice(0, 50)));
      window.dispatchEvent(new CustomEvent("visualizer-saved-local-updated"));
    } catch {
      // ignore
    }
  };

  const handleSaveToBackend = async (design: {
    link: string;
    image: string | null;
    designId?: string;
    designData?: string;
    roomId?: string | null;
  }) => {
    try {
      if (isSaving) return;

      const token = sessionStorage.getItem("pgatoken");
      if (!token) {
        setPendingSave(design);
        setShowAuthModal(true);
        return;
      }

      if (design.designId && lastSavedIdRef.current === design.designId) {
        alert("Design already saved.");
        return;
      }

      const apiBase = normalizeApiBase(process.env.NEXT_PUBLIC_API_BASE);
      if (!apiBase) {
        alert("API base is not configured.");
        return;
      }

      if (!design.image) {
        alert("Preview image is missing.");
        return;
      }

      if (design.designData) {
        try {
          const linkRes = await fetch(`${apiBase}saved_rooms/designs`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              designData: design.designData,
              roomId: design.roomId ?? roomId ?? null,
            }),
          });
          const linkData = await linkRes.json().catch(() => null);
          if (linkRes.ok && linkData?.designId) {
            design.designId = linkData.designId;
            const is3D = !!tryParse3DDesignPayload(String(design.designData ?? ""));
            design.link = `${window.location.origin}/visualizer?d=${linkData.designId}${
              is3D ? "&view=3d" : ""
            }`;
            localStorage.setItem(
              `visualizer_design_payload_${linkData.designId}`,
              design.designData
            );
            const resolvedRoom = design.roomId ?? roomId ?? null;
            if (resolvedRoom) {
              localStorage.setItem(
                `visualizer_design_room_${linkData.designId}`,
                String(resolvedRoom)
              );
            }
          }
        } catch {
          // If design linking fails, continue saving the image anyway.
        }
      }

      setIsSaving(true);

      const dataUrlToFile = (dataUrl: string, defaultName: string): File | null => {
        try {
          const m = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
          if (!m) return null;
          const mime = m[1] || "image/jpeg";
          const b64 = m[2] || "";
          const bin = atob(b64);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          const ext = mime.includes("png") ? "png" : "jpg";
          return new File([bytes], `${defaultName}.${ext}`, { type: mime });
        } catch {
          return null;
        }
      };

      let file: File | null = null;
      if (design.image.startsWith("data:")) {
        file = dataUrlToFile(design.image, "design");
      } else {
        const blob = await fetch(design.image).then((res) => res.blob());
        const type = blob.type || "image/jpeg";
        const ext = type.includes("png") ? "png" : "jpg";
        file = new File([blob], `design.${ext}`, { type });
      }
      if (!file) {
        pushLocalSavedRoom(design);
        alert("Saved link locally, but could not prepare image for upload.");
        if (design.designId) lastSavedIdRef.current = design.designId;
        return;
      }
      const formData = new FormData();
      formData.append("image", file, file.name);
      formData.append("redirectUrl", design.link);
      if (design.designId) {
        formData.append("designId", design.designId);
      }

      const now = new Date();
      const datePart =
        now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, "0") +
        String(now.getDate()).padStart(2, "0");
      const timePart =
        String(now.getHours()).padStart(2, "0") +
        String(now.getMinutes()).padStart(2, "0");
      const fileName = `room${design.roomId ?? roomId ?? "room"}_${datePart}_${timePart}`;
      formData.append("imageName", fileName);

      const res = await fetch(`${apiBase}saved_rooms/save`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        console.error("saved_rooms/save failed", {
          status: res.status,
          body: data,
        });
        pushLocalSavedRoom(design);
        alert(
          `Saved link, but server image save failed. Use the link or try again later.${
            data?.error ? ` (${data.error})` : ""
          }`
        );
        if (design.designId) lastSavedIdRef.current = design.designId;
        return;
      }

      if (data?.message === "Already exists") {
        alert("Design already saved.");
        if (design.designId) lastSavedIdRef.current = design.designId;
        return;
      }

      if (design.designId) lastSavedIdRef.current = design.designId;
      alert("Design saved successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to save design.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoginSuccess = () => {
    setShowAuthModal(false);
    if (pendingSave) {
      handleSaveToBackend(pendingSave);
      setPendingSave(null);
    }
  };

  const handleCopyLink = async (link: string) => {
    if (copyTimeoutRef.current) {
      window.clearTimeout(copyTimeoutRef.current);
    }
    try {
      await navigator.clipboard.writeText(link);
      setCopyStatus("success");
    } catch {
      setCopyStatus("error");
    }
    copyTimeoutRef.current = window.setTimeout(() => {
      setCopyStatus("idle");
    }, 2000);
  };

  const decodeDesignData = (encoded: string) => {
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const decoded = new TextDecoder("utf-8").decode(bytes);
    return JSON.parse(decoded);
  };

  const isDesignReady = (win: Window, design: any) => {
    if (!design || !design.tiles) return false;
    try {
      const doc = win.document;
      for (const tk of Object.keys(design.tiles)) {
        const t = design.tiles[tk];
        if (!t || t.length < 3) return false;
        const groutSel = `#tile_grout_${tk}_${t[0]}`;
        const layoutSel = `#layout-${t[1]}-${tk}`;
        if (!doc.querySelector(groutSel)) return false;
        if (!doc.querySelector(layoutSel)) return false;
        const tiles = Array.isArray(t[2]) ? t[2] : [];
        for (const tileId of tiles) {
          const tileSel = `#tile_radio_${tileId}`;
          if (!doc.querySelector(tileSel)) return false;
        }
      }
      return true;
    } catch {
      return false;
    }
  };

  const applyDesignToIframe = () => {
    if (!roomId || !designHash) return;
    const iframe = iframeRef.current;
    const win = iframe?.contentWindow;
    if (!win) return;

    try {
      // Prefer direct loadDesign if available
      if (typeof (win as any).loadDesign === "function") {
        const data = decodeDesignData(designHash);
        if (isDesignReady(win, data)) {
          (win as any).loadDesign(data);
          setDesignApplied(true);
          setDesignLoading(false);
          return;
        }
      }
    } catch (err) {
      console.error("Failed to apply design data", err);
    }

    // Fallback: set hash inside iframe to trigger its built-in loader
    try {
      if (win.location) {
        win.location.hash = `#design-data:${designHash}`;
        // Fallback: assume apply shortly after hash change
        setTimeout(() => {
          setDesignApplied(true);
          setDesignLoading(false);
        }, 1500);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!roomId || !designHash) return;
    setDesignApplied(false);
    let cancelled = false;
    let attempts = 0;

    const tryApply = () => {
      if (cancelled) return;
      const iframe = iframeRef.current;
      const win = iframe?.contentWindow;
      if (win) {
        applyDesignToIframe();
        attempts += 1;
        if (attempts < 40) {
          setTimeout(tryApply, 300);
        }
        return;
      }
      attempts += 1;
      if (attempts < 30) {
        setTimeout(tryApply, 300);
      }
    };

    tryApply();
    return () => {
      cancelled = true;
    };
  }, [roomId, designHash]);

  if (designLoading && !roomId) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm">
        <div className="bg-white rounded-2xl px-6 py-5 shadow-xl flex items-center gap-4">
          <div className="h-6 w-6 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
          <div className="text-sm font-semibold text-slate-700">
            Loading design…
          </div>
        </div>
      </div>
    );
  }

  if (roomId) {
    return (
      <>
        <iframe
          key={`${roomId}-${designHash ?? "none"}`}
          ref={iframeRef}
          src={`/app/${roomId}.html${
            designHash ? `#design-data:${designHash}` : ""
          }`}
          onLoad={() => {
            if (!designHash) {
              setDesignApplied(true);
              setDesignLoading(false);
            }
            applyDesignToIframe();
          }}
          style={{ width: "100%", height: "100vh", border: "none" }}
        />
        {(designLoading || (designHash && !designApplied)) && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="bg-white rounded-2xl px-6 py-5 shadow-xl flex items-center gap-4">
              <div className="h-6 w-6 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
              <div className="text-sm font-semibold text-slate-700">
                Loading design…
              </div>
            </div>
          </div>
        )}

        {showModal && savedDesign && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-[420px] shadow-xl">
              <h2 className="text-lg font-semibold mb-4">Design Saved</h2>

              {savedDesign.image && (
                <img
                  src={savedDesign.image}
                  className="rounded-md border mb-4"
                  alt="Saved design preview"
                />
              )}

              <input
                value={savedDesign.link}
                readOnly
                className="w-full border p-2 rounded mb-3 text-sm"
              />
              {copyStatus === "success" && (
                <div className="text-xs text-green-600 mb-3">Link copied.</div>
              )}
              {copyStatus === "error" && (
                <div className="text-xs text-red-600 mb-3">
                  Unable to copy link. Please copy manually.
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => handleCopyLink(savedDesign.link)}
                  className="bg-black text-white px-4 py-2 rounded"
                >
                  {copyStatus === "success" ? "Copied" : "Copy"}
                </button>

                <button
                  onClick={() => handleSaveToBackend(savedDesign)}
                  disabled={isSaving}
                  className="bg-green-600 text-white px-4 py-2 rounded"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>

                <button
                  onClick={() => {
                    setShowModal(false);
                    setCopyStatus("idle");
                  }}
                  className="border px-4 py-2 rounded"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <AuthModal
          open={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleLoginSuccess}
        />
      </>
    );
  }

  const sectionClass = is3DMode
    ? "h-screen w-screen relative overflow-hidden bg-[#f8f8f6]"
    : "min-h-screen w-full relative bg-[#f8f8f6] overflow-hidden flex items-center justify-center p-4 lg:p-8";

  const gridClass = is3DMode
    ? "w-full h-full grid grid-cols-12 gap-0"
    : "relative max-w-[1400px] w-full h-full max-h-[900px] grid grid-cols-12 gap-6 lg:gap-8";

  const rightPanelClass = is3DMode
    ? "col-span-12 relative w-full h-full overflow-hidden bg-[#f1f1ee]"
    : "col-span-12 lg:col-span-8 rounded-[32px] border border-white/60 shadow-inner relative overflow-hidden bg-[#f1f1ee]";

  return (
    <section className={sectionClass}>
      {/* Decorative blobs only in intro/2D */}
      {!is3DMode && (
        <>
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-amber-200/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-slate-200/40 rounded-full blur-[140px]" />
        </>
      )}

      <div className={gridClass}>
        {/* LEFT INTRO PANEL — ALWAYS visible in 2D mode (Image 2 style) */}
        {!is3DMode && (
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
            className="col-span-12 lg:col-span-4 bg-white rounded-[32px] p-8 lg:p-12 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden"
          >
            <VisualizerIntro />
          </motion.div>
        )}

        {/* RIGHT PANEL */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: EASE_OUT }}
          className={rightPanelClass}
        >
          {/* PREVIEW AREA */}
          <div className="absolute inset-0 z-0">
            {is3DMode ? <Preview3D /> : <PreviewArea />}
          </div>

          {/* 2D OPTIONS MENU (thumbnails etc.) */}
          {!is3DMode && (
            <div className="relative z-10 h-full bg-[#f1f1ee] rounded-[32px] pt-2 px-6 pb-6 lg:pt-3 lg:px-10 lg:pb-10">
              <VisualizerOptions />
            </div>
          )}
        </motion.div>
      </div>

      {showModal && savedDesign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[420px] shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Design Saved</h2>

            {savedDesign.image && (
              <img
                src={savedDesign.image}
                className="rounded-md border mb-4"
                alt="Saved design preview"
              />
            )}

            <input
              value={savedDesign.link}
              readOnly
              className="w-full border p-2 rounded mb-3 text-sm"
            />
            {copyStatus === "success" && (
              <div className="text-xs text-green-600 mb-3">Link copied.</div>
            )}
            {copyStatus === "error" && (
              <div className="text-xs text-red-600 mb-3">
                Unable to copy link. Please copy manually.
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => handleCopyLink(savedDesign.link)}
                className="bg-black text-white px-4 py-2 rounded"
              >
                {copyStatus === "success" ? "Copied" : "Copy"}
              </button>

              <button
                onClick={() => handleSaveToBackend(savedDesign)}
                disabled={isSaving}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>

              <button
                onClick={() => {
                  setShowModal(false);
                  setCopyStatus("idle");
                }}
                className="border px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </section>
  );
}
