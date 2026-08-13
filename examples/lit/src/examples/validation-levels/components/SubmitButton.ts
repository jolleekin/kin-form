import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { __decorate } from "tslib";
import { type FormApi, WatchController } from "@kin-form/lit";

/**
 * A submit button bound to a form's submit state.
 *
 * Disables itself while `.api` is invalid, validating, or submitting, and
 * shows `.pendingLabel` in place of `.label` while submitting.
 */
export class SubmitButton extends LitElement {
  // `declare`, not a real field: a plain class field here would set itself
  // via `[[Define]]` at construction time, which *overwrites* the
  // `__decorate`-installed prototype accessor below instead of going
  // through it (Lit's own "class field shadowing" gotcha). Since `declare`
  // fields have no initializer, default values are set in the constructor
  // instead, as plain `this.x = ...` assignments - those go through
  // `[[Set]]`, which correctly reaches the inherited accessor.
  // deno-lint-ignore no-explicit-any
  declare api: FormApi<any>;
  declare label: string;
  declare pendingLabel: string;
  declare buttonClass: string;

  readonly #watch = new WatchController(
    this,
    () => this.api,
    (f) => [f.invalid, f.validating, f.submitting] as const,
  );

  constructor() {
    super();
    this.label = "Submit";
    this.pendingLabel = "Submitting…";
    this.buttonClass = "";
  }

  override createRenderRoot(): this {
    return this;
  }

  override render(): unknown {
    const [invalid, validating, submitting] = this.#watch.value;

    return html`
      <button
        type="submit"
        ?disabled=${invalid || validating || submitting}
        class="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300 ${this
          .buttonClass}"
      >
        ${submitting ? this.pendingLabel : this.label}
      </button>
    `;
  }
}

// Applied by hand instead of `@property()` on the field: `@deno/vite-plugin`
// strips types without lowering decorator *syntax*, and this browser
// generation doesn't support the `accessor` keyword standard decorators
// need - so no decorator syntax (legacy or standard) survives this
// toolchain's dev pipeline. `__decorate` (from `tslib`) is exactly what
// `tsc` itself emits for a legacy `@property() foo;` field, just written
// out as a plain function call instead of `@`-syntax, which needs no
// special transform support at all.
__decorate(
  [property({ attribute: false })],
  SubmitButton.prototype,
  "api",
  void 0,
);
__decorate(
  [property({ type: String })],
  SubmitButton.prototype,
  "label",
  void 0,
);
__decorate(
  [property({ type: String, attribute: "pending-label" })],
  SubmitButton.prototype,
  "pendingLabel",
  void 0,
);
__decorate(
  [property({ type: String, attribute: "button-class" })],
  SubmitButton.prototype,
  "buttonClass",
  void 0,
);

customElements.define("validation-levels-submit-button", SubmitButton);

declare global {
  interface HTMLElementTagNameMap {
    "validation-levels-submit-button": SubmitButton;
  }
}
