import "inspector-elements";
import { FormController } from "@kin/form/form-controller.ts";
import type { KinField } from "@kin/form/elements/kin-field.ts";
import "@kin/form/elements/kin-field.ts";

import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";

import "./global.ts";
import { getFieldState } from "./utils.ts";

interface User {
  name: string;
  level: number;
}

@customElement("kin-form-example")
export class KinFormExample extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    ix-object-inspector {
      zoom: 1.5;
    }
  `;

  readonly #form = new FormController<User>(this, {
    initialValue: {
      name: "",
      level: 0,
    },
    onSubmit: (_form) => {
      alert("Submitted");
    },
  });

  protected render(): unknown {
    const { field, handleSubmit, submitting } = this.#form;
    return html`
      <h1>Kin Form | Basic | Vite + PNPM</h1>

      <kin-field
        ${field("name")}
        .template=${(f: KinField<string>) => html`
          <label>Name</label>
          <input
            .value=${f.value}
            @blur=${f.handleBlur}
            @change=${f.handleChange}
          />
        `}
      ></kin-field>

      <kin-field
        ${field("level")}
        .template=${(f: KinField<number>) => html`
          <label>Level</label>
          <input
            type="number"
            .valueAsNumber=${f.value}
            @blur=${f.handleBlur}
            @change=${(evt: Event) =>
              f.handleChange(
                evt,
                (evt.target as HTMLInputElement).valueAsNumber
              )}
          />
        `}
      ></kin-field>

      <div>
        <button .disabled=${submitting} @click=${handleSubmit}>Submit</button>
      </div>

      <ix-object-inspector
        expandLevel="99"
        .data=${getFieldState(this.#form)}
      ></ix-object-inspector>
    `;
  }

  protected firstUpdated(): void {
    this.requestUpdate();
  }
}
