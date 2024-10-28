export type Customer = {
  customerId: number;
  name: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CustomerDTO = Omit<
  Customer,
  "customerId" | "createdAt" | "updatedAt"
>;

// Type guard(s)
export function isCustomer(data: any): data is Customer {
  return (
    data !== null &&
    typeof data === "object" &&
    "customerId" in data &&
    "name" in data &&
    "phoneNumber" in data &&
    "createdAt" in data &&
    "updatedAt" in data
  );
}
