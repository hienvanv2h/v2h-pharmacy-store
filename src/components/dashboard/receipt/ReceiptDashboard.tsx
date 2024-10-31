"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

import { ReceiptView } from "@/types/receipt";
import { dashboardSideItems } from "@/lib/dashboard-items";
import RefreshIcon from "../../../public/images/refresh-cw-alt.svg";
import ReceptTable from "./ReceiptTable";
import LoadingTable from "../LoadingTable";
import Pagination from "@/components/ui/Pagination";
import { DashboardCategoryEnum } from "@/lib/dashboard-categories";
import { useScrollLock } from "@/hooks/useScrollLock";

const ReceiptCreateModal = dynamic(() => import("./ReceiptCreateModal"), {
  loading: () => <div>Loading modal...</div>,
  ssr: false,
});

export default function ReceiptDashboard() {
  const [tableData, setTableData] = useState<ReceiptView[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useScrollLock(isCreateModalOpen);

  const rowOptions =
    dashboardSideItems.find(
      (item) => item.id === DashboardCategoryEnum.RECEIPTS
    )?.options || [];

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const fetchTableData = async (page: number = 1) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API_URL}/receipts?page=${page}&limit=${itemsPerPage}`
      );
      if (response.ok) {
        const { result, totalItems } = await response.json();

        setTotalPages(Math.ceil(totalItems / itemsPerPage));
        setTableData(result as ReceiptView[]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error fetching data");
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchTableData();
  }, []);

  const handleCreateSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
    data: any
  ) => {
    event.preventDefault();

    const toastId = toast.loading("Creating data...");
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API_URL}/suppliers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error);
      }

      toast.success("Data created successfully");
      setIsCreateModalOpen(false);
      handleRefresh();
    } catch (error) {
      console.error("Failed to create data:", error);
      toast.error(error instanceof Error ? error.message : "Create failed");
    } finally {
      toast.dismiss(toastId);
    }
  };

  const handleRefresh = () => {
    setIsLoadingData(true);
    setCurrentPage(1); // Reset to the first page
    fetchTableData(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchTableData(page);
  };

  return (
    <>
      {/* Dashboard Options */}
      <div className="flex justify-start items-start gap-2 mb-2">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded flex items-center justify-center w-12 h-10"
          onClick={handleRefresh}
        >
          <RefreshIcon className="w-5 h-5" fill="none" stroke="white" />
        </button>

        {rowOptions.includes("CREATE") && (
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded flex items-center justify-center w-24 h-10 text-nowrap"
            onClick={() => setIsCreateModalOpen(true)}
          >
            Thêm mới
          </button>
        )}
      </div>

      {/* Table */}
      {isLoadingData ? (
        <LoadingTable />
      ) : (
        <ReceptTable
          tableData={tableData}
          rowOptions={rowOptions}
          onRefresh={handleRefresh}
        />
      )}

      {/* Modal thêm mới dữ liệu */}
      {isCreateModalOpen && (
        <ReceiptCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateSubmit}
        />
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </>
  );
}