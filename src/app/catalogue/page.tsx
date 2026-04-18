"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { listCatalogueItems, removeFromCatalogue, type LocalCatalogueItem } from "@/lib/localCatalogue";

export default function CataloguePage() {
  const [items, setItems] = useState<LocalCatalogueItem[]>(() => listCatalogueItems());

  useEffect(() => {
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
                <div key={item.skuCode} className="group">
                  <div className="relative flex h-[320px] items-center justify-center">
                    <div className="pointer-events-none absolute inset-x-8 bottom-6 h-12 rounded-full bg-slate-300/20 blur-2xl transition duration-500 group-hover:bg-amber-200/30" />
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      unoptimized
                      className="object-contain transition duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="mt-2 text-center">
                    <div className="text-sm font-extrabold uppercase tracking-[0.08em] text-slate-900">
                      {item.name}
                    </div>
                    <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-700/80">
                      {item.size || "Size unavailable"}
                    </div>
                    <div className="mt-5 flex items-center justify-center gap-3">
                      <div className="rounded-full border border-slate-200/80 bg-white/60 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600 backdrop-blur-sm">
                        {item.skuCode}
                      </div>
                      <button
                        onClick={() => removeFromCatalogue(item.skuCode)}
                        className="rounded-full border border-amber-200 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700 transition hover:border-amber-300 hover:bg-amber-50"
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
