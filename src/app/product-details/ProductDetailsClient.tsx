"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductDetailsView from "@/components/products/ProductDetailsView";
import { API_BASE, ASSET_BASE } from "@/lib/constants";
import type { ProductDetails } from "@/lib/productDetailsApi";

function resolveBase(): string {
  const base = String(API_BASE ?? "").trim();
  return base.endsWith("/") ? base : `${base}/`;
}

function resolveAssetBase(): string {
  const base = String(ASSET_BASE ?? "").trim();
  return base.endsWith("/") ? base : `${base}/`;
}

async function fetchProductDetailsClient(sku: string): Promise<ProductDetails | null> {
  const safe = String(sku || "").trim();
  if (!safe) return null;

  const tried = new Set<string>();
  const candidates = [safe, safe.toLowerCase(), safe.toUpperCase()].filter((v) => {
    if (!v || tried.has(v)) return false;
    tried.add(v);
    return true;
  });

  const base = resolveBase();
  if (!base) return null;

  let data: Record<string, unknown> | null = null;
  for (const skuCandidate of candidates) {
    const url = `${base}GetTileBySku?skuCode=${encodeURIComponent(skuCandidate)}`;
    try {
      const response = await fetch(url, { method: "GET" });
      if (response.status === 404) continue;
      if (!response.ok) continue;
      data = (await response.json()) as Record<string, unknown> | null;
    } catch {
      // ignore and try next candidate
    }
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
}

export default function ProductDetailsClient() {
  const searchParams = useSearchParams();
  const sku = useMemo(() => {
    return (
      searchParams.get("sku") ||
      searchParams.get("code") ||
      searchParams.get("id") ||
      ""
    ).trim();
  }, [searchParams]);

  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<ProductDetails | null>(null);

  useEffect(() => {
    let active = true;
    if (!sku) {
      setProduct(null);
      return;
    }
    setLoading(true);
    fetchProductDetailsClient(sku)
      .then((result) => {
        if (!active) return;
        setProduct(result);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [sku]);

  if (!sku) {
    return (
      <main className="min-h-screen bg-[#f8f8f6] px-4 py-10 text-slate-900">
        <section className="mx-auto max-w-3xl rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_30px_60px_-20px_rgba(15,23,42,0.14)]">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-amber-600">
            Product Details
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Pick a Tile</h1>
          <p className="mt-3 text-base text-slate-600">
            Open a product from the catalogue or visualizer to see details here.
          </p>
        </section>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f8f6] px-4 py-10 text-slate-900">
        <section className="mx-auto max-w-3xl rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_30px_60px_-20px_rgba(15,23,42,0.14)]">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-amber-600">
            Product Details
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Loading...</h1>
          <p className="mt-3 text-base text-slate-600">
            Fetching tile details for SKU: {sku}
          </p>
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
          <p className="mt-3 text-base text-slate-600">
            No tile details were returned for SKU: {sku}
          </p>
        </section>
      </main>
    );
  }

  return <ProductDetailsView product={product} />;
}
