import { html } from "lit";
import { customElement, property } from "lit/decorators.js";

import { FormField } from "../../../../form/form-field.ts";

import { defaultStyles, fieldStatusStyles, fieldStyles } from "../styles.ts";

import { renderStatus } from "./helpers.ts";

@customElement("select-field")
export class SelectField extends FormField<string> {
  static override styles = [defaultStyles, fieldStyles, fieldStatusStyles];

  constructor() {
    super();
    this.value = "";
  }

  @property()
  label = "";

  @property({ attribute: false })
  options: unknown;

  #handleChange(event: Event): void {
    this.value = (event.target as HTMLSelectElement).value;
  }

  protected override render(): unknown {
    return html`
      <label part="label">${this.label}</label>
      <div part="content">
        <select
          part="input"
          .disabled=${this.disabled}
          .value=${this.value}
          @blur=${this.handleBlur}
          @change=${this.#handleChange}
        >
          ${this.options}
        </select>
        ${renderStatus(this)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "select-field": SelectField;
  }
}
