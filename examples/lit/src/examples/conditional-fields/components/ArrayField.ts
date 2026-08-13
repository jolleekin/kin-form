import { html, LitElement, nothing } from "lit";
import { property } from "lit/decorators.js";
import { __decorate } from "tslib";
import { type FieldApi, WatchController } from "@kin-form/lit";

export class ArrayField<
  TParentValue = unknown,
  TItem = unknown,
> extends LitElement {
  // See `SubmitButton.ts`'s own doc comment for why these are `declare`d
  // rather than real class fields.
  // deno-lint-ignore no-explicit-any
  declare api: FieldApi<TItem[], any>;
  declare label?: string;
  declare newItem: () => TItem;
  declare renderItem: (
    api: FieldApi<TItem[], TParentValue>,
    index: number,
  ) => unknown;

  readonly #watch = new WatchController(this, () => this.api, (f) => f.value);

  override createRenderRoot(): this {
    return this;
  }

  override render(): unknown {
    const value = this.#watch.value;

    return html`
      <div>
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-700">${this.label}</span>
          <button
            type="button"
            @click=${() => this.api.pushItem("", this.newItem())}
            class="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            + Add
          </button>
        </div>

        <div class="mt-2 space-y-2">
          ${value.map((_, index) =>
            html`
              <div class="flex items-start gap-2">
                <div class="flex-1">${this.renderItem(this.api, index)}</div>
                <div class="flex flex-col gap-1 pt-1">
                  <button
                    type="button"
                    ?disabled=${index === 0}
                    @click=${() => this.api.moveItem("", index, index - 1)}
                    class="text-xs text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Move up"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    ?disabled=${index === value.length - 1}
                    @click=${() => this.api.moveItem("", index, index + 1)}
                    class="text-xs text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Move down"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    @click=${() => this.api.removeItem("", index)}
                    class="text-xs text-red-500 hover:text-red-600"
                    aria-label="Remove"
                  >
                    ✕
                  </button>
                </div>
              </div>
            `
          )}
          ${value.length === 0
            ? html`<p class="text-sm text-gray-400">None yet.</p>`
            : nothing}
        </div>
      </div>
    `;
  }
}

__decorate(
  [property({ attribute: false })],
  ArrayField.prototype,
  "api",
  void 0,
);
__decorate(
  [property({ type: String })],
  ArrayField.prototype,
  "label",
  void 0,
);
__decorate(
  [property({ attribute: false })],
  ArrayField.prototype,
  "newItem",
  void 0,
);
__decorate(
  [property({ attribute: false })],
  ArrayField.prototype,
  "renderItem",
  void 0,
);

customElements.define(
  "conditional-fields-array-field",
  ArrayField,
);

declare global {
  interface HTMLElementTagNameMap {
    "conditional-fields-array-field": ArrayField;
  }
}
