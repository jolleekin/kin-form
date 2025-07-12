export interface OrderItem {
  productId: string;
  unitPrice: number;
  quantity: number;
}

export interface Order {
  items: OrderItem[];
}
