import { FormController } from "@kin/form/form-controller.ts";
import { required } from "@kin/form/validators.ts";

import "inspector-elements";
import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";

import "./fields/text-field.ts";
import { TextField } from "./fields/text-field.ts";
import "./global.ts";
import { fieldStatusStyles } from "./styles.ts";
import { Model } from "./types.ts";
import { getFieldState } from "./utils.ts";
import { on } from "@kin/form/utils/event.ts";

const passwordValidators = [required("Password is required")];

const confirmPasswordValidators = [
  ...passwordValidators,
  ({ value, parent }: TextField<Model>) =>
    value === parent!.value.password ? null : "Passwords don't match",
];
@customElement("kin-form-example")
export class KinFormExample extends LitElement {
  static override styles = [
    fieldStatusStyles,
    css`
      :host {
        font:
          16px/24px "Segoe UI",
          Sans-serif;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
      h2 {
        font-weight: normal;
      }
      ix-object-inspector {
        zoom: 1.5;
      }
    `,
  ];

  readonly #form = new FormController<Model>(this, {
    initialValue: {
      password: "",
      confirmPassword: "",
    },
    onSubmit: (_form, _event) => {
      alert("Submitted");
    },
  });

  constructor() {
    super();
    // Update when any field at any level changes its status.
    // This is to keep the data displayed by <ix-object-inspector> up to date.
    on(this, "status-changed", () => this.requestUpdate());
  }

  protected render(): unknown {
    const { field, handleReset, handleSubmit, submitting } = this.#form;
    return html`
      <h1>Kin Form | Dependent Field Validation | Vite + NPM</h1>

      <div>This example demonstrates dependent field validation.</div>
      <div>
        The <strong>Confirm password</strong> field depends on the
        <strong>Password</strong> field and is automatically validated when the
        value of the <strong>Password</strong> field changes.
      </div>

      <text-field
        dependents='["confirmPassword"]'
        label="Password"
        type="password"
        .validators=${passwordValidators}
        ${field("password")}
      ></text-field>
      <text-field
        label="Confirm password"
        type="password"
        .validators=${confirmPasswordValidators}
        ${field("confirmPassword")}
      ></text-field>

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
