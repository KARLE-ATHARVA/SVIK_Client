import { API_BASE, ASSET_BASE } from "@/lib/constants";

export type ProductDetails = {
  tileId: number;
  skuCode: string;
  name: string;
  category: string;
  application: string;
  space: string;
  size: string;
  finish: string;
  color: string;
  faces: string;
  block: string;
  faceImageUrl: string;
  fallbackImageUrl: string;
};

function resolveBase(): string {
  const base = String(API_BASE ?? "").trim();
  if (!base) throw new Error("NEXT_PUBLIC_API_BASE is missing");
  return base.endsWith("/") ? base : `${base}/`;
}

function resolveAssetBase(): string {
  const base = String(ASSET_BASE ?? "").trim();
  if (base) return base.endsWith("/") ? base : `${base}/`;
  return "https://vyr.svikinfotech.in/assets/";
}

export async function fetchProductDetails(routeKey: string): Promise<ProductDetails | null> {
  const safeRouteKey = String(routeKey || "").trim();
  if (!safeRouteKey) return null;
  const tried = new Set<string>();
  const candidates = [safeRouteKey, safeRouteKey.toLowerCase(), safeRouteKey.toUpperCase()].filter((v) => {
    if (!v || tried.has(v)) return false;
    tried.add(v);
    return true;
  });

  try {
    let data: Record<string, unknown> | null = null;
    for (const skuCandidate of candidates) {
      const url = `${resolveBase()}GetTileBySku?skuCode=${encodeURIComponent(skuCandidate)}`;
      const response = await fetch(url, { method: "GET", cache: "no-store" });
      if (response.status === 404) continue;
      if (!response.ok) throw new Error(`GetTileBySku ${response.status}`);
      data = (await response.json()) as Record<string, unknown> | null;
      if (data) break;
    }
    if (!data) return null;

    const name = String(data.sku_name ?? "").trim();
    const skuCode = String(data.skuCode ?? data.sku_code ?? "").trim();
    const assetBase = resolveAssetBase();
    const fallbackImage = `${assetBase}no-image.jpg`;
    const bigFromSku = skuCode ? `${assetBase}media/big/${skuCode}.jpg` : fallbackImage;

    return {
      tileId: Number(data.tileId ?? data.tile_id ?? 0),
      skuCode,
      name: name || skuCode || "Product",
      category: String(data.cat_name ?? "").trim() || "N/A",
      application: String(data.app_name ?? "").trim() || "N/A",
      space: String(data.space_name ?? "").trim() || "N/A",
      size: String(data.size_name ?? "").trim() || "N/A",
      finish: String(data.finish_name ?? "").trim() || "N/A",
      color: String(data.color_name ?? "").trim() || "N/A",
      faces: String(data.faces ?? "").trim() || "N/A",
      block: String(data.block ?? "").trim() || "N/A",
      faceImageUrl: bigFromSku || fallbackImage,
      fallbackImageUrl: fallbackImage,
    };
  } catch {
    return null;
  }
}
