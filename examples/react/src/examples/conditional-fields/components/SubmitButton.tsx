import type { ReactNode } from "react";
import { type FormApi, useWatch } from "@kin-form/react/index.ts";

export type SubmitButtonProps<TValue> = {
  api: FormApi<TValue>;
  pendingLabel: ReactNode;
  className?: string;
  children: ReactNode;
};

/**
 * A submit button bound to a form's submit state.
 *
 * Disables itself while `api` is invalid, validating, or submitting, and
 * shows `pendingLabel` in place of `children` while submitting.
 */
export function SubmitButton<TValue>(
  { api, pendingLabel, className, children }: SubmitButtonProps<TValue>,
): ReactNode {
  const [invalid, validating, submitting] = useWatch(
    api,
    (f) => [f.invalid, f.validating, f.submitting] as const,
  );

  return (
    <button
      type="submit"
      disabled={invalid || validating || submitting}
      className={`rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300 ${
        className ?? ""
      }`}
    >
      {submitting ? pendingLabel : children}
    </button>
  );
}
