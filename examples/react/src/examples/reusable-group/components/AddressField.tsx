import type { ReactNode } from "react";
import { type FieldApi, FieldApiOptions } from "@kin-form/react/index.ts";
import { required } from "@kin-form/validators/index.ts";
import { TextField } from "./TextField.tsx";

export type Address = {
  line1: string;
  line2: string;
  city: string;
  zip: string;
};

export type AddressFieldProps<TParentValue> = {
  api: FieldApi<Address, TParentValue>;
  label: ReactNode;
};

export function AddressField<TParentValue>(
  { api, label }: AddressFieldProps<TParentValue>,
): ReactNode {
  return (
    <fieldset className="space-y-4 rounded-md border border-gray-200 p-4">
      <legend className="px-1 text-sm font-medium text-gray-700">
        {label}
      </legend>
      <TextField
        api={api.field("line1", line1Options)}
        label="Line 1"
        required
      />
      <TextField
        api={api.field("line2")}
        label="Line 2"
      />
      <div className="grid grid-cols-2 gap-4">
        <TextField
          api={api.field("city", cityOptions)}
          label="City"
          required
        />
        <TextField
          api={api.field("zip", zipOptions)}
          label="ZIP code"
          required
        />
      </div>
    </fieldset>
  );
}

const line1Options: FieldApiOptions<string, Address> = {
  validators: [required("Line 1 is required")],
};
const cityOptions: FieldApiOptions<string, Address> = {
  validators: [required("City is required")],
};
const zipOptions: FieldApiOptions<string, Address> = {
  validators: [required("ZIP code is required")],
};
