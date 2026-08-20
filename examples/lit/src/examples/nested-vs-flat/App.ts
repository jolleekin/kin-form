import { html } from "lit";
import { type FieldApi, FormApi, watch } from "@kintools/form-lit";
import { required } from "@kintools/form-validators";

type Address = { line1: string; city: string; zip: string };
type Contact = { address: Address; tags: string[] };

const inputClasses = (invalid: boolean) =>
  `mt-1 block w-full rounded-md border px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 ${
    invalid
      ? "border-red-400 focus:border-red-400 focus:ring-red-200"
      : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
  }`;

export default function App(): unknown {
  return html`
    <div
      class="flex min-h-screen items-start justify-center gap-6 bg-gray-50 px-4 py-12">
      ${FlatPanel()}
      ${NestedPanel()}
    </div>
  `;
}

// One flat `DeepKey` string ("address.line1", "tags.0") reaches straight
// from `form` into the nested value - no group involved at all, and array
// mutation happens directly on `form` too (`form.pushItem("tags", ...)`).
function FlatPanel(): unknown {
  const form = new FormApi<Contact>({
    initialValue: { address: { line1: "", city: "", zip: "" }, tags: [] },
  });

  return Panel({
    title: "Flat",
    code: `watch(form.field("address.line1"), ...)
form.pushItem("tags", "")`,
    children: html`
      <form @submit=${form.handleSubmit} novalidate class="space-y-4">
        ${watch(
          form.field("address.line1", { validators: [required("Required")] }),
          (field) => FieldInput({ label: "Street address", field }),
        )}
        ${watch(
          form.field("address.city", { validators: [required("Required")] }),
          (field) => FieldInput({ label: "City", field }),
        )}
        ${watch(
          form.field("address.zip", { validators: [required("Required")] }),
          (field) => FieldInput({ label: "ZIP code", field }),
        )}

        ${watch(
          form,
          (api) => api.value.tags,
          (_form, tags) =>
            TagList({
              tags,
              onAdd: () => form.pushItem("tags", ""),
              onRemove: (index) => form.removeItem("tags", index),
              renderInput: (index) =>
                watch(
                  form.field(`tags.${index}`),
                  (field) => TagInput({ field }),
                ),
            }),
        )}

        ${ValuePreview({ form })}
      </form>
    `,
  });
}

// Steps through an explicit group first - for `"address"`, an object, and for
// `"tags"`, an array - then addresses everything relative to *that* group
// instead of relative to `form`. Array mutation happens on the group itself
// via the `""` self-key: `tags.pushItem("", "")` appends to the group's own
// value.
function NestedPanel(): unknown {
  const form = new FormApi<Contact>({
    initialValue: { address: { line1: "", city: "", zip: "" }, tags: [] },
  });

  return Panel({
    title: "Nested",
    code:
      `watch(form.field("address"), (address) => watch(address.field("line1"), ...))
watch(form.field("tags"), (tags) => tags.pushItem("", ""))`,
    children: html`
      <form @submit=${form.handleSubmit} novalidate class="space-y-4">
        ${watch(form.field("address"), (address) =>
          html`
            ${watch(
              address.field("line1", { validators: [required("Required")] }),
              (field) => FieldInput({ label: "Street address", field }),
            )}
            ${watch(
              address.field("city", { validators: [required("Required")] }),
              (field) => FieldInput({ label: "City", field }),
            )}
            ${watch(
              address.field("zip", { validators: [required("Required")] }),
              (field) => FieldInput({ label: "ZIP code", field }),
            )}
          `)}

        ${watch(form.field("tags"), (tags) =>
          TagList({
            tags: tags.value,
            onAdd: () => tags.pushItem("", ""),
            onRemove: (index) => tags.removeItem("", index),
            renderInput: (index) =>
              watch(tags.field(`${index}`), (field) => TagInput({ field })),
          }))}

        ${ValuePreview({ form })}
      </form>
    `,
  });
}

function TagList({
  tags,
  onAdd,
  onRemove,
  renderInput,
}: {
  tags: readonly string[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  renderInput: (index: number) => unknown;
}): unknown {
  return html`
    <div>
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-gray-700">Tags</span>
        <button
          type="button"
          @click=${onAdd}
          class="text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          + Add
        </button>
      </div>
      <div class="mt-2 space-y-2">
        ${tags.map((_, index) =>
          html`
            <div class="flex items-center gap-2">
              <div class="flex-1">${renderInput(index)}</div>
              <button
                type="button"
                @click=${() => onRemove(index)}
                class="text-xs text-red-500 hover:text-red-600"
                aria-label="Remove"
              >
                ✕
              </button>
            </div>
          `
        )}
      </div>
    </div>
  `;
}

function TagInput<TParentValue>(
  { field }: { field: FieldApi<string, TParentValue> },
): unknown {
  return html`
    <input
      .value=${field.value}
      @blur=${field.handleBlur}
      @input=${(event: Event) =>
        field.handleChange((event.target as HTMLInputElement).value)}
      class=${inputClasses(false)}
      placeholder="e.g. vip"
    >
  `;
}

function Panel(
  { title, code, children }: { title: string; code: string; children: unknown },
): unknown {
  return html`
    <div class="w-full max-w-sm rounded-lg bg-white p-8 shadow-md">
      <h1 class="text-xl font-semibold text-gray-900">${title}</h1>
      <pre
        class="mt-3 whitespace-pre-wrap rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-600">${code}</pre>
      <div class="mt-6">${children}</div>
    </div>
  `;
}

function FieldInput<TParentValue>(
  { label, field }: { label: string; field: FieldApi<string, TParentValue> },
): unknown {
  const showError = field.invalid && field.touched;

  return html`
    <div>
      <label class="block text-sm font-medium text-gray-700">${label}</label>
      <input
        .value=${field.value}
        @blur=${field.handleBlur}
        @input=${(event: Event) =>
          field.handleChange((event.target as HTMLInputElement).value)}
        class=${inputClasses(showError)}
      >
      ${showError
        ? html`<p class="mt-1 text-sm text-red-600">${field.error}</p>`
        : ""}
    </div>
  `;
}

// Renders `form.value` live as JSON: both panels produce the exact same
// `{ address: { line1, city, zip }, tags }` shape, despite reaching it two
// different ways.
function ValuePreview<TValue>({ form }: { form: FormApi<TValue> }): unknown {
  return watch(
    form,
    (f) => f.value,
    (_form, value) =>
      html`
        <pre
          class="overflow-x-auto rounded-md bg-gray-900 p-3 text-xs text-gray-100">${JSON
            .stringify(value, null, 2)}</pre>
      `,
  );
}
