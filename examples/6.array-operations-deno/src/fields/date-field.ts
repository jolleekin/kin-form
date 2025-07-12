import { html } from "lit";
import { customElement, property } from "lit/decorators.js";

import { FormField } from "../../../../form/form-field.ts";

import { defaultStyles, fieldStatusStyles, fieldStyles } from "../styles.ts";

import { renderStatus } from "./helpers.ts";

@customElement("date-field")
export class DateField extends FormField<Date | null> {
  static override styles = [defaultStyles, fieldStyles, fieldStatusStyles];

  constructor() {
    super();
    this.value = null;
  }

  @property()
  label = "";

  #handleChange(event: Event): void {
    this.value = (event.target as HTMLInputElement).valueAsDate;
  }

  protected override render(): unknown {
    return html`
      <label part="label">${this.label}</label>
      <div part="content">
        <input
          part="input"
          type="date"
          .disabled=${this.disabled}
          .valueAsDate=${this.value}
          @blur=${this.handleBlur}
          @change=${this.#handleChange}
        />
        ${renderStatus(this)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "date-field": DateField;
  }
}
