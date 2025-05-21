export interface OrderItem {
  productId: string;
  unitPrice: number;
  quantity: number;
}

export interface Order {
  customer: string;
  paid: boolean;
  paidOn: Date | null;
  items: OrderItem[];
  billingAddress: Address;
}

export interface Address {
  line1: string;
  line2: string;
  city: string;
}
