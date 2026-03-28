
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { API_BASE } from "@/lib/constants";
import LegacySidebar3D from "./LegacySidebar3D"; // adjust path

import {
  buildBathroomScene,
  BathroomRefs,
  TUBE_LIGHT_NAMES as BATH_TUBE_NAMES,
} from "@/3d-scenes/bathroom";
import { buildBedroomScene, LAMP_NAMES, BedroomRefs } from "@/3d-scenes/bedroom";
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

const IMAGE_PROXY_URL = "/api/tile-image?url=";

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
  onWallMaterialsReady: (mats: THREE.MeshStandardMaterial[]) => void;
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
};

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
  width: "100%", height: "42px", border: "1px solid #d1d9e0", borderRadius: "6px",
  padding: "0 14px", fontSize: "14px", color: "#0f172a", background: "#fff",
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
};
 
 
export default function Preview3D() {
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

  // Materials
  const floorMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const wallMatsRef = useRef<THREE.MeshStandardMaterial[]>([]);

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

  // ── REFS for tile — always fresh, no stale closure issues ─────────────────
  const selectedTileRef = useRef<any>(null);
  const selectedTileSizeRef = useRef<string | null>(null);
  const tileRotationRef = useRef<number>(0);
const degToRad = (deg: number) => (deg * Math.PI) / 180;


  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

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
  const [activModal, setActivModal] = useState<"save" | "share" | "mail" | null>(
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
        scene: localStorage.getItem("selected_3d_sub_scene") || "living_room",
        wallTiles: appliedWallTiles,
        floorTiles: appliedFloorTiles,
      };
      const encoded = btoa(
        unescape(encodeURIComponent(JSON.stringify(payload)))
      );
      return `${window.location.href.split("#")[0]}#design-data:${encoded}`;
    } catch {
      return window.location.href;
    }
  };

  const handleSavePDF = async () => {
    const jsPDFModule = await import("jspdf").catch(() => null);
    const jsPDF = jsPDFModule?.jsPDF ?? jsPDFModule?.default?.jsPDF ?? null;
    if (!jsPDF) {
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

    const pdf = new jsPDF("p", "mm", "a4");
    const pageW = 210;
    const margin = 12;

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
        const proxied = `/api/tile-image?url=${encodeURIComponent(provider)}`;
        const res = await loadImg(proxied);
        if (res?.dataUrl) return res.dataUrl;
      }
      return null;
    };

    const allTiles = [
      ...appliedWallTiles.map((t) => ({ ...t, section: "Wall Tile" })),
      ...appliedFloorTiles.map((t) => ({ ...t, section: "Floor Tile" })),
    ];

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
      if (tile.skuCode) pdf.text(`SKU: ${tile.skuCode}`, leftX, y + 32);

      pdf.setDrawColor(214, 223, 228);
      pdf.rect(imgBox.x, imgBox.y, imgBox.w, imgBox.h);
      pdf.rect(qrBox.x, qrBox.y, qrBox.w, qrBox.h);

      const tileImgUrl = tile.image
        ? `/api/tile-image?url=${encodeURIComponent(tile.image)}`
        : "";
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

    pdf.save("Design-with-info.pdf");
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

  const handleShareSocial = (service: string) => {
    const designLink = createDesignShareLink();
    const encodedUrl = encodeURIComponent(designLink);
    let url = "";
    if (service === "facebook")
      url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    else if (service === "twitter")
      url = `https://twitter.com/intent/tweet?url=${encodedUrl}`;
    else if (service === "google")
      url = `https://plus.google.com/share?url=${encodedUrl}`;
    else if (service === "whatsapp")
      url = `https://wa.me/?text=${encodeURIComponent(
        "Check out my tile design! " + designLink
      )}`;
    if (url) window.open(url, "sharer", "width=626,height=436");
    setActivModal(null);
  };

  const handleMailSend = async () => {
    if (!mailForm.to || !mailForm.subject) {
      alert("Please fill in recipient email and subject.");
      return;
    }
    setMailSending(true);
    try {
      const canvas = canvasRef.current;
      const imgUrl = canvas
        ? (() => {
            const c = document.createElement("canvas");
            c.width = canvas.width;
            c.height = canvas.height;
            const ctx = c.getContext("2d")!;
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, c.width, c.height);
            ctx.drawImage(canvas, 0, 0, c.width, c.height);
            return c.toDataURL("image/jpeg");
          })()
        : "";

      const designLink = window.location.href;
      const sceneKey =
        localStorage.getItem("selected_3d_sub_scene") || "living_room";

      const tilesPayload: Record<string, any> = {};
      appliedWallTiles.forEach((t, i) => {
        tilesPayload[`wall_${i}`] = {
          name: t.name,
          image: t.image,
          size: t.size,
          skuCode: t.skuCode,
        };
      });
      appliedFloorTiles.forEach((t, i) => {
        tilesPayload[`floor_${i}`] = {
          name: t.name,
          image: t.image,
          size: t.size,
          skuCode: t.skuCode,
        };
      });

      const res = await fetch("/api/visualizer/mail", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          full_name: mailForm.name,
          to: mailForm.to,
          subject: mailForm.subject,
          message: mailForm.message,
          roomname: sceneKey,
          tiles: JSON.stringify(tilesPayload),
          imgpath: imgUrl,
          design_link: designLink,
        }),
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
    const space = (
      localStorage.getItem("selected_space_type") || "living"
    ).toLowerCase();
    localStorage.removeItem("force_3d_mode");
    localStorage.removeItem("selected_3d_sub_scene");
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("force3DMode"));
    localStorage.setItem("selected_space_type", space);
    sessionStorage.setItem("visualizer_category_intent", "1");
    localStorage.setItem("visualizer_category_sticky", "1");
    window.location.href = "/visualizer";
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

  const getTileImageSrc = (src?: string) =>
    src ? `${IMAGE_PROXY_URL}${encodeURIComponent(src)}` : "";

  // ── Texture builder ───────────────────────────────────────────────────────
//   const buildTexture = useCallback(
//     (base: THREE.Texture, rx: number, ry: number): THREE.Texture => {
//       const img = base.image as HTMLImageElement;
//       const cv = document.createElement("canvas");
//       cv.width = img.width;
//       cv.height = img.height;
//       const ctx = cv.getContext("2d")!;
//       ctx.drawImage(img, 0, 0, cv.width, cv.height);
//       ctx.strokeStyle = "#4f4942";
//       ctx.lineWidth = 3;
//       ctx.strokeRect(1.5, 1.5, cv.width - 3, cv.height - 3);
//       ctx.strokeStyle = "#e6e1da";
//       ctx.lineWidth = 1;
//       ctx.strokeRect(3.5, 3.5, cv.width - 7, cv.height - 7);
//       const tex = new THREE.CanvasTexture(cv);
//       tex.colorSpace = THREE.SRGBColorSpace;
//       // tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
//       // tex.repeat.set(rx, ry);
//       // tex.needsUpdate = true;
//       tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
// tex.repeat.set(rx, ry);

// // apply rotation (0 or 90)
// const rot = degToRad(tileRotationRef.current);
// tex.center.set(0.5, 0.5);
// tex.rotation = rot;

// tex.needsUpdate = true;

//       return tex;
//     },
//     []
//   );

const buildTexture = useCallback(
  (base: THREE.Texture, rx: number, ry: number): THREE.Texture => {
    const img = base.image as HTMLImageElement;
    const cv = document.createElement("canvas");
    const scale = 2;
    cv.width = img.width * scale;
    cv.height = img.height * scale;
    const ctx = cv.getContext("2d")!;
    ctx.drawImage(img, 0, 0, cv.width, cv.height);
    const groutOuter = 1;  // fixed 4px — thin, uniform for all tile sizes
const groutInner = 0;  // fixed 1px inner highlight
    ctx.strokeStyle = "#4f4942";
    ctx.lineWidth = groutOuter;
    ctx.strokeRect(groutOuter / 2, groutOuter / 2, cv.width - groutOuter, cv.height - groutOuter);
    ctx.strokeStyle = "#e6e1da";
    ctx.lineWidth = groutInner;
    ctx.strokeRect(groutOuter + groutInner / 2, groutOuter + groutInner / 2, cv.width - (groutOuter + groutInner) * 2, cv.height - (groutOuter + groutInner) * 2);
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
//   const applyTexToMat = useCallback((mat: THREE.MeshStandardMaterial, tex: THREE.Texture) => {
//     const prev = mat.map;
//     if (prev && ownedMapsRef.current.has(prev)) {
//       prev.dispose();
//       ownedMapsRef.current.delete(prev);
//     }
//     ownedMapsRef.current.add(tex);

//     // mat.map = tex;
//     // mat.map.wrapS = mat.map.wrapT = THREE.RepeatWrapping;
//     // mat.map.repeat.copy(tex.repeat);
//     // mat.map.needsUpdate = true;
// mat.map = tex;
// mat.map.wrapS = mat.map.wrapT = THREE.RepeatWrapping;
// mat.map.repeat.copy(tex.repeat);
// mat.map.anisotropy = rendererRef.current?.capabilities.getMaxAnisotropy() ?? 16;
// mat.map.needsUpdate = true;
//     mat.transparent = false;
//     mat.opacity = 1;
//     mat.needsUpdate = true;
//   }, []);
const applyTexToMat = useCallback((mat: THREE.MeshStandardMaterial, tex: THREE.Texture) => {
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

  // Force ALL surfaces to render identically
  mat.color.set(0xffffff);
  mat.roughness = 0.65;
  mat.metalness = 0.0;
  mat.emissive.set(0xffffff);
  mat.emissiveIntensity = 0.18;
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
    const url = `${IMAGE_PROXY_URL}${encodeURIComponent(tile.image)}`;
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (tex: THREE.Texture) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        applyFn(tex);
        setIsApplying(false);
      },
      () => {},
      () => {
        setErrorMessage("Failed to load tile texture.");
        setIsApplying(false);
      }
    );
  }, []);

  const applyFloor = useCallback(() => {
    if (!floorMatRef.current) return;
    const [rx, ry] = getRepeat(selectedTileSizeRef.current, "floor");
    registerAppliedTile("floor");
    loadAndApply((base) =>
      applyTexToMat(floorMatRef.current!, buildTexture(base, rx, ry))
    );
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
      if (idx < 0 || !wallMatsRef.current[idx]) return;
      const [rx, ry] = getRepeat(selectedTileSizeRef.current, "wall");
      registerAppliedTile("wall");
      loadAndApply((base) =>
        applyTexToMat(wallMatsRef.current[idx], buildTexture(base, rx, ry))
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
    // renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // renderer.toneMappingExposure = 0.7;
    renderer.toneMapping = THREE.LinearToneMapping;
renderer.toneMappingExposure = 0.6;
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

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const dir = new THREE.DirectionalLight(0xffffff, 0.5);
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

    const sceneKey = (
      localStorage.getItem("selected_3d_sub_scene") || "living_room"
    ).toLowerCase();
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
  }, [refreshHandles]);

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
  const toggleLamp = useCallback((lampName: string) => {
    const refs = bedroomRefsRef.current;
    if (!refs) return;
    const isLeft = lampName === LAMP_NAMES.leftShade;
    const light = isLeft ? refs.leftLampLight : refs.rightLampLight;
    const shadeMat = isLeft ? refs.leftShadeMat : refs.rightShadeMat;
    const turningOn = light.intensity === 0;
    light.intensity = turningOn ? 12 : 0;
    shadeMat.emissiveIntensity = turningOn ? 1.0 : 0.0;
    shadeMat.needsUpdate = true;
    const bothOff =
      refs.leftLampLight.intensity === 0 && refs.rightLampLight.intensity === 0;
    refs.ambientLight.intensity = bothOff ? 0.25 : 0.5;
    refs.hemisphereLight.intensity = bothOff ? 0.3 : 0.6;
  }, []);

  const toggleTubeLight = useCallback((tubeName: string) => {
    const refs = kitchenRefsRef.current ?? bathroomRefsRef.current;
    if (!refs) return;
    const isFirst =
      tubeName === KIT_TUBE_NAMES.tube1 || tubeName === BATH_TUBE_NAMES.tube1;
    const light = isFirst ? refs.tubeLight1 : refs.tubeLight2;
    const tubeMat = isFirst ? refs.tubeMat1 : refs.tubeMat2;
    const turningOn = light.intensity === 0;
    light.intensity = turningOn ? 18 : 0;
    tubeMat.emissiveIntensity = turningOn ? 2.5 : 0.0;
    tubeMat.needsUpdate = true;
    const bothOff =
      refs.tubeLight1.intensity === 0 && refs.tubeLight2.intensity === 0;
    refs.ambientLight.intensity = bothOff ? 0.15 : 0.35;
    refs.hemisphereLight.intensity = bothOff ? 0.2 : 0.45;
  }, []);

  const toggleLivingLight = useCallback((lightName: string) => {
    const refs = livingRoomRefsRef.current;
    if (!refs) return;
    if (
      lightName === LIVING_LIGHT_NAMES.tubeLight1 ||
      lightName === LIVING_LIGHT_NAMES.tubeLight2
    ) {
      const isFirst = lightName === LIVING_LIGHT_NAMES.tubeLight1;
      const light = isFirst ? refs.tubeLight1 : refs.tubeLight2;
      const mat = isFirst ? refs.tubeMat1 : refs.tubeMat2;
      const turningOn = light.intensity === 0;
      light.intensity = turningOn ? 22 : 0;
      mat.emissiveIntensity = turningOn ? 2.5 : 0.0;
      mat.needsUpdate = true;
    } else if (lightName === LIVING_LIGHT_NAMES.floorShade) {
      const turningOn = refs.floorLampLight.intensity === 0;
      refs.floorLampLight.intensity = turningOn ? 12 : 0;
      refs.floorShadeMat.emissiveIntensity = turningOn ? 1.0 : 0.0;
      refs.floorShadeMat.needsUpdate = true;
    } else if (lightName === LIVING_LIGHT_NAMES.pendantShade) {
      const turningOn = refs.pendantLight.intensity === 0;
      refs.pendantLight.intensity = turningOn ? 15 : 0;
      refs.pendantShadeMat.emissiveIntensity = turningOn ? 0.6 : 0.0;
      refs.pendantShadeMat.needsUpdate = true;
    }
    const allOff =
      refs.floorLampLight.intensity === 0 &&
      refs.pendantLight.intensity === 0 &&
      refs.tubeLight1.intensity === 0 &&
      refs.tubeLight2.intensity === 0;
    refs.ambientLight.intensity = allOff ? 0.1 : 0.5;
    refs.hemisphereLight.intensity = allOff ? 0.2 : 0.7;
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
    if (bedroomRefsRef.current) targetNames.push(LAMP_NAMES.leftShade, LAMP_NAMES.rightShade);
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
    const hits = raycasterRef.current.intersectObjects(targets, true);
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
        selectedFurniture.current.position.x = Math.max(
          -bounds.x,
          Math.min(bounds.x, newX)
        );
        selectedFurniture.current.position.z = Math.max(
          -bounds.z,
          Math.min(bounds.z, newZ)
        );
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
//   const handleMouseMove = useCallback(
//   (e: React.MouseEvent) => {
//     if (handleDragRef.current) {
//       const hd = handleDragRef.current;
//       const sel = selectedFurniture.current;
//       if (!sel) return;
//       const dx = e.clientX - hd.mouseX;
//       const dy = e.clientY - hd.mouseY;
//       const delta = (dx - dy) * 0.003;
//       const newScale = Math.max(0.3, Math.min(4.0, hd.scaleStart * (1 + delta)));
//       sel.scale.set(newScale, newScale, newScale);
//       syncFurnitureOutline();
//       refreshHandles();
//       return;
//     }
//     if (furnitureDragging.current && selectedFurniture.current) {
//       const fp = getFloorPoint(e);
//       const start = furnitureDragFloorStart.current;
//       const objStart = furnitureDragObjStart.current;
//       if (!fp || !start || !objStart) return;
//       const sceneKey = (
//         localStorage.getItem("selected_3d_sub_scene") || "living_room"
//       ).toLowerCase();
//       const bounds = sceneKey.includes("bathroom")
//         ? { x: 5.2, z: 3.8 }
//         : sceneKey.includes("bedroom")
//         ? { x: 6.2, z: 5.2 }
//         : sceneKey.includes("kitchen")
//         ? { x: 7.2, z: 6.2 }
//         : { x: 9.2, z: 7.2 };
//       const newX = objStart.x + fp.x - start.x;
//       const newZ = objStart.z + fp.z - start.z;
//       selectedFurniture.current.position.x = Math.max(
//         -bounds.x,
//         Math.min(bounds.x, newX)
//       );
//       selectedFurniture.current.position.z = Math.max(
//         -bounds.z,
//         Math.min(bounds.z, newZ)
//       );
//       syncFurnitureOutline();
//       return;
//     }
//     const m = modeRef.current;
//     if (m === "pick-wall" || m === "draw-area") {
//       const hit = raycastAnyWall(getNDC(e));
//       setHoveredWall(hit ? hit.name : null);
//       if (canvasRef.current)
//         canvasRef.current.style.cursor = hit ? "pointer" : "crosshair";
//       return;
//     }
//     if (m === "draw-area-dragging") {
//       const wall = areaWallRef.current;
//       const p1 = drawStartHitRef.current;
//       if (!wall || !p1 || !sceneRef.current) return;
//       const pt = raycastWallHit(getNDC(e), wall);
//       if (!pt) return;
//       const isBack = wall === SURFACE_NAMES.wallBack;
//       const cx = (p1.x + pt.x) / 2,
//         cy = (p1.y + pt.y) / 2,
//         cz = (p1.z + pt.z) / 2;
//       const w = Math.max(Math.abs(isBack ? pt.x - p1.x : pt.z - p1.z), 0.01);
//       const h = Math.max(Math.abs(pt.y - p1.y), 0.01);
//       const wallMesh = sceneRef.current.getObjectByName(wall);
//       const wallPos = wallMesh ? (wallMesh as THREE.Mesh).position : new THREE.Vector3();
//       if (!previewBoxRef.current) {
//         const geo = new THREE.PlaneGeometry(1, 1);
//         const mat = new THREE.MeshBasicMaterial({
//           color: 0xf59e0b,
//           transparent: true,
//           opacity: 0.12,
//           side: THREE.DoubleSide,
//           depthWrite: false,
//         });
//         const mesh = new THREE.Mesh(geo, mat);
//         mesh.renderOrder = 2;
//         sceneRef.current.add(mesh);
//         previewBoxRef.current = mesh;
//         const edgeGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(1, 1));
//         const outline = new THREE.LineSegments(
//           edgeGeo,
//           new THREE.LineBasicMaterial({
//             color: 0xffffff,
//             transparent: true,
//             opacity: 0.85,
//           })
//         );
//         outline.renderOrder = 3;
//         outline.name = "preview_outline";
//         mesh.add(outline);
//       }
//       const OFFSET = 0.014;
//       previewBoxRef.current.scale.set(w, h, 1);
//       if (isBack) {
//         previewBoxRef.current.rotation.set(0, 0, 0);
//         previewBoxRef.current.position.set(cx, cy, wallPos.z + OFFSET);
//       } else if (wall === SURFACE_NAMES.wallLeft) {
//         previewBoxRef.current.rotation.set(0, Math.PI / 2, 0);
//         previewBoxRef.current.position.set(wallPos.x + OFFSET, cy, cz);
//       } else {
//         previewBoxRef.current.rotation.set(0, -Math.PI / 2, 0);
//         previewBoxRef.current.position.set(wallPos.x - OFFSET, cy, cz);
//       }
//       return;
//     }
//     if (m === "orbit" && canvasRef.current)
//       canvasRef.current.style.cursor = "grab";
//   },
//   [syncFurnitureOutline, getFloorPoint, refreshHandles]
// );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const m = modeRef.current;
      mouseDownPosRef.current = { x: e.clientX, y: e.clientY };

      if (m === "orbit") {
        const hit = hitMovable(e);
        if (hit) {
          if (hit !== selectedFurniture.current) selectFurniture(hit);
          const objY = hit.position.y;
          furnitureDragging.current = true;
          furnitureDragFloorStart.current = getFloorPoint(e, objY);
          furnitureDragObjStart.current = hit.position.clone();
          e.stopPropagation();
          return;
        }
        if (selectedFurniture.current) deselectFurniture();
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
    [hitMovable, getFloorPoint, deselectFurniture, selectFurniture]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      const m = modeRef.current;
      if (furnitureDragging.current) {
        furnitureDragging.current = false;
        furnitureDragFloorStart.current = null;
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
              setPendingAreaData({ wall, p1, p2: pt });
              setAreaConfirmPending(true);
              return;
            }
          }
        }
        drawStartHitRef.current = null;
        modeRef.current = "draw-area";
        setMode("draw-area");
      }
    },
    [applyWall, clearPreviewBox, toggleLamp, toggleTubeLight, toggleLivingLight]
  );

  const handleDoubleClick = useCallback((_e: React.MouseEvent) => {}, []);

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

  const tileReady = !!selectedTile && !isApplying;
  const activeProductTiles = productInfoTab === "wall" ? appliedWallTiles : appliedFloorTiles;

  // ─── UI ──────────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#F9F7F2] overflow-hidden">
      <LegacySidebar3D
        onFilters={() => {
          /* open filters */
        }}
        onClear={clearAllTiles}
        onSelectRoom={handleSelectRoom}
        onProductInfo={handleProductInfo}
        onSave={() => setActivModal("save")}
        onPrint={handlePrint}
        onEmail={() => setActivModal("mail")}
        onShare={() => setActivModal("share")}
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

      {/* <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <button onClick={handleSelectRoom} className={legacyHeaderBtn}>
          Select Room
        </button>
        <button onClick={handleProductInfo} className={legacyHeaderBtn}>
          Product Info
        </button>
      </div> */}

      <div className={`${legacyRightRail} absolute top-1/2 right-0 -translate-y-1/2 z-50`}>
        <button onClick={() => setActivModal("save")} className={legacyRightBtn} title="Save Design">
          <Save size={18} />
        </button>
        <button onClick={handlePrint} className={legacyRightBtn} title="Print / PDF">
          <Printer size={18} />
        </button>
        <button onClick={() => setActivModal("mail")} className={legacyRightBtn} title="Email">
          <Mail size={18} />
        </button>
        <button onClick={() => setActivModal("share")} className={legacyRightBtn} title="Share / Link">
          <Share2 size={18} />
        </button>
        <button onClick={toggleFullscreen} className={`${legacyRightBtn} border-b-0`} title="Fullscreen">
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </div>

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
{/* 
      {selectedTile && (
        <div className="absolute top-24 right-6 z-40 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-slate-200 max-w-[160px]">
          <p className="text-xs font-semibold mb-1.5 text-slate-800">Selected Tile</p>
          <img
            src={`${IMAGE_PROXY_URL}${encodeURIComponent(selectedTile.image)}`}
            alt={selectedTile.name}
            className="w-full h-auto rounded-lg object-cover"
          />
          <p className="text-[10px] mt-1.5 text-slate-600 truncate">{selectedTile.name}</p>
          {selectedTileSize && <p className="text-[9px] mt-1 text-slate-500">Size: {selectedTileSize}</p>}
        </div>
      )} */}

      {mode === "pick-wall" && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md text-white px-6 py-3 rounded-full text-sm font-medium shadow-2xl border border-amber-500/30 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Click any wall to tile it · <span className="text-amber-400">Esc to cancel</span>
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

      {areaConfirmPending && pendingAreaData && (
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
      )}

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
            disabled={!tileReady || mode !== "orbit"}
            onClick={applyFloor}
            className={`px-5 py-2.5 rounded-full text-xs uppercase tracking-wider font-semibold shadow-2xl border transition-all
              ${
                tileReady && mode === "orbit"
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
            disabled={!tileReady}
            onClick={() => setMode(mode === "pick-wall" ? "orbit" : "pick-wall")}
            className={`px-5 py-2.5 rounded-full text-xs uppercase tracking-wider font-semibold shadow-xl border transition-all
              ${
                mode === "pick-wall"
                  ? "bg-amber-500 text-white border-amber-400"
                  : tileReady
                  ? "bg-slate-900/95 text-white border-amber-500/30 hover:bg-amber-700 hover:border-amber-400"
                  : "bg-slate-900/50 text-white/30 border-slate-700 cursor-not-allowed"
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
              disabled={!tileReady}
              onClick={() => {
                if (mode === "draw-area" || mode === "draw-area-dragging") {
                  cancelArea();
                } else {
                  setMode("draw-area");
                  modeRef.current = "draw-area";
                }
              }}
              className={`px-4 py-2.5 rounded-full text-xs uppercase tracking-wider font-semibold shadow-xl border transition-all
                ${
                  mode === "draw-area" || mode === "draw-area-dragging"
                    ? "bg-violet-500 text-white border-violet-400"
                    : tileReady
                    ? "bg-slate-900/95 text-white border-violet-500/30 hover:bg-violet-700"
                    : "bg-slate-900/50 text-white/30 border-slate-700 cursor-not-allowed"
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

      {/* {activModal === "save" && (
        <div className="absolute inset-0 z-[80] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setActivModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-[320px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[13px] font-black tracking-[0.15em] uppercase text-slate-800">Save Design</h3>
              <button onClick={() => setActivModal(null)} className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
                <X size={14} />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  handleSaveImage();
                  setActivModal(null);
                }}
                className="w-full py-3 rounded-xl border border-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <Save size={14} /> Save as Image
              </button>
              <button
                onClick={() => {
                  handleSavePDF();
                  setActivModal(null);
                }}
                className="w-full py-3 rounded-xl border border-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <Printer size={14} /> Save as PDF
              </button>
              <button
                onClick={() => {
                  handleSaveLink();
                  setActivModal(null);
                }}
                className="w-full py-3 rounded-xl border border-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <Share2 size={14} /> Copy Share Link
              </button>
            </div>
          </div>
        </div>
      )} */}

      
      {activModal === "save" && (
        <div className="absolute inset-0 z-[80] flex items-start justify-center pt-[12vh]" style={{ background: "rgba(0,0,0,0.45)" }} onClick={() => setActivModal(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: "8px", width: "560px", maxWidth: "96vw", boxShadow: "0 5px 20px rgba(0,0,0,0.4)", border: "1px solid rgba(0,0,0,0.18)", fontFamily: "'UbuntuM', sans-serif", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 14px", borderBottom: "1px solid #e5e5e5" }}>
              <span style={{ fontSize: "14px", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#111" }}>Save Design</span>
              <button onClick={() => setActivModal(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "#000", opacity: 0.45, lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ padding: "30px 24px 24px", background: "#f5f7fa", display: "flex", flexWrap: "wrap", gap: "14px", justifyContent: "center" }}>
              <button style={modalSaveBtn} onClick={() => { handleSaveImage(); setActivModal(null); }}>SAVE DESIGN AS IMAGE</button>
              <button style={modalSaveBtn} onClick={() => { handleSavePDF(); setActivModal(null); }}>SAVE WITH INFO AS PDF</button>
              <button style={modalSaveBtn} onClick={() => { handleSaveLink(); setActivModal(null); }}>SAVE DESIGN FOR LATER</button>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 20px 14px", background: "#f5f7fa", borderTop: "1px solid #e5e5e5" }}>
              <button style={modalCloseBtn} onClick={() => setActivModal(null)}>CLOSE</button>
            </div>
          </div>
        </div>
      )}

      {/* {activModal === "share" && (
        <div className="absolute inset-0 z-[80] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setActivModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-[320px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[13px] font-black tracking-[0.15em] uppercase text-slate-800">Share Design</h3>
              <button onClick={() => setActivModal(null)} className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
                <X size={14} />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleShareSocial("facebook")}
                className="w-full py-3 rounded-xl text-white text-[11px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                style={{ backgroundColor: "#1877F2" }}
              >
                Facebook
              </button>
              <button
                onClick={() => handleShareSocial("twitter")}
                className="w-full py-3 rounded-xl text-white text-[11px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                style={{ backgroundColor: "#1DA1F2" }}
              >
                Twitter / X
              </button>
              <button
                onClick={() => handleShareSocial("google")}
                className="w-full py-3 rounded-xl text-white text-[11px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                style={{ backgroundColor: "#DB4437" }}
              >
                Google+
              </button>
              <button
                onClick={() => handleShareSocial("whatsapp")}
                className="w-full py-3 rounded-xl text-white text-[11px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                style={{ backgroundColor: "#25D366" }}
              >
                WhatsApp
              </button>
              <button
                onClick={() => {
                  handleSaveLink();
                  setActivModal(null);
                }}
                className="w-full py-3 rounded-xl border border-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <Share2 size={14} /> Copy Link
              </button>
            </div>
          </div>
        </div>
      )} */}

      {activModal === "share" && (
        <div className="absolute inset-0 z-[80] flex items-start justify-center pt-[12vh]" style={{ background: "rgba(0,0,0,0.45)" }} onClick={() => setActivModal(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: "8px", width: "480px", maxWidth: "96vw", boxShadow: "0 5px 20px rgba(0,0,0,0.4)", border: "1px solid rgba(0,0,0,0.18)", fontFamily: "'UbuntuM', sans-serif", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 14px", borderBottom: "1px solid #e5e5e5" }}>
              <span style={{ fontSize: "14px", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#111" }}>Share</span>
              <button onClick={() => setActivModal(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "#000", opacity: 0.45, lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ padding: "30px 24px 24px", background: "#f5f7fa", display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
              {[
                { label: "Facebook", color: "#3b5998", service: "facebook" },
                { label: "Twitter",  color: "#55acee", service: "twitter" },
                { label: "Google+",  color: "#dd4b39", service: "google" },
              ].map(({ label, color, service }) => (
                <button key={service} onClick={() => handleShareSocial(service)}
                  style={{ background: color, color: "#fff", border: "none", borderRadius: "10px", width: "110px", height: "80px", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "'UbuntuM', sans-serif" }}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 20px 14px", background: "#f5f7fa", borderTop: "1px solid #e5e5e5" }}>
              <button style={modalCloseBtn} onClick={() => setActivModal(null)}>CLOSE</button>
            </div>
          </div>
        </div>
      )}
 

      {/* {activModal === "mail" && (
        <div className="absolute inset-0 z-[80] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setActivModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-[380px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[13px] font-black tracking-[0.15em] uppercase text-slate-800">Email Design</h3>
              <button onClick={() => setActivModal(null)} className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
                <X size={14} />
              </button>
            </div>
            {mailSent ? (
              <div className="text-center py-6 text-emerald-600 font-bold text-sm">✓ Email sent successfully!</div>
            ) : (
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Your Full Name"
                  value={mailForm.name}
                  onChange={(e) => setMailForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 transition-colors"
                />
                <input
                  type="email"
                  placeholder="Recipient's Email Address"
                  value={mailForm.to}
                  onChange={(e) => setMailForm((p) => ({ ...p, to: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 transition-colors"
                />
                <input
                  type="text"
                  placeholder="Subject"
                  value={mailForm.subject}
                  onChange={(e) => setMailForm((p) => ({ ...p, subject: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 transition-colors"
                />
                <textarea
                  placeholder="Write your message here..."
                  rows={3}
                  value={mailForm.message}
                  onChange={(e) => setMailForm((p) => ({ ...p, message: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 transition-colors resize-none"
                />
                <button
                  onClick={handleMailSend}
                  disabled={mailSending}
                  className="w-full py-3 rounded-xl bg-slate-900 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-slate-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {mailSending ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                  {mailSending ? "Sending..." : "Send Email"}
                </button>
              </div>
            )}
          </div>
        </div>
      )} */}
      {activModal === "mail" && (
        <div className="absolute inset-0 z-[80] flex items-start justify-center pt-[12vh]" style={{ background: "rgba(0,0,0,0.45)" }} onClick={() => setActivModal(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: "8px", width: "500px", maxWidth: "96vw", boxShadow: "0 5px 20px rgba(0,0,0,0.4)", border: "1px solid rgba(0,0,0,0.18)", fontFamily: "'UbuntuM', sans-serif", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 14px", borderBottom: "1px solid #e5e5e5" }}>
              <span style={{ fontSize: "14px", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#111" }}>Email</span>
              <button onClick={() => setActivModal(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "#000", opacity: 0.45, lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ padding: "20px", background: "#f5f7fa" }}>
              {mailSent ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: "#16a34a", fontWeight: 700, fontSize: "14px" }}>✓ Email sent successfully!</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <input type="text" placeholder="Your Full Name" value={mailForm.name} onChange={(e) => setMailForm((p) => ({ ...p, name: e.target.value }))} style={modalInputStyle} />
                  <input type="email" placeholder="Recipient's Email Address" value={mailForm.to} onChange={(e) => setMailForm((p) => ({ ...p, to: e.target.value }))} style={modalInputStyle} />
                  <input type="text" placeholder="Subject" value={mailForm.subject} onChange={(e) => setMailForm((p) => ({ ...p, subject: e.target.value }))} style={modalInputStyle} />
                  <textarea placeholder="Write your message here..." rows={4} value={mailForm.message} onChange={(e) => setMailForm((p) => ({ ...p, message: e.target.value }))} style={{ ...modalInputStyle, height: "auto", padding: "10px 14px", resize: "vertical", lineHeight: "1.5" }} />
                </div>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 20px 14px", background: "#f5f7fa", borderTop: "1px solid #e5e5e5" }}>
              {!mailSent && (
                <button onClick={handleMailSend} disabled={mailSending} style={{ ...modalCloseBtn, opacity: mailSending ? 0.6 : 1, cursor: mailSending ? "not-allowed" : "pointer" }}>
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
