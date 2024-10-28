import { DashboardCategoryEnum } from "./dashboard-categories";

type OptionType = "CREATE" | "UPDATE" | "DELETE";

type DashboardCategory = {
  id: DashboardCategoryEnum;
  title: string;
  options?: OptionType[];
};

// Sidebar items for management dashboard
export const dashboardSideItems: DashboardCategory[] = [
  {
    id: DashboardCategoryEnum.MEDICINES,
    title: "Danh mục thuốc",
    options: ["CREATE", "UPDATE", "DELETE"],
  },
  {
    id: DashboardCategoryEnum.SUPPLIERS,
    title: "Danh mục nhà cung cấp",
    options: ["CREATE", "UPDATE"],
  },
  {
    id: DashboardCategoryEnum.CUSTOMERS,
    title: "Danh mục khách hàng đã đăng ký",
    options: ["UPDATE"],
  },
  {
    id: DashboardCategoryEnum.ORDERS,
    title: "Tra cứu đơn hàng",
    options: ["CREATE", "UPDATE"],
  },
  {
    id: DashboardCategoryEnum.RECEIPTS,
    title: "Tra cứu biên lai nhập hàng",
    options: [],
  },
];
