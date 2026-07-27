import { useForm } from "@kin-form/react/index.ts";
import { useFormDevtools } from "@kin-form/react-devtools/index.ts";
import { type Address, AddressField } from "./components/AddressField.tsx";
import { SubmitButton } from "./components/SubmitButton.tsx";

type Order = {
  billing: Address;
  shipping: Address;
};

const emptyAddress: Address = { line1: "", line2: "", city: "", zip: "" };

export default function App() {
  const form = useForm<Order>({
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

  useFormDevtools(form);

  return (
    <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
      <h1 className="text-xl font-semibold text-gray-900">Shipping details</h1>
      <p className="mt-1 text-sm text-gray-500">
        The same <code>AddressFields</code>{" "}
        component is mounted twice below, once for billing and once for
        shipping.
      </p>

      <form
        className="mt-6 space-y-6"
        onSubmit={form.handleSubmit}
        noValidate
      >
        <AddressField
          api={form.field("billing")}
          label="Billing address"
        />
        <AddressField
          api={form.field("shipping")}
          label="Shipping address"
        />

        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300"
            onChange={(event) => {
              if (event.target.checked) {
                form.field("shipping").value = {
                  ...form.value.billing,
                };
              }
            }}
          />
          Shipping address is the same as billing
        </label>

        <SubmitButton
          api={form}
          className="w-full"
          pendingLabel="Placing order…"
        >
          Place order
        </SubmitButton>
      </form>
    </div>
  );
}
