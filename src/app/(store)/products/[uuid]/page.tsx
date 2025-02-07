import { Suspense } from "react";

import { getProductDetailViewByProductUuid, getProductImages } from "@/lib/api";
import ProductDetail from "@/components/products/ProductDetail";
import { ProductSliderWrapper } from "@/components/wrappers/ProductSliderWrapper";
import ErrorBoundary from "@/components/errors/ErrorBoundary";
import ReactHotToast from "@/components/ui/ReactHotToast";

export const revalidate = 10;

export default async function ProductDetailPage({
  params,
}: {
  params: { uuid: string };
}) {
  // Fetch product
  const product = await getProductDetailViewByProductUuid(params.uuid);
  if (!product)
    return (
      <div>
        Error fetching product details information. Please try again later.
      </div>
    );

  const productImages = await getProductImages(params.uuid);
  if (!productImages)
    return <div>Error fetching product images. Please try again later.</div>;

  // TODO: Implement product detail
  return (
    <div className=" flex flex-col gap-10 md:max-w-6xl mx-8 xl:mx-auto my-8">
      <ReactHotToast />

      {/* ProductDetail */}
      <ProductDetail product={product} productImages={productImages} />
      <hr />
      {/* RelatedProducts */}
      <ErrorBoundary fallback={<div>Error fetching products</div>}>
        <Suspense fallback={<div>Loading...</div>}>
          <ProductSliderWrapper
            fetchBy="category"
            identifier={product.category}
            label="Related Products"
          />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
