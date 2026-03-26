
import ProductDetailsView from "@/components/products/ProductDetailsView";
import { fetchProductDetails } from "@/lib/productDetailsApi";

type ProductDetailsPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductDetailsPage({ params }: ProductDetailsPageProps) {
  const { slug } = await params;
  const skuCode = decodeURIComponent(String(slug || "").trim());
  const product = await fetchProductDetails(skuCode);
  if (!product) {
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

  return <ProductDetailsView product={product} />;
}