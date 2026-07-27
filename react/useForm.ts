/**
 * React hook that creates a {@linkcode FormApi}.
 *
 * @module
 */

import { useState } from "react";
import { FormApi, type FormApiOptions } from "@kin-form/core/index.ts";

/**
 * Creates a {@linkcode FormApi} once and calls `updateOptions` on it every
 * render, so `onSubmit`/`onSubmitInvalid`/`onSubmitError` (and
 * validators/dependents) stay in sync with the latest render's closures
 * instead of going stale.
 *
 * Doesn't itself subscribe the calling component to the form; pass the
 * returned instance to `Watch` for that.
 *
 * @example
 * ```tsx
 * function LoginForm() {
 *   const form = useForm({
 *     initialValue: { email: "", password: "" },
 *     onSubmit: async (form) => {
 *       await login(form.value);
 *     },
 *     onSubmitError: (form, error) => {
 *       toast.error("Failed to log in");
 *     },
 *   });
 *
 *   return (
 *     <form onSubmit={form.handleSubmit}>
 *       <Watch api={form.field("email", { validators: [required("Required")] })}>
 *         {(field) => (
 *           <input
 *             value={field.value}
 *             onBlur={field.handleBlur}
 *             onChange={(e) => field.handleChange(e.target.value)}
 *           />
 *         )}
 *       </Watch>
 *     </form>
 *   );
 * }
 * ```
 */
export function useForm<TValue>(
  opts: FormApiOptions<TValue>,
): FormApi<TValue> {
  const [form] = useState(() => new FormApi<TValue>(opts));
  form.updateOptions(opts);
  return form;
}
