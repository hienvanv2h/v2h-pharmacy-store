"use client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

import { MedicineBatchDTO } from "@/types/medicine-batch";
import { ReceiptDTO } from "@/types/receipt";
import { MedicineDetailView } from "@/types/medicine-detail";
import { useProductFilter } from "@/contexts/FilterContext";
import {
  getAllMedicinesBrandName,
  getAllProductCategories,
  searchProducts,
} from "@/lib/api";
import ProductsFilter from "@/components/products/ProductsFilter";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import SupplierSelectBox from "./SupplierSelectBox";

interface ReceiptCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>, data: any) => void;
}

type FormDataType = {
  medicineBatchDto: Partial<MedicineBatchDTO>;
  receiptDto: Partial<ReceiptDTO>;
};

export default function ReceiptCreateModal({
  isOpen,
  onClose,
  onSubmit,
}: ReceiptCreateModalProps) {
  const { filters, setFilters } = useProductFilter();

  const [formData, setFormData] = useState<FormDataType>({
    medicineBatchDto: {
      medicineUuid: "",
      expirationDate: new Date(),
    },
    receiptDto: {
      supplierId: null,
      quantity: 0,
      price: 0,
      createdBy: "",
    },
  });

  const [medicinesViews, setMedicineViews] = useState<MedicineDetailView[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [brandNames, setBrandNames] = useState<string[]>([]);

  const [selectedMedicine, setSelectedMedicine] =
    useState<MedicineDetailView | null>(null);

  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // get categories and brand names from local storage
    const storedCategories = localStorage.getItem("categories");
    const storedBrandNames = localStorage.getItem("brandNames");

    if (storedCategories && storedBrandNames) {
      setCategories(JSON.parse(storedCategories));
      setBrandNames(JSON.parse(storedBrandNames));
    } else {
      const fetchCategoriesAndBrandNames = async () => {
        const [fetchedCategories, fetchedBrandNames] = await Promise.all([
          getAllProductCategories(),
          getAllMedicinesBrandName(),
        ]);
        setCategories(fetchedCategories);
        setBrandNames(fetchedBrandNames);
        // save categories and brand names to local storage
        localStorage.setItem("categories", JSON.stringify(fetchedCategories));
        localStorage.setItem("brandNames", JSON.stringify(fetchedBrandNames));
      };

      fetchCategoriesAndBrandNames();
    }

    const fetchMedicineDetailViews = async () => {
      setIsLoading(true);
      try {
        const { result, totalItems } = await searchProducts(
          filters.categories,
          filters.brandName,
          filters.keyword,
          filters.page,
          filters.itemsPerPage
        );
        setTotalPages(Math.ceil(totalItems / itemsPerPage));
        setMedicineViews(result);
      } catch (error) {
        console.error("Error fetching medicines:", error);
        toast.error("Failed to fetch medicines");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMedicineDetailViews();
  }, [filters]);

  const handleMedicineRowSelect = (medicineView: MedicineDetailView) => {
    setSelectedMedicine(medicineView);
    setFormData((prev) => ({
      ...prev,
      medicineBatchDto: {
        ...prev.medicineBatchDto,
        medicineUuid: medicineView.uuid,
      },
    }));
  };

  const handleQuantityChange = (value: number) => {
    setFormData((prev) => ({
      ...prev,
      receiptDto: { ...prev.receiptDto, quantity: value },
    }));
  };

  const handleExpirationDateChange = (date: Date) => {
    setFormData((prev) => ({
      ...prev,
      medicineBatchDto: { ...prev.medicineBatchDto, expirationDate: date },
    }));
  };

  const handlePriceChange = (value: string) => {
    let parsedValue = parseInt(value);
    if (isNaN(parsedValue) || parsedValue < 0) {
      parsedValue = 0;
    }
    setFormData((prev) => ({
      ...prev,
      receiptDto: { ...prev.receiptDto, price: parsedValue },
    }));
  };

  const handleSupplierSelect = (supplierId: number) => {
    setFormData((prev) => ({
      ...prev,
      receiptDto: { ...prev.receiptDto, supplierId: supplierId },
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page: page }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log(formData);
    // onSubmit(event, formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-900 bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-7xl w-full mx-4 md:mx-auto my-auto overflow-y-auto h-[90vh]">
        <div className="relative mb-6">
          <h2 className="text-xl font-bold mb-4">Create New Receipt</h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-0 right-2 p-2 bg-gray-200 rounded-md hover:bg-gray-400 focus:outline-none"
          >
            X
          </button>
        </div>

        {/* Medicine Filter */}
        <ProductsFilter categories={categories} brandNames={brandNames} />

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          {/* Medicine List Section */}
          <div className="md:col-span-2">
            <div className="bg-white p-4 border border-gray-200 rounded-lg h-full">
              <h3 className="text-lg font-semibold mb-4">Medicine List</h3>

              {isLoading ? (
                <LoadingSpinner />
              ) : (
                <div className="space-y-4">
                  {medicinesViews.length > 0 ? (
                    medicinesViews.map((medicine) => (
                      <div
                        key={medicine.uuid}
                        onClick={() => handleMedicineRowSelect(medicine)}
                        className={`flex justify-between items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors duration-200 ${
                          selectedMedicine?.uuid === medicine.uuid
                            ? "bg-gray-100"
                            : ""
                        }`}
                      >
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {medicine.name}
                          </h4>
                          <div className="mt-1 text-sm text-gray-600">
                            <p>Brand: {medicine.brandName}</p>
                            <p>Category: {medicine.category}</p>
                          </div>
                        </div>

                        <div>
                          <span>
                            Quantity in stock: {medicine.totalQuantity}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No results found.</p>
                  )}
                </div>
              )}

              {/* Pagination */}
              <div className="mt-4 flex justify-center">
                <Pagination
                  currentPage={filters.page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </div>
          </div>

          {/* Order Form Section */}
          <div className="bg-white p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Receipt Form</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium mb-3">Selected Items:</h4>

                {selectedMedicine ? (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-700">
                      {selectedMedicine.name}
                    </h3>

                    <div className="flex items-center gap-3 p-2 bg-gray-100 rounded-lg">
                      <span className="flex-grow text-sm">Số lượng:</span>
                      <input
                        type="number"
                        min="1"
                        value={formData.receiptDto.quantity}
                        onChange={(e) =>
                          handleQuantityChange(parseInt(e.target.value || "0"))
                        }
                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 p-2 bg-gray-100 rounded-lg">
                      <span className="flex-grow text-sm">Hạn sử dụng:</span>
                      <input
                        type="date"
                        value={
                          formData.medicineBatchDto?.expirationDate
                            ? formData.medicineBatchDto?.expirationDate
                                ?.toISOString()
                                .split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          handleExpirationDateChange(new Date(e.target.value))
                        }
                        className="w-40 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 p-2 bg-gray-100 rounded-lg">
                      <span className="flex-grow text-sm">Tổng tiền:</span>
                      <input
                        type="number"
                        value={formData.receiptDto.price}
                        onChange={(e) => handlePriceChange(e.target.value)}
                        className="w-40 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic">
                    No items selected
                  </p>
                )}

                <SupplierSelectBox onSelect={handleSupplierSelect} />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Create Order
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
