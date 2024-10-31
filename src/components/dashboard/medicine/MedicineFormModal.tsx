"use client";
import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";

import { MedicineDTO, MedicineView, isMedicineView } from "@/types/medicine";
import Dropdown from "@/components/ui/Dropdown";
import { isMedicineDetail } from "@/types/medicine-detail";
import ImageUpload from "@/components/forms/ImageUpload";

interface MedicineFormModalProps {
  mode: "create" | "update";
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>, data: any) => void;
  data?: MedicineView | MedicineDTO;
}

export default function MedicineFormModal({
  mode,
  isOpen,
  onClose,
  onSubmit,
  data,
}: MedicineFormModalProps) {
  // Filter out UUID, createdAt, updatedAt from data - cached this
  const filteredData = useMemo(() => {
    if (!data) return {};
    if (isMedicineView(data)) {
      const medicineDto: MedicineDTO = {
        name: data.name,
        category: data.category,
        description: data.description,
        price: data.price,
        quantityUnit: data.quantityUnit,
        tags: data.tags,
        thumbnailUrl: data.thumbnailUrl || null,
      };
      return medicineDto;
    }

    return data;
  }, [data, mode]);

  const [formData, setFormData] = useState<{
    medicineData: Record<string, any>;
    medicineDetailData?: any;
  }>({
    medicineData: filteredData,
    medicineDetailData: null,
  });

  const [showMedicineDetail, setShowMedicineDetail] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    formData.medicineData.tags || []
  );
  const [selectedImageName, setSelectedImageName] = useState<string>("");

  const tagsList = ["new", "sale", "popular"]; // Hardcoded for now

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      medicineData: filteredData,
    }));
  }, [filteredData]);

  useEffect(() => {
    const fetchDetail = async () => {
      let medicineDetailData = null;

      // Fetch medicine detail only in "update" mode
      if (
        mode === "update" &&
        data &&
        isMedicineView(data) &&
        showMedicineDetail
      ) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_API_URL}/medicine-details?medicineUuid=${data.uuid}`
          );

          if (response.ok) {
            const data = await response.json();
            if (isMedicineDetail(data)) {
              const { detailId, medicineUuid, createdAt, updatedAt, ...rest } =
                data;
              medicineDetailData = rest;
            }
          }
        } catch (error) {
          console.error("Error fetching product detail:", error);
          toast.error("Error fetching product detail");
        }
      }

      // Update form data state
      setFormData((prev) => ({
        ...prev,
        medicineDetailData,
      }));
    };

    fetchDetail();
  }, [data, mode, showMedicineDetail]);

  const handleTagChange = (value: string) => {
    setSelectedTags((prev) => {
      let newTags = prev.includes(value)
        ? prev.filter((tag) => tag !== value) // Remove if exists
        : [...prev, value]; // Add if not exists

      // Update formData
      setFormData((prev: any) => ({
        ...prev,
        medicineData: {
          ...prev.medicineData,
          tags: newTags,
        },
      }));

      return newTags; // Return updated state for selectedTags
    });
  };

  const handleMedicineInputChange = (key: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      medicineData: {
        ...prev.medicineData,
        [key]: value,
      },
    }));
  };

  const handleMedicineDetailInputChange = (key: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      medicineDetailData: {
        ...prev.medicineDetailData,
        [key]: value,
      },
    }));
  };

  const handleImageUploadSuccess = (result: any) => {
    if (typeof result.info === "object" && "secure_url" in result.info) {
      // Save image url to formData
      setFormData((prev: any) => ({
        ...prev,
        medicineData: {
          ...prev.medicineData,
          thumbnailUrl: result.info.secure_url,
        },
      }));
      setSelectedImageName(result.info.original_filename);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Create copy of formData
    const submissionData = {
      ...formData,
      medicineData: { ...formData.medicineData },
    };

    // handle case the thumbnailUrl is null but its input set to ""
    // which then saved in database converted to "null" and can cause error when loading img src
    const isThumbnailEmpty =
      !submissionData.medicineData.thumbnailUrl ||
      String(submissionData.medicineData.thumbnailUrl).trim() === "";

    if (isThumbnailEmpty) {
      submissionData.medicineData.thumbnailUrl = null;
    }

    onSubmit(event, submissionData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-900 bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-xl w-full mx-4 md:mx-auto my-auto overflow-y-auto max-h-[90vh]">
        <div className="relative">
          <h2 className="text-xl font-bold mb-4">
            {mode === "create" ? "Create Item" : "Update Item"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-0 right-2 p-2 bg-gray-200 rounded-md hover:bg-gray-400 focus:outline-none"
          >
            X
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {/* Product */}
          {Object.entries(formData.medicineData).map(([key, value]) => (
            <div key={key} className="mb-4">
              <label className="block text-gray-700 text-md font-bold mb-2">
                {key}
              </label>

              {key === "tags" ? (
                // Nếu là cột tags
                <div className="mb-2">
                  <Dropdown options={tagsList} onSelect={handleTagChange} />

                  <input
                    type="text"
                    value={selectedTags.join(", ")}
                    readOnly
                    className="w-full mt-2 px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                  />
                </div>
              ) : key === "thumbnailUrl" ? (
                // Nếu là thumbnailUrl
                <div className="space-y-2">
                  <ImageUpload
                    onSuccess={handleImageUploadSuccess}
                    onError={(error) => {
                      console.error("Error uploading image:", error);
                      toast.error("Đã có lỗi xảy ra khi upload ảnh");
                    }}
                  />
                  <p className="text-sm text-gray-500 text-wrap line-clamp-2">
                    Original Name: {selectedImageName}
                  </p>
                  <p className="text-sm text-gray-500 text-wrap break-words">
                    Source URL: {formData.medicineData.thumbnailUrl}
                  </p>
                </div>
              ) : (
                // Nếu là các input bình thường
                <input
                  type={typeof value === "number" ? "number" : "text"}
                  value={typeof value === "number" ? value ?? 0 : value ?? ""}
                  onChange={(e) =>
                    handleMedicineInputChange(key, e.target.value)
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                />
              )}
            </div>
          ))}

          {/* Product Detail */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <label className="block text-gray-700 text-md font-bold">
                Product Detail
              </label>
              <button
                type="button"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={() => setShowMedicineDetail(!showMedicineDetail)}
              >
                {showMedicineDetail ? "Hide" : "Show"}
              </button>
            </div>

            {formData.medicineDetailData && showMedicineDetail && (
              <div className="space-y-4 border-t pt-4">
                {Object.entries(formData.medicineDetailData).map(
                  ([key, value]) => (
                    <div key={key} className="border p-4 rounded-lg">
                      <label className="block text-gray-700 text-md font-bold mb-2">
                        {key}
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                        value={value ? String(value) : ""}
                        onChange={(e) =>
                          handleMedicineDetailInputChange(key, e.target.value)
                        }
                      />
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end mt-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded mr-2"
            >
              {mode === "create" ? "Create" : "Save"}
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
