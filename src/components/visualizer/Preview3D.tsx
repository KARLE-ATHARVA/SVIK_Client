
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Square,
  Layers,
  CheckSquare,
  X,
  Maximize2,
  Minimize2,
  Save,
  Printer,
  Mail,
  Share2,
} from "lucide-react";
import * as THREE from "three";
import { Bookmark } from "lucide-react";
import { ImFilePdf } from "react-icons/im";
import {FaRegFileImage} from "react-icons/fa";


import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { API_BASE, VISUALIZER_MAIL_ENDPOINT } from "@/lib/constants";
import { resolveAssetUrl } from "@/lib/assetUrls";
import LegacySidebar3D from "./LegacySidebar3D"; // adjust path

import {
  buildBathroomScene,
  BathroomRefs,
  TUBE_LIGHT_NAMES as BATH_TUBE_NAMES,
} from "@/3d-scenes/bathroom";
//import { buildBedroomScene, LAMP_NAMES, BedroomRefs } from "@/3d-scenes/bedroom";
import { buildBedroomScene, LAMP_NAMES, TUBE_LIGHT_NAMES as BED_TUBE_NAMES, BedroomRefs } from "@/3d-scenes/bedroom";
import {
  buildKitchenScene,
  KitchenRefs,
  TUBE_LIGHT_NAMES as KIT_TUBE_NAMES,
} from "@/3d-scenes/kitchen";
import {
  buildLivingRoomScene,
  SURFACE_NAMES,
  LivingRoomRefs,
  LIVING_LIGHT_NAMES,
} from "@/3d-scenes/living_room";

const legacyHeaderBtn =
  "border border-[#d9dde3] bg-[rgba(248,248,246,0.96)] text-[#0e4645] rounded-[12px] font-[900] tracking-[0.05em] text-[13px] px-3 py-2 shadow-[0_6px_16px_rgba(2,6,23,0.08)] hover:bg-[#f5f9f9] hover:-translate-y-[1px] transition";
const legacyRightRail =
  "flex flex-col bg-[rgba(248,248,246,0.96)] border border-[#d9dde3] rounded-l-[6px] shadow-[0_8px_18px_rgba(2,6,23,0.12)] overflow-hidden";
const legacyRightBtn =
  "w-[50px] h-[52px] flex items-center justify-center bg-transparent text-[#334155] border-b border-[#d9dde3] hover:bg-[#f5f9f9] hover:-translate-y-[1px] transition";


// ─── Types ────────────────────────────────────────────────────────────────────
type InteractionMode = "orbit" | "pick-wall" | "draw-area" | "draw-area-dragging";

type WallTarget =
  | typeof SURFACE_NAMES.wallBack
  | typeof SURFACE_NAMES.wallLeft
  | typeof SURFACE_NAMES.wallRight;

type AnyRoomRefs = BedroomRefs | KitchenRefs | BathroomRefs | LivingRoomRefs;

type SceneBuilder = (props: {
  scene: THREE.Scene;
  onFloorMaterialReady: (mat: THREE.MeshStandardMaterial) => void;
  //onWallMaterialsReady: (mats: THREE.MeshStandardMaterial[]) => void;
  onWallMaterialsReady: (mats: any[]) => void;
}) => AnyRoomRefs | void;

const sceneBuilders: Record<string, SceneBuilder> = {
  living_room: buildLivingRoomScene,
  bedroom: buildBedroomScene,
  kitchen: (props) => buildKitchenScene(props),
  bathroom: (props) => buildBathroomScene(props),
  living: buildLivingRoomScene,
  bath: (props) => buildBathroomScene(props),
};

const WALL_LABELS: Record<string, string> = {
  [SURFACE_NAMES.wallBack]: "Back Wall",
  [SURFACE_NAMES.wallLeft]: "Left Wall",
  [SURFACE_NAMES.wallRight]: "Right Wall",
};

type PublicEnvWindow = Window & {
  NEXT_PUBLIC_API_BASE?: string;
  NEXT_PUBLIC_VISUALIZER_MAIL_ENDPOINT?: string;
};

type Corner = "tl" | "tr" | "bl" | "br";
interface HandleDragState {
  corner: Corner;
  scaleStart: THREE.Vector3;
  mouseX: number;
  mouseY: number;
}
// interface HandleDragState {
//   corner: Corner;
//   scaleStart: number;
//   mouseX: number;
//   mouseY: number;
// }

type AppliedTile = {
  id?: string | number;
  name?: string;
  image?: string;
  skuCode?: string;
  size?: string | null;
  finish?: string;
};

type Saved3DDesignPayload = {
  kind?: string;
  scene?: string;
  wallBySurface?: Partial<Record<WallTarget, AppliedTile>>;
  floorTile?: AppliedTile | null;
  wallTiles?: AppliedTile[];
  floorTiles?: AppliedTile[];
  rotationDeg?: number;
};

type TargetSurface3D = "wall" | "floor";

// ─── Repeat values per tile size ─────────────────────────────────────────────
function getRepeat(
  size: string | null,
  surface: "floor" | "wall"
): [number, number] {
  const s = (size ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  if (surface === "floor") {
    switch (s) {
      case "600X600":
        return [14, 14];
      case "300X300":
        return [22, 22];
      case "800X800":
        return [11, 11];
      case "600X1200":
        return [14, 7];
      case "300X600":
        return [22, 11];
      case "300X1200":
      case "200X1200":
        return [24, 4];
      case "300X450":
        return [22, 15];
      default:
        return [12, 12];
    }
  } else {
    switch (s) {
      case "600X600":
        return [7, 6];
      case "300X300":
        return [11, 10];
      case "800X800":
        return [5.5, 5];
      case "600X1200":
        return [7, 3.5];
      case "300X600":
        return [11, 5.5];
      case "300X1200":
      case "200X1200":
        return [12, 2];
      case "300X450":
        return [11, 7.5];
      default:
        return [6, 5];
    }
  }
}

type MatSnapshot = {
  map: THREE.Texture | null;
  transparent: boolean;
  opacity: number;
  wrapS?: THREE.Wrapping;
  wrapT?: THREE.Wrapping;
  repeat?: THREE.Vector2;
  offset?: THREE.Vector2;
  center?: THREE.Vector2;
  rotation?: number;
};

// ─────────────────────────────────────────────────────────────────────────────

const modalSaveBtn: React.CSSProperties = {
  background: "#0f172a", color: "#fff", border: "none", borderRadius: "8px",
  padding: "13px 22px", fontSize: "12px", fontWeight: 800, letterSpacing: "0.12em",
  textTransform: "uppercase", cursor: "pointer", fontFamily: "'UbuntuM', sans-serif", whiteSpace: "nowrap",
};
const modalCloseBtn: React.CSSProperties = {
  background: "#fff", color: "#333", border: "1.5px solid #ccc", borderRadius: "6px",
  padding: "7px 22px", fontSize: "11px", fontWeight: 800, letterSpacing: "0.12em",
  textTransform: "uppercase", cursor: "pointer", fontFamily: "'UbuntuM', sans-serif",
};
const modalInputStyle: React.CSSProperties = {
  width: "100%",
  height: "34px",
  border: "1px solid #c9cdd6",
  borderRadius: "6px",
  padding: "8px 12px",
  fontSize: "14px",
  color: "#1f2937",
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};
 
 
export default function Preview3D() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const bedroomRefsRef = useRef<BedroomRefs | null>(null);
  const kitchenRefsRef = useRef<KitchenRefs | null>(null);
  const bathroomRefsRef = useRef<BathroomRefs | null>(null);
  const livingRoomRefsRef = useRef<LivingRoomRefs | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);

  const [sceneKey, setSceneKey] = useState<string>(() => {
    if (typeof window === "undefined") return "living_room";
    return (
      localStorage.getItem("selected_3d_sub_scene") || "living_room"
    ).toLowerCase();
  });

  const setTargetSurface = useCallback((surface: TargetSurface3D) => {
    try {
      localStorage.setItem("visualizer_3d_target_surface", surface);
    } catch {
      // ignore
    }
    try {
      window.dispatchEvent(
        new CustomEvent("visualizer-3d-target-surface", { detail: { surface } })
      );
    } catch {
      // ignore
    }
  }, []);

  const setSidebarOpen = useCallback((open: boolean) => {
    try {
      window.dispatchEvent(
        new CustomEvent("visualizer-3d-sidebar", { detail: { open } })
      );
    } catch {
      // ignore
    }
  }, []);

  const pendingAutoApplySurfaceRef = useRef<TargetSurface3D | null>(null);
  const closeSidebarOnApplyRef = useRef(false);
  const markCloseSidebarOnApply = () => {
    closeSidebarOnApplyRef.current = true;
  };

  // Materials
  const floorMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
 // const wallMatsRef = useRef<THREE.MeshStandardMaterial[]>([]);
const wallMatsRef = useRef<any[]>([]);
  // Original snapshots for clear
  const originalFloorSnapRef = useRef<MatSnapshot | null>(null);
  const originalWallSnapsRef = useRef<MatSnapshot[]>([]);
  const ownedMapsRef = useRef<Set<THREE.Texture>>(new Set());

  // Area patch meshes
  const areaMeshesRef = useRef<Partial<Record<WallTarget, THREE.Mesh>>>({});

  // Draw-area state
  const modeRef = useRef<InteractionMode>("orbit");
  const areaWallRef = useRef<WallTarget | null>(null);
  const drawStartHitRef = useRef<THREE.Vector3 | null>(null);
  const previewBoxRef = useRef<THREE.Mesh | null>(null);

  // Furniture move/resize state
  const movablesRef = useRef<THREE.Group[]>([]);
  const selectedFurniture = useRef<THREE.Group | null>(null);
  const furnitureOutline = useRef<THREE.Group | null>(null);
  const furnitureDragging = useRef(false);
  const furnitureDragFloorStart = useRef<THREE.Vector3 | null>(null);
  const furnitureDragObjStart = useRef<THREE.Vector3 | null>(null);
  const floorPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const handleDragRef = useRef<HandleDragState | null>(null);
  const handleElsRef = useRef<Record<Corner, HTMLDivElement | null>>({
    tl: null,
    tr: null,
    bl: null,
    br: null,
  });

  // React state
  const [mode, setMode] = useState<InteractionMode>("orbit");
  const [selectedTile, setSelectedTile] = useState<any>(null);
  const [selectedTileSize, setSelectedTileSize] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hoveredWall, setHoveredWall] = useState<string | null>(null);
  const [areaWallChosen, setAreaWallChosen] = useState<WallTarget | null>(null);
  const [areaConfirmPending, setAreaConfirmPending] = useState(false);
  const [hasAreaPatch, setHasAreaPatch] = useState<
    Partial<Record<WallTarget, boolean>>
  >({});
  const [pendingAreaData, setPendingAreaData] = useState<{
    wall: WallTarget;
    p1: THREE.Vector3;
    p2: THREE.Vector3;
  } | null>(null);
  const [furnitureLabel, setFurnitureLabel] = useState<string | null>(null);
  const [isProductInfoOpen, setIsProductInfoOpen] = useState(false);
  const [productInfoTab, setProductInfoTab] = useState<"wall" | "floor">("wall");
  const [appliedWallTiles, setAppliedWallTiles] = useState<AppliedTile[]>([]);
  const [appliedFloorTiles, setAppliedFloorTiles] = useState<AppliedTile[]>([]);
  const [appliedWallBySurface, setAppliedWallBySurface] = useState<
    Partial<Record<WallTarget, AppliedTile>>
  >({});

  // ── REFS for tile — always fresh, no stale closure issues ─────────────────
  const selectedTileRef = useRef<any>(null);
  const selectedTileSizeRef = useRef<string | null>(null);
  const tileRotationRef = useRef<number>(0);
const degToRad = (deg: number) => (deg * Math.PI) / 180;


  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const readScene = () => {
      setSceneKey(
        (localStorage.getItem("selected_3d_sub_scene") || "living_room").toLowerCase()
      );
    };
    readScene();
    window.addEventListener("storage", readScene);
    window.addEventListener("selected3DSceneUpdated", readScene as EventListener);
    return () => {
      window.removeEventListener("storage", readScene);
      window.removeEventListener("selected3DSceneUpdated", readScene as EventListener);
    };
  }, []);

  // ── Tile selection listener ───────────────────────────────────────────────
  useEffect(() => {
    const load = () => {
      const saved = localStorage.getItem("selected_tile");
      const tile = saved ? JSON.parse(saved) : null;
      const size = localStorage.getItem("selected_tile_size");
      setSelectedTile(tile);
      setSelectedTileSize(size);
      selectedTileRef.current = tile;
      selectedTileSizeRef.current = size;
    };

    const onTile = (event: Event) => {
      const detail = (event as CustomEvent).detail as { tile?: any; size?: string };
      if (detail?.tile !== undefined) {
        setSelectedTile(detail.tile ?? null);
        selectedTileRef.current = detail.tile ?? null;
      }
      if (detail?.size !== undefined) {
        setSelectedTileSize(detail.size ?? null);
        selectedTileSizeRef.current = detail.size ?? null;
      }
    };

    load();
    window.addEventListener("storage", load);
    window.addEventListener("selectedTileUpdated", onTile as EventListener);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener("selectedTileUpdated", onTile as EventListener);
    };
  }, []);

  useEffect(() => {
  // init from localStorage
  const saved = Number(localStorage.getItem("tile_rotation_deg") || "0");
  tileRotationRef.current = isNaN(saved) ? 0 : saved;

  const onRotate = (e: Event) => {
    const deg = Number((e as CustomEvent).detail?.degrees ?? 0);
    tileRotationRef.current = isNaN(deg) ? 0 : deg;

    const rot = degToRad(tileRotationRef.current);

    const updateMap = (map?: THREE.Texture | null) => {
      if (!map) return;
      map.center.set(0.5, 0.5);
      map.rotation = rot;
      map.needsUpdate = true;
    };

    if (floorMatRef.current?.map) updateMap(floorMatRef.current.map);
    wallMatsRef.current.forEach((m) => updateMap(m.map));
  };

  window.addEventListener("tile-rotation", onRotate as EventListener);
  return () => window.removeEventListener("tile-rotation", onRotate as EventListener);
}, []);


  // ── Back button fix ───────────────────────────────────────────────────────
  useEffect(() => {
    window.history.replaceState({ preview3D: true }, "");
    const onPop = () => {
      localStorage.removeItem("force_3d_mode");
      localStorage.removeItem("selected_3d_sub_scene");
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("force3DMode"));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // ── Toolbar actions ───────────────────────────────────────────────────────
  const [activModal, setActivModal] = useState<"save" | "mail" | null>(
    null
  );
  const [mailForm, setMailForm] = useState({
    name: "",
    to: "",
    subject: "",
    message: "",
  });
  const [mailSending, setMailSending] = useState(false);
  const [mailSent, setMailSent] = useState(false);
  const [mailMounted, setMailMounted] = useState(false);
  const [mailOpen, setMailOpen] = useState(false);

  const resolveMailEndpoint = () => {
    const explicit =
      String(process.env.NEXT_PUBLIC_VISUALIZER_MAIL_ENDPOINT ?? "").trim() ||
      (typeof window !== "undefined"
        ? String(
            (window as PublicEnvWindow).NEXT_PUBLIC_VISUALIZER_MAIL_ENDPOINT ?? ""
          ).trim()
        : "") ||
      String(VISUALIZER_MAIL_ENDPOINT ?? "").trim();

    if (explicit) {
      return explicit;
    }

    const rawBase =
      String(process.env.NEXT_PUBLIC_API_BASE ?? "").trim() ||
      (typeof window !== "undefined"
        ? String((window as PublicEnvWindow).NEXT_PUBLIC_API_BASE ?? "").trim()
        : "");

    if (!rawBase) {
      return "/visualizermail";
    }

    const base = rawBase.endsWith("/") ? rawBase.slice(0, -1) : rawBase;
    return `${base}/visualizermail`;
  };
  const handleSaveImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const c = document.createElement("canvas");
    c.width = canvas.width;
    c.height = canvas.height;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(canvas, 0, 0, c.width, c.height);
    const link = document.createElement("a");
    link.download = "Design.jpg";
    link.href = c.toDataURL("image/jpeg");
    link.click();
  };

  const createDesignShareLink = () => {
    try {
      const payload = {
        kind: "svik-3d-v1",
        scene: localStorage.getItem("selected_3d_sub_scene") || "living_room",
        wallBySurface: appliedWallBySurface,
        floorTile: appliedFloorTiles[0] ?? null,
        wallTiles: appliedWallTiles,
        floorTiles: appliedFloorTiles,
        rotationDeg: Number(localStorage.getItem("tile_rotation_deg") || "0") || 0,
      };
      const encoded = btoa(
        unescape(encodeURIComponent(JSON.stringify(payload)))
      );
      return `${window.location.href.split("#")[0]}#design-data:${encoded}`;
    } catch {
      return window.location.href;
    }
  };

  const handleSaveForLater = () => {
    try {
      const canvas = canvasRef.current;
      const scene = localStorage.getItem("selected_3d_sub_scene") || "living_room";

      const payload = {
        kind: "svik-3d-v1",
        scene,
        wallBySurface: appliedWallBySurface,
        floorTile: appliedFloorTiles[0] ?? null,
        wallTiles: appliedWallTiles,
        floorTiles: appliedFloorTiles,
        rotationDeg: Number(localStorage.getItem("tile_rotation_deg") || "0") || 0,
      };

      const designData = btoa(
        unescape(encodeURIComponent(JSON.stringify(payload)))
      );

      let image: string | null = null;
      if (canvas) {
        const c = document.createElement("canvas");
        c.width = canvas.width;
        c.height = canvas.height;
        const ctx = c.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(canvas, 0, 0, c.width, c.height);
          image = c.toDataURL("image/jpeg", 0.92);
        }
      }

      window.postMessage(
        {
          type: "SAVE_DESIGN",
          payload: {
            link: `${window.location.origin}/visualizer?view=3d#design-data:${designData}`,
            image,
            designData,
            roomId: null,
          },
        },
        "*"
      );
    } catch {
      alert("Failed to prepare save payload.");
    }
  };

  const handleSavePDF = async () => {
    const jsPDFModule = await import("jspdf").catch(() => null);
    const JsPDF = jsPDFModule?.jsPDF ?? null;
    if (!JsPDF) {
      window.print();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const c = document.createElement("canvas");
    c.width = canvas.width;
    c.height = canvas.height;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(canvas, 0, 0, c.width, c.height);
    const roomDataUrl = c.toDataURL("image/jpeg");

    const pdf = new JsPDF("p", "mm", "a4");
    const pageW = 210;
    const margin = 12;
    const getRoomKey = () =>
  String(localStorage.getItem("selected_3d_sub_scene") || "living_room")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

const pad2 = (n: number) => String(n).padStart(2, "0");
const today = new Date();
const dateStr = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;

const baseName = `${getRoomKey()}-${dateStr}`;
const countKey = `svik_pdf_count:${baseName}`;
const prevCount = Number(localStorage.getItem(countKey) || "0"); // 0 = first time
localStorage.setItem(countKey, String(prevCount + 1));

const suffix = prevCount === 0 ? "" : `(${prevCount})`;
const fileName = `${baseName}${suffix}.pdf`;


    pdf.setFillColor(14, 70, 69);
    pdf.rect(0, 0, pageW, 24, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(17);
    pdf.setFont("helvetica", "bold");
    pdf.text("SVIK Infotech", margin, 15);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text("Generated on " + new Date().toLocaleString(), margin, 20);

    pdf.setFillColor(245, 248, 250);
    pdf.rect(margin, 28, pageW - margin * 2, 92, "F");
    pdf.addImage(
      roomDataUrl,
      "JPEG",
      margin + 1.5,
      29.5,
      pageW - margin * 2 - 3,
      89
    );
    pdf.setDrawColor(214, 223, 228);
    pdf.rect(margin, 28, pageW - margin * 2, 92);

    pdf.setTextColor(32, 44, 49);
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("Applied Product Details", margin, 128);

    const loadImg = (
      url: string
    ): Promise<{ dataUrl: string; w: number; h: number } | null> =>
      new Promise((resolve) => {
        if (!url) {
          resolve(null);
          return;
        }
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            const ic = document.createElement("canvas");
            ic.width = img.naturalWidth || img.width;
            ic.height = img.naturalHeight || img.height;
            ic.getContext("2d")!.drawImage(img, 0, 0, ic.width, ic.height);
            resolve({
              dataUrl: ic.toDataURL("image/jpeg", 0.95),
              w: ic.width,
              h: ic.height,
            });
          } catch {
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = url;
      });

    const fetchQr = async (link: string): Promise<string | null> => {
      if (!link) return null;
      const providers = [
        `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=0&data=${encodeURIComponent(
          link
        )}`,
        `https://quickchart.io/qr?size=220&margin=0&text=${encodeURIComponent(
          link
        )}`,
        `https://chart.googleapis.com/chart?cht=qr&chs=220x220&chl=${encodeURIComponent(
          link
        )}`,
      ];
      for (const provider of providers) {
        const res = await loadImg(provider);
        if (res?.dataUrl) return res.dataUrl;
      }
      return null;
    };

    // const allTiles = [
    //   ...appliedWallTiles.map((t) => ({ ...t, section: "Wall Tile" })),
    //   ...appliedFloorTiles.map((t) => ({ ...t, section: "Floor Tile" })),
    // ];
    const currentWallTiles = (Object.values(appliedWallBySurface).filter(Boolean) as AppliedTile[])
  .map((t) => ({ ...t, section: "Wall Tile" }));

const currentFloorTile = appliedFloorTiles[0]
  ? [{ ...appliedFloorTiles[0], section: "Floor Tile" }]
  : [];

const allTiles = [...currentWallTiles, ...currentFloorTile];


    let y = 132;
    const cardH = 56;

    for (const tile of allTiles) {
      if (y + cardH + 6 > 285) {
        pdf.addPage();
        y = 16;
      }

      const leftX = margin + 6;
      const qrBox = { x: pageW - margin - 44, y: y + 10, w: 36, h: 36 };
      const imgBox = { x: qrBox.x - 48, y: y + 10, w: 40, h: 36 };
      const productLink = tile.skuCode
        ? `${window.location.origin}/product-details?sku=${encodeURIComponent(
            tile.skuCode
          )}`
        : "";

      pdf.setFillColor(248, 251, 252);
      pdf.roundedRect(margin, y, pageW - margin * 2, cardH, 3, 3, "F");
      pdf.setDrawColor(218, 228, 231);
      pdf.roundedRect(margin, y, pageW - margin * 2, cardH, 3, 3, "S");

      pdf.setTextColor(18, 48, 47);
      pdf.setFontSize(13);
      pdf.setFont("helvetica", "bold");
      pdf.text(tile.section, leftX, y + 10);

      pdf.setTextColor(34, 51, 59);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text(`Name: ${tile.name || "Tile"}`, leftX, y + 20);
      pdf.text(`Size: ${tile.size || "-"}`, leftX, y + 26);
      //if (tile.skuCode) pdf.text(`SKU: ${tile.skuCode}`, leftX, y + 32);
      const finish =
  (tile as any).finish ??
  (tile as any).finish_name ??
  (tile as any).surface_finish ??
  (tile as any).finishType ??
  "";

pdf.text(`Finish: ${tile.finish || "-"}`, leftX, y + 32);


      pdf.setDrawColor(214, 223, 228);

      const normalizedTileImage = tile.image
        ? resolveAssetUrl(tile.image)
        : "";
      const tileImgUrl = normalizedTileImage ? normalizedTileImage : "";
      const tileImgData = await loadImg(tileImgUrl);
      if (tileImgData?.dataUrl) {
        const r = Math.min(
          imgBox.w / tileImgData.w,
          imgBox.h / tileImgData.h
        );
        const fw = tileImgData.w * r;
        const fh = tileImgData.h * r;
        const fx = imgBox.x + (imgBox.w - fw) / 2;
        const fy = imgBox.y + (imgBox.h - fh) / 2;
        pdf.addImage(tileImgData.dataUrl, "JPEG", fx, fy, fw, fh);
      } else {
        pdf.setFontSize(8);
        pdf.text("Image unavailable", imgBox.x + 3, imgBox.y + 18);
      }

      if (productLink) {
        try {
          pdf.setTextColor(14, 88, 86);
          pdf.setFontSize(10);
          pdf.textWithLink("Open product page", leftX, y + 44, {
            url: productLink,
          });
        } catch {
          pdf.text(`Product: ${productLink}`, leftX, y + 44);
        }
      }

      await new Promise((r) => setTimeout(r, 300));
      const qrDataUrl = await fetchQr(productLink);
      if (qrDataUrl) {
        const fmt = qrDataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
        pdf.addImage(
          qrDataUrl,
          fmt,
          qrBox.x + 1,
          qrBox.y + 1,
          qrBox.w - 2,
          qrBox.h - 2
        );
      } else {
        pdf.setFontSize(8);
        pdf.text("QR", qrBox.x + 14, qrBox.y + 20);
      }

      y += cardH + 6;
    }

    if (!allTiles.length) {
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text("No applied tiles found for wall/floor.", margin, 136);
    }

    pdf.save(fileName);

  };

  const handleSaveLink = async () => {
    const link = createDesignShareLink();
    try {
      await navigator.clipboard.writeText(link);
      alert("Design link copied to clipboard!");
    } catch {
      alert(`Copy this link:\n${link}`);
    }
  };

  const handleShareImage = () => {
    const buildWatermarkedShareFile = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const footerHeight = 54;
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = canvas.width;
      exportCanvas.height = canvas.height + footerHeight;
      const ctx = exportCanvas.getContext("2d");
      if (!ctx) return null;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, canvas.height, exportCanvas.width, footerHeight);
      ctx.fillStyle = "#0f172a";
      ctx.font = `700 ${Math.max(18, Math.round(exportCanvas.width * 0.028))}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("SvikInfotech", exportCanvas.width / 2, canvas.height + footerHeight / 2);

      const blob = await new Promise<Blob | null>((resolve) => {
        exportCanvas.toBlob((nextBlob) => resolve(nextBlob), "image/png");
      });
      if (!blob) return null;
      return new File([blob], "svik-room-share.png", { type: "image/png" });
    };

    const run = async () => {
      const file = await buildWatermarkedShareFile();
      if (!file) {
        alert("Unable to prepare share image.");
        return;
      }

      try {
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "SvikInfotech Room Design",
            text: "SvikInfotech room design",
          });
        } else {
          const url = URL.createObjectURL(file);
          const link = document.createElement("a");
          link.href = url;
          link.download = file.name;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            alert("Direct image sharing is not supported in this browser, so the image was downloaded instead.");
        }
      } catch {
        // ignore cancellation
      }
    };

    void run();
  };

  const handleMailSend = async () => {
    if (!mailForm.to || !mailForm.subject || !mailForm.message) {
      alert("Please fill in recipient email, subject, and message.");
      return;
    }
    setMailSending(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        alert("Preview image is not available.");
        return;
      }

      const c = document.createElement("canvas");
      c.width = canvas.width;
      c.height = canvas.height;
      const ctx = c.getContext("2d");
      if (!ctx) {
        alert("Unable to prepare preview image.");
        return;
      }
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(canvas, 0, 0, c.width, c.height);

      const designLink = window.location.href;
      const sceneKey =
        localStorage.getItem("selected_3d_sub_scene") || "living_room";
      const imageBlob = await new Promise<Blob | null>((resolve) => {
        c.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
      });
      if (!imageBlob) {
        alert("Unable to prepare preview image.");
        return;
      }

      const formData = new FormData();
      formData.append("FullName", mailForm.name || "");
      formData.append("To", mailForm.to || "");
      formData.append("Subject", mailForm.subject || "");
      formData.append("Message", mailForm.message || "");
      formData.append("RoomName", sceneKey || "");
      formData.append("DesignLink", designLink || "");
      formData.append("Image", imageBlob, "visualizer-3d.jpg");

      const res = await fetch(resolveMailEndpoint(), {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setMailSent(true);
        setTimeout(() => {
          setMailSent(false);
          setActivModal(null);
          setMailForm({ name: "", to: "", subject: "", message: "" });
        }, 2000);
      } else {
        const body = [
          `Name: ${mailForm.name}`,
          `Room: ${sceneKey}`,
          "",
          mailForm.message,
          "",
          `Design URL: ${designLink}`,
        ].join("\n");
        window.location.href = `mailto:${encodeURIComponent(
          mailForm.to
        )}?subject=${encodeURIComponent(
          mailForm.subject
        )}&body=${encodeURIComponent(body)}`;
        setActivModal(null);
      }
    } catch {
      const body = [
        `Name: ${mailForm.name}`,
        "",
        mailForm.message,
        "",
        `Design URL: ${window.location.href}`,
      ].join("\n");
      window.location.href = `mailto:${encodeURIComponent(
        mailForm.to
      )}?subject=${encodeURIComponent(
        mailForm.subject
      )}&body=${encodeURIComponent(body)}`;
      setActivModal(null);
    } finally {
      setMailSending(false);
    }
  };

  useEffect(() => {
    if (activModal === "mail") {
      setMailMounted(true);
      const raf = requestAnimationFrame(() => setMailOpen(true));
      return () => cancelAnimationFrame(raf);
    }
    if (!mailMounted) return;
    setMailOpen(false);
    const t = setTimeout(() => setMailMounted(false), 600);
    return () => clearTimeout(t);
  }, [activModal, mailMounted]);

  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      window.print();
      return;
    }
    const c = document.createElement("canvas");
    c.width = canvas.width;
    c.height = canvas.height;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(canvas, 0, 0, c.width, c.height);
    const dataUrl = c.toDataURL("image/jpeg");
    const content = `<body style="margin:0;"><img src="${dataUrl}" style="width:100%;"></body>`;
    const WinPrint = window.open(
      "",
      "",
      `width=${canvas.width},height=${canvas.height},toolbar=0,scrollbars=0,status=0`
    );
    if (!WinPrint) {
      window.print();
      return;
    }
    WinPrint.document.write(content);
    WinPrint.document.close();
    WinPrint.focus();
    setTimeout(() => {
      WinPrint.print();
    }, 1000);
    setTimeout(() => {
      WinPrint.close();
    }, 2000);
  };

  const handleSelectRoom = () => {
    const rawSpace =
      localStorage.getItem("selected_space_type") ||
      localStorage.getItem("selected_3d_sub_scene") ||
      "living";
    const space = String(rawSpace).toLowerCase().includes("kitchen")
      ? "kitchen"
      : String(rawSpace).toLowerCase().includes("bed")
        ? "bedroom"
        : String(rawSpace).toLowerCase().includes("bath")
          ? "bathroom"
          : String(rawSpace).toLowerCase().includes("outdoor")
            ? "outdoor"
            : "living";
    localStorage.removeItem("visualizer_room_id");
    localStorage.removeItem("visualizer_design_hash");
    localStorage.removeItem("visualizer_3d_design_hash");
    localStorage.removeItem("force_3d_mode");
    localStorage.removeItem("selected_3d_sub_scene");
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("force3DMode"));
    localStorage.setItem("selected_space_type", space);
    sessionStorage.removeItem("visualizer_intent");
    sessionStorage.setItem("visualizer_category_intent", "1");
    router.push("/visualizer");
  };

  const handleProductInfo = () => setIsProductInfoOpen(true);

  // ── Applied tile helpers ──────────────────────────────────────────────────
  const getTileKey = (tile: AppliedTile) => {
    const sku = tile.skuCode?.trim();
    if (sku) return sku;
    const id = String(tile.id ?? "").trim();
    if (id) return id;
    return `${tile.name ?? ""}__${tile.size ?? ""}`;
  };

  const buildAppliedTile = (tile: any, size: string | null): AppliedTile | null => {
    if (!tile) return null;
    return {
      id: tile.id ?? tile.tile_id ?? "",
      name: tile.name ?? tile.sku_name ?? "Tile",
      image: tile.image ?? "",
      skuCode: tile.sku_code ?? tile.skuCode ?? "",
      size,
      finish: tile.finish ?? tile.finish_name ?? "",

    };
  };

  const registerAppliedTile = useCallback((surface: "wall" | "floor") => {
    const tile = buildAppliedTile(
      selectedTileRef.current,
      selectedTileSizeRef.current
    );
    if (!tile) return;
    if (surface === "floor") {
      setAppliedFloorTiles([tile]);
    } else {
      setAppliedWallTiles((prev) => {
        const key = getTileKey(tile);
        const filtered = prev.filter((t) => getTileKey(t) !== key);
        return [tile, ...filtered];
      });
    }
  }, []);

  const getTileImageSrc = (src?: string) => (src ? resolveAssetUrl(src) : "");

 
const buildTexture = useCallback(
  (base: THREE.Texture, rx: number, ry: number): THREE.Texture => {
    const img = base.image as HTMLImageElement;
    const cv = document.createElement("canvas");
    const scale = 4;
    cv.width = img.width * scale;
    cv.height = img.height * scale;
    const ctx = cv.getContext("2d")!;
    ctx.drawImage(img, 0, 0, cv.width, cv.height);

    // ── Detect average brightness of tile ──────────────────
    // Sample a small version of the original image to get avg color
    const sampleCanvas = document.createElement("canvas");
    sampleCanvas.width = 16;
    sampleCanvas.height = 16;
    const sampleCtx = sampleCanvas.getContext("2d")!;
    sampleCtx.drawImage(img, 0, 0, 16, 16);
    const pixels = sampleCtx.getImageData(0, 0, 16, 16).data;
    let totalBrightness = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      // perceived brightness formula
      totalBrightness +=
        0.299 * pixels[i] +       // R
        0.587 * pixels[i + 1] +   // G
        0.114 * pixels[i + 2];    // B
    }
    const avgBrightness = totalBrightness / (pixels.length / 4); // 0–255

    
    const isDark = avgBrightness < 80;
    const groutOuter = isDark ? "#888888" : "#2a2a2a";
    const groutInner = isDark ? "#aaaaaa" : "#555555";
    // ────────────────────────────────────────────────────────

    const groutWidth = 3;
    const groutInnerW = 1.5;

    ctx.strokeStyle = groutOuter;
    ctx.lineWidth = groutWidth;
    ctx.strokeRect(
      groutWidth / 2,
      groutWidth / 2,
      cv.width - groutWidth,
      cv.height - groutWidth
    );

    ctx.strokeStyle = groutInner;
    ctx.lineWidth = groutInnerW;
    ctx.strokeRect(
      groutWidth + groutInnerW / 2,
      groutWidth + groutInnerW / 2,
      cv.width - (groutWidth + groutInnerW) * 2,
      cv.height - (groutWidth + groutInnerW) * 2
    );

    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(rx, ry);
    tex.anisotropy = 16;
    const rot = degToRad(tileRotationRef.current);
    tex.center.set(0.5, 0.5);
    tex.rotation = rot;
    tex.needsUpdate = true;
    return tex;
  },
  []
);


const applyTexToMat = useCallback((mat: any, tex: THREE.Texture) => {
  const prev = mat.map;
  if (prev && ownedMapsRef.current.has(prev)) {
    prev.dispose();
    ownedMapsRef.current.delete(prev);
  }
  ownedMapsRef.current.add(tex);

  mat.map = tex;
  mat.map.wrapS = mat.map.wrapT = THREE.RepeatWrapping;
  mat.map.repeat.copy(tex.repeat);
  mat.map.anisotropy = rendererRef.current?.capabilities.getMaxAnisotropy() ?? 16;
  mat.map.needsUpdate = true;
  mat.color.set(0xffffff);
  mat.transparent = false;
  mat.opacity = 1;
  mat.needsUpdate = true;
}, []);
  // ── KEY FIX: loadAndApply reads from ref — never stale ───────────────────
  const loadAndApply = useCallback((applyFn: (base: THREE.Texture) => void) => {
    const tile = selectedTileRef.current;
    if (!tile?.image) {
      setErrorMessage("No tile selected.");
      return;
    }
    setIsApplying(true);
    setErrorMessage(null);
    const url = resolveAssetUrl(tile.image);
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      url,
      (tex: THREE.Texture) => {
        try {
          tex.colorSpace = THREE.SRGBColorSpace;
          applyFn(tex);
          if (closeSidebarOnApplyRef.current) {
            closeSidebarOnApplyRef.current = false;
            setSidebarOpen(false);
          }
        } finally {
          setIsApplying(false);
        }
      },
      () => {},
      () => {
        setErrorMessage("Failed to load tile texture.");
        setIsApplying(false);
        closeSidebarOnApplyRef.current = false;
      }
    );
  }, [setSidebarOpen]);

  
  const applyFloor = useCallback(() => {
  if (!floorMatRef.current) return;
  const [rx, ry] = getRepeat(selectedTileSizeRef.current, "floor");
  registerAppliedTile("floor");
  markCloseSidebarOnApply();
  loadAndApply((base) => {
    applyTexToMat(floorMatRef.current!, buildTexture(base, rx, ry));

    // ── Neutralize floor after tile applied ──
    if (floorMatRef.current) {
      floorMatRef.current.roughness = 0.9;
      floorMatRef.current.metalness = 0.0;
      floorMatRef.current.emissive.set(0x000000);
      floorMatRef.current.emissiveIntensity = 0.0;
      floorMatRef.current.needsUpdate = true;
    }
  });
}, [loadAndApply, applyTexToMat, buildTexture, registerAppliedTile]);

  
const applyWall = useCallback(
  (surfaceName: string) => {
    const idx =
      surfaceName === SURFACE_NAMES.wallBack
        ? 0
        : surfaceName === SURFACE_NAMES.wallLeft
        ? 1
        : surfaceName === SURFACE_NAMES.wallRight
        ? 2
        : -1;

    // ── GUARD: bail if mat not ready ──────────────────
    if (idx < 0) return;
    const mat = wallMatsRef.current[idx];
    if (!mat) {
      console.warn("Wall mat not ready at index", idx, wallMatsRef.current);
      return;
    }
    // ─────────────────────────────────────────────────

    const [rx, ry] = getRepeat(selectedTileSizeRef.current, "wall");
    const wallTile = buildAppliedTile(
      selectedTileRef.current,
      selectedTileSizeRef.current
    );
    if (
      wallTile &&
      (surfaceName === SURFACE_NAMES.wallBack ||
        surfaceName === SURFACE_NAMES.wallLeft ||
        surfaceName === SURFACE_NAMES.wallRight)
    ) {
      setAppliedWallBySurface((prev) => ({
        ...prev,
        [surfaceName as WallTarget]: wallTile,
      }));
    }
    registerAppliedTile("wall");
    markCloseSidebarOnApply();
    loadAndApply((base) =>
      applyTexToMat(mat, buildTexture(base, rx, ry))  // ← use captured mat
    );
  },
  [loadAndApply, applyTexToMat, buildTexture, registerAppliedTile]
);
  const applyAreaTileOnWall = useCallback(
    (wall: WallTarget, p1: THREE.Vector3, p2: THREE.Vector3) => {
      if (!sceneRef.current) return;
      const scene = sceneRef.current;
      const [rx, ry] = getRepeat(selectedTileSizeRef.current, "wall");
      const wallMesh = scene.getObjectByName(wall);
      const wallPos = wallMesh ? wallMesh.position : new THREE.Vector3();

      markCloseSidebarOnApply();
      loadAndApply((base) => {
        registerAppliedTile("wall");
        if (areaMeshesRef.current[wall]) {
          scene.remove(areaMeshesRef.current[wall]!);
          areaMeshesRef.current[wall]!.geometry.dispose();
          const oldMat = areaMeshesRef.current[wall]!
            .material as THREE.MeshStandardMaterial;
          if (oldMat.map && ownedMapsRef.current.has(oldMat.map)) {
            oldMat.map.dispose();
            ownedMapsRef.current.delete(oldMat.map);
          }
          oldMat.dispose();
          delete areaMeshesRef.current[wall];
        }
        const isBackWall = wall === SURFACE_NAMES.wallBack;
        const isLeftWall = wall === SURFACE_NAMES.wallLeft;
        const horizDiff = isBackWall ? Math.abs(p2.x - p1.x) : Math.abs(p2.z - p1.z);
        const vertDiff = Math.abs(p2.y - p1.y);
        const w = Math.max(horizDiff, 0.1);
        const h = Math.max(vertDiff, 0.1);
        if (w < 0.15 || h < 0.15) return;
        const cx = (p1.x + p2.x) / 2;
        const cy = (p1.y + p2.y) / 2;
        const geo = new THREE.PlaneGeometry(w, h);
        const tex = buildTexture(base, rx * (w / 10), ry * (h / 6));
        ownedMapsRef.current.add(tex);
        const mat = new THREE.MeshStandardMaterial({
          map: tex,
          roughness: 0.6,
          metalness: 0.05,
          transparent: false,
          opacity: 1.0,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.receiveShadow = true;
        mesh.renderOrder = 1;
        const OFFSET = 0.013;
        if (isBackWall) {
          mesh.position.set(cx, cy, wallPos.z + OFFSET);
        } else if (isLeftWall) {
          mesh.rotation.y = Math.PI / 2;
          mesh.position.set(wallPos.x + OFFSET, cy, (p1.z + p2.z) / 2);
        } else {
          mesh.rotation.y = -Math.PI / 2;
          mesh.position.set(wallPos.x - OFFSET, cy, (p1.z + p2.z) / 2);
        }
        mesh.name = `area_patch_${wall}`;
        scene.add(mesh);
        areaMeshesRef.current[wall] = mesh;
        setHasAreaPatch((prev) => ({ ...prev, [wall]: true }));
      });
    },
    [loadAndApply, buildTexture, registerAppliedTile]
  );

  useEffect(() => {
    const maybeAutoApply = (event?: Event) => {
      const target = pendingAutoApplySurfaceRef.current;
      if (!target) return;
      if (target !== "floor") return;
      if (event instanceof StorageEvent) {
        const key = String(event.key || "");
        if (key && key !== "selected_tile" && key !== "selected_tile_size") return;
      }
      if (!floorMatRef.current) return;
      if (!selectedTileRef.current?.image) return;
      if (modeRef.current !== "orbit") return;
      pendingAutoApplySurfaceRef.current = null;
      applyFloor();
    };

    window.addEventListener("storage", maybeAutoApply as EventListener);
    window.addEventListener("selectedTileUpdated", maybeAutoApply as EventListener);
    return () => {
      window.removeEventListener("storage", maybeAutoApply as EventListener);
      window.removeEventListener("selectedTileUpdated", maybeAutoApply as EventListener);
    };
  }, [applyFloor]);

  const clearAreaPatch = useCallback((wall: WallTarget) => {
    if (!sceneRef.current) return;
    const mesh = areaMeshesRef.current[wall];
    if (mesh) {
      sceneRef.current.remove(mesh);
      mesh.geometry.dispose();
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat.map && ownedMapsRef.current.has(mat.map)) {
        mat.map.dispose();
        ownedMapsRef.current.delete(mat.map);
      }
      mat.dispose();
      delete areaMeshesRef.current[wall];
      setHasAreaPatch((prev) => {
        const n = { ...prev };
        delete n[wall];
        return n;
      });
    }
  }, []);

  const clearPreviewBox = useCallback(() => {
    if (previewBoxRef.current && sceneRef.current) {
      const outline = previewBoxRef.current.getObjectByName("preview_outline");
      if (outline instanceof THREE.LineSegments) {
        outline.geometry.dispose();
        (outline.material as THREE.Material).dispose();
      }
      sceneRef.current.remove(previewBoxRef.current);
      previewBoxRef.current.geometry.dispose();
      (previewBoxRef.current.material as THREE.Material).dispose();
      previewBoxRef.current = null;
    }
  }, []);

  // ── Furniture outline helpers ─────────────────────────────────────────────
  const clearFurnitureOutline = useCallback(() => {
    if (furnitureOutline.current && sceneRef.current) {
      sceneRef.current.remove(furnitureOutline.current);
      furnitureOutline.current = null;
    }
  }, []);

  const showFurnitureOutline = useCallback(
    (obj: THREE.Group) => {
      clearFurnitureOutline();
      if (!sceneRef.current) return;
      const grp = new THREE.Group();
      obj.traverse((c: THREE.Object3D) => {
        if (!(c as THREE.Mesh).isMesh) return;
        const edges = new THREE.EdgesGeometry((c as THREE.Mesh).geometry, 12);
        const line = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ color: 0xf0b43c, linewidth: 2 })
        );
        line.position.copy(c.position);
        line.rotation.copy(c.rotation);
        line.scale.copy(c.scale);
        grp.add(line);
      });
      grp.position.copy(obj.position);
      grp.rotation.copy(obj.rotation);
      grp.scale.copy(obj.scale);
      sceneRef.current.add(grp);
      furnitureOutline.current = grp;
    },
    [clearFurnitureOutline]
  );

  const syncFurnitureOutline = useCallback(() => {
    if (!furnitureOutline.current || !selectedFurniture.current) return;
    furnitureOutline.current.position.copy(selectedFurniture.current.position);
    furnitureOutline.current.rotation.copy(selectedFurniture.current.rotation);
    furnitureOutline.current.scale.copy(selectedFurniture.current.scale);
  }, []);

  // ── Corner handles ────────────────────────────────────────────────────────
  const hideHandles = useCallback(() => {
    (Object.values(handleElsRef.current) as (HTMLDivElement | null)[]).forEach(
      (el) => {
        if (el) el.style.display = "none";
      }
    );
  }, []);

  const refreshHandles = useCallback(() => {
    const obj = selectedFurniture.current;
    const els = handleElsRef.current;
    if (!obj || !cameraRef.current || !canvasRef.current || !containerRef.current) {
      hideHandles();
      return;
    }
    const camera = cameraRef.current;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    obj.traverse((child: THREE.Object3D) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      const pos = mesh.geometry.attributes.position;
      if (!pos) return;
      for (let i = 0; i < pos.count; i++) {
        const v = new THREE.Vector3().fromBufferAttribute(pos, i);
        mesh.localToWorld(v);
        v.project(camera);
        const vpX = canvasRect.left + ((v.x + 1) / 2) * canvasRect.width;
        const vpY = canvasRect.top + ((-v.y + 1) / 2) * canvasRect.height;
        const cx = vpX - containerRect.left;
        const cy = vpY - containerRect.top;
        if (cx < minX) minX = cx;
        if (cy < minY) minY = cy;
        if (cx > maxX) maxX = cx;
        if (cy > maxY) maxY = cy;
      }
    });
    if (!isFinite(minX)) {
      hideHandles();
      return;
    }
    const pad = 5;
    minX -= pad;
    minY -= pad;
    maxX += pad;
    maxY += pad;
    const corners: Record<Corner, [number, number]> = {
      tl: [minX, minY],
      tr: [maxX, minY],
      bl: [minX, maxY],
      br: [maxX, maxY],
    };
    (Object.entries(corners) as [Corner, [number, number]][]).forEach(
      ([key, [sx, sy]]) => {
        const el = els[key];
        if (!el) return;
        el.style.display = "block";
        el.style.left = `${sx}px`;
        el.style.top = `${sy}px`;
      }
    );
  }, [hideHandles]);

  // ── Select / deselect furniture ───────────────────────────────────────────
  const selectFurniture = useCallback(
    (obj: THREE.Group) => {
      selectedFurniture.current = obj;
      showFurnitureOutline(obj);
      refreshHandles();
      setFurnitureLabel(obj.userData.label ?? obj.name);
      if (controlsRef.current) controlsRef.current.enabled = false;
    },
    [showFurnitureOutline, refreshHandles]
  );

  const deselectFurniture = useCallback(() => {
    selectedFurniture.current = null;
    clearFurnitureOutline();
    hideHandles();
    setFurnitureLabel(null);
    if (controlsRef.current)
      controlsRef.current.enabled = modeRef.current === "orbit";
  }, [clearFurnitureOutline, hideHandles]);

  // ── CLEAR ALL TILES (walls+floor+area patches + selection) ────────────────
  const clearAllTiles = useCallback(() => {
    setActivModal(null);
    setIsProductInfoOpen(false);

    setMode("orbit");
    modeRef.current = "orbit";
    setHoveredWall(null);
    setAreaWallChosen(null);
    setAreaConfirmPending(false);
    setPendingAreaData(null);
    areaWallRef.current = null;
    drawStartHitRef.current = null;

    clearPreviewBox();

    if (selectedFurniture.current) deselectFurniture();

    // Remove all area patches
    if (sceneRef.current) {
      (Object.keys(areaMeshesRef.current) as WallTarget[]).forEach((wall) => {
        const mesh = areaMeshesRef.current[wall];
        if (!mesh) return;

        sceneRef.current!.remove(mesh);
        mesh.geometry.dispose();

        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat.map && ownedMapsRef.current.has(mat.map)) {
          mat.map.dispose();
          ownedMapsRef.current.delete(mat.map);
        }
        mat.dispose();

        delete areaMeshesRef.current[wall];
      });
    }
    setHasAreaPatch({});

    // Restore floor
    const floorMat = floorMatRef.current;
    const floorSnap = originalFloorSnapRef.current;
    if (floorMat && floorSnap) {
      if (floorMat.map && ownedMapsRef.current.has(floorMat.map)) {
        floorMat.map.dispose();
        ownedMapsRef.current.delete(floorMat.map);
      }
      floorMat.map = floorSnap.map;
      floorMat.transparent = floorSnap.transparent;
      floorMat.opacity = floorSnap.opacity;

      if (floorMat.map) {
        if (floorSnap.wrapS !== undefined) floorMat.map.wrapS = floorSnap.wrapS;
        if (floorSnap.wrapT !== undefined) floorMat.map.wrapT = floorSnap.wrapT;
        if (floorSnap.repeat) floorMat.map.repeat.copy(floorSnap.repeat);
        if (floorSnap.offset) floorMat.map.offset.copy(floorSnap.offset);
        if (floorSnap.center) floorMat.map.center.copy(floorSnap.center);
        if (floorSnap.rotation !== undefined)
          floorMat.map.rotation = floorSnap.rotation;
        floorMat.map.needsUpdate = true;
      }
      floorMat.needsUpdate = true;
    }

    // Restore walls
    wallMatsRef.current.forEach((m, i) => {
      const snap = originalWallSnapsRef.current[i];
      if (!snap) return;

      if (m.map && ownedMapsRef.current.has(m.map)) {
        m.map.dispose();
        ownedMapsRef.current.delete(m.map);
      }

      m.map = snap.map;
      m.transparent = snap.transparent;
      m.opacity = snap.opacity;

      if (m.map) {
        if (snap.wrapS !== undefined) m.map.wrapS = snap.wrapS;
        if (snap.wrapT !== undefined) m.map.wrapT = snap.wrapT;
        if (snap.repeat) m.map.repeat.copy(snap.repeat);
        if (snap.offset) m.map.offset.copy(snap.offset);
        if (snap.center) m.map.center.copy(snap.center);
        if (snap.rotation !== undefined) m.map.rotation = snap.rotation;
        m.map.needsUpdate = true;
      }
      m.needsUpdate = true;
    });

    setAppliedWallTiles([]);
    setAppliedFloorTiles([]);

    localStorage.removeItem("selected_tile");
    localStorage.removeItem("selected_tile_size");
    setSelectedTile(null);
    setSelectedTileSize(null);
    selectedTileRef.current = null;
    selectedTileSizeRef.current = null;

    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(
      new CustomEvent("selectedTileUpdated", { detail: { tile: null, size: null } })
    );

    setErrorMessage(null);
    if (canvasRef.current) canvasRef.current.style.cursor = "grab";
  }, [clearPreviewBox, deselectFurniture]);

  // ── Hit test movables ─────────────────────────────────────────────────────
  const hitMovable = useCallback((e: React.MouseEvent): THREE.Group | null => {
    if (!cameraRef.current) return null;
    const r = canvasRef.current!.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      -((e.clientY - r.top) / r.height) * 2 + 1
    );
    raycasterRef.current.setFromCamera(ndc, cameraRef.current);
    const meshes: THREE.Mesh[] = [];
    movablesRef.current.forEach((g) =>
      g.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) meshes.push(c as THREE.Mesh);
      })
    );
    const hits = raycasterRef.current.intersectObjects(meshes, false);
    if (!hits.length) return null;
    let cur: THREE.Object3D | null = hits[0].object;
    while (cur) {
      if (cur.userData.movable) return cur as THREE.Group;
      cur = cur.parent;
    }
    return null;
  }, []);

  const isDescendantOfSelected = (node: THREE.Object3D): boolean => {
    let cur: THREE.Object3D | null = node;
    while (cur) {
      if (cur === selectedFurniture.current) return true;
      cur = cur.parent;
    }
    return false;
  };

  const getFloorPoint = useCallback((e: React.MouseEvent, atY = 0): THREE.Vector3 | null => {
    if (!cameraRef.current) return null;
    const r = canvasRef.current!.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      -((e.clientY - r.top) / r.height) * 2 + 1
    );
    raycasterRef.current.setFromCamera(ndc, cameraRef.current);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -atY);
    const t = new THREE.Vector3();
    const hit = raycasterRef.current.ray.intersectPlane(plane, t);
    return hit ? t : null;
  }, []);

  // ── 3D Scene Setup ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf9f7f2);
    sceneRef.current = scene;

    const getSize = () => {
      const el = canvas.parentElement;
      return el
        ? { w: el.clientWidth, h: el.clientHeight }
        : { w: window.innerWidth, h: window.innerHeight };
    };
    const { w: W, h: H } = getSize();
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 1000);
    camera.position.set(0, 2.0, 7.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(W, H);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.75;
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 1.0, 0);
    controls.minDistance = 3;
    controls.maxDistance = 11;
    // controls.minPolarAngle = 0.2;
    // controls.maxPolarAngle = Math.PI / 2.1;
    controls.minPolarAngle = 0.1;
controls.maxPolarAngle = Math.PI * 0.95;
    controls.minAzimuthAngle = -Math.PI * 0.55;
    controls.maxAzimuthAngle = Math.PI * 0.55;
    controls.enablePan = false;
    controlsRef.current = controls;

    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const dir = new THREE.DirectionalLight(0xffffff, 0.2);
    dir.position.set(0, 12, 0);
    dir.castShadow = true;
    dir.shadow.mapSize.width = dir.shadow.mapSize.height = 2048;
    dir.shadow.camera.near = 0.5;
    dir.shadow.camera.far = 50;
    dir.shadow.camera.left = -15;
    dir.shadow.camera.right = 15;
    dir.shadow.camera.top = 15;
    dir.shadow.camera.bottom = -15;
    scene.add(dir);

    floorMatRef.current = null;
    wallMatsRef.current = [];
    originalFloorSnapRef.current = null;
    originalWallSnapsRef.current = [];

    const builder = sceneBuilders[sceneKey] || buildLivingRoomScene;

    const refs = builder({
      scene,
      onFloorMaterialReady: (mat) => {
        floorMatRef.current = mat;
        originalFloorSnapRef.current = {
          map: mat.map ?? null,
          transparent: mat.transparent,
          opacity: mat.opacity,
          wrapS: mat.map?.wrapS,
          wrapT: mat.map?.wrapT,
          repeat: mat.map ? mat.map.repeat.clone() : undefined,
          offset: mat.map ? mat.map.offset.clone() : undefined,
          center: mat.map ? mat.map.center.clone() : undefined,
          rotation: mat.map?.rotation,
        };
      },
      
      onWallMaterialsReady: (mats) => {
  wallMatsRef.current = mats;
  originalWallSnapsRef.current = mats.map((m) => ({
    map: m.map ?? null,
    transparent: m.transparent,
    opacity: m.opacity,
    wrapS: m.map?.wrapS,
    wrapT: m.map?.wrapT,
    repeat: m.map ? m.map.repeat.clone() : undefined,
    offset: m.map ? m.map.offset.clone() : undefined,
    center: m.map ? m.map.center.clone() : undefined,
    rotation: m.map?.rotation,
  }));
},
    });

    const allRefs = refs as AnyRoomRefs | undefined;
    bedroomRefsRef.current = null;
    kitchenRefsRef.current = null;
    bathroomRefsRef.current = null;
    livingRoomRefsRef.current = null;

    if (allRefs && "leftLampLight" in allRefs) {
      bedroomRefsRef.current = allRefs as BedroomRefs;
      movablesRef.current = (allRefs as any).movables ?? [];
    } else if (allRefs && "floorLampLight" in allRefs) {
      livingRoomRefsRef.current = allRefs as LivingRoomRefs;
      movablesRef.current = (allRefs as any).movables ?? [];
    } else if (allRefs && "tubeLight1" in allRefs && sceneKey.includes("kitchen")) {
      kitchenRefsRef.current = allRefs as KitchenRefs;
      movablesRef.current = (allRefs as any).movables ?? [];
    } else if (allRefs && "tubeLight1" in allRefs) {
      bathroomRefsRef.current = allRefs as BathroomRefs;
      movablesRef.current = (allRefs as any).movables ?? [];
    }

    const onResize = () => {
      const { w, h } = getSize();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);
    onResize();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && canvas.parentElement) {
      ro = new ResizeObserver(onResize);
      ro.observe(canvas.parentElement);
    }

    const ROOM_X = 8.5,
      ROOM_Z_MIN = -6.5,
      ROOM_Z_MAX = 6.5,
      ROOM_Y_MIN = 0.5,
      ROOM_Y_MAX = 6.8;
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      controls.update();
      // Smooth furniture drag
if (furnitureDragging.current && selectedFurniture.current) {
  const obj = selectedFurniture.current;
  if (obj.userData.targetX !== undefined) {
    const dist = Math.hypot(
      obj.position.x - obj.userData.targetX,
      obj.position.z - obj.userData.targetZ
    );
    const t = THREE.MathUtils.clamp(dist * 0.18, 0.18, 0.40);
    obj.position.x += (obj.userData.targetX - obj.position.x) * t;
    obj.position.z += (obj.userData.targetZ - obj.position.z) * t;
  }
}
      camera.position.x = Math.max(-ROOM_X, Math.min(ROOM_X, camera.position.x));
      camera.position.z = Math.max(
        ROOM_Z_MIN,
        Math.min(ROOM_Z_MAX, camera.position.z)
      );
      camera.position.y = Math.max(
        ROOM_Y_MIN,
        Math.min(ROOM_Y_MAX, camera.position.y)
      );
      if (selectedFurniture.current) refreshHandles();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener("resize", onResize);
      ro?.disconnect();
      cancelAnimationFrame(frameId);
      renderer.dispose();
      controls.dispose();
      sceneRef.current =
        rendererRef.current =
        controlsRef.current =
        cameraRef.current =
          null;
    };
  }, [refreshHandles, sceneKey]);

  const decode3DDesignData = (encoded: string): Saved3DDesignPayload => {
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const decoded = new TextDecoder("utf-8").decode(bytes);
    return JSON.parse(decoded);
  };

  const applyTileToMat = useCallback(
    (mat: THREE.MeshStandardMaterial, tile: AppliedTile, surface: "wall" | "floor") => {
      if (!tile?.image) return;
      const [rx, ry] = getRepeat(tile.size ?? null, surface);
      const url = resolveAssetUrl(tile.image);
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin("anonymous");
      loader.load(
        url,
        (base) => {
          base.colorSpace = THREE.SRGBColorSpace;
          applyTexToMat(mat, buildTexture(base, rx, ry));
        },
        () => {},
        () => {
          // ignore
        }
      );
    },
    [applyTexToMat, buildTexture]
  );

  const apply3DSavedPayload = useCallback(
    (payload: Saved3DDesignPayload) => {
      if (!payload || typeof payload !== "object") return;

      const rotationDeg = Number(payload.rotationDeg ?? 0);
      if (!isNaN(rotationDeg)) {
        tileRotationRef.current = rotationDeg;
        localStorage.setItem("tile_rotation_deg", String(rotationDeg));
      }

      const wallBySurface = (payload.wallBySurface ?? {}) as Partial<
        Record<WallTarget, AppliedTile>
      >;
      const floorTile = (payload.floorTile ?? null) as AppliedTile | null;
      const wallTiles = (payload.wallTiles ?? []) as AppliedTile[];
      const floorTiles = (payload.floorTiles ?? []) as AppliedTile[];

      if (wallTiles.length) setAppliedWallTiles(wallTiles);
      if (floorTiles.length) setAppliedFloorTiles(floorTiles);
      if (wallBySurface && typeof wallBySurface === "object")
        setAppliedWallBySurface(wallBySurface);

      const floorMat = floorMatRef.current;
      if (floorMat && floorTile) {
        applyTileToMat(floorMat, floorTile, "floor");
      } else if (floorMat && floorTiles[0]) {
        applyTileToMat(floorMat, floorTiles[0], "floor");
      }

      const mats = wallMatsRef.current;
      const applyWallMat = (wall: WallTarget, idx: number) => {
        const t = wallBySurface?.[wall];
        if (!t || !mats[idx]) return;
        applyTileToMat(mats[idx], t, "wall");
      };

      applyWallMat(SURFACE_NAMES.wallBack, 0);
      applyWallMat(SURFACE_NAMES.wallLeft, 1);
      applyWallMat(SURFACE_NAMES.wallRight, 2);
    },
    [applyTileToMat]
  );

  useEffect(() => {
    const applyEncodedWhenReady = (encoded: string) => {
      let attempts = 0;
      const tryApply = () => {
        attempts += 1;
        if (attempts > 60) return;
        if (!floorMatRef.current || wallMatsRef.current.length < 3) {
          setTimeout(tryApply, 250);
          return;
        }
        try {
          const payload = decode3DDesignData(encoded);
          apply3DSavedPayload(payload);
        } catch {
          // ignore
        }
      };
      tryApply();
    };

    const encoded = localStorage.getItem("visualizer_3d_design_hash");
    if (encoded) applyEncodedWhenReady(encoded);

    const onDesign = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail) {
        apply3DSavedPayload(detail);
        return;
      }
      const stored = localStorage.getItem("visualizer_3d_design_hash");
      if (stored) applyEncodedWhenReady(stored);
    };

    window.addEventListener("visualizer-3d-design", onDesign as EventListener);
    return () => {
      window.removeEventListener("visualizer-3d-design", onDesign as EventListener);
    };
  }, [apply3DSavedPayload]);

  // ── Attach scale-handle pointerdown ──────────────────────────────────────
  useEffect(() => {
    (Object.entries(handleElsRef.current) as [Corner, HTMLDivElement | null][]).forEach(
      ([corner, el]) => {
        if (!el) return;
        el.addEventListener("pointerdown", (e: PointerEvent) => {
          const sel = selectedFurniture.current;
          if (!sel) return;
          handleDragRef.current = {
            corner,
            scaleStart: sel.scale.clone(),
            mouseX: e.clientX,
            mouseY: e.clientY,
          };
        //   handleDragRef.current = {
        //   corner,
        //   scaleStart: sel.scale.x,
        //   mouseX: e.clientX,
        //   mouseY: e.clientY,
        // };
                  e.stopPropagation();
          e.preventDefault();
        });
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Light toggles ─────────────────────────────────────────────────────────
  // const toggleLamp = useCallback((lampName: string) => {
  //   const refs = bedroomRefsRef.current;
  //   if (!refs) return;
  //   const isLeft = lampName === LAMP_NAMES.leftShade;
  //   const light = isLeft ? refs.leftLampLight : refs.rightLampLight;
  //   const shadeMat = isLeft ? refs.leftShadeMat : refs.rightShadeMat;
  //   const turningOn = light.intensity === 0;
  //   light.intensity = turningOn ? 12 : 0;
  //   shadeMat.emissiveIntensity = turningOn ? 1.0 : 0.0;
  //   shadeMat.needsUpdate = true;
  //   const bothOff =
  //     refs.leftLampLight.intensity === 0 && refs.rightLampLight.intensity === 0;
  //   refs.ambientLight.intensity = bothOff ? 0.25 : 0.5;
  //   refs.hemisphereLight.intensity = bothOff ? 0.3 : 0.6;
  // }, []);
  const toggleLamp = useCallback((lampName: string) => {
    const refs = bedroomRefsRef.current;
    if (!refs) return;

    // Tube light click — delegate to handleLightClick
    if (refs.handleLightClick(lampName)) {
      const allOff =
        refs.leftLampLight.intensity  === 0 &&
        refs.rightLampLight.intensity === 0 &&
        refs.tubeLight1.intensity     === 0 &&
        refs.tubeLight2.intensity     === 0;
      refs.ambientLight.intensity    = allOff ? 0.25 : 1.2;
      refs.hemisphereLight.intensity = allOff ? 0.3  : 1.0;
      return;
    }

    // Bedside lamp click
    const isLeft   = lampName === LAMP_NAMES.leftShade;
    const light    = isLeft ? refs.leftLampLight : refs.rightLampLight;
    const shadeMat = isLeft ? refs.leftShadeMat  : refs.rightShadeMat;
    const turningOn = light.intensity === 0;
    light.intensity            = turningOn ? 12  : 0;
    shadeMat.emissiveIntensity = turningOn ? 1.0 : 0.0;
    shadeMat.needsUpdate = true;
    const allOff =
      refs.leftLampLight.intensity  === 0 &&
      refs.rightLampLight.intensity === 0 &&
      refs.tubeLight1.intensity     === 0 &&
      refs.tubeLight2.intensity     === 0;
    refs.ambientLight.intensity    = allOff ? 0.25 : 1.2;
    refs.hemisphereLight.intensity = allOff ? 0.3  : 1.0;
  }, []);

  // const toggleTubeLight = useCallback((tubeName: string) => {
  //   const refs = kitchenRefsRef.current ?? bathroomRefsRef.current;
  //   if (!refs) return;
  //   const isFirst =
  //     tubeName === KIT_TUBE_NAMES.tube1 || tubeName === BATH_TUBE_NAMES.tube1;
  //   const light = isFirst ? refs.tubeLight1 : refs.tubeLight2;
  //   const tubeMat = isFirst ? refs.tubeMat1 : refs.tubeMat2;
  //   const turningOn = light.intensity === 0;
  //   light.intensity = turningOn ? 18 : 0;
  //   tubeMat.emissiveIntensity = turningOn ? 2.5 : 0.0;
  //   tubeMat.needsUpdate = true;
  //   const bothOff =
  //     refs.tubeLight1.intensity === 0 && refs.tubeLight2.intensity === 0;
  //   refs.ambientLight.intensity = bothOff ? 0.15 : 0.35;
  //   refs.hemisphereLight.intensity = bothOff ? 0.2 : 0.45;
  // }, []);
  const toggleTubeLight = useCallback((lightName: string) => {
    const refs = kitchenRefsRef.current ?? bathroomRefsRef.current;
    if (!refs) return;
    refs.handleLightClick(lightName);
    const allOff =
      refs.tubeLight1.intensity === 0 && refs.tubeLight2.intensity === 0;
    refs.ambientLight.intensity    = allOff ? 0.15 : 0.6;
    refs.hemisphereLight.intensity = allOff ? 0.2  : 0.5;
  }, []);

  // const toggleLivingLight = useCallback((lightName: string) => {
  //   const refs = livingRoomRefsRef.current;
  //   if (!refs) return;
  //   if (
  //     lightName === LIVING_LIGHT_NAMES.tubeLight1 ||
  //     lightName === LIVING_LIGHT_NAMES.tubeLight2
  //   ) {
  //     const isFirst = lightName === LIVING_LIGHT_NAMES.tubeLight1;
  //     const light = isFirst ? refs.tubeLight1 : refs.tubeLight2;
  //     const mat = isFirst ? refs.tubeMat1 : refs.tubeMat2;
  //     const turningOn = light.intensity === 0;
  //     light.intensity = turningOn ? 22 : 0;
  //     mat.emissiveIntensity = turningOn ? 2.5 : 0.0;
  //     mat.needsUpdate = true;
  //   } else if (lightName === LIVING_LIGHT_NAMES.floorShade) {
  //     const turningOn = refs.floorLampLight.intensity === 0;
  //     refs.floorLampLight.intensity = turningOn ? 12 : 0;
  //     refs.floorShadeMat.emissiveIntensity = turningOn ? 1.0 : 0.0;
  //     refs.floorShadeMat.needsUpdate = true;
  //   } else if (lightName === LIVING_LIGHT_NAMES.pendantShade) {
  //     const turningOn = refs.pendantLight.intensity === 0;
  //     refs.pendantLight.intensity = turningOn ? 15 : 0;
  //     refs.pendantShadeMat.emissiveIntensity = turningOn ? 0.6 : 0.0;
  //     refs.pendantShadeMat.needsUpdate = true;
  //   }
  //   const allOff =
  //     refs.floorLampLight.intensity === 0 &&
  //     refs.pendantLight.intensity === 0 &&
  //     refs.tubeLight1.intensity === 0 &&
  //     refs.tubeLight2.intensity === 0;
  //   refs.ambientLight.intensity = allOff ? 0.1 : 0.5;
  //   refs.hemisphereLight.intensity = allOff ? 0.2 : 0.7;
  // }, []);
//   const toggleLivingLight = useCallback((lightName: string) => {
//   const refs = livingRoomRefsRef.current;
//   if (!refs) return;
//   // Delegate entirely to the scene's own handler which tracks state correctly
//   refs.handleLightClick(lightName);
//   // Sync ambient/hemisphere after any toggle
//   const allOff =
//     refs.floorLampLight.intensity === 0 &&
//     refs.pendantLight.intensity === 0 &&
//     refs.tubeLight1.intensity === 0 &&
//     refs.tubeLight2.intensity === 0;
//   refs.ambientLight.intensity = allOff ? 0.1 : 0.5;
//   refs.hemisphereLight.intensity = allOff ? 0.2 : 0.7;
// }, []);
const toggleLivingLight = useCallback((lightName: string) => {
    const refs = livingRoomRefsRef.current;
    if (!refs) return;
    refs.handleLightClick(lightName);
    const allOff =
      refs.floorLampLight.intensity === 0 &&
      refs.pendantLight.intensity   === 0 &&
      refs.tubeLight1.intensity     === 0 &&
      refs.tubeLight2.intensity     === 0;
    refs.ambientLight.intensity    = allOff ? 0.0 : 1.2;
    refs.hemisphereLight.intensity = allOff ? 0.0 : 1.0;
  }, []);
  // ── NDC + Raycast helpers ─────────────────────────────────────────────────
  const getNDC = (e: React.MouseEvent): THREE.Vector2 => {
    const r = canvasRef.current!.getBoundingClientRect();
    return new THREE.Vector2(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      -((e.clientY - r.top) / r.height) * 2 + 1
    );
  };

  const raycastWallHit = (ndc: THREE.Vector2, wallName: string): THREE.Vector3 | null => {
    if (!cameraRef.current || !sceneRef.current) return null;
    raycasterRef.current.setFromCamera(ndc, cameraRef.current);
    const mesh = sceneRef.current.getObjectByName(wallName);
    if (!mesh) return null;
    const hits = raycasterRef.current.intersectObject(mesh);
    return hits.length > 0 ? hits[0].point.clone() : null;
  };

  const raycastAnyWall = (ndc: THREE.Vector2): THREE.Object3D | null => {
    if (!cameraRef.current || !sceneRef.current) return null;
    raycasterRef.current.setFromCamera(ndc, cameraRef.current);
    const walls = ([SURFACE_NAMES.wallBack, SURFACE_NAMES.wallLeft, SURFACE_NAMES.wallRight] as string[])
      .map((n) => sceneRef.current!.getObjectByName(n))
      .filter(Boolean) as THREE.Object3D[];
    const hits = raycasterRef.current.intersectObjects(walls);
    return hits.length > 0 ? hits[0].object : null;
  };

  const findLightName = (obj: THREE.Object3D, names: string[]): string | null => {
    let cur: THREE.Object3D | null = obj;
    while (cur) {
      if (names.includes(cur.name)) return cur.name;
      cur = cur.parent;
    }
    return null;
  };

  const raycastLamp = (ndc: THREE.Vector2): string | null => {
    if (!cameraRef.current || !sceneRef.current) return null;
    raycasterRef.current.setFromCamera(ndc, cameraRef.current);
    const targetNames: string[] = [];
    //if (bedroomRefsRef.current) targetNames.push(LAMP_NAMES.leftShade, LAMP_NAMES.rightShade);
    if (bedroomRefsRef.current) targetNames.push(
      LAMP_NAMES.leftShade,
      LAMP_NAMES.rightShade,
      BED_TUBE_NAMES.tube1,
      BED_TUBE_NAMES.tube2,
    );
    if (kitchenRefsRef.current) targetNames.push(KIT_TUBE_NAMES.tube1, KIT_TUBE_NAMES.tube2);
    if (bathroomRefsRef.current) targetNames.push(BATH_TUBE_NAMES.tube1, BATH_TUBE_NAMES.tube2);
    if (livingRoomRefsRef.current)
      targetNames.push(
        LIVING_LIGHT_NAMES.floorShade,
        LIVING_LIGHT_NAMES.pendantShade,
        LIVING_LIGHT_NAMES.tubeLight1,
        LIVING_LIGHT_NAMES.tubeLight2
      );
    if (targetNames.length === 0) return null;
    const targets = targetNames
      .map((n) => sceneRef.current!.getObjectByName(n))
      .filter(Boolean) as THREE.Object3D[];
    if (targets.length === 0) return null;
    const hits = raycasterRef.current.intersectObjects(targets, false);
    if (hits.length === 0) return null;
    return findLightName(hits[0].object, targetNames);
  };

  // ── Canvas events ─────────────────────────────────────────────────────────
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (handleDragRef.current) {
        const hd = handleDragRef.current;
        const sel = selectedFurniture.current;
        if (!sel) return;
        const dx = e.clientX - hd.mouseX;
        const dy = e.clientY - hd.mouseY;
        const sgnX = hd.corner === "tr" || hd.corner === "br" ? 1 : -1;
        const sgnY = hd.corner === "tl" || hd.corner === "tr" ? -1 : 1;
        sel.scale.x = Math.max(
          0.2,
          Math.min(3.5, hd.scaleStart.x * (1 + sgnX * dx * 0.004))
        );
        sel.scale.z = Math.max(
          0.2,
          Math.min(3.5, hd.scaleStart.z * (1 + sgnX * dx * 0.004))
        );
        sel.scale.y = Math.max(
          0.2,
          Math.min(3.5, hd.scaleStart.y * (1 + sgnY * dy * 0.004))
        );
        syncFurnitureOutline();
        return;
      }
      if (furnitureDragging.current && selectedFurniture.current) {
        const fp = getFloorPoint(e);
        const start = furnitureDragFloorStart.current;
        const objStart = furnitureDragObjStart.current;
        if (!fp || !start || !objStart) return;
        const sceneKey = (
          localStorage.getItem("selected_3d_sub_scene") || "living_room"
        ).toLowerCase();
        const bounds = sceneKey.includes("bathroom")
          ? { x: 5.2, z: 3.8 }
          : sceneKey.includes("bedroom")
          ? { x: 6.2, z: 5.2 }
          : sceneKey.includes("kitchen")
          ? { x: 7.2, z: 6.2 }
          : { x: 9.2, z: 7.2 };
        const newX = objStart.x + fp.x - start.x;
        const newZ = objStart.z + fp.z - start.z;
        // selectedFurniture.current.position.x = Math.max(
        //   -bounds.x,
        //   Math.min(bounds.x, newX)
        // );
        // selectedFurniture.current.position.z = Math.max(
        //   -bounds.z,
        //   Math.min(bounds.z, newZ)
        // );
        const clampedX = Math.max(-bounds.x, Math.min(bounds.x, newX));
const clampedZ = Math.max(-bounds.z, Math.min(bounds.z, newZ));
// Store target, lerp in animation loop
selectedFurniture.current.userData.targetX = clampedX;
selectedFurniture.current.userData.targetZ = clampedZ;
        syncFurnitureOutline();
        return;
      }
      const m = modeRef.current;
      if (m === "pick-wall" || m === "draw-area") {
        const hit = raycastAnyWall(getNDC(e));
        setHoveredWall(hit ? hit.name : null);
        if (canvasRef.current)
          canvasRef.current.style.cursor = hit ? "pointer" : "crosshair";
        return;
      }
      if (m === "draw-area-dragging") {
        const wall = areaWallRef.current;
        const p1 = drawStartHitRef.current;
        if (!wall || !p1 || !sceneRef.current) return;
        const pt = raycastWallHit(getNDC(e), wall);
        if (!pt) return;
        const isBack = wall === SURFACE_NAMES.wallBack;
        const cx = (p1.x + pt.x) / 2,
          cy = (p1.y + pt.y) / 2,
          cz = (p1.z + pt.z) / 2;
        const w = Math.max(Math.abs(isBack ? pt.x - p1.x : pt.z - p1.z), 0.01);
        const h = Math.max(Math.abs(pt.y - p1.y), 0.01);
        const wallMesh = sceneRef.current.getObjectByName(wall);
        const wallPos = wallMesh ? (wallMesh as THREE.Mesh).position : new THREE.Vector3();
        if (!previewBoxRef.current) {
          const geo = new THREE.PlaneGeometry(1, 1);
          const mat = new THREE.MeshBasicMaterial({
            color: 0xf59e0b,
            transparent: true,
            opacity: 0.12,
            side: THREE.DoubleSide,
            depthWrite: false,
          });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.renderOrder = 2;
          sceneRef.current.add(mesh);
          previewBoxRef.current = mesh;
          const edgeGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(1, 1));
          const outline = new THREE.LineSegments(
            edgeGeo,
            new THREE.LineBasicMaterial({
              color: 0xffffff,
              transparent: true,
              opacity: 0.85,
            })
          );
          outline.renderOrder = 3;
          outline.name = "preview_outline";
          mesh.add(outline);
        }
        const OFFSET = 0.014;
        previewBoxRef.current.scale.set(w, h, 1);
        if (isBack) {
          previewBoxRef.current.rotation.set(0, 0, 0);
          previewBoxRef.current.position.set(cx, cy, wallPos.z + OFFSET);
        } else if (wall === SURFACE_NAMES.wallLeft) {
          previewBoxRef.current.rotation.set(0, Math.PI / 2, 0);
          previewBoxRef.current.position.set(wallPos.x + OFFSET, cy, cz);
        } else {
          previewBoxRef.current.rotation.set(0, -Math.PI / 2, 0);
          previewBoxRef.current.position.set(wallPos.x - OFFSET, cy, cz);
        }
        return;
      }
      if (m === "orbit" && canvasRef.current)
        canvasRef.current.style.cursor = "grab";
    },
    [syncFurnitureOutline, getFloorPoint]
  );


  // const handleMouseDown = useCallback(
  //   (e: React.MouseEvent) => {
  //     const m = modeRef.current;
  //     mouseDownPosRef.current = { x: e.clientX, y: e.clientY };

  //     if (m === "orbit") {
  //       const hit = hitMovable(e);
  //       if (hit) {
  //         if (hit !== selectedFurniture.current) selectFurniture(hit);
  //         const objY = hit.position.y;
  //         furnitureDragging.current = true;
  //         furnitureDragFloorStart.current = getFloorPoint(e, objY);
  //         furnitureDragObjStart.current = hit.position.clone();
  //         e.stopPropagation();
  //         return;
  //       }
  //       if (selectedFurniture.current) deselectFurniture();
  //     }

  //     if (m === "draw-area") {
  //       const hit = raycastAnyWall(getNDC(e));
  //       if (!hit) return;
  //       const wall = hit.name as WallTarget;
  //       const pt = raycastWallHit(getNDC(e), wall);
  //       if (!pt) return;
  //       areaWallRef.current = wall;
  //       drawStartHitRef.current = pt;
  //       setAreaWallChosen(wall);
  //       modeRef.current = "draw-area-dragging";
  //       setMode("draw-area-dragging");
  //       e.stopPropagation();
  //     }
  //   },
  //   [hitMovable, getFloorPoint, deselectFurniture, selectFurniture]
  // );

  const handleMouseDown = useCallback(
  (e: React.MouseEvent) => {
    const m = modeRef.current;
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };

    // Only drag if furniture is already selected and clicking on it
    if (m === "orbit" && selectedFurniture.current) {
      const hit = hitMovable(e);
      if (hit && hit === selectedFurniture.current) {
        furnitureDragging.current = true;
        hit.traverse((c) => {
  const m = (c as THREE.Mesh).material as THREE.MeshStandardMaterial;
  if (m?.emissive) m.emissive.set(0x333333);
});
        const objY = hit.position.y;
        // furnitureDragFloorStart.current = getFloorPoint(e, objY);
        // furnitureDragObjStart.current = hit.position.clone();
        // Camera-facing plane through the exact click point — no depth mismatch
const planeNormal = new THREE.Vector3();
cameraRef.current!.getWorldDirection(planeNormal).negate();
floorPlaneRef.current.setFromNormalAndCoplanarPoint(planeNormal, hit.position);
furnitureDragFloorStart.current = getFloorPoint(e, objY);
furnitureDragObjStart.current = hit.position.clone();
if (canvasRef.current) canvasRef.current.style.cursor = "grabbing"; 
        e.stopPropagation();
        return;
      }
    }

    if (m === "draw-area") {
      const hit = raycastAnyWall(getNDC(e));
      if (!hit) return;
      const wall = hit.name as WallTarget;
      const pt = raycastWallHit(getNDC(e), wall);
      if (!pt) return;
      areaWallRef.current = wall;
      drawStartHitRef.current = pt;
      setAreaWallChosen(wall);
      modeRef.current = "draw-area-dragging";
      setMode("draw-area-dragging");
      e.stopPropagation();
    }
  },
  [hitMovable, getFloorPoint, selectFurniture]
);
  // const handleMouseUp = useCallback(
  //   (e: React.MouseEvent) => {
  //     const m = modeRef.current;
  //     if (furnitureDragging.current) {
  //       furnitureDragging.current = false;
  //       furnitureDragFloorStart.current = null;
  //       return;
  //     }
  //     if (handleDragRef.current) {
  //       handleDragRef.current = null;
  //       return;
  //     }
  //     if (m === "pick-wall") {
  //       const hit = raycastAnyWall(getNDC(e));
  //       if (hit && selectedTileRef.current) {
  //         applyWall(hit.name);
  //         setMode("orbit");
  //         setHoveredWall(null);
  //         if (canvasRef.current) canvasRef.current.style.cursor = "grab";
  //       }
  //       return;
  //     }
  //     if (m === "orbit") {
  //       const down = mouseDownPosRef.current;
  //       const moved = down ? Math.hypot(e.clientX - down.x, e.clientY - down.y) : 999;
  //       if (moved < 5) {
  //         const lightName = raycastLamp(getNDC(e));
  //         if (lightName) {
  //           if (bedroomRefsRef.current) toggleLamp(lightName);
  //           else if (livingRoomRefsRef.current) toggleLivingLight(lightName);
  //           else toggleTubeLight(lightName);
  //           return;
  //         }
  //       }
  //     }
  //     if (m === "draw-area-dragging") {
  //       const wall = areaWallRef.current;
  //       const p1 = drawStartHitRef.current;
  //       clearPreviewBox();
  //       if (wall && p1) {
  //         const pt = raycastWallHit(getNDC(e), wall);
  //         if (pt) {
  //           const isBack = wall === SURFACE_NAMES.wallBack;
  //           const hSize = Math.abs(isBack ? pt.x - p1.x : pt.z - p1.z);
  //           const vSize = Math.abs(pt.y - p1.y);
  //           if (hSize > 0.2 && vSize > 0.2) {
  //             setPendingAreaData({ wall, p1, p2: pt });
  //             setAreaConfirmPending(true);
  //             return;
  //           }
  //         }
  //       }
  //       drawStartHitRef.current = null;
  //       modeRef.current = "draw-area";
  //       setMode("draw-area");
  //     }
  //   },
  //   [applyWall, clearPreviewBox, toggleLamp, toggleTubeLight, toggleLivingLight]
  // );

  const handleMouseUp = useCallback(
  (e: React.MouseEvent) => {
    const m = modeRef.current;

    if (furnitureDragging.current) {
      furnitureDragging.current = false;
      selectedFurniture.current?.traverse((c) => {
  const m = (c as THREE.Mesh).material as THREE.MeshStandardMaterial;
  if (m?.emissive) m.emissive.set(0x000000);
});
      furnitureDragFloorStart.current = null;
      if (canvasRef.current) canvasRef.current.style.cursor = "grab"; 
        const down = mouseDownPosRef.current;
  const moved = down ? Math.hypot(e.clientX - down.x, e.clientY - down.y) : 999;
  if (moved < 5) {
    const lightName = raycastLamp(getNDC(e));
    if (lightName) {
      if (bedroomRefsRef.current) toggleLamp(lightName);
      else if (livingRoomRefsRef.current) toggleLivingLight(lightName);
      else toggleTubeLight(lightName);
    }
  }

      return;
    }
    if (handleDragRef.current) {
      handleDragRef.current = null;
      return;
    }
    if (m === "pick-wall") {
      const hit = raycastAnyWall(getNDC(e));
      if (hit && selectedTileRef.current) {
        applyWall(hit.name);
        setMode("orbit");
        setHoveredWall(null);
        if (canvasRef.current) canvasRef.current.style.cursor = "grab";
      }
      return;
    }

    // Single click → lights only
    if (m === "orbit") {
      const down = mouseDownPosRef.current;
      const moved = down ? Math.hypot(e.clientX - down.x, e.clientY - down.y) : 999;
      if (moved < 5) {
        const lightName = raycastLamp(getNDC(e));
        if (lightName) {
          if (bedroomRefsRef.current) toggleLamp(lightName);
          else if (livingRoomRefsRef.current) toggleLivingLight(lightName);
          else toggleTubeLight(lightName);
          return;
        }
      }
    }

    // Area draw — immediately apply tile on mouse up, no popup
    if (m === "draw-area-dragging") {
      const wall = areaWallRef.current;
      const p1 = drawStartHitRef.current;
      clearPreviewBox();
      if (wall && p1) {
        const pt = raycastWallHit(getNDC(e), wall);
        if (pt) {
          const isBack = wall === SURFACE_NAMES.wallBack;
          const hSize = Math.abs(isBack ? pt.x - p1.x : pt.z - p1.z);
          const vSize = Math.abs(pt.y - p1.y);
          if (hSize > 0.2 && vSize > 0.2) {
            // Directly apply — no popup
            applyAreaTileOnWall(wall, p1, pt);
          }
        }
      }
      drawStartHitRef.current = null;
      areaWallRef.current = null;
      setAreaWallChosen(null);
      modeRef.current = "draw-area";
      setMode("draw-area");
    }
  },
  [applyWall, clearPreviewBox, toggleLamp, toggleTubeLight, toggleLivingLight, applyAreaTileOnWall]
);
  //const handleDoubleClick = useCallback((_e: React.MouseEvent) => {}, []);
const handleDoubleClick = useCallback(
  (e: React.MouseEvent) => {
    if (modeRef.current !== "orbit") return;

    const hit = hitMovable(e);
    if (hit) {
      if (hit === selectedFurniture.current) {
        deselectFurniture(); // double-click selected furniture → deselect
      } else {
        selectFurniture(hit); // double-click new furniture → select
      }
      return;
    }
    // Double-click empty space → deselect
    if (selectedFurniture.current) deselectFurniture();
  },
  [hitMovable, selectFurniture, deselectFurniture]
);
  const confirmAreaTile = useCallback(() => {
    if (!pendingAreaData) return;
    applyAreaTileOnWall(pendingAreaData.wall, pendingAreaData.p1, pendingAreaData.p2);
    setPendingAreaData(null);
    setAreaConfirmPending(false);
    areaWallRef.current = null;
    drawStartHitRef.current = null;
    setAreaWallChosen(null);
    setMode("orbit");
    modeRef.current = "orbit";
  }, [pendingAreaData, applyAreaTileOnWall]);

  const cancelArea = useCallback(() => {
    clearPreviewBox();
    setPendingAreaData(null);
    setAreaConfirmPending(false);
    areaWallRef.current = null;
    drawStartHitRef.current = null;
    setAreaWallChosen(null);
    setMode("orbit");
    modeRef.current = "orbit";
    setHoveredWall(null);
  }, [clearPreviewBox]);

  useEffect(() => {
    if (!controlsRef.current) return;
    controlsRef.current.enabled = mode === "orbit" && !selectedFurniture.current;
  }, [mode]);

  const handleEsc = useCallback(() => {
    if (activModal) {
      setActivModal(null);
      return;
    }
    if (isProductInfoOpen) {
      setIsProductInfoOpen(false);
      return;
    }
    if (selectedFurniture.current) {
      deselectFurniture();
      return;
    }
    if (mode !== "orbit") {
      clearPreviewBox();
      setMode("orbit");
      modeRef.current = "orbit";
      setHoveredWall(null);
      setAreaWallChosen(null);
      setAreaConfirmPending(false);
      setPendingAreaData(null);
      areaWallRef.current = null;
      drawStartHitRef.current = null;
    }
  }, [mode, clearPreviewBox, deselectFurniture, isProductInfoOpen, activModal]);

  const resizeRenderer = useCallback(() => {
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    const canvas = canvasRef.current;
    if (!camera || !renderer || !canvas) return;
    const inFS = !!document.fullscreenElement;
    const w = inFS ? window.innerWidth : canvas.parentElement?.clientWidth ?? window.innerWidth;
    const h = inFS ? window.innerHeight : canvas.parentElement?.clientHeight ?? window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(resizeRenderer, 50);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [resizeRenderer]);

  const activeProductTiles = productInfoTab === "wall" ? appliedWallTiles : appliedFloorTiles;

  // ─── UI ──────────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#F9F7F2] overflow-hidden">
      <LegacySidebar3D
        onClear={clearAllTiles}
        onSelectRoom={handleSelectRoom}
        onProductInfo={handleProductInfo}
        onSave={() => setActivModal("save")}
        onPrint={handlePrint}
        onEmail={() => setActivModal("mail")}
        onShare={handleShareImage}
        onFullscreen={toggleFullscreen}
      />

      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          cursor: mode === "orbit" ? "grab" : "crosshair",
        }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      />
      <div className="absolute inset-0 border border-white/10 pointer-events-none z-20" />

      

      {isApplying && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-5 text-white">
            <Loader2 className="w-14 h-14 animate-spin text-amber-400" />
            <p className="text-xl font-medium tracking-wide drop-shadow-md">
              Applying tiles{selectedTileSize ? ` (${selectedTileSize})` : ""}...
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full px-4">
          <div className="bg-gradient-to-r from-red-600 to-red-800 text-white px-6 py-4 rounded-xl shadow-2xl border border-red-400/30 text-sm flex items-center justify-between gap-4">
            {errorMessage}
            <button onClick={() => setErrorMessage(null)}>
              <X size={16} />
            </button>
          </div>
        </div>
      )}


      {mode === "pick-wall" && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md text-white px-6 py-3 rounded-full text-sm font-medium shadow-2xl border border-amber-500/30 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Click any wall to lay tiles · <span className="text-amber-400">Esc to cancel</span>
          </div>
        </div>
      )}

      {mode === "draw-area" && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md text-white px-6 py-3 rounded-full text-sm font-medium shadow-2xl border border-violet-500/30 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            Click on a wall, then drag to draw the highlight area · <span className="text-violet-400">Esc to cancel</span>
          </div>
        </div>
      )}

      {mode === "draw-area-dragging" && !areaConfirmPending && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md text-white px-6 py-3 rounded-full text-sm font-medium shadow-2xl border border-violet-500/40 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-violet-300 animate-pulse" />
            Drag to resize · release to confirm area on{" "}
            <span className="text-violet-300">{areaWallChosen ? WALL_LABELS[areaWallChosen] : "wall"}</span>
          </div>
        </div>
      )}

      {hoveredWall && (mode === "pick-wall" || mode === "draw-area") && (
        <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <div
            className={`text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg ${
              mode === "pick-wall" ? "bg-amber-500" : "bg-violet-500"
            }`}
          >
            {WALL_LABELS[hoveredWall] ?? "Wall"} —{" "}
            {mode === "pick-wall" ? "click to tile" : "click + drag to draw area"}
          </div>
        </div>
      )}

      {/* {areaConfirmPending && pendingAreaData && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 flex flex-col items-center gap-4 min-w-[280px]">
            <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center">
              <CheckSquare size={24} className="text-violet-500" />
            </div>
            <p className="text-slate-800 font-semibold text-sm text-center">Apply highlight tile to this area?</p>
            <p className="text-slate-500 text-xs text-center">
              Selected area on{" "}
              <span className="font-semibold text-slate-700">
                {WALL_LABELS[pendingAreaData.wall]}
              </span>
            </p>
            <div className="flex gap-3 w-full">
              <button onClick={cancelArea} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-all">
                Cancel
              </button>
              <button onClick={confirmAreaTile} className="flex-1 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-semibold hover:bg-violet-600 transition-all">
                Apply Tile
              </button>
            </div>
          </div>
        </div>
      )} */}

      {furnitureLabel && !areaConfirmPending && mode === "orbit" && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <div className="bg-amber-400/10 backdrop-blur-md border border-amber-400/30 text-amber-400 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full whitespace-nowrap">
            {furnitureLabel} · drag to move · corner handles to resize · Esc to deselect
          </div>
        </div>
      )}

      {(["tl", "tr", "bl", "br"] as Corner[]).map((c) => (
        <div
          key={c}
          ref={(el) => {
            handleElsRef.current[c] = el;
          }}
          className="absolute z-50 w-4 h-4 rounded-full bg-white border-2 border-amber-400 shadow-[0_0_0_3px_rgba(240,180,60,0.3)] -translate-x-1/2 -translate-y-1/2 hover:scale-125 hover:bg-amber-400 transition-transform"
          style={{
            display: "none",
            cursor:
              c === "tl"
                ? "nw-resize"
                : c === "tr"
                ? "ne-resize"
                : c === "bl"
                ? "sw-resize"
                : "se-resize",
            touchAction: "none",
          }}
        />
      ))}

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-end gap-3">
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[10px] text-white/60 uppercase tracking-widest font-medium">Floor</span>
          <button
            disabled={mode !== "orbit"}
            onClick={() => {
              setTargetSurface("floor");
              pendingAutoApplySurfaceRef.current = "floor";
              setSidebarOpen(true);
            }}
            className={`px-5 py-2.5 rounded-full text-xs uppercase tracking-wider font-semibold shadow-2xl border transition-all
              ${
                mode === "orbit"
                  ? "bg-slate-900/95 text-white border-emerald-500/40 hover:bg-emerald-700 hover:border-emerald-400"
                  : "bg-slate-900/50 text-white/30 border-slate-700 cursor-not-allowed"
              }`}
          >
            <span className="relative flex items-center gap-2">
              <Layers size={13} /> Entire Floor
            </span>
          </button>
        </div>

        <div className="w-px h-12 bg-white/10 self-center" />

        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[10px] text-white/60 uppercase tracking-widest font-medium">Wall</span>
          <button
            onClick={() => {
              if (mode === "pick-wall") {
                setMode("orbit");
                modeRef.current = "orbit";
                setHoveredWall(null);
                setSidebarOpen(false);
                if (canvasRef.current) canvasRef.current.style.cursor = "grab";
              } else {
                setTargetSurface("wall");
                setSidebarOpen(true);
                setMode("pick-wall");
                modeRef.current = "pick-wall";
              }
            }}
            className={`px-5 py-2.5 rounded-full text-xs uppercase tracking-wider font-semibold shadow-xl border transition-all
              ${
                mode === "pick-wall"
                  ? "bg-amber-500 text-white border-amber-400"
                  : "bg-slate-900/95 text-white border-amber-500/30 hover:bg-amber-700 hover:border-amber-400"
              }`}
          >
            {mode === "pick-wall" ? "✕ Cancel" : "Click Wall"}
          </button>
        </div>

        <div className="w-px h-12 bg-white/10 self-center" />

        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[10px] text-white/60 uppercase tracking-widest font-medium">Wall Area</span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (mode === "draw-area" || mode === "draw-area-dragging") {
                  cancelArea();
                } else {
                  setTargetSurface("wall");
                  setSidebarOpen(true);
                  setMode("draw-area");
                  modeRef.current = "draw-area";
                }
              }}
              className={`px-4 py-2.5 rounded-full text-xs uppercase tracking-wider font-semibold shadow-xl border transition-all
                ${
                  mode === "draw-area" || mode === "draw-area-dragging"
                    ? "bg-violet-500 text-white border-violet-400"
                    : "bg-slate-900/95 text-white border-violet-500/30 hover:bg-violet-700"
                }`}
            >
              <span className="flex items-center gap-2">
                <Square size={13} />
                {mode === "draw-area" || mode === "draw-area-dragging" ? "Cancel" : "Select Area"}
              </span>
            </button>

            {(Object.keys(hasAreaPatch) as WallTarget[]).filter((w) => hasAreaPatch[w]).map((w) => (
              <button
                key={w}
                onClick={() => clearAreaPatch(w)}
                className="px-3 py-2.5 rounded-full text-[10px] uppercase tracking-wider font-semibold shadow-xl border bg-slate-900/95 text-white border-rose-500/30 hover:bg-rose-700 transition-all"
              >
                Clear {WALL_LABELS[w]?.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isProductInfoOpen && (
        <div className="absolute inset-0 z-[80] flex items-start justify-center pt-[12vh] bg-black/30 backdrop-blur-sm" onClick={() => setIsProductInfoOpen(false)}>
          {/* <div className="w-[88vw] max-w-[900px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden" onClick={(e) => e.stopPropagation()}> */}
          <div className="w-[78vw] max-w-[650px] h-[80vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>

            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-[12px] font-black tracking-[0.2em] uppercase text-slate-800">Product Information</h3>
              <button onClick={() => setIsProductInfoOpen(false)} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50">
                <X size={16} />
              </button>
            </div>
            <div className="px-6 pt-4">
              <div className="flex gap-2 border-b border-slate-200">
                {(["wall", "floor"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setProductInfoTab(tab)}
                    className={`px-4 py-2 text-[11px] font-semibold rounded-t-lg border border-b-0 capitalize ${
                      productInfoTab === tab
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1" style={{ height: 'calc(80vh - 130px)' }}>
              {activeProductTiles.length === 0 ? (
                <div className="text-sm text-slate-500">No tiles applied to this surface yet.</div>
              ) : (
                <div className="space-y-4">
                  {activeProductTiles.map((tile, idx) => (
                    <div key={`${getTileKey(tile)}-${idx}`} className="flex gap-4 items-start border border-slate-100 rounded-xl p-3">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                        {tile.image ? (
                          <img src={getTileImageSrc(tile.image)} alt={tile.name ?? "Tile"} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">No image</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-800">{tile.name ?? "Tile"}</div>
                        {tile.size && <div className="text-xs text-slate-500 mt-1">Size: {tile.size}</div>}
                        {/* {tile.skuCode && <div className="text-xs text-slate-500 mt-1">SKU: {tile.skuCode}</div>} */}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      
      {activModal === "save" && (
        <div className="fixed inset-0 z-[9998]" onClick={() => setActivModal(null)}>
          <div className="save-options-panel active" onClick={(e) => e.stopPropagation()}>
            <button className="save-option" onClick={() => { handleSaveImage(); setActivModal(null); }}>
              <span className="save-icon fa fa-file-image-o" aria-hidden="true"></span>
              <span>Save Image</span>
            </button>
            <button className="save-option" onClick={() => { handleSavePDF(); setActivModal(null); }}>
              <span className="save-icon fa fa-file-pdf-o" aria-hidden="true"></span>
              <span>Save PDF</span>
            </button>
            <button className="save-option" onClick={() => { handleSaveForLater(); setActivModal(null); }}>
              <span className="save-icon fa fa-bookmark-o" aria-hidden="true"></span>
              <span>Save For Later</span>
            </button>
          </div>
        </div>
      )}



      
      {mailMounted && (
        <div
          className="absolute inset-0 z-[80] flex items-start justify-center pt-[5vh]"
          style={{
            background: "rgba(0,0,0,0.45)",
            opacity: mailOpen ? 1 : 0,
            transition: "opacity 600ms ease",
          }}
          onClick={() => setActivModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#f8fafc",
              borderRadius: "14px",
              width: "600px",
              maxWidth: "96vw",
              boxShadow: "0 12px 28px rgba(15, 23, 42, 0.28)",
              border: "1px solid #d7dde6",
              fontFamily: "'UbuntuM', sans-serif",
              overflow: "hidden",
              transform: mailOpen ? "translateY(0)" : "translateY(-28px)",
              opacity: mailOpen ? 1 : 0,
              transition: "transform 600ms ease, opacity 600ms ease",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14.5px 18px",
                borderBottom: "1px solid #e2e8f0",
                background: "#f8fafc",
                color: "#0f172a",
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Email
              </span>
              <button
                onClick={() => setActivModal(null)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "22px", color: "#0f172a", lineHeight: 1, fontWeight: 700 }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: "14.5px 15px", background: "#f8fafc" }}>
              {mailSent ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: "#16a34a", fontWeight: 700, fontSize: "14px" }}>
                  ✓ Email sent successfully!
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <input
                    type="text"
                    placeholder="Your Full Name"
                    value={mailForm.name}
                    onChange={(e) => setMailForm((p) => ({ ...p, name: e.target.value }))}
                    style={{ ...modalInputStyle, height: "34px" }}
                  />
                  <input
                    type="email"
                    placeholder="Recipient's Email Address"
                    value={mailForm.to}
                    onChange={(e) => setMailForm((p) => ({ ...p, to: e.target.value }))}
                    style={{ ...modalInputStyle, height: "34px" }}
                  />
                  <input
                    type="text"
                    placeholder="Subject"
                    value={mailForm.subject}
                    onChange={(e) => setMailForm((p) => ({ ...p, subject: e.target.value }))}
                    style={{ ...modalInputStyle, height: "34px" }}
                  />
                  <textarea
                    placeholder="Write your message here..."
                    rows={2}
                    value={mailForm.message}
                    onChange={(e) => setMailForm((p) => ({ ...p, message: e.target.value }))}
                    style={{ ...modalInputStyle, height: "auto", padding: "10px 12px", resize: "vertical", lineHeight: "1.5" }}
                  />
                </div>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 22px", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
              {!mailSent && (
                <button
                  onClick={handleMailSend}
                  disabled={mailSending}
                  style={{
                    background: "#f8fafc",
                    color: "#1e293b",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    padding: "6px 14px",
                    fontSize: "14px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    fontFamily: "'UbuntuM', sans-serif",
                    opacity: mailSending ? 0.6 : 1,
                    cursor: mailSending ? "not-allowed" : "pointer",
                  }}
                >
                  {mailSending ? "SENDING..." : "SEND"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
 

      <EscListener onEsc={handleEsc} />
    </div>
  );
}

function EscListener({ onEsc }: { onEsc: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEsc();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onEsc]);
  return null;
}
