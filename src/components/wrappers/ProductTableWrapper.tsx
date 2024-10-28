"use client";
import { useState, useEffect } from "react";

import { getProductsByUuids } from "@/lib/api";
import { CartContextType, useCartContext } from "@/contexts/CartContext";
import ProductTable from "../products/ProductTable";
import { MedicineView } from "@/types/medicine";

export default function ProductTableWrapper() {
  const { state } = useCartContext() as CartContextType;
  const { cart } = state;

  const [cartProducts, setCartProducts] = useState<MedicineView[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCartProducts = async () => {
      if (cart.length > 0) {
        const productUuids = cart.map((item) => item.productUuid);
        const data = await getProductsByUuids(productUuids);
        setCartProducts(data);
      }
      setIsLoading(false);
    };
    fetchCartProducts();
  }, [cart]);

  if (cartProducts.length === 0) {
    return <div className="text-center">No products in cart</div>;
  }

  return (
    <>
      {isLoading ? (
        <div className="text-center">Loading products...</div>
      ) : (
        <ProductTable products={cartProducts} />
      )}
    </>
  );
}
