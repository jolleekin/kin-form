import { html } from "lit";
import { customElement, property } from "lit/decorators.js";

import { FormField } from "../../../../form/form-field.ts";

import { defaultStyles, fieldStatusStyles, fieldStyles } from "../styles.ts";

import { renderStatus } from "./helpers.ts";

@customElement("text-field")
export class TextField extends FormField<string> {
  static override styles = [defaultStyles, fieldStyles, fieldStatusStyles];

  constructor() {
    super();
    this.value = "";
  }

  @property()
  label = "";

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
        ${renderStatus(this)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "text-field": TextField;
  }
}
