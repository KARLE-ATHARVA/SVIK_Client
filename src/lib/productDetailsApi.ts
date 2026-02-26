import { API_BASE, ASSET_BASE } from "@/lib/constants";

export type ProductDetails = {
  tileId: number;
  skuCode: string;
  slug: string;
  name: string;
  material: string;
  application: string;
  size: string;
  looksLike: string;
  finish: string;
  color: string;
  qtyPerBox: number;
  coverageSqmPerBox: number;
  coverageSqftPerBox: number;
  faceImageUrl: string;
};

function resolveBase(): string {
  const base = String(API_BASE ?? "").trim();
  if (!base) throw new Error("NEXT_PUBLIC_API_BASE is missing");
  return base.endsWith("/") ? base : `${base}/`;
}

function toSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveAssetBase(): string {
  const base = String(ASSET_BASE ?? "").trim();
  if (base) return base.endsWith("/") ? base : `${base}/`;
  return "https://vyr.svikinfotech.in/assets/";
}

function fallbackProduct(slug: string): ProductDetails {
  const name = "Ariana Grey - N";
  const skuCode = "nttigvmgl1200x1800nogl02010";
  const assetBase = resolveAssetBase();
  return {
    tileId: 41,
    skuCode,
    slug,
    name,
    material: "Glazed Vitrified Tiles",
    application: "Floor",
    size: "1200 x 1800 mm",
    looksLike: "Marble",
    finish: "Glossy",
    color: "Grey",
    qtyPerBox: 2,
    coverageSqmPerBox: 4.32,
    coverageSqftPerBox: 46.5,
    faceImageUrl: `${assetBase}big/${skuCode}.jpg`,
  };
}

export async function fetchProductDetails(slug: string): Promise<ProductDetails> {
  const safeSlug = toSlug(slug || "");
  if (!safeSlug) return fallbackProduct("sample-product");

  const url = `${resolveBase()}ProductDetails?slug=${encodeURIComponent(safeSlug)}`;

  try {
    const response = await fetch(url, { method: "GET", cache: "no-store" });
    if (!response.ok) throw new Error(`ProductDetails ${response.status}`);

    const data = (await response.json()) as Record<string, unknown> | null;
    if (!data) throw new Error("Empty ProductDetails payload");

    const name = String(data.name ?? data.sku_name ?? "Product");
    const skuCode = String(data.skuCode ?? data.sku_code ?? "");
    const assetBase = resolveAssetBase();
    const apiFace = String(data.faceImageUrl ?? data.face_image_url ?? "").trim();
    const bigFromSku = skuCode
      ? `${assetBase}big/${skuCode}.jpg`
      : "";

    return {
      tileId: Number(data.tileId ?? data.tile_id ?? 0),
      skuCode,
      slug: safeSlug,
      name,
      material: String(data.material ?? "Glazed Vitrified Tiles"),
      application: String(data.application ?? data.app_name ?? "Floor"),
      size: String(data.size ?? data.size_name ?? "N/A"),
      looksLike: String(data.looksLike ?? data.looks_like ?? "N/A"),
      finish: String(data.finish ?? data.finish_name ?? "N/A"),
      color: String(data.color ?? data.color_name ?? "N/A"),
      qtyPerBox: Number(data.qtyPerBox ?? data.qty_per_box ?? 1),
      coverageSqmPerBox: Number(data.coverageSqmPerBox ?? data.coverage_sqm_per_box ?? 0),
      coverageSqftPerBox: Number(data.coverageSqftPerBox ?? data.coverage_sqft_per_box ?? 0),
      faceImageUrl: bigFromSku || apiFace,
    };
  } catch {
    return fallbackProduct(safeSlug);
  }
}
