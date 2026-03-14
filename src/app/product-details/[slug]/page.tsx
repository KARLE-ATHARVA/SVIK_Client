"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ASSET_BASE } from "@/lib/constants";
import { fetchFilterTileList, type TileListItem } from "@/lib/filterApi";

type ProductListItem = {
  id: string | number;
  skuCode: string;
  name: string;
  size: string;
  image: string;
};

function mapTiles(rows: TileListItem[]): ProductListItem[] {
  const assetBase = String(ASSET_BASE ?? "https://vyr.svikinfotech.in/assets/").trim();
  const normalizedAssetBase = assetBase.endsWith("/") ? assetBase : `${assetBase}/`;

  return rows.map((item) => {
    const skuCode = String(item.sku_code ?? "").trim();
    const name = String(item.sku_name ?? "").trim();
    const size = String(item.size_name ?? "").trim();

    return {
      id: item.tile_id,
      skuCode,
      name: name || "Product",
      size: size || "Size unavailable",
      image: `${normalizedAssetBase}media/thumb/${skuCode}.jpg`,
    };
  });
}

export default function ProductsPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ProductListItem[]>([]);
  const [space] = useState(() => {
    if (typeof window === "undefined") return "Kitchen";
    return localStorage.getItem("selected_space_type") || "Kitchen";
  });

  useEffect(() => {
    let isMounted = true;

    fetchFilterTileList({
      spaceName: space,
      catNames: [],
      appNames: [],
      finishNames: [],
      sizeNames: [],
      colorNames: [],
    })
      .then((rows) => {
        if (!isMounted) return;
        setItems(mapTiles(rows));
      })
      .catch((error) => {
        if (!isMounted) return;
        console.error("ProductsPage fetch error:", error);
        setItems([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [space]);

  return (
    <main className="min-h-screen bg-neutral-50 text-slate-900">
      <section className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-5xl font-black font-serif tracking-tight text-amber-700">
            Product Catalog
          </h1>
        </div>

        {loading ? (
          <div className="h-72 flex items-center justify-center">
            <p className="text-slate-600">Loading products...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="h-72 flex items-center justify-center">
            <p className="text-slate-600">No products available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((product) => (
              <Link
                key={product.id}
                href={`/product-details/${encodeURIComponent(product.skuCode)}`}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition"
              >
                <div className="relative h-64">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition duration-500"
                  />
                </div>
                <div className="p-4">
                  <h2 className="font-semibold text-lg leading-tight">{product.name}</h2>
                  <p className="text-sm text-slate-500 mt-1">{product.size}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}