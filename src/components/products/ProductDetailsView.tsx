"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { ProductDetails } from "@/lib/productDetailsApi";

type ProductDetailsViewProps = {
  product: ProductDetails;
};

function toFixedSafe(value: number, digits: number): string {
  if (!Number.isFinite(value)) return "0.00";
  return value.toFixed(digits);
}

export default function ProductDetailsView({ product }: ProductDetailsViewProps) {
  const [boxCount, setBoxCount] = useState<number>(0);

  const totals = useMemo(() => {
    const safeBoxes = Number.isFinite(boxCount) && boxCount > 0 ? boxCount : 0;
    return {
      sqm: safeBoxes * product.coverageSqmPerBox,
      sqft: safeBoxes * product.coverageSqftPerBox,
    };
  }, [boxCount, product.coverageSqftPerBox, product.coverageSqmPerBox]);

  return (
    <main className="min-h-screen bg-[#f4f4f4] text-slate-900">
      <section className="mx-auto max-w-[1320px] px-4 py-6">
        <div className="mb-4 text-sm text-slate-500">
          Home / Glazed Vitrified Tiles
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="overflow-hidden rounded-sm bg-white shadow-sm">
            <div className="relative min-h-[540px] bg-slate-100">
              <Image
                src={product.faceImageUrl}
                alt={product.name}
                fill
                unoptimized
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover"
              />
            </div>
          </div>

          <aside className="rounded-sm bg-white p-6 shadow-sm">
            <h1 className="mb-6 text-4xl font-medium leading-tight">{product.name}</h1>

            <dl className="grid grid-cols-[132px_1fr] gap-x-3 gap-y-3 text-lg">
              <dt className="text-slate-500">Material</dt>
              <dd>{product.material}</dd>

              <dt className="text-slate-500">Application</dt>
              <dd>{product.application}</dd>

              <dt className="text-slate-500">Size</dt>
              <dd>{product.size}</dd>

              <dt className="text-slate-500">Looks Like</dt>
              <dd>{product.looksLike}</dd>

              <dt className="text-slate-500">Finish</dt>
              <dd>{product.finish}</dd>

              <dt className="text-slate-500">Colour</dt>
              <dd>{product.color}</dd>

              <dt className="text-slate-500">Qty. Per Box</dt>
              <dd>{product.qtyPerBox} Pcs</dd>

              <dt className="text-slate-500">Coverage</dt>
              <dd>
                {toFixedSafe(product.coverageSqmPerBox, 2)} sq mt / {toFixedSafe(product.coverageSqftPerBox, 1)} sq ft / box
              </dd>

              <dt className="text-slate-500">No. of Boxes</dt>
              <dd>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={boxCount}
                  onChange={(event) => setBoxCount(Number(event.target.value || 0))}
                  className="w-full max-w-[140px] border border-slate-300 px-2 py-1.5"
                />
              </dd>

              <dt className="text-slate-500">Total Area</dt>
              <dd>
                {toFixedSafe(totals.sqm, 2)} sq mt / {toFixedSafe(totals.sqft, 2)} sq ft
              </dd>
            </dl>

            <button
              type="button"
              className="mt-8 w-full bg-black px-5 py-4 text-left text-2xl font-bold tracking-wide text-white transition hover:bg-slate-800"
            >
              ADD TO CATALOG
            </button>
          </aside>
        </div>
      </section>
    </main>
  );
}
