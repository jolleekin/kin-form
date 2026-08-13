import { html } from "lit";
import { FormApi } from "@kin-form/lit";
import { type Address } from "./components/AddressField.ts";
import "./components/AddressField.ts";
import "./components/SubmitButton.ts";

type Order = {
  billing: Address;
  shipping: Address;
};

const emptyAddress: Address = { line1: "", line2: "", city: "", zip: "" };

export default function App(): unknown {
  const form = new FormApi<Order>({
    initialValue: {
      billing: emptyAddress,
      shipping: emptyAddress,
    },
    onSubmit: async (form) => {
      // Simulate a network request.
      await new Promise((resolve) => setTimeout(resolve, 800));
      alert(`Order placed! Shipping to ${form.value.shipping.city}.`);
    },
  });

  return html`
    <div class="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
      <h1 class="text-xl font-semibold text-gray-900">Shipping details</h1>
      <p class="mt-1 text-sm text-gray-500">
        The same <code>address-field</code> element is mounted twice below,
        once for billing and once for shipping.
      </p>

      <form class="mt-6 space-y-6" @submit=${form.handleSubmit} novalidate>
        <address-field
          .api=${form.field("billing")}
          label="Billing address"
        ></address-field>
        <address-field
          .api=${form.field("shipping")}
          label="Shipping address"
        ></address-field>

        <label class="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            class="h-4 w-4 rounded border-gray-300"
            @change=${(event: Event) => {
              if ((event.target as HTMLInputElement).checked) {
                form.field("shipping").value = { ...form.value.billing };
              }
            }}
          >
          Shipping address is the same as billing
        </label>

        <reusable-group-submit-button
          .api=${form}
          button-class="w-full"
          pending-label="Placing order…"
          label="Place order"
        ></reusable-group-submit-button>
      </form>
    </div>
  `;
}
