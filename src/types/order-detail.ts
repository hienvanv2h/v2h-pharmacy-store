type OrderDetail = {
  orderDetailId: number;
  orderUuid: string;
  medicineUuid: string;
  medicineBatchId: string;
  quantity: number;
  price: number;
  createdAt: Date;
  updatedAt: Date;
};

export type OrderDetailView = OrderDetail & {
  quantityUnit: string;
  expirationDate: Date;
};

export type OrderDetailDTO = Omit<
  OrderDetail,
  "orderDetailId" | "createdAt" | "updatedAt"
>;
