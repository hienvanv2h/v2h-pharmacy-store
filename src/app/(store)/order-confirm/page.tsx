import ProductTableWrapper from "@/components/wrappers/ProductTableWrapper";

export default function OrderConfirmationPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Xác nhận đơn hàng</h1>

      {/* Bảng sản phẩm */}
      <ProductTableWrapper />

      {/* Mã giảm giá */}
      <div className="my-8">
        <label htmlFor="discount-code" className="block mb-2">
          Mã giảm giá:
        </label>
        <div className="flex">
          <input
            type="text"
            id="discount-code"
            className="flex-grow border border-gray-300 rounded-l px-4 py-2"
            placeholder="Nhập mã giảm giá"
          />
          <button className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600">
            Áp dụng
          </button>
        </div>
      </div>

      {/* Phương thức thanh toán */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Phương thức thanh toán</h2>
        <div>
          <label className="inline-flex items-center mr-4">
            <input
              type="radio"
              name="payment-method"
              className="form-radio"
              value="CASH"
              defaultChecked
            />
            <span className="ml-2">Tiền mặt</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="payment-method"
              className="form-radio"
              value="CREDIT"
            />
            <span className="ml-2">Thẻ tín dụng</span>
          </label>
        </div>
      </div>

      {/* Nút xác nhận */}
      <button className="bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600">
        Xác nhận đặt hàng
      </button>
    </div>
  );
}
