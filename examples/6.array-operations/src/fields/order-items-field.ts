/**
 * This modules defines `<order-items-field>`, which is a custom field group
 * for manipulating an array of order items.
 * @module
 */
import { Task } from "@lit/task/task.js";
import { css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { ItemTemplate, repeat } from "lit/directives/repeat.js";

import { FieldGroup } from "@kin/form/field-group.ts";
import { required, min } from "@kin/form/validators.ts";

import { formatCurrency, parseCurrency } from "../currency.ts";
import { productOptions, products } from "../products.ts";
import {
  buttonStyles,
  defaultStyles,
  fieldStatusStyles,
  utilityStyles,
} from "../styles.ts";
import { OrderItem } from "../types.ts";

import { renderStatus } from "./helpers.ts";
import { NumberField } from "./number-field.ts";
import { SelectField } from "./select-field.ts";

import "./number-field.ts";
import "./select-field.ts";
import "./text-field.ts";

const productIdValidators = [required("Product is required")];

const unitPriceValidators = [
  required("Unit price is required"),
  min(0, "Unit price cannot be negative"),
];

const quantityValidators = [
  required("Quantity is required"),
  min(1, "Quantity must be at least one"),
];

@customElement("order-items-field")
export class OrderItemsField extends FieldGroup<OrderItem[]> {
  static override styles = [
    defaultStyles,
    utilityStyles,
    buttonStyles,
    fieldStatusStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      table {
        border-collapse: collapse;
        width: 100%;
      }
      th,
      td {
        text-align: start;
        vertical-align: top;
      }
      th.unit-price {
        width: 90px;
      }
      th.quantity {
        width: 70px;
      }
    `,
  ];

  readonly #total = new Task(
    this,
    ([items]) =>
      items.reduce((s, e) => s + (e.unitPrice ?? 0) * (e.quantity ?? 0), 0),
    () => [this.value] as const
  );

  #productChanged = (event: Event) => {
    // Synchronize the corresponding unitPrice field.

    const productIdField = event.currentTarget as SelectField;

    const unitPriceField = productIdField.parentElement!.nextElementSibling!
      .nextElementSibling!.firstElementChild as NumberField;

    const product = products.find((p) => p.id === productIdField.value);

    unitPriceField.value = product ? product.unitPrice : 0;
  };

  #itemTemplate: ItemTemplate<OrderItem> = (item, idx) => html`
    <tr>
      <td>
        <select-field
          class="product"
          .options=${productOptions}
          .validators=${productIdValidators as never}
          @value-changed=${this.#productChanged}
          ${this.field(`${idx}.productId`)}
        ></select-field>
      </td>
      <td>
        <number-field
          class="quantity"
          .validators=${quantityValidators as never}
          ${this.field(`${idx}.quantity`)}
        ></number-field>
      </td>
      <td>
        <number-field
          class="unit-price"
          .validators=${unitPriceValidators as never}
          .valueFormatter=${formatCurrency}
          .valueParser=${parseCurrency}
          ${this.field(`${idx}.unitPrice`)}
        ></number-field>
      </td>
      <td class="pt-2 text-end">
        ${formatCurrency((item.unitPrice ?? 0) * (item.quantity ?? 0))}
      </td>
      <td>
        <button
          icon
          .disabled=${this.disabled || idx === 0}
          @blur=${this.handleBlur}
          @click=${() => this.moveItem("", idx, idx - 1)}
        >
          ^
        </button>
        <button
          icon
          .disabled=${this.disabled}
          @blur=${this.handleBlur}
          @click=${() => this.moveItem("", idx, idx + 1)}
        >
          V
        </button>
        <button
          icon
          .disabled=${this.disabled}
          @blur=${this.handleBlur}
          @click=${() => this.removeItem("", idx)}
        >
          X
        </button>
      </td>
    </tr>
  `;

  #addOrderItem(): void {
    this.pushItem("", { productId: "", quantity: 1, unitPrice: 0 });
  }

  protected override render(): unknown {
    return html`
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th class="quantity">Quantity</th>
            <th class="unit-price">Unit Price</th>
            <th>Subtotal</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${repeat(this.value, (_, i) => i, this.#itemTemplate)}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3">Total</td>
            <td class="text-end">${formatCurrency(this.#total.value!)}</td>
            <td>&nbsp;</td>
          </tr>
        </tfoot>
      </table>

      <div>
        <button
          .disabled=${this.disabled}
          @blur=${this.handleBlur}
          @click=${this.#addOrderItem}
        >
          Add product
        </button>
      </div>

      ${renderStatus(this)}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "order-items-field": OrderItemsField;
  }
}
