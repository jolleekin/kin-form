import { css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";

import { FormField } from "../../../../form/form-field.ts";

import { defaultStyles, fieldStatusStyles, fieldStyles } from "../styles.ts";

@customElement("check-box")
export class CheckBox extends FormField<boolean | null> {
  static override styles = [
    defaultStyles,
    fieldStyles,
    fieldStatusStyles,
    css`
      :host {
        display: flex;
        position: relative;
        gap: 12px;
      }
      :host(:not([reversed])):has(:focus-visible) {
        outline: 2px solid white;
      }
      [part="input"] {
        width: 20px;
        height: 20px;
        min-height: 20px;
        outline: none;
        margin-block: 6px;
      }
      :host([reversed]) {
        gap: 0;
        flex-flow: row-reverse wrap;

        [part="input"] {
          outline: auto;
        }
      }
    `,
  ];

  constructor() {
    super();
    this.value = false;
  }

  /**
   * Whether the label should be placed before the check box.
   */
  @property({ type: Boolean, reflect: true })
  reversed = false;

  get tristate(): boolean {
    return this.#tristate;
  }

  @property({ type: Boolean, reflect: true })
  set tristate(v: boolean) {
    const oldValue = this.#tristate;
    if (oldValue !== v) {
      if (!v) this.value = this.value === true;
      this.#tristate = v;
      this.requestUpdate("tristate", oldValue);
    }
  }

  #tristate = false;

  #handleClick(): void {
    const { value } = this;

    if (this.tristate) {
      // false -> true -> null.
      this.value = value === true ? null : value === false;
    } else {
      this.value = !value;
    }
  }

  protected override render(): unknown {
    const { value } = this;
    return html`
      <div part="content">
        <input
          part="input"
          type="checkbox"
          .disabled=${this.disabled}
          .indeterminate=${value === null}
          .checked=${live(value === true)}
          @blur=${this.handleBlur}
          @click=${this.#handleClick}
        />
      </div>
      <label part="label"><slot></slot></label>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "check-box": CheckBox;
  }
}
