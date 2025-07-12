import { css, html } from "lit";
import { customElement } from "lit/decorators.js";

import { FieldGroup } from "@kin/form/field-group.ts";
import { required } from "@kin/form/validators.ts";

import { Address } from "../types.ts";

const line1Validators = [required("Line 1 is required")];

@customElement("address-field")
export class AddressField extends FieldGroup<Address> {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
  `;

  protected override render(): unknown {
    return html`
      <text-field
        label="Line 1"
        .validators=${line1Validators}
        ${this.field("line1")}
      ></text-field>
      <text-field
        label="Line 2"
        ${this.field("line2")}
      ></text-field>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "address-field": AddressField;
  }
}
