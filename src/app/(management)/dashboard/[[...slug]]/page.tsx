import { notFound } from "next/navigation";

import { dashboardSideItems } from "@/lib/dashboard-items";
import { DashboardCategoryEnum } from "@/lib/dashboard-categories";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import MedicineDashboard from "@/components/dashboard/medicine/MedicineDashboard";
import SupplierDashboard from "@/components/dashboard/supplier/SupplierDashboard";
import CustomerDashboard from "@/components/dashboard/customer/CustomerDashboard";
import OrderDashboard from "@/components/dashboard/order/OrderDashboard";
import ReceiptDashboard from "@/components/dashboard/receipt/ReceiptDashboard";

const dashboardComponents: Partial<
  Record<DashboardCategoryEnum, () => JSX.Element>
> = {
  [DashboardCategoryEnum.MEDICINES]: MedicineDashboard,
  [DashboardCategoryEnum.SUPPLIERS]: SupplierDashboard,
  [DashboardCategoryEnum.CUSTOMERS]: CustomerDashboard,
  [DashboardCategoryEnum.ORDERS]: OrderDashboard,
  [DashboardCategoryEnum.RECEIPTS]: ReceiptDashboard,
};

export default function DashboardPage({
  params,
}: {
  params: { slug: string[] };
}) {
  const { slug } = params;
  const category: DashboardCategoryEnum =
    (slug?.[0] as DashboardCategoryEnum) || dashboardSideItems[0].id;

  const DashboardComponent = dashboardComponents[category];
  const title = dashboardSideItems.find((item) => item.id === category)?.title;

  if (!DashboardComponent || !title) return notFound();

  return (
    <DashboardLayout title={title} activeSlug={category}>
      <DashboardComponent />
    </DashboardLayout>
  );
}
