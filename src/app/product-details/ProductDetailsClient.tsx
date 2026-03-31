"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import ProductDetailsView from "@/components/products/ProductDetailsView";
import { ASSET_BASE, API_BASE } from "@/lib/constants";
import type { ProductDetails } from "@/lib/productDetailsApi";

function normalizeBase(raw: string) {
  return raw.endsWith("/") ? raw : `${raw}/`;
}

function getAssetBase() {
  const base = String(ASSET_BASE ?? "").trim();
  if (!base) {
    throw new Error("NEXT_PUBLIC_ASSET_BASE is missing");
  }
  return normalizeBase(base);
}

function getApiBase() {
  const base = String(API_BASE ?? "").trim();
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_BASE is missing");
  }
  return normalizeBase(base);
}

async function fetchProductDetailsClient(routeKey: string): Promise<ProductDetails | null> {
  const safeRouteKey = String(routeKey || "").trim();
  if (!safeRouteKey) return null;

  const tried = new Set<string>();
  const candidates = [safeRouteKey, safeRouteKey.toLowerCase(), safeRouteKey.toUpperCase()].filter((v) => {
    if (!v || tried.has(v)) return false;
    tried.add(v);
    return true;
  });

  let data: Record<string, unknown> | null = null;

  for (const skuCandidate of candidates) {
    const url = `${getApiBase()}GetTileBySku?skuCode=${encodeURIComponent(skuCandidate)}`;
    const response = await fetch(url, { method: "GET", cache: "no-store" });
    if (response.status === 404) continue;
    if (!response.ok) throw new Error(`GetTileBySku ${response.status}`);
    data = (await response.json()) as Record<string, unknown> | null;
    if (data) break;
  }

  if (!data) return null;

  const name = String(data.sku_name ?? "").trim();
  const skuCode = String(data.skuCode ?? data.sku_code ?? "").trim();
  const assetBase = getAssetBase();
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
}

export default function ProductDetailsClient() {
  const searchParams = useSearchParams();
  const skuCode = String(searchParams.get("sku") || "").trim();
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!skuCode) {
      setProduct(null);
      setLoading(false);
      setError("Missing SKU.");
      return;
    }

    setLoading(true);
    setError(null);

    fetchProductDetailsClient(skuCode)
      .then((result) => {
        if (cancelled) return;
        setProduct(result);
        if (!result) {
          setError(`No tile details were returned for SKU: ${skuCode}`);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setProduct(null);
        setError(err instanceof Error ? err.message : "Unable to load product details.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [skuCode]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f8f6] px-4 py-10 text-slate-900">
        <section className="mx-auto max-w-3xl rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_30px_60px_-20px_rgba(15,23,42,0.14)]">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-amber-600">
            Product Details
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Loading...</h1>
        </section>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-[#f8f8f6] px-4 py-10 text-slate-900">
        <section className="mx-auto max-w-3xl rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_30px_60px_-20px_rgba(15,23,42,0.14)]">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-amber-600">
            Product Details
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Tile Not Found</h1>
          <p className="mt-3 text-base text-slate-600">{error || "Unable to load tile details."}</p>
        </section>
      </main>
    );
  }

  return <ProductDetailsView product={product} />;
}
