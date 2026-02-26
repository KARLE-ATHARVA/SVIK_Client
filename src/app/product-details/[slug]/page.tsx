import ProductDetailsView from "@/components/products/ProductDetailsView";
import { fetchProductDetails } from "@/lib/productDetailsApi";

type ProductDetailsPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductDetailsPage({ params }: ProductDetailsPageProps) {
  const { slug } = await params;
  const product = await fetchProductDetails(slug);

  return <ProductDetailsView product={product} />;
}
