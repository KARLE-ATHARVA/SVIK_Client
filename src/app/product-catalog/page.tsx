"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { API_BASE, ASSET_BASE } from "@/lib/constants";

type GroupByOption =
  | "category"
  | "application"
  | "space"
  | "size"
  | "finish"
  | "color";

type GroupedTileApiItem = {
  tile_id?: string | number;
  sku_name?: string;
  sku_code?: string;
  cat_name?: string;
  app_name?: string;
  space_name?: string;
  size_name?: string;
  finish_name?: string;
  color_name?: string;
};

type ProductListItem = {
  id: string | number;
  skuCode: string;
  name: string;
  image: string;
  category: string;
  application: string;
  space: string;
  size: string;
  finish: string;
  color: string;
};

type GroupedApiResponse = Record<string, GroupedTileApiItem[]>;

const GROUP_OPTIONS: Array<{ value: GroupByOption; label: string }> = [
  { value: "category", label: "Category" },
  { value: "application", label: "Application" },
  { value: "space", label: "Space" },
  { value: "size", label: "Size" },
  { value: "finish", label: "Finish" },
  { value: "color", label: "Color" },
];

function resolveApiBase(): string {
  const base = String(API_BASE ?? "").trim();
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_BASE is not configured.");
  }
  return base.endsWith("/") ? base : `${base}/`;
}

function resolveAssetBase(): string {
  const base = String(ASSET_BASE ?? "").trim();
  return base.endsWith("/") ? base : `${base}/`;
}

async function fetchGroupedTiles(
  groupBy: GroupByOption,
  signal?: AbortSignal
): Promise<GroupedApiResponse> {
  const response = await fetch(
    `${resolveApiBase()}GetTilesGroupedOptimized?groupBy=${encodeURIComponent(groupBy)}`,
    {
      method: "GET",
      cache: "no-store",
      signal,
    }
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `GetTilesGroupedOptimized failed with status ${response.status}${body ? `: ${body}` : ""}`
    );
  }

  const raw = (await response.json()) as unknown;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  return raw as GroupedApiResponse;
}

function mapTile(item: GroupedTileApiItem): ProductListItem {
  const assetBase = resolveAssetBase();
  const skuCode = String(item.sku_code ?? "").trim();

  return {
    id: item.tile_id ?? skuCode,
    skuCode,
    name: String(item.sku_name ?? "").trim() || "Product",
    image: `${assetBase}media/thumb/${skuCode}.jpg`,
    category: String(item.cat_name ?? "").trim() || "Category unavailable",
    application: String(item.app_name ?? "").trim() || "Application unavailable",
    space: String(item.space_name ?? "").trim() || "Space unavailable",
    size: String(item.size_name ?? "").trim() || "Size unavailable",
    finish: String(item.finish_name ?? "").trim() || "Finish unavailable",
    color: String(item.color_name ?? "").trim() || "Color unavailable",
  };
}

function getMetaLabel(item: ProductListItem, groupBy: GroupByOption): string {
  switch (groupBy) {
    case "category":
      return item.category;
    case "application":
      return item.application;
    case "space":
      return item.space;
    case "size":
      return item.size;
    case "finish":
      return item.finish;
    case "color":
      return item.color;
    default:
      return item.category;
  }
}

export default function ProductCatalogPage() {
  const [groupBy, setGroupBy] = useState<GroupByOption>("category");
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Array<[string, ProductListItem[]]>>([]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    fetchGroupedTiles(groupBy, controller.signal)
      .then((data) => {
        if (!isMounted) return;

        const nextGroups = Object.entries(data).map(([groupName, groupItems]) => [
          groupName,
          Array.isArray(groupItems) ? groupItems.map(mapTile) : [],
        ]) as Array<[string, ProductListItem[]]>;

        setGroups(nextGroups);
      })
      .catch((error) => {
        if (!isMounted) return;
        console.error("ProductCatalog fetch error:", error);
        setGroups([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [groupBy]);

  return (
    <main className="min-h-screen bg-[#f8f8f6] text-slate-900">
      <section className="relative overflow-hidden px-4 py-10 sm:px-6 lg:px-10 xl:px-14 2xl:px-20">
        <div className="pointer-events-none absolute right-[-5%] top-[-8%] h-[420px] w-[420px] rounded-full bg-amber-200/20 blur-[110px]" />
        <div className="pointer-events-none absolute bottom-[-12%] left-[-4%] h-[500px] w-[500px] rounded-full bg-slate-200/40 blur-[120px]" />

        <div className="relative mx-auto max-w-[1440px]">
          <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                Products
              </h1>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">
                Grouped by {GROUP_OPTIONS.find((option) => option.value === groupBy)?.label}
              </p>
            </div>

            <div className="ml-auto w-full max-w-[240px]">
              <label
                htmlFor="product-group-by"
                className="mb-2 block text-right text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500"
              >
                View By
              </label>
              <div className="relative">
                <select
                  id="product-group-by"
                  value={groupBy}
                  onChange={(event) => {
                    setLoading(true);
                    setGroupBy(event.target.value as GroupByOption);
                  }}
                  className="w-full appearance-none rounded-full border border-amber-200 bg-white/90 px-5 py-3 pr-12 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                >
                  {GROUP_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-5 flex items-center text-amber-700">
                  v
                </span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex h-72 items-center justify-center">
              <p className="text-slate-600">Loading products...</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="flex h-72 items-center justify-center">
              <p className="text-slate-600">No products available.</p>
            </div>
          ) : (
            <div className="space-y-20">
              {groups.map(([groupName, groupItems]) => (
                <section key={groupName} className="space-y-10">
                  <div className="flex items-center justify-center gap-4 text-center text-xs font-semibold uppercase tracking-[0.32em] text-amber-700">
                    <span className="h-[1px] w-14 bg-amber-300" />
                    <span>{groupName}</span>
                    <span className="h-[1px] w-14 bg-amber-300" />
                  </div>

                  <div className="grid grid-cols-1 gap-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-20 xl:gap-y-24">
                    {groupItems.map((product) => (
                      <Link
                        key={`${groupName}-${product.id}`}
                        href={`/product-details?sku=${encodeURIComponent(product.skuCode)}`}
                        className="group"
                      >
                        <div className="transition hover:-translate-y-1">
                          <div className="relative flex h-[280px] items-center justify-center">
                            <Image
                              src={product.image}
                              alt={product.name}
                              width={900}
                              height={700}
                              className="max-h-full w-auto max-w-full object-contain transition duration-500 group-hover:scale-[1.03]"
                            />
                          </div>
                          <div className="pt-4 text-center">
                            <h2 className="text-base font-semibold leading-tight text-slate-900">
                              {product.name}
                            </h2>
                            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
                              {getMetaLabel(product, groupBy)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
