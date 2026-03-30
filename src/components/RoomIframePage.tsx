"use client";

import { useEffect, useRef, useState } from "react";
import AuthModal from "@/components/visualizer/AuthModal";

type SavedDesign = {
  link: string;
  image: string | null;
  designId?: string;
};

type RoomIframePageProps = {
  roomId: string;
};

function normalizeApiBase(raw: string | undefined): string {
  const base = String(raw ?? "").trim();
  if (!base) return "";
  return base.endsWith("/") ? base : `${base}/`;
}

function getDesignHashFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash || "";
  if (hash.startsWith("#design-data:")) {
    return hash.substring("#design-data:".length);
  }
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const design = params.get("design");
  return design || null;
}

function dataUrlToFile(dataUrl: string, defaultName: string): File | null {
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
}

function pushLocalSavedRoom(design: { link: string; image: string | null }) {
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
}

export default function RoomIframePage({ roomId }: RoomIframePageProps) {
  const [designHash, setDesignHash] = useState<string | null>(null);
  const [savedDesign, setSavedDesign] = useState<SavedDesign | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingSave, setPendingSave] = useState<SavedDesign | null>(null);
  const lastSavedIdRef = useRef<string | null>(null);

  useEffect(() => {
    const updateHash = () => setDesignHash(getDesignHashFromLocation());
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event?.data?.type !== "SAVE_DESIGN") return;
      const payload = event.data.payload as SavedDesign | undefined;
      if (!payload?.link) return;
      setSavedDesign({
        link: payload.link,
        image: payload.image ?? null,
        designId: payload.designId,
      });
      setShowModal(true);
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const handleSaveToBackend = async (design: SavedDesign) => {
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

      setIsSaving(true);

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
      const fileName = `room${roomId}_${datePart}_${timePart}`;
      formData.append("imageName", fileName);

      const res = await fetch(`${apiBase}saved_rooms/save`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        console.error("saved_rooms/save failed", { status: res.status, body: data });
        pushLocalSavedRoom(design);
        alert(
          `Saved link, but server image save failed.${data?.error ? ` (${data.error})` : ""}`
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

  const iframeSrc = `/app/${roomId}.html${
    designHash ? `#design-data:${designHash}` : ""
  }`;

  return (
    <>
      <iframe
        src={iframeSrc}
        style={{ width: "100%", height: "100vh", border: "none" }}
      />

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

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => navigator.clipboard.writeText(savedDesign.link)}
                className="bg-black text-white px-4 py-2 rounded"
              >
                Copy
              </button>

              <button
                onClick={() => handleSaveToBackend(savedDesign)}
                disabled={isSaving}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>

              <button
                onClick={() => setShowModal(false)}
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
