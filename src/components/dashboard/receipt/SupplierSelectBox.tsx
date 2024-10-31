"use client";
import { useState, useEffect } from "react";

import Dropdown from "@/components/ui/Dropdown";
import { Supplier } from "@/types/supplier";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface SupplierSelectBoxProps {
  onSelect: (supplierId: number) => void;
}

export default function SupplierSelectBox({
  onSelect,
}: SupplierSelectBoxProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // get suppliers from local storage
    const cachedSuppliers = localStorage.getItem("suppliers");

    if (cachedSuppliers) {
      setSuppliers(JSON.parse(cachedSuppliers));
      setIsLoading(false);
    } else {
      const fetchSuppliers = async () => {
        setIsLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_API_URL}/suppliers`
        );
        if (response.ok) {
          const { result } = await response.json();
          setSuppliers(result as Supplier[]);
          // save suppliers to local storage
          localStorage.setItem("suppliers", JSON.stringify(result));
        }
        setIsLoading(false);
      };

      fetchSuppliers();
    }
  }, []);

  if (isLoading) return <LoadingSpinner />;

  const supplierNames = suppliers.map((supplier) => supplier.name); // get supplierNames

  const handleSelectSupplierName = (name: string) => {
    // get customer id
    const supplierId = suppliers.find(
      (supplier) => supplier.name === name
    )?.supplierId;
    onSelect(supplierId || 0);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-2 bg-gray-100 rounded-lg">
      <span className="flex-grow text-sm">Nhà cung cấp:</span>
      <Dropdown options={supplierNames} onSelect={handleSelectSupplierName} />
    </div>
  );
}
