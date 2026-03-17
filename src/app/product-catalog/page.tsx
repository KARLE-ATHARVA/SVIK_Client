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

export default function ProductCatalogPage() {
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
        console.error("ProductCatalog fetch error:", error);
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
    <main className="min-h-screen bg-[#f8f8f6] text-slate-900">
      <section className="relative overflow-hidden px-4 py-10 sm:px-6 lg:px-10 xl:px-14 2xl:px-20">
        <div className="pointer-events-none absolute right-[-5%] top-[-8%] h-[420px] w-[420px] rounded-full bg-amber-200/20 blur-[110px]" />
        <div className="pointer-events-none absolute bottom-[-12%] left-[-4%] h-[500px] w-[500px] rounded-full bg-slate-200/40 blur-[120px]" />

        <div className="relative mx-auto max-w-[1440px]">
          <div className="mb-10 flex flex-col items-center gap-3 text-center">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Products
            </h1>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">
              Tile size
            </p>
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
          (() => {
            const grouped = new Map<string, ProductListItem[]>();
            items.forEach((item) => {
              const key = item.size || "Size unavailable";
              if (!grouped.has(key)) grouped.set(key, []);
              grouped.get(key)?.push(item);
            });

            return (
              <div className="space-y-20">
                {Array.from(grouped.entries()).map(([size, groupItems]) => (
                  <section key={size} className="space-y-10">
                    <div className="flex items-center justify-center gap-4 text-center text-xs font-semibold uppercase tracking-[0.32em] text-amber-700">
                      <span className="h-[1px] w-14 bg-amber-300" />
                      <span>{size}</span>
                      <span className="h-[1px] w-14 bg-amber-300" />
                    </div>

                    <div className="grid grid-cols-1 gap-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-20 xl:gap-y-24">
                      {groupItems.map((product) => (
                        <Link
                          key={product.id}
                          href={`/product-details/${encodeURIComponent(product.skuCode)}`}
                          className="group"
                        >
                          <div className="transition hover:-translate-y-1">
                            <div className="relative">
                              <Image
                                src={product.image}
                                alt={product.name}
                                width={900}
                                height={700}
                                className="h-auto w-full object-contain transition duration-500 group-hover:scale-[1.03]"
                              />
                            </div>
                            <div className="pt-4">
                              <h2 className="text-base font-semibold leading-tight text-slate-900">
                                {product.name}
                              </h2>
                              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
                                {product.size}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            );
          })()
        )}
        </div>
      </section>
    </main>
  );
}
