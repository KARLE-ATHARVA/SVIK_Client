"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { listCatalogueItems, removeFromCatalogue, type LocalCatalogueItem } from "@/lib/localCatalogue";

export default function CataloguePage() {
  const [items, setItems] = useState<LocalCatalogueItem[]>([]);

  useEffect(() => {
    setItems(listCatalogueItems());
    const onUpdate = () => setItems(listCatalogueItems());
    window.addEventListener("catalogue:updated", onUpdate);
    return () => window.removeEventListener("catalogue:updated", onUpdate);
  }, []);

  return (
    <main className="min-h-screen bg-[#f8f8f6] text-slate-900">
      <section className="relative overflow-hidden px-4 py-10 sm:px-6 lg:px-10 xl:px-14 2xl:px-20">
        <div className="pointer-events-none absolute right-[-5%] top-[-8%] h-[420px] w-[420px] rounded-full bg-amber-200/20 blur-[110px]" />
        <div className="pointer-events-none absolute bottom-[-12%] left-[-4%] h-[500px] w-[500px] rounded-full bg-slate-200/40 blur-[120px]" />

        <div className="relative mx-auto max-w-[1440px]">
          <div className="mb-10 flex flex-col items-center gap-3 text-center">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Catalogue
            </h1>
          </div>

          {items.length === 0 ? (
            <div className="h-72 flex items-center justify-center">
              <p className="text-slate-600">No items in catalogue yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-20 xl:gap-y-20">
              {items.map((item) => (
                <div key={item.skuCode} className="rounded-3xl bg-white p-4 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.12)]">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-slate-100">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      unoptimized
                      className="object-contain"
                    />
                  </div>
                  <div className="mt-4">
                    <div className="text-[11px] font-extrabold uppercase">{item.name}</div>
                    <div className="text-[9px] uppercase tracking-widest text-slate-400">
                      {item.size || "Size unavailable"}
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <div className="rounded-full bg-slate-100 px-3 py-1 text-[9px] font-bold uppercase text-slate-600">
                        {item.skuCode}
                      </div>
                      <button
                        onClick={() => removeFromCatalogue(item.skuCode)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-[9px] font-bold uppercase text-slate-600 hover:bg-slate-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
