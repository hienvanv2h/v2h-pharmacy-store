export type Payment = {
  paymentId: number;
  orderUuid: string;
  paymentMethod: string;
  totalAmount: number;
  paymentDate: Date;
  updatedAt: Date;
};

export type PaymentDTO = Omit<
  Payment,
  "paymentId" | "paymentDate" | "updatedAt"
>;
