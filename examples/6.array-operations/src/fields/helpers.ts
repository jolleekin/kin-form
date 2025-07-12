import { html, nothing } from "lit";
import { FormField } from "@kin/form/form-field.ts";

export function renderLabel({ label }: { label: string }) {
  return label ? html`<label part="label">${label}</label>` : nothing;
}

export function renderStatus<TValue, TParentValue>({
  error,
  touched,
}: FormField<TValue, TParentValue>) {
  return error && touched
    ? html`<div part="error" role="alert" aria-live="polite">${error}</div>`
    : nothing;
}
