import { FormController } from "@kin/form/form-controller.ts";
import "@kin/form/elements/kin-field.ts";
import { required } from "@kin/form/validators.ts";

import { Task } from "@lit/task";

import "inspector-elements";
import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { ItemTemplate, repeat } from "lit/directives/repeat.js";

import { NumberField } from "./fields/number-field.ts";
import "./fields/number-field.ts";
import { SelectField } from "./fields/select-field.ts";
import "./fields/select-field.ts";
import "./fields/text-field.ts";

import "./fields/order-items-field.ts";

import { formatCurrency, parseCurrency } from "./currency.ts";
import "./global.ts";
import { productOptions, products } from "./products.ts";
import { buttonStyles } from "./styles.ts";
import { Order, OrderItem } from "./types.ts";
import { getFieldState } from "./utils.ts";

const itemsValidators = [required("Please add at least one product")];

@customElement("kin-form-example")
export class KinFormExample extends LitElement {
  static override styles = [
    buttonStyles,
    css`
      :host {
        font: 16px/24px "Segoe UI", Sans-serif;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
      table {
        text-align: left;
        width: 100%;
      }
      td.text-end {
        padding-inline-end: 16px;
        text-align: end;
      }
      code {
        color: chocolate;
      }
      ix-object-inspector {
        zoom: 1.5;
      }
    `,
  ];

  readonly #form = new FormController<Order>(this, {
    initialValue: {
      items: [],
    },
    onSubmit: (_form, _event) => {
      alert("Submitted");
    },
  });

  readonly #total = new Task(
    this,
    ([items]) => items.reduce((s, e) => s + e.quantity * e.unitPrice, 0),
    () => [this.#form.value.items] as const
  );

  readonly #productChanged = (event: Event): void => {
    const selectField = event.target as SelectField;

    const unitPriceField = selectField.parentElement!.nextElementSibling!
      .nextElementSibling!.firstElementChild as NumberField;

    const product = products.find((p) => p.id === selectField.value);

    unitPriceField.value = product ? product.unitPrice : 0;
  };

  readonly #itemTemplate: ItemTemplate<OrderItem> = (item, idx) => {
    const form = this.#form;

    return html`
      <tr>
        <td>
          <select-field
            style="width: 100%"
            .options=${productOptions}
            @value-changed=${this.#productChanged}
            ${form.field(`items.${idx}.productId`)}
          ></select-field>
        </td>
        <td>
          <number-field ${form.field(`items.${idx}.quantity`)}></number-field>
        </td>
        <td>
          <number-field
            .valueParser=${parseCurrency}
            .valueFormatter=${formatCurrency}
            ${form.field(`items.${idx}.unitPrice`)}
          ></number-field>
        </td>
        <td class="text-end">
          ${formatCurrency(item.quantity * item.unitPrice)}
        </td>
        <td>
          <button
            .disabled=${idx === 0}
            icon
            @click=${() => form.moveItem("items", idx, idx - 1)}
          >
            ^
          </button>
          <button icon @click=${() => form.moveItem("items", idx, idx + 1)}>
            v
          </button>
          <button icon @click=${() => form.removeItem("items", idx)}>X</button>
        </td>
      </tr>
    `;
  };

  readonly #addOrderItem = () =>
    this.#form.pushItem("items", {
      productId: "",
      quantity: 1,
      unitPrice: 0,
    });

  protected render(): unknown {
    const { field, handleReset, handleSubmit, submitting, value } = this.#form;
    return html`
      <h1>Kin Form | Array | Vite + PNPM</h1>

      <div>
        This example demonstrates array field and array operations.<br />It also
        demonstrates custom <code>valueParser</code> and
        <code>valueFormatter</code> on the unit price fields.
      </div>

      <fieldset>
        <legend>Order Items (using a custom field group)</legend>
        <order-items-field
          .validators=${itemsValidators}
          ${field("items")}
        ></order-items-field>
      </fieldset>

      <fieldset>
        <legend>Order Items (using flattened form structure)</legend>
        <table style="width: 100%">
          <thead>
            <tr>
              <th>Product</th>
              <th style="width: 80px">Quantity</th>
              <th style="width: 80px">Unit Price</th>
              <th>Subtotal</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${repeat(value.items, (_, idx) => idx, this.#itemTemplate)}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3">Total</td>
              <td class="text-end">${formatCurrency(this.#total.value!)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
        <div><button @click=${this.#addOrderItem}>Add product</button></div>
      </fieldset>

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
