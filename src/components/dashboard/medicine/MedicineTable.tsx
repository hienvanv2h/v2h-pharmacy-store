"use client";
import dynamic from "next/dynamic";
import { useState } from "react";

import { MedicineView } from "@/types/medicine";
import { useScrollLock } from "@/hooks/useScrollLock";
import DeleteModal from "../DeleteModal";
import toast from "react-hot-toast";

const MedicineFormModal = dynamic(() => import("./MedicineFormModal"), {
  loading: () => <div>Loading modal...</div>,
  ssr: false,
});

interface MedicineTableProps {
  tableData: MedicineView[];
  rowOptions?: string[];
  onRefresh: () => void;
}

export default function MedicineTable({
  tableData,
  rowOptions = [],
  onRefresh,
}: MedicineTableProps) {
  const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Lock scroll when any modal is open
  useScrollLock(isTagsModalOpen || isUpdateModalOpen || isDeleteModalOpen);

  const [modalData, setModalData] = useState<any>(null);
  const [isSelectedRow, setIsSelectedRow] = useState<any>(null);

  const openTagsModal = (tagsJsonArr: any[]) => {
    setModalData(tagsJsonArr);
    setIsTagsModalOpen(true);
  };

  const openUpdateModal = (rowData: any) => {
    setModalData(rowData); // store the row data
    setIsUpdateModalOpen(true);
  };

  const openDeleteModal = (rowData: any) => {
    setModalData(rowData); // store the row data
    setIsDeleteModalOpen(true);
  };

  const closeModals = () => {
    setIsTagsModalOpen(false);
    setIsUpdateModalOpen(false);
    setIsDeleteModalOpen(false);
    setModalData(null);
  };

  const handleUpdateSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
    data: any
  ) => {
    event.preventDefault();

    const identifier = modalData["uuid"];
    const toastId = toast.loading("Updating data...");

    try {
      // Remap the data to match the API
      const mappedData = {
        medicineDto: data.medicineData,
        medicineDetailDto: data.medicineDetailData,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API_URL}/medicines/${identifier}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(mappedData),
        }
      );

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error);
      }

      toast.success("Data updated successfully");
      closeModals();
      onRefresh();
    } catch (error) {
      console.error("Failed to update data:", error);
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      toast.dismiss(toastId);
    }
  };

  const handleDeleteConfirm = async () => {
    const identifier = modalData["uuid"];
    const toastId = toast.loading("Deleting data...");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API_URL}/medicines/${identifier}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error);
      }

      toast.success("Data deleted successfully");
      closeModals();
      onRefresh();
    } catch (error) {
      console.error("Failed to delete data:", error);
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      toast.dismiss(toastId);
    }
  };

  // Early return if tableData is empty
  if (!tableData || tableData.length === 0) {
    return <p className="text-center text-lg mt-10">Không có dữ liệu</p>;
  }

  const columns = Object.keys(tableData[0]).slice(1); // Exclude ID/UUID (NOTE: must be in the first column)

  return (
    <div className="relative overflow-x-auto max-w-full">
      <table className="min-w-full bg-white border-collapse border border-slate-400">
        <thead className="bg-gray-100">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                className="border border-slate-300 px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
              >
                {column}
              </th>
            ))}

            <th className="border border-slate-300 px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[120px]">
              Tùy chọn
            </th>
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {tableData.map((row, index) => (
            <tr
              key={index}
              onClick={() => setIsSelectedRow(index)}
              className={isSelectedRow === index ? "bg-blue-100" : ""}
            >
              {columns.map((column) => (
                <td
                  key={`${index}-${column}`}
                  className="border border-slate-300 px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-[400px] truncate"
                >
                  {/* Kiểm tra nếu giá trị cột là kiểu JSON thì hiển thị button để xem chi tiết trong modal */}
                  {column === "tags" ? (
                    <button
                      onClick={() => openTagsModal((row as any)[column])}
                      className="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-2 py-1 text-center hover:underline"
                    >
                      Xem chi tiết
                    </button>
                  ) : (
                    (row as any)[column]
                  )}
                </td>
              ))}

              <td className="border border-slate-300 px-6 py-4">
                <div className="flex items-center justify-center gap-4">
                  {/* Hiển thị button mở modal cập nhật dữ liệu */}
                  {rowOptions.includes("UPDATE") && (
                    <button
                      onClick={() => openUpdateModal(row)}
                      className="w-full text-nowrap text-white bg-red-700 hover:bg-red-800 font-medium rounded-lg text-sm px-2 py-1 text-center hover:underline"
                    >
                      Chỉnh sửa
                    </button>
                  )}

                  {/* Hiển thị button mở modal xác nhận xóa dữ liệu */}
                  {rowOptions.includes("DELETE") && (
                    <button
                      onClick={() => openDeleteModal(row)}
                      className="w-full text-nowrap text-white bg-red-700 hover:bg-red-800 font-medium rounded-lg text-sm px-2 py-1 text-center hover:underline"
                    >
                      Xóa
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal show tags */}
      {isTagsModalOpen && modalData && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-900 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
            <h2 className="text-2xl font-bold mb-4">Tags Info</h2>
            <div className="space-y-4">
              <div className="flex flex-col">
                <span className="font-bold text-gray-700">Data:</span>
                <span className="text-gray-600">
                  {JSON.stringify(modalData)}
                </span>
              </div>
            </div>
            <button
              onClick={closeModals}
              className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Modal xác nhận xóa dữ liệu */}
      {isDeleteModalOpen && modalData && (
        <DeleteModal
          isOpen={isDeleteModalOpen}
          onClose={closeModals}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {/* Modal cập nhật dữ liệu */}
      {isUpdateModalOpen && modalData && (
        <MedicineFormModal
          mode={"update"}
          isOpen={isUpdateModalOpen}
          onClose={closeModals}
          onSubmit={handleUpdateSubmit}
          data={modalData}
        />
      )}
    </div>
  );
}
