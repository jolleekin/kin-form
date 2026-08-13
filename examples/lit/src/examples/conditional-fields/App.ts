import { html, nothing } from "lit";
import { type FieldApi, FormApi, type Validator, watch } from "@kin-form/lit";
import { required } from "@kin-form/validators";
import "./components/ArrayField.ts";
import "./components/SubmitButton.ts";
import "./components/TextField.ts";

type AttributeType = "string" | "number" | "boolean" | "enum";
type EnumItem = { code: string; value: string };

type Attribute = {
  name: string;
  type: AttributeType;
  defaultValue: string | number | boolean | null;
  items: EnumItem[];
};

const inputClasses = (invalid: boolean) =>
  `mt-1 block w-full rounded-md border px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 ${
    invalid
      ? "border-red-400 focus:border-red-400 focus:ring-red-200"
      : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
  }`;

// The single validator for `defaultValue` branches on the sibling `type`
// field instead of being swapped out per type: validators are fixed when a
// field is first created (`field`'s `options` argument only applies on
// that first call, not on every navigation into the form), so there's no
// `field.validators = ...` to hook into here - reading `field.parent.value.type`
// is the idiomatic way to make one field's validity depend on another's
// current value.
const defaultValueValidators: Validator<
  string | number | boolean | null,
  Attribute
>[] = [
  (field) => {
    switch (field.parent!.value.type) {
      case "string":
        return typeof field.value === "string" && field.value.trim() !== ""
          ? null
          : "Default value is required";
      case "number":
        return typeof field.value === "number" && !Number.isNaN(field.value)
          ? null
          : "Default value must be a number";
      case "enum":
        return typeof field.value === "string" && field.value !== ""
          ? null
          : "Pick a default option";
      case "boolean":
        return null;
    }
  },
];

const itemValidators: Validator<string, EnumItem[]>[] = [required("Required")];

export default function App(): unknown {
  const form = new FormApi<Attribute>({
    initialValue: { name: "", type: "string", defaultValue: "", items: [] },
    onSubmit: async (form) => {
      // Simulate a network request.
      await new Promise((resolve) => setTimeout(resolve, 500));
      alert(JSON.stringify(form.value, null, 2));
    },
  });

  return html`
    <div class="w-full max-w-sm rounded-lg bg-white p-8 shadow-md">
      <h1 class="text-xl font-semibold text-gray-900">New attribute</h1>
      <p class="mt-1 text-sm text-gray-500">
        Switching <em>Type</em> re-validates <em>Default value</em> via
        <code>dependents</code>, and toggles whether <em>Options</em>
        shows at all.
      </p>

      <form class="mt-6 space-y-4" @submit=${form.handleSubmit} novalidate>
        <conditional-fields-text-field
          .api=${form.field("name", {
            validators: [required("Name is required")],
          })}
          label="Name"
          required
        ></conditional-fields-text-field>

        ${TypeSection(form)}

        <conditional-fields-submit-button
          .api=${form}
          button-class="w-full"
          pending-label="Saving…"
          label="Save attribute"
        ></conditional-fields-submit-button>
      </form>
    </div>
  `;
}

// Owns both `type` and `defaultValue` here so `type`'s `dependents` option
// is only ever set once, at the one place `type`'s field is created -
// everything downstream (which widget `defaultValue` renders as, whether
// `items` shows) just branches on the watched values below.
//
// One outer `watch(form, select, ...)` covers all three interdependent
// sources (`type`, `defaultValue`'s own state, `items`) at once, mirroring
// how a React function component re-renders as a whole when any of several
// independent `useWatch` subscriptions inside it notifies - a Lit
// custom-element `render()` would get this for free via `WatchController`
// per source, but this section isn't its own element, so one combined
// selector plays the same role.
function TypeSection(form: FormApi<Attribute>): unknown {
  const typeField = form.field("type", { dependents: ["defaultValue"] });
  const defaultValueField = form.field("defaultValue", {
    validators: defaultValueValidators,
  });
  const itemsGroup = form.field("items");

  return watch(
    form,
    () =>
      [
        typeField.value,
        defaultValueField.value,
        defaultValueField.touched,
        defaultValueField.invalid,
        itemsGroup.value,
      ] as const,
    (_form, [type, defaultValue, touched, invalid, items]) => {
      const showError = invalid && touched;

      return html`
        <div>
          <label for="type" class="block text-sm font-medium text-gray-700">
            Type
          </label>
          <select
            id="type"
            .value=${type}
            @change=${(event: Event) => {
              typeField.handleChange(
                (event.target as HTMLSelectElement).value as AttributeType,
              );
              // Surface `defaultValue`'s freshly re-validated state right away,
              // without waiting for the user to blur it themselves.
              defaultValueField.value = null;
              defaultValueField.touched = false;
            }}
            class=${inputClasses(false)}
          >
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="enum">Enum</option>
          </select>
        </div>

        ${type === "enum"
          ? html`
            <conditional-fields-array-field
              .api=${itemsGroup}
              label="Options"
              .newItem=${() => ({ code: "", value: "" })}
              .renderItem=${(
                group: FieldApi<EnumItem[], Attribute>,
                index: number,
              ) =>
                html`
                  <div class="grid grid-cols-2 gap-2">
                    <conditional-fields-text-field
                      .api=${group.field(`${index}.code`, {
                        validators: itemValidators,
                      })}
                      placeholder="Code"
                    ></conditional-fields-text-field>
                    <conditional-fields-text-field
                      .api=${group.field(`${index}.value`, {
                        validators: itemValidators,
                      })}
                      placeholder="Label"
                    ></conditional-fields-text-field>
                  </div>
                `}
            ></conditional-fields-array-field>
          `
          : nothing}

        <div>
          <label class="block text-sm font-medium text-gray-700">
            Default value
          </label>
          ${type === "boolean"
            ? html`
              <label class="mt-1 flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  .checked=${Boolean(defaultValue)}
                  @change=${(event: Event) =>
                    defaultValueField.handleChange(
                      (event.target as HTMLInputElement).checked,
                    )}
                  class="h-4 w-4 rounded border-gray-300"
                >
                ${defaultValue ? "True" : "False"}
              </label>
            `
            : type === "number"
            ? html`
              <input
                type="number"
                .value=${typeof defaultValue === "number"
                  ? String(defaultValue)
                  : ""}
                @blur=${defaultValueField.handleBlur}
                @input=${(event: Event) =>
                  defaultValueField.handleChange(
                    (event.target as HTMLInputElement).valueAsNumber,
                  )}
                class=${inputClasses(showError)}
              >
            `
            : type === "enum"
            ? html`
              <select
                .value=${typeof defaultValue === "string" ? defaultValue : ""}
                @blur=${defaultValueField.handleBlur}
                @change=${(event: Event) =>
                  defaultValueField.handleChange(
                    (event.target as HTMLSelectElement).value,
                  )}
                class=${inputClasses(showError)}
              >
                <option value="">Select an option…</option>
                ${items.map((item) =>
                  html`
                    <option value=${item.code}>
                      ${item.value || item.code}
                    </option>
                  `
                )}
              </select>
            `
            : html`
              <input
                type="text"
                .value=${typeof defaultValue === "string" ? defaultValue : ""}
                @blur=${defaultValueField.handleBlur}
                @input=${(event: Event) =>
                  defaultValueField.handleChange(
                    (event.target as HTMLInputElement).value,
                  )}
                class=${inputClasses(showError)}
              >
            `}
          ${showError
            ? html`
              <p class="mt-1 text-sm text-red-600">${defaultValueField
                .error}</p>
            `
            : nothing}
        </div>
      `;
    },
  );
}
