import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { __decorate } from "tslib";
import {
  type FieldApi,
  type FieldApiOptions,
  WatchController,
} from "@kintools/form-lit";
import { email, required } from "@kintools/form-validators";
import "./TextField.ts";

export type Contact = {
  name: string;
  email: string;
};

const nameOptions: FieldApiOptions<string, Contact> = {
  validators: [required("Required")],
};
const emailOptions: FieldApiOptions<string, Contact> = {
  validators: [required("Required"), email("Invalid email")],
};

/**
 * One virtualized row's fields.
 *
 * Row height is fixed (see `ContactList.ts`'s own doc comment for why): an
 * invalid+touched text field growing with an error message can visually
 * overlap the row below instead of pushing it down.
 */
export class ContactRow extends LitElement {
  // See `SubmitButton.ts`'s own doc comment for why these are `declare`d
  // rather than real class fields, with `index`'s default set in the
  // constructor instead of a field initializer.
  // deno-lint-ignore no-explicit-any
  declare api: FieldApi<Contact, any>;
  declare index: number;

  readonly #watch = new WatchController(this, () => this.api, (f) => f.dirty);

  constructor() {
    super();
    this.index = 0;
  }

  override createRenderRoot(): this {
    return this;
  }

  override render(): unknown {
    const dirty = this.#watch.value;
    const api = this.api;

    return html`
      <div class="flex items-start gap-3 border-b border-gray-100 px-3 py-2">
        <span
          class="w-10 shrink-0 pt-1.5 text-right text-xs tabular-nums text-gray-400">
          ${this.index + 1}
        </span>
        <div class="grid flex-1 grid-cols-2 gap-2">
          <virtual-list-text-field
            .api=${api.field("name", nameOptions)}
            placeholder="Name"
          ></virtual-list-text-field>
          <virtual-list-text-field
            .api=${api.field("email", emailOptions)}
            placeholder="Email"
          ></virtual-list-text-field>
        </div>
        <span
          title=${dirty ? "Edited, persists across scroll" : "Unedited"}
          class="mt-2 h-2 w-2 shrink-0 rounded-full ${dirty
            ? "bg-blue-500"
            : "bg-gray-200"}"
        ></span>
      </div>
    `;
  }
}

__decorate(
  [property({ attribute: false })],
  ContactRow.prototype,
  "api",
  void 0,
);
__decorate(
  [property({ type: Number })],
  ContactRow.prototype,
  "index",
  void 0,
);

customElements.define("contact-row", ContactRow);

declare global {
  interface HTMLElementTagNameMap {
    "contact-row": ContactRow;
  }
}
