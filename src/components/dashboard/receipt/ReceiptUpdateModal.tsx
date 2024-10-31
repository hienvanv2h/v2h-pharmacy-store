"use client";
import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";

import { ReceiptDTO, ReceiptView } from "@/types/receipt";
import Dropdown from "@/components/ui/Dropdown";

interface ReceiptUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>, data: any) => void;
  data?: ReceiptView;
}

export default function ReceiptUpdateModal({
  isOpen,
  onClose,
  onSubmit,
  data,
}: ReceiptUpdateModalProps) {
  const filteredData = useMemo(() => {
    if (!data) return {};

    const updateDto: Partial<ReceiptDTO> = {
      supplierId: data.supplierId,
      quantity: data.quantity,
      price: data.price,
    };
    return updateDto;
  }, [data]);

  const [formData, setFormData] = useState<Partial<ReceiptDTO>>(filteredData);

  useEffect(() => {
    setFormData(filteredData);
  }, [filteredData]);

  const handleInputChange = (key: string, value: string | number) => {
    setFormData((prev: any) => ({
      ...prev,
      [key]:
        typeof value === "string" && !isNaN(Number(value))
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(event, formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-900 bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-xl w-full mx-4 md:mx-auto my-auto overflow-y-auto min-h-[40vh] max-h-[90vh]">
        <div className="relative">
          <h2 className="text-xl font-bold mb-4">Update Receipt</h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-0 right-2 p-2 bg-gray-200 rounded-md hover:bg-gray-400 focus:outline-none"
          >
            X
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {formData &&
            Object.entries(formData).map(([key, value]) => (
              <div key={key} className="mb-4">
                <label className="block text-gray-700 text-md font-bold mb-2">
                  {key}
                </label>

                <input
                  min={0}
                  type={typeof value === "number" ? "number" : "text"}
                  value={typeof value === "number" ? value ?? 0 : value ?? ""}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>
            ))}

          <div className="flex justify-end mt-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded mr-2"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
