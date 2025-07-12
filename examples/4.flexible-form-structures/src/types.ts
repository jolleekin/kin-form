export interface Address {
    line1: string;
    line2: string;
}
  
export interface Model {
    billingAddress: Address;
    shippingAddress: Address;
    otherAddress: Address;
}
  