import type { ReactNode } from "react";
import {
  type FormApi,
  useForm,
  useWatch,
  type Validator,
} from "@kin-form/react";
import { useFormDevtools } from "@kin-form/react-devtools";
import { required } from "@kin-form/validators";
import { ArrayField } from "./components/ArrayField.tsx";
import { SubmitButton } from "./components/SubmitButton.tsx";
import { TextField } from "./components/TextField.tsx";

type AttributeType = "string" | "number" | "boolean" | "enum";
type EnumItem = { code: string; value: string };

type Attribute = {
  name: string;
  type: AttributeType;
  defaultValue: string | number | boolean | null;
  items: EnumItem[];
};

const inputClasses = (invalid: boolean) =>
  `mt-1 block w-full rounded-md border px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 ${
    invalid
      ? "border-red-400 focus:border-red-400 focus:ring-red-200"
      : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
  }`;

// The single validator for `defaultValue` branches on the sibling `type`
// field instead of being swapped out per type: validators are fixed when a
// field is first created (`field`'s `options` argument only applies on
// that first call, not on every render), so there's no `field.validators =
// ...` per render to hook into here — reading `field.parent.value.type` is
// the idiomatic way to make one field's validity depend on another's
// current value.
const defaultValueValidators: Validator<
  string | number | boolean | null,
  Attribute
>[] = [
  (field) => {
    switch (field.parent!.value.type) {
      case "string":
        return typeof field.value === "string" && field.value.trim() !== ""
          ? null
          : "Default value is required";
      case "number":
        return typeof field.value === "number" && !Number.isNaN(field.value)
          ? null
          : "Default value must be a number";
      case "enum":
        return typeof field.value === "string" && field.value !== ""
          ? null
          : "Pick a default option";
      case "boolean":
        return null;
    }
  },
];

const itemValidators: Validator<string, EnumItem[]>[] = [required("Required")];

export default function App() {
  const form = useForm<Attribute>({
    initialValue: { name: "", type: "string", defaultValue: "", items: [] },
    onSubmit: async (form) => {
      // Simulate a network request.
      await new Promise((resolve) => setTimeout(resolve, 500));
      alert(JSON.stringify(form.value, null, 2));
    },
  });

  useFormDevtools(form);

  return (
    <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-md">
      <h1 className="text-xl font-semibold text-gray-900">New attribute</h1>
      <p className="mt-1 text-sm text-gray-500">
        Switching <em>Type</em> re-validates <em>Default value</em> via{" "}
        <code>dependents</code>, and toggles whether <em>Options</em>{" "}
        shows at all.
      </p>

      <form
        className="mt-6 space-y-4"
        onSubmit={form.handleSubmit}
        noValidate
      >
        <TextField
          api={form.field("name", {
            validators: [required("Name is required")],
          })}
          label="Name"
          required
        />

        <TypeSection form={form} />

        <SubmitButton api={form} className="w-full" pendingLabel="Saving…">
          Save attribute
        </SubmitButton>
      </form>
    </div>
  );
}

// Owns both `type` and `defaultValue` in one component so `type`'s
// `dependents` option is only ever set once, at the one place `type`'s
// field is created — everything downstream (which widget `defaultValue`
// renders as, whether `items` shows) just branches on `typeField.value`.
function TypeSection({ form }: { form: FormApi<Attribute> }): ReactNode {
  const typeField = form.field("type", { dependents: ["defaultValue"] });
  const type = useWatch(typeField, (f) => f.value);
  const defaultValueField = useWatch(
    form.field("defaultValue", { validators: defaultValueValidators }),
  );
  // Watched separately (not read off `form.value`) so the "Default value"
  // dropdown's options re-render as items are added/renamed, without
  // `TypeSection` otherwise subscribing to the whole form's value.
  const itemsGroup = form.field("items");
  const items = useWatch(itemsGroup, (f) => f.value);
  const showError = defaultValueField.invalid && defaultValueField.touched;

  return (
    <>
      <div>
        <label
          htmlFor="type"
          className="block text-sm font-medium text-gray-700"
        >
          Type
        </label>
        <select
          id="type"
          value={type}
          onChange={(event) => {
            typeField.handleChange(event.target.value as AttributeType);
            // Surface `defaultValue`'s freshly re-validated state right
            // away, without waiting for the user to blur it themselves.
            defaultValueField.value = null;
            defaultValueField.touched = false;
          }}
          className={inputClasses(false)}
        >
          <option value="string">String</option>
          <option value="number">Number</option>
          <option value="boolean">Boolean</option>
          <option value="enum">Enum</option>
        </select>
      </div>

      {type === "enum" && (
        <ArrayField
          api={itemsGroup}
          label="Options"
          newItem={() => ({ code: "", value: "" })}
        >
          {(group, index) => (
            <div className="grid grid-cols-2 gap-2">
              <TextField
                api={group.field(`${index}.code`, {
                  validators: itemValidators,
                })}
                placeholder="Code"
              />
              <TextField
                api={group.field(`${index}.value`, {
                  validators: itemValidators,
                })}
                placeholder="Label"
              />
            </div>
          )}
        </ArrayField>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Default value
        </label>
        {type === "boolean"
          ? (
            <label className="mt-1 flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={Boolean(defaultValueField.value)}
                onChange={(event) =>
                  defaultValueField.handleChange(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              {defaultValueField.value ? "True" : "False"}
            </label>
          )
          : type === "number"
          ? (
            <input
              type="number"
              value={typeof defaultValueField.value === "number"
                ? defaultValueField.value
                : ""}
              onBlur={defaultValueField.handleBlur}
              onChange={(event) =>
                defaultValueField.handleChange(event.target.valueAsNumber)}
              className={inputClasses(showError)}
            />
          )
          : type === "enum"
          ? (
            <select
              value={typeof defaultValueField.value === "string"
                ? defaultValueField.value
                : ""}
              onBlur={defaultValueField.handleBlur}
              onChange={(event) =>
                defaultValueField.handleChange(event.target.value)}
              className={inputClasses(showError)}
            >
              <option value="">Select an option…</option>
              {items.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.value || item.code}
                </option>
              ))}
            </select>
          )
          : (
            <input
              type="text"
              value={typeof defaultValueField.value === "string"
                ? defaultValueField.value
                : ""}
              onBlur={defaultValueField.handleBlur}
              onChange={(event) =>
                defaultValueField.handleChange(event.target.value)}
              className={inputClasses(showError)}
            />
          )}
        {showError && (
          <p className="mt-1 text-sm text-red-600">{defaultValueField.error}</p>
        )}
      </div>
    </>
  );
}
