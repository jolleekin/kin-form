import type { InputHTMLAttributes, ReactNode } from "react";
import { type FieldApi, useWatch } from "@kintools/form-react";

const inputClasses = (invalid: boolean) =>
  `block w-full rounded-md border px-2 py-1.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 ${
    invalid
      ? "border-red-400 focus:border-red-400 focus:ring-red-200"
      : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
  }`;

export type TextFieldProps<TParentValue> =
  & { api: FieldApi<string, TParentValue> }
  & Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "id" | "value" | "onChange" | "onBlur"
  >;

export function TextField<const TParentValue>(
  props: TextFieldProps<TParentValue>,
): ReactNode {
  const { api, className, ...inputProps } = props;
  const { error, invalid, touched, value, handleBlur, handleChange } = useWatch(
    api,
  );
  const showError = invalid && touched;

  return (
    <div>
      <input
        {...inputProps}
        value={value}
        onBlur={handleBlur}
        onChange={(event) => handleChange(event.target.value)}
        className={`${inputClasses(!!showError)} ${className ?? ""}`}
      />
      {showError && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
