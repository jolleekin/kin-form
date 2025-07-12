import "inspector-elements";
import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { live } from "lit/directives/live.js";

import { FormController } from "../../../form/form-controller.ts";
import "../../../form/elements/kin-field.ts";
import { on } from "../../../form/utils/event.ts";
import { minLength, required } from "../../../form/validators.ts";

// Leaf fields
import "./fields/check-box.ts";
import "./fields/date-field.ts";
import "./fields/number-field.ts";
import "./fields/select-field.ts";
import "./fields/text-field.ts";

// Field groups
import "./fields/address-field.ts";
import "./fields/order-items-field.ts";

import { styles } from "./kin-form-example.styles.ts";
import { buttonStyles, utilityStyles } from "./styles.ts";
import { Order } from "./types.ts";
import { getFieldState } from "./utils.ts";

const customerValidators = [
  required("Customer is required"),
  minLength(4, "Customer must be at least 4 characters"),
];

const paidOnValidators = [required("Paid on is required")];

const itemsValidators = [required("Please add at least one product")];

@customElement("kin-form-example")
export class KinFormExample extends LitElement {
  static override styles = [buttonStyles, utilityStyles, styles];

  readonly #form = new FormController<Order>(this, {
    initialValue: {
      customer: "",
      paid: false,
      paidOn: null,
      items: [],
      billingAddress: {
        line1: "",
        line2: "",
        city: "",
      },
    },
    onSubmit: async (_form) => {
      _form.disabled = true;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("Order saved");
      _form.disabled = false;
    },
  });

  f = () => this.requestUpdate();

  constructor() {
    super();
    // Listen to status-changed events of nested fields and update the page so
    // the object inspector is always up to date.
    on(this, "status-changed" as never, this.f);
  }

  protected override render(): unknown {
    const form = this.#form;
    const { disabled, field, handleReset, handleSubmit, submitting, value } =
      form;

    return html`
      <h1 class="text-center">Kin Form Example</h1>
      <div class="main">
        <section class="form">
          <fieldset>
            <legend>Order Info</legend>
            <text-field
              class="field"
              label="Customer"
              .validators=${customerValidators as never}
              ${field("customer")}
            ></text-field>
            <check-box reversed ${field("paid")}>Paid</check-box>
            <date-field
              class="field"
              label="Paid on"
              .validators=${paidOnValidators as never}
              ${field("paidOn")}
              .disabled=${live(disabled || !value.paid)}
            ></date-field>
          </fieldset>

          <fieldset>
            <legend>Billing Address</legend>
            <address-field ${field("billingAddress")}></address-field>
          </fieldset>

          <fieldset>
            <legend>Order Items</legend>

            <order-items-field
              .validators=${itemsValidators as never}
              ${field("items")}
            ></order-items-field>
          </fieldset>

          <div class="actions">
            <button primary .disabled=${submitting} @click=${handleSubmit}>
              ${submitting ? "Submitting" : "Submit"}
            </button>
            <button @click=${handleReset}>Reset</button>
          </div>
        </section>

        <section class="form-state">
          <ix-object-inspector
            expandLevel="4"
            .data=${getFieldState(form)}
          ></ix-object-inspector>
        </section>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "kin-form-example": KinFormExample;
  }
}
