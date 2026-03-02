"use client";

import { useState } from "react";
import Image from "next/image";
import type { ProductDetails } from "@/lib/productDetailsApi";

type ProductDetailsViewProps = {
  product: ProductDetails;
};

export default function ProductDetailsView({ product }: ProductDetailsViewProps) {
  const localFallbackImage = "/tiles/tile-1.jpg";
  const imageCandidates = [
    product.faceImageUrl,
    product.fallbackImageUrl,
    localFallbackImage,
  ].filter((value, index, list) => Boolean(value) && list.indexOf(value) === index);
  const [imageIndex, setImageIndex] = useState(0);
  const mainImageSrc = imageCandidates[Math.min(imageIndex, imageCandidates.length - 1)];

  return (
    <main className="min-h-screen bg-[#f8f8f6] text-slate-900">
      <section className="relative overflow-hidden px-4 py-6 sm:px-6 lg:px-10 xl:px-14 2xl:px-20">
        <div className="pointer-events-none absolute right-[-5%] top-[-8%] h-[420px] w-[420px] rounded-full bg-amber-200/25 blur-[110px]" />
        <div className="pointer-events-none absolute bottom-[-12%] left-[-4%] h-[500px] w-[500px] rounded-full bg-slate-200/50 blur-[120px]" />

        <div className="relative w-full">
          <div className="mb-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
            <span className="h-[1px] w-8 bg-amber-500" />
            <span>Home / {product.category}</span>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:min-h-[calc(100vh-85px)] lg:grid-cols-[minmax(0,1.7fr)_minmax(360px,1fr)] xl:gap-8">
            <div className="rounded-[30px] border border-white/80 bg-white/70 p-4 shadow-[0_25px_60px_-20px_rgba(15,23,42,0.22)] backdrop-blur-sm lg:p-6">
              <div className="relative overflow-hidden rounded-[24px] border border-slate-200/70 bg-slate-100 p-3 lg:p-5">
                <div className="absolute left-4 top-4 z-10 rounded-full bg-white/92 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-700 shadow-sm">
                  {product.skuCode}
                </div>
                <Image
                  src={mainImageSrc}
                  alt={product.name}
                  width={1600}
                  height={1600}
                  unoptimized
                  className="h-auto w-full max-h-[72vh] object-contain"
                  onError={() =>
                    setImageIndex((previous) => Math.min(previous + 1, imageCandidates.length - 1))
                  }
                />
              </div>
            </div>

            <aside className="rounded-[30px] border border-slate-100 bg-white p-6 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.12)] lg:h-full lg:p-8">
              
              <h1 className="mb-7 text-3xl font-bold leading-tight text-slate-900 lg:text-3xl">
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
