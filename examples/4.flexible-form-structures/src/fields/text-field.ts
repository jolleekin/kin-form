import { html } from "lit";
import { customElement, property } from "lit/decorators.js";

import { FormField } from "@kin/form/form-field.ts";

import { defaultStyles, fieldStatusStyles, fieldStyles } from "../styles.ts";

import { renderStatus } from "./helpers.ts";

// When a field is used in many places, it makes sense to refactor it into a
// custom element.
@customElement("text-field")
export class TextField extends FormField<string> {
  static override styles = [defaultStyles, fieldStyles, fieldStatusStyles];

  constructor() {
    super();
    // For stand-alone use case.
    this.value = "";
  }

  @property()
  label = "";

  @property({ attribute: false })
  statusTemplate: (field: this) => unknown = renderStatus;

  #handleChange(event: Event): void {
    this.value = (event.target as HTMLInputElement).value;
  }

  protected override render(): unknown {
    return html`
      <label part="label">${this.label}</label>
      <div part="content">
        <input
          part="input"
          type="text"
          .disabled=${this.disabled}
          .value=${this.value}
          @blur=${this.handleBlur}
          @change=${this.#handleChange}
        />
        ${this.statusTemplate(this)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "text-field": TextField;
  }
}
