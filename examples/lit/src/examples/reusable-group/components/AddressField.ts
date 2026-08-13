import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { __decorate } from "tslib";
import { type FieldApi, type Validator } from "@kin-form/lit";
import { required } from "@kin-form/validators";
import "./TextField.ts";

export type Address = {
  line1: string;
  line2: string;
  city: string;
  zip: string;
};

const line1Validators: Validator<string, Address>[] = [
  required("Line 1 is required"),
];
const cityValidators: Validator<string, Address>[] = [
  required("City is required"),
];
const zipValidators: Validator<string, Address>[] = [
  required("ZIP code is required"),
];

export class AddressField<TParentValue = unknown> extends LitElement {
  // See `SubmitButton.ts`'s own doc comment for why these are `declare`d
  // rather than real class fields.
  // deno-lint-ignore no-explicit-any
  declare api: FieldApi<Address, any>;
  declare label?: string;

  override createRenderRoot(): this {
    return this;
  }

  override render(): unknown {
    const api = this.api;

    return html`
      <fieldset class="space-y-4 rounded-md border border-gray-200 p-4">
        <legend class="px-1 text-sm font-medium text-gray-700">${this
          .label}</legend>
        <reusable-group-text-field
          .api=${api.field("line1", { validators: line1Validators })}
          label="Line 1"
          required
        ></reusable-group-text-field>
        <reusable-group-text-field
          .api=${api.field("line2")}
          label="Line 2"
        ></reusable-group-text-field>
        <div class="grid grid-cols-2 gap-4">
          <reusable-group-text-field
            .api=${api.field("city", { validators: cityValidators })}
            label="City"
            required
          ></reusable-group-text-field>
          <reusable-group-text-field
            .api=${api.field("zip", { validators: zipValidators })}
            label="ZIP code"
            required
          ></reusable-group-text-field>
        </div>
      </fieldset>
    `;
  }
}

__decorate(
  [property({ attribute: false })],
  AddressField.prototype,
  "api",
  void 0,
);
__decorate(
  [property({ type: String })],
  AddressField.prototype,
  "label",
  void 0,
);

customElements.define("address-field", AddressField);

declare global {
  interface HTMLElementTagNameMap {
    "address-field": AddressField;
  }
}
