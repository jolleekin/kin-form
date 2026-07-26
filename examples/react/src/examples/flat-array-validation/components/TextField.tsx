import type { InputHTMLAttributes, ReactNode } from "react";
import { type FieldApi, useWatch } from "@kin-form/react/index.ts";

const inputClasses = (invalid: boolean) =>
  `mt-1 block w-full rounded-md border px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 ${
    invalid
      ? "border-red-400 focus:border-red-400 focus:ring-red-200"
      : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
  }`;

export type TextFieldProps<TParentValue> =
  & Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "id" | "value" | "onChange" | "onBlur"
  >
  & {
    api: FieldApi<string, TParentValue>;
    label?: ReactNode;
  };

// This example has no per-field validators at all — every message comes
// from the one whole-form `toSchemaValidator()` validator in `App.tsx`, so this
// reads `field.schemaError` alongside `field.error` instead of taking a
// `validators` prop like the other examples' `TextField` does.
export function TextField<const TParentValue>({
  api,
  label,
  className,
  ...inputProps
}: TextFieldProps<TParentValue>): ReactNode {
  const field = useWatch(api);
  const showError = field.invalid && field.touched;
  const error = field.error ?? field.schemaError;
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
      {showError && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
