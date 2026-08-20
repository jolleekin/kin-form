import type { ReactNode } from "react";
import {
  type FieldApi,
  type FormApi,
  useForm,
  Watch,
} from "@kintools/form-react";
import { useFormDevtools } from "@kintools/form-devtools-react";
import { required } from "@kintools/form-validators";

type Address = { line1: string; city: string; zip: string };
type Contact = { address: Address; tags: string[] };

const inputClasses = (invalid: boolean) =>
  `mt-1 block w-full rounded-md border px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 ${
    invalid
      ? "border-red-400 focus:border-red-400 focus:ring-red-200"
      : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
  }`;

export default function App() {
  return (
    <div className="flex min-h-screen items-start justify-center gap-6 bg-gray-50 px-4 py-12">
      <FlatPanel />
      <NestedPanel />
    </div>
  );
}

// One flat `DeepKey` string ("address.line1", "tags.0") reaches straight
// from `form` into the nested value — no group involved at all, and array
// mutation happens directly on `form` too (`form.pushItem("tags", ...)`).
function FlatPanel(): ReactNode {
  const form = useForm<Contact>({
    initialValue: { address: { line1: "", city: "", zip: "" }, tags: [] },
  });

  useFormDevtools(form, "Flat");

  return (
    <Panel
      title="Flat"
      code={`<Watch api={form.field("address.line1")}>
form.pushItem("tags", "")`}
    >
      <form
        onSubmit={form.handleSubmit}
        noValidate
        className="space-y-4"
      >
        <Watch
          api={form.field("address.line1", {
            validators: [required("Required")],
          })}
        >
          {(field) => <FieldInput label="Street address" field={field} />}
        </Watch>
        <Watch
          api={form.field("address.city", {
            validators: [required("Required")],
          })}
        >
          {(field) => <FieldInput label="City" field={field} />}
        </Watch>
        <Watch
          api={form.field("address.zip", {
            validators: [required("Required")],
          })}
        >
          {(field) => <FieldInput label="ZIP code" field={field} />}
        </Watch>

        <Watch api={form} select={(api) => api.value.tags}>
          {(_form, tags) => (
            <TagList
              tags={tags}
              onAdd={() => form.pushItem("tags", "")}
              onRemove={(index) => form.removeItem("tags", index)}
              renderInput={(index) => (
                <Watch api={form.field(`tags.${index}`)}>
                  {(field) => <TagInput field={field} />}
                </Watch>
              )}
            />
          )}
        </Watch>

        <ValuePreview form={form} />
      </form>
    </Panel>
  );
}

// Steps through an explicit group first — for `"address"`, an object, and for
// `"tags"`, an array — then addresses everything relative to *that* group
// instead of relative to `form`. Array mutation happens on the group itself
// via the `""` self-key (see `4-reusable-array`'s README):
// `group.pushItem("", "")` appends to the group's own value.
function NestedPanel(): ReactNode {
  const form = useForm<Contact>({
    initialValue: { address: { line1: "", city: "", zip: "" }, tags: [] },
  });

  useFormDevtools(form, "Nested");

  return (
    <Panel
      title="Nested"
      code={`<Watch api={form.field("address")}>{(address) => <Watch api={address.field("line1")}>}
<Watch api={form.field("tags")}>{(tags) => tags.pushItem("", "")}`}
    >
      <form
        onSubmit={form.handleSubmit}
        noValidate
        className="space-y-4"
      >
        <Watch api={form.field("address")}>
          {(address) => (
            <>
              <Watch
                api={address.field("line1", {
                  validators: [required("Required")],
                })}
              >
                {(field) => <FieldInput label="Street address" field={field} />}
              </Watch>
              <Watch
                api={address.field("city", {
                  validators: [required("Required")],
                })}
              >
                {(field) => <FieldInput label="City" field={field} />}
              </Watch>
              <Watch
                api={address.field("zip", {
                  validators: [required("Required")],
                })}
              >
                {(field) => <FieldInput label="ZIP code" field={field} />}
              </Watch>
            </>
          )}
        </Watch>

        <Watch api={form.field("tags")}>
          {(tags) => (
            <TagList
              tags={tags.value}
              onAdd={() => tags.pushItem("", "")}
              onRemove={(index) => tags.removeItem("", index)}
              renderInput={(index) => (
                <Watch api={tags.field(`${index}`)}>
                  {(field) => <TagInput field={field} />}
                </Watch>
              )}
            />
          )}
        </Watch>

        <ValuePreview form={form} />
      </form>
    </Panel>
  );
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
  renderInput: (index: number) => ReactNode;
}): ReactNode {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Tags</span>
        <button
          type="button"
          onClick={onAdd}
          className="text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          + Add
        </button>
      </div>
      <div className="mt-2 space-y-2">
        {tags.map((_, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-1">{renderInput(index)}</div>
            <button
              type="button"
              onClick={() =>
                onRemove(index)}
              className="text-xs text-red-500 hover:text-red-600"
              aria-label="Remove"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function TagInput<TParentValue>({
  field,
}: {
  field: FieldApi<string, TParentValue>;
}): ReactNode {
  return (
    <input
      value={field.value}
      onBlur={field.handleBlur}
      onChange={(event) => field.handleChange(event.target.value)}
      className={inputClasses(false)}
      placeholder="e.g. vip"
    />
  );
}

function Panel({
  title,
  code,
  children,
}: {
  title: string;
  code: string;
  children: ReactNode;
}): ReactNode {
  return (
    <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-md">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      <pre className="mt-3 whitespace-pre-wrap rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-600">
        {code}
      </pre>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function FieldInput<TParentValue>({
  label,
  field,
}: {
  label: string;
  field: FieldApi<string, TParentValue>;
}): ReactNode {
  const showError = field.invalid && field.touched;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        value={field.value}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        className={inputClasses(showError)}
      />
      {showError && <p className="mt-1 text-sm text-red-600">{field.error}</p>}
    </div>
  );
}

// Renders `form.value` live as JSON: both panels produce the exact same
// `{ address: { line1, city, zip }, tags }` shape, despite reaching it two
// different ways.
function ValuePreview<TValue>({ form }: { form: FormApi<TValue> }): ReactNode {
  return (
    <Watch api={form} select={(f) => f.value}>
      {(_form, value) => (
        <pre className="overflow-x-auto rounded-md bg-gray-900 p-3 text-xs text-gray-100">
          {JSON.stringify(value, null, 2)}
        </pre>
      )}
    </Watch>
  );
}
