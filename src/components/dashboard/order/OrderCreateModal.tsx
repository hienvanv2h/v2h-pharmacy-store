"use client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

import { OrderDTO } from "@/types/order";
import { MedicineDetailView } from "@/types/medicine-detail";
import {
  getAllMedicinesBrandName,
  getAllProductCategories,
  searchProducts,
} from "@/lib/api";
import ProductsFilter from "@/components/products/ProductsFilter";
import Pagination from "@/components/ui/Pagination";
import { useProductFilter } from "@/contexts/FilterContext";

interface OrderCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>, data: any) => void;
}

type ItemType = {
  medicineUuid: string;
  name: string;
  quantity: number;
};

export default function OrderCreateModal({
  isOpen,
  onClose,
  onSubmit,
}: OrderCreateModalProps) {
  const { filters, setFilters } = useProductFilter();

  const [formData, setFormData] = useState<{
    orderDto: OrderDTO;
    items: ItemType[];
  }>({
    orderDto: {
      customerId: 1,
      status: "Pending",
    },
    items: [],
  });

  const [medicinesViews, setMedicineViews] = useState<MedicineDetailView[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [brandNames, setBrandNames] = useState<string[]>([]);

  const [selectedItems, setSelectedItems] = useState<ItemType[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCategoriesAndBrandNames = async () => {
      const [fetchedCategories, fetchedBrandNames] = await Promise.all([
        getAllProductCategories(),
        getAllMedicinesBrandName(),
      ]);
      setCategories(fetchedCategories);
      setBrandNames(fetchedBrandNames);
    };

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
    console.log(formData);

    fetchCategoriesAndBrandNames();
    fetchMedicineDetailViews();
  }, [filters]);

  const handleItemSelect = (medicineView: MedicineDetailView) => {
    console.log("invoke handleItemSelect");
    setSelectedItems((prev) => {
      const existingItem = prev.find(
        (item) => item.medicineUuid === medicineView.uuid
      );

      const updatedItems = existingItem
        ? prev.filter((item) => item.medicineUuid !== medicineView.uuid)
        : [
            ...prev,
            {
              medicineUuid: medicineView.uuid,
              name: medicineView.name,
              quantity: 1,
            },
          ];
      setFormData((prev) => ({ ...prev, items: updatedItems }));
      return updatedItems;
    });
  };

  const handleQuantityChange = (medicineUuid: string, quantity: number) => {
    setSelectedItems((prev) => {
      const updatedItems = prev.map((item) =>
        item.medicineUuid === medicineUuid ? { ...item, quantity } : item
      );

      setFormData((prev) => ({ ...prev, items: updatedItems }));
      return updatedItems;
    });
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page: page }));
    setCurrentPage(page);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(event, formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-900 bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-7xl w-full mx-4 md:mx-auto my-auto overflow-y-auto h-[90vh]">
        <div className="relative mb-6">
          <h2 className="text-xl font-bold mb-4">Create New Order</h2>
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
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {medicinesViews.length > 0 ? (
                    medicinesViews.map((medicine) => (
                      <div
                        key={medicine.uuid}
                        onClick={() => handleItemSelect(medicine)}
                        className={`flex justify-between items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors duration-200 ${
                          selectedItems.some(
                            (item) => item.medicineUuid === medicine.uuid
                          )
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
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </div>
          </div>

          {/* Order Form Section */}
          <div className="bg-white p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Order Form</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium mb-3">Selected Items:</h4>
                <div className="space-y-3">
                  {selectedItems.map((item) => (
                    <div
                      key={item.medicineUuid}
                      className="flex items-center gap-3 p-2 bg-gray-100 rounded-lg"
                    >
                      <span className="flex-grow text-sm">{item.name}</span>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleQuantityChange(
                            item.medicineUuid,
                            parseInt(e.target.value)
                          )
                        }
                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                  ))}
                  {selectedItems.length === 0 && (
                    <p className="text-gray-500 text-sm italic">
                      No items selected
                    </p>
                  )}
                </div>
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
