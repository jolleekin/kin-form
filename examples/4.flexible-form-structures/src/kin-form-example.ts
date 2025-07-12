import { FormController } from "@kin/form/form-controller.ts";
import "@kin/form/elements/kin-field-group.ts";
import { KinFieldGroup } from "@kin/form/elements/kin-field-group.ts";
import "@kin/form/elements/kin-field.ts";
import { required } from "@kin/form/validators.ts";

import "inspector-elements";
import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";

import "./fields/address-field.ts";
import "./fields/text-field.ts";
import "./global.ts";
import { Address, Model } from "./types.ts";
import { getFieldState } from "./utils.ts";

const line1Validators = [required("Line 1 is required")];

@customElement("kin-form-example")
export class KinFormExample extends LitElement {
  static override styles = css`
    :host {
      font: 16px/24px "Segoe UI", Sans-serif;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    h2, h3 {
      font-weight: normal;
    }
    ix-object-inspector {
      zoom: 1.5;
    }
  `;

  readonly #form = new FormController<Model>(this, {
    initialValue: {
      billingAddress: { line1: "", line2: "" },
      shippingAddress: { line1: "", line2: "" },
      otherAddress: { line1: "", line2: "" },
    },
    onSubmit: (_form, _event) => {
      alert("Submitted");
    },
  });

  protected render(): unknown {
    const { field, handleSubmit, submitting } = this.#form;
    return html`
      <h1>Kin Form | Flexible Form Structures | Vite + NPM</h1>

      <div>This example demonstrates flexible form structures.</div>

      <!-- 1. Flattened -->
      <section>
        <h3>Billing Address (flattened)</h3>

        <text-field
          label="Line 1"
          .validators=${line1Validators}
          ${field("billingAddress.line1")}
        ></text-field>
        <text-field
          label="Line 2"
          ${field("billingAddress.line2")}
        ></text-field>
      </section>

      <!-- 2. Nested using <kin-field-group> -->
      <kin-field-group
        ${field("shippingAddress")}
        .template=${(g: KinFieldGroup<Address>) => html`
          <h3 style="font-weight: normal">
            Shipping Address (nested using <code>&lt;kin-group-field&gt;</code>)
          </h3>
          <text-field
            label="Line 1"
            .validators=${line1Validators}
            ${g.field("line1")}
          ></text-field>
          <text-field label="Line 2" ${g.field("line2")}></text-field>
        `}
      ></kin-field-group>

      <!-- 3. Nested using a custom group field -->
      <section>
        <h3>Other Address (nested using a custom group field)</h3>
        <address-field ${field("otherAddress")}></address-field>
      </section>

      <div>
        <button .disabled=${submitting} @click=${handleSubmit}>Submit</button>
      </div>

      <ix-object-inspector expandLevel="99" .data=${getFieldState(
        this.#form
      )}></ix-object-inspector>
    `;
  }
}
