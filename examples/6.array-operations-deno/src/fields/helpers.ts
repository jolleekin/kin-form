import { html, nothing } from "lit";
import { FormField } from "../../../../form/form-field.ts";

export function renderStatus<TValue, TParentValue>({
  error,
  touched,
}: FormField<TValue, TParentValue>) {
  return error && touched
    ? html`<div part="error" role="alert" aria-live="polite">${error}</div>`
    : nothing;
}
