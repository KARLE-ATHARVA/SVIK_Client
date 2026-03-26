
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { ProductDetails } from "@/lib/productDetailsApi";

type ProductDetailsViewProps = {
  product: ProductDetails;
};

export default function ProductDetailsView({ product }: ProductDetailsViewProps) {
  const fallbackImage = product.fallbackImageUrl;
  const [mainImageSrc, setMainImageSrc] = useState<string>(product.faceImageUrl || fallbackImage);

  useEffect(() => {
    setMainImageSrc(product.faceImageUrl || fallbackImage);
  }, [product.faceImageUrl]);

  return (
    <main className="min-h-screen bg-[#f8f8f6] text-slate-900">
      <section className="relative overflow-hidden px-4 py-6 lg:px-8">
        <div className="pointer-events-none absolute right-[-5%] top-[-8%] h-[420px] w-[420px] rounded-full bg-amber-200/25 blur-[110px]" />
        <div className="pointer-events-none absolute bottom-[-12%] left-[-4%] h-[500px] w-[500px] rounded-full bg-slate-200/50 blur-[120px]" />

        <div className="relative mx-auto max-w-[1380px]">
          <div className="mb-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
            <span className="h-[1px] w-8 bg-amber-500" />
            <span>Home / {product.category}</span>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="rounded-[30px] border border-white/80 bg-white/70 p-4 shadow-[0_25px_60px_-20px_rgba(15,23,42,0.22)] backdrop-blur-sm lg:p-6">
              <div className="relative h-[360px] overflow-hidden rounded-[24px] border border-slate-200/70 bg-slate-100 lg:h-[520px]">
                <div className="absolute left-4 top-4 z-10 rounded-full bg-white/92 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-700 shadow-sm">
                  {product.skuCode}
                </div>
                <Image
                  src={mainImageSrc}
                  alt={product.name}
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 65vw"
                  className="object-cover"
                  onError={() => setMainImageSrc(fallbackImage)}
                />
              </div>
            </div>

            <aside className="rounded-[30px] border border-slate-100 bg-white p-6 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.12)] lg:p-8">
              <div className="mb-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                  {product.application}
                </span>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-700">
                  {product.finish}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600">
                  {product.color}
                </span>
              </div>

              <h1 className="mb-7 text-3xl font-extrabold leading-tight text-slate-900 lg:text-5xl">
                {product.name}
              </h1>

              <dl className="space-y-4">
                <div className="grid grid-cols-[130px_1fr] items-center gap-3 border-b border-slate-100 pb-3">
                  <dt className="text-sm font-bold uppercase tracking-wide text-slate-400">SKU Code</dt>
                  <dd className="text-base font-semibold text-slate-900">{product.skuCode}</dd>
                </div>
                <div className="grid grid-cols-[130px_1fr] items-center gap-3 border-b border-slate-100 pb-3">
                  <dt className="text-sm font-bold uppercase tracking-wide text-slate-400">Category</dt>
                  <dd className="text-base font-semibold text-slate-900">{product.category}</dd>
                </div>
                <div className="grid grid-cols-[130px_1fr] items-center gap-3 border-b border-slate-100 pb-3">
                  <dt className="text-sm font-bold uppercase tracking-wide text-slate-400">Application</dt>
                  <dd className="text-base font-semibold text-slate-900">{product.application}</dd>
                </div>
                <div className="grid grid-cols-[130px_1fr] items-center gap-3 border-b border-slate-100 pb-3">
                  <dt className="text-sm font-bold uppercase tracking-wide text-slate-400">Space</dt>
                  <dd className="text-base font-semibold text-slate-900">{product.space}</dd>
                </div>
                <div className="grid grid-cols-[130px_1fr] items-center gap-3 border-b border-slate-100 pb-3">
                  <dt className="text-sm font-bold uppercase tracking-wide text-slate-400">Size</dt>
                  <dd className="text-base font-semibold text-slate-900">{product.size}</dd>
                </div>
                <div className="grid grid-cols-[130px_1fr] items-center gap-3 border-b border-slate-100 pb-3">
                  <dt className="text-sm font-bold uppercase tracking-wide text-slate-400">Finish</dt>
                  <dd className="text-base font-semibold text-slate-900">{product.finish}</dd>
                </div>
                <div className="grid grid-cols-[130px_1fr] items-center gap-3 border-b border-slate-100 pb-3">
                  <dt className="text-sm font-bold uppercase tracking-wide text-slate-400">Color</dt>
                  <dd className="text-base font-semibold text-slate-900">{product.color}</dd>
                </div>
                <div className="h-1" />
              </dl>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}