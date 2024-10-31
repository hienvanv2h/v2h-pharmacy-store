import ProductTableWrapper from "@/components/wrappers/ProductTableWrapper";
import ReactHotToast from "@/components/ui/ReactHotToast";

export default function OrderConfirmationPage() {
  return (
    <div className="relative container mx-auto px-4 py-8">
      <ReactHotToast duration={5000} />

      {/* Bảng sản phẩm */}
      <ProductTableWrapper />
    </div>
  );
}
