import type { InputHTMLAttributes, ReactNode } from "react";
import { type FieldApi, useWatch } from "@kin-form/react";

const inputClasses = (invalid: boolean) =>
  `mt-1 block w-full rounded-md border px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 ${
    invalid
      ? "border-red-400 focus:border-red-400 focus:ring-red-200"
      : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
  }`;

export type TextFieldProps<TParentValue> =
  & {
    api: FieldApi<string, TParentValue>;
    label?: ReactNode;
    required?: boolean | ReactNode;
  }
  & Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "id" | "value" | "onChange" | "onBlur"
  >;

// `field.error` (this field's own `validators`) and `field.schemaError` (this
// field's slice of the form's whole-tree `toSchemaValidator()`) are two separate
// channels — see `App.tsx` — so every field here checks both.
export function TextField<const TParentValue>(
  props: TextFieldProps<TParentValue>,
): ReactNode {
  const { api, label, required, className, ...inputProps } = props;
  const field = useWatch(api);
  const showError = field.invalid && field.touched;
  const message = field.error ?? field.schemaError;
  const value = field.value;
  const inputId = `${field.name}-${field.id}`;

  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && (
            <span className="ml-0.5 text-red-500">
              {required === true ? "*" : required}
            </span>
          )}
        </label>
      )}
      <input
        {...inputProps}
        id={inputId}
        value={value}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        className={`${inputClasses(!!showError)} ${className ?? ""}`}
      />
      {showError && <p className="mt-1 text-sm text-red-600">{message}</p>}
    </div>
  );
}
