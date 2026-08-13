import { html, LitElement, nothing } from "lit";
import { property } from "lit/decorators.js";
import { __decorate } from "tslib";
import { type FieldApi, WatchController } from "@kin-form/lit";

const inputClasses = (invalid: boolean) =>
  `mt-1 block w-full rounded-md border px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 ${
    invalid
      ? "border-red-400 focus:border-red-400 focus:ring-red-200"
      : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
  }`;

export class TextField extends LitElement {
  // See `SubmitButton.ts`'s own doc comment for why these are `declare`d
  // rather than real class fields, with defaults set in the constructor
  // instead of a field initializer.
  // deno-lint-ignore no-explicit-any
  declare api: FieldApi<string, any>;
  declare label?: string;
  declare required?: boolean;
  declare type: string;
  declare autocomplete?: string;
  declare placeholder?: string;
  declare inputClass: string;

  readonly #watch = new WatchController(this, () => this.api);

  constructor() {
    super();
    this.type = "text";
    this.inputClass = "";
  }

  override createRenderRoot(): this {
    return this;
  }

  override render(): unknown {
    const field = this.#watch.value;
    const showError = field.invalid && field.touched;
    const inputId = `${field.name}-${field.id}`;

    return html`
      <div>
        ${this.label
          ? html`
            <label for=${inputId} class="block text-sm font-medium text-gray-700">
              ${this.label}
              ${this.required
                ? html`<span class="ml-0.5 text-red-500">*</span>`
                : nothing}
            </label>
          `
          : nothing}
        <input
          id=${inputId}
          type=${this.type}
          autocomplete=${this.autocomplete ?? nothing}
          placeholder=${this.placeholder ?? nothing}
          .value=${field.value}
          @blur=${field.handleBlur}
          @input=${(event: Event) =>
            field.handleChange((event.target as HTMLInputElement).value)}
          class="${inputClasses(!!showError)} ${this.inputClass}"
        >
        ${showError
          ? html`<p class="mt-1 text-sm text-red-600">${field.error}</p>`
          : nothing}
      </div>
    `;
  }
}

__decorate(
  [property({ attribute: false })],
  TextField.prototype,
  "api",
  void 0,
);
__decorate(
  [property({ type: String })],
  TextField.prototype,
  "label",
  void 0,
);
__decorate(
  [property({ type: Boolean })],
  TextField.prototype,
  "required",
  void 0,
);
__decorate(
  [property({ type: String })],
  TextField.prototype,
  "type",
  void 0,
);
__decorate(
  [property({ type: String })],
  TextField.prototype,
  "autocomplete",
  void 0,
);
__decorate(
  [property({ type: String })],
  TextField.prototype,
  "placeholder",
  void 0,
);
__decorate(
  [property({ type: String, attribute: "input-class" })],
  TextField.prototype,
  "inputClass",
  void 0,
);

customElements.define("reusable-array-text-field", TextField);

declare global {
  interface HTMLElementTagNameMap {
    "reusable-array-text-field": TextField;
  }
}
