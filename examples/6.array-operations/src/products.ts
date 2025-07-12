import { html } from "lit";

interface Product {
  id: string;
  name: string;
  unitPrice: number;
}

export const products: Product[] = [
  { id: "a", name: "Product A", unitPrice: 5 },
  { id: "b", name: "Product B", unitPrice: 8 },
  { id: "c", name: "Product C", unitPrice: 2 },
  { id: "d", name: "Product D", unitPrice: 10 },
];

export const productOptions = [
  html`<option value="">Select a product</option>`,
  ...products.map((p) => html`<option .value=${p.id}>${p.name}</option>`),
];
