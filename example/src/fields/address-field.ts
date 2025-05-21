import { css, html } from "lit";
import { customElement } from "lit/decorators.js";

import { FieldGroup } from "../../../form/field-group.ts";
import { required } from "../../../form/validators.ts";

import { Address } from "../types.ts";

import { renderStatus } from "./helpers.ts";

const line1Validators = [required("Line 1 is required")];
const cityValidators = [required("City is required")];

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
    const { disabled, field } = this;
    return html`
      <text-field
        label="Line 1"
        .disabled=${disabled}
        .validators=${line1Validators as never}
        ${field("line1")}
      ></text-field>
      <text-field
        label="Line 2"
        .disabled=${disabled}
        ${field("line2")}
      ></text-field>
      <text-field
        label="City"
        .disabled=${disabled}
        .validators=${cityValidators as never}
        ${field("city")}
      ></text-field>
      ${renderStatus(this)}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "address-field": AddressField;
  }
}
