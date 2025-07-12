import { FormController } from "@kin/form/form-controller.ts";
import "@kin/form/elements/kin-field-group.ts";
import { KinFieldGroup } from "@kin/form/elements/kin-field-group.ts";
import "@kin/form/elements/kin-field.ts";
import { on } from "@kin/form/utils/event.ts";
import { required } from "@kin/form/validators.ts";

import "inspector-elements";
import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";

import "./fields/address-field.ts";
import { renderStatus } from "./fields/helpers.ts";
import "./fields/text-field.ts";
import "./global.ts";
import { fieldStatusStyles } from "./styles.ts";
import { Address, Model } from "./types.ts";
import { getFieldState } from "./utils.ts";

const leafFieldValidators = [required("[Leaf level] Line 1 is required")];

const groupValidators = [
  (field: KinFieldGroup<Address>) =>
    field.value.line1 ? null : "[Group level] Line 1 is required",
];

@customElement("kin-form-example")
export class KinFormExample extends LitElement {
  static override styles = [
    fieldStatusStyles,
    css`
      :host {
        font: 16px/24px "Segoe UI", Sans-serif;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
      ix-object-inspector {
        zoom: 1.5;
      }
    `,
  ];

  readonly #form = new FormController<Model>(this, {
    initialValue: {
      billingAddress: { line1: "", line2: "" },
    },
    onSubmit: (_form, _event) => {
      alert("Submitted");
    },
    validators: (form) => {
      console.log("validating form");
      return form.value.billingAddress.line1
        ? null
        : "[Form level] Line 1 is required";
    },
  });

  constructor() {
    super();
    // Listen to status-changed events from all fields and update the page so
    // the data displayed by <ix-object-inspector> is up to date.
    on(this, "status-changed", () => this.requestUpdate());
  }

  protected render(): unknown {
    const { field, handleReset, handleSubmit, submitting } = this.#form;
    return html`
      <h1>Kin Form | Any-level Validation | Vite + NPM</h1>

      <div>
        This example demonstrates validation at three levels (leaf field, field
        group, and the whole form).
      </div>

      <kin-field-group
        style="border: 1px solid"
        .validators=${groupValidators}
        ${field("billingAddress")}
        .template=${(g: KinFieldGroup<Address>) => html`
          <style>
            ${fieldStatusStyles}
          </style>
          <h2>Billing Address</h2>
          <text-field
            label="Line 1"
            .validators=${leafFieldValidators}
            ${g.field("line1")}
          ></text-field>
          <text-field label="Line 2" ${g.field("line2")}></text-field>
          ${renderStatus(g)}
        `}
      ></kin-field-group>

      ${renderStatus(this.#form)}

      <div>
        <button .disabled=${submitting} @click=${handleSubmit}>Submit</button>
        <button @click=${handleReset}>Reset</button>
      </div>

      <ix-object-inspector
        expandLevel="99"
        .data=${getFieldState(this.#form)}
      ></ix-object-inspector>
    `;
  }
}
