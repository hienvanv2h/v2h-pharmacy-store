import { Suspense } from "react";

import { ProductsFilterWrapper } from "@/components/wrappers/ProductsFilterWrapper";
import { ProductListWrapper } from "@/components/wrappers/ProductListWrapper";
import ErrorBoundary from "@/components/errors/ErrorBoundary";

export const revalidate = 10;

// Loading components
const ProductsFilterLoading = () => <div>Loading filters...</div>;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { page: string };
}) {
  return (
    <div className="flex flex-col justify-between gap-8">
      <ErrorBoundary fallback={<div>Error loading filters</div>}>
        <Suspense fallback={<ProductsFilterLoading />}>
          <ProductsFilterWrapper />
        </Suspense>
      </ErrorBoundary>

      <ProductListWrapper />
    </div>
  );
}
