/**
 * React hook that opts a form into the devtools panel, via
 * {@linkcode useFormDevtools}.
 *
 * @module
 */

import { useContext, useEffect } from "react";
import type { FormApi } from "@kin-form/core";
import { DevtoolsContext } from "./DevtoolsProvider.tsx";

/**
 * Opts `form` into any ancestor {@linkcode DevtoolsProvider}'s panel. Call it
 * once per form you want visible, right next to `useForm`. `name`, if given,
 * is shown in the panel's form select instead of the form's numeric id,
 * handy once more than one form is registered at a time:
 *
 * ```tsx
 * const form = useForm({ ... });
 * useFormDevtools(form, "checkout");
 * ```
 *
 * A genuine no-op when there's no `DevtoolsProvider` above in the tree:
 * `useContext` without a matching provider just returns `null`, so the
 * effect below returns before registering anything; no subscriber is ever
 * added to `form`'s own tree, unlike a permanently-installed broadcaster
 * that merely goes quiet outside development.
 */
export function useFormDevtools<TValue>(
  form: FormApi<TValue>,
  name?: string,
): void {
  const registry = useContext(DevtoolsContext);

  useEffect(() => {
    return registry?.register(form as FormApi<unknown>, name);
  }, [registry, form, name]);
}
