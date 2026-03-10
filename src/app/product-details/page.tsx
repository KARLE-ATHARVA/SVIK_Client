"use client";

import { useEffect, useState } from "react";

import ProductDetailsView from "@/components/products/ProductDetailsView";
import { fetchProductDetails, type ProductDetails } from "@/lib/productDetailsApi";

type LoadState =
  | { status: "idle"; product: null }
  | { status: "loading"; product: null }
  | { status: "error"; product: null }
  | { status: "success"; product: ProductDetails };

function NotFoundCard({ skuCode }: { skuCode: string }) {
  return (
    <main className="min-h-screen bg-[#f8f8f6] px-4 py-10 text-slate-900">
      <section className="mx-auto max-w-3xl rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_30px_60px_-20px_rgba(15,23,42,0.14)]">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-amber-600">
          Product Details
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Tile Not Found</h1>
        <p className="mt-3 text-base text-slate-600">
          No tile details were returned for SKU:{" "}
          <span className="font-semibold text-slate-900">{skuCode || "N/A"}</span>
        </p>
      </section>
    </main>
  );
}

function LoadingCard() {
  return (
    <main className="min-h-screen bg-[#f8f8f6] px-4 py-10 text-slate-900">
      <section className="mx-auto max-w-3xl rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_30px_60px_-20px_rgba(15,23,42,0.14)]">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-amber-600">
          Product Details
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Loading tile details…</h1>
        <p className="mt-3 text-base text-slate-600">Fetching product data.</p>
      </section>
    </main>
  );
}

export default function ProductDetailsPage() {
  const [skuCode, setSkuCode] = useState("");
  const [state, setState] = useState<LoadState>({ status: "idle", product: null });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    setSkuCode((params.get("sku") ?? "").trim());
  }, []);

  useEffect(() => {
    let active = true;

    if (!skuCode) {
      setState({ status: "idle", product: null });
      return () => {
        active = false;
      };
    }

    setState({ status: "loading", product: null });

    fetchProductDetails(skuCode)
      .then((product) => {
        if (!active) return;
        if (!product) {
          setState({ status: "error", product: null });
          return;
        }
        setState({ status: "success", product });
      })
      .catch(() => {
        if (!active) return;
        setState({ status: "error", product: null });
      });

    return () => {
      active = false;
    };
  }, [skuCode]);

  if (!skuCode) {
    return <NotFoundCard skuCode="N/A" />;
  }

  if (state.status === "loading" || state.status === "idle") {
    return <LoadingCard />;
  }

  if (state.status === "error") {
    return <NotFoundCard skuCode={skuCode} />;
  }

  return <ProductDetailsView product={state.product} />;
}
