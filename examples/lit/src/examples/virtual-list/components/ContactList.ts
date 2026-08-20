import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { createRef, ref } from "lit/directives/ref.js";
import { repeat } from "lit/directives/repeat.js";
import { __decorate } from "tslib";
import { VirtualizerController } from "@tanstack/lit-virtual";
import type { FieldApi } from "@kintools/form-lit";
import { type Contact } from "./ContactRow.ts";
import "./ContactRow.ts";

const ROW_HEIGHT = 56;

/**
 * A virtualized rendering of `.api`'s array, built on
 * `@tanstack/lit-virtual`.
 *
 * A real custom element (not a plain function, unlike this app's other
 * reusable pieces): `VirtualizerController`, like `WatchController`/
 * `MultistepController`, needs a genuine `ReactiveControllerHost` to call
 * `requestUpdate()` on as the user scrolls. Owning that host itself also
 * means scrolling only re-renders this subtree, not whatever else is
 * mounted alongside it (e.g. `App.ts`'s submit button).
 *
 * Unlike `examples/react`'s version, rows use a fixed `estimateSize` only,
 * with no `measureElement` ref for per-row dynamic remeasurement: wiring
 * `virtualizer.measureElement` through lit-html's `ref()` directive (even
 * with a stable function reference) triggered an unbounded feedback loop
 * between `@tanstack/lit-virtual`'s ResizeObserver-driven remeasurement and
 * its scroll-position-adjustment logic, growing the rendered row count
 * without bound. Fixed-height rows sidestep it; an invalid+touched row's
 * error message can visually overlap the row below instead of pushing it
 * down.
 */
class ContactList extends LitElement {
  // See `SubmitButton.ts`'s own doc comment for why these are `declare`d
  // rather than real class fields, with `count`'s default set in the
  // constructor instead of a field initializer.
  // deno-lint-ignore no-explicit-any
  declare api: FieldApi<Contact[], any>;
  declare count: number;

  #virtualizerController?: VirtualizerController<
    HTMLDivElement,
    HTMLDivElement
  >;
  #scrollElementRef = createRef<HTMLDivElement>();

  readonly #jumpToRow = (event: KeyboardEvent): void => {
    if (event.key !== "Enter") return;
    const row = Number((event.currentTarget as HTMLInputElement).value);
    if (row >= 1 && row <= this.count) {
      this.#virtualizerController!.getVirtualizer().scrollToIndex(
        row - 1,
        { align: "center" },
      );
    }
  };

  constructor() {
    super();
    this.count = 0;
  }

  override createRenderRoot(): this {
    return this;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.#virtualizerController = new VirtualizerController(this, {
      count: this.count,
      getScrollElement: () => this.#scrollElementRef.value ?? null,
      estimateSize: () => ROW_HEIGHT,
      overscan: 8,
    });
  }

  override render(): unknown {
    const virtualizer = this.#virtualizerController?.getVirtualizer();

    return html`
      <div class="mt-4 flex items-center gap-2">
        <label class="text-sm text-gray-600" for="jump-to-row">
          Jump to row
        </label>
        <input
          id="jump-to-row"
          type="number"
          min="1"
          max=${this.count}
          class="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm"
          @keydown=${this.#jumpToRow}
        >
        <span class="text-xs text-gray-400">then press Enter</span>
      </div>

      <div
        ${ref(this.#scrollElementRef)}
        class="mt-4 h-112 overflow-auto rounded-md border border-gray-200"
      >
        <div
          class="relative"
          style="height: ${virtualizer ? virtualizer.getTotalSize() : 0}px"
        >
          ${virtualizer
            ? repeat(
              virtualizer.getVirtualItems(),
              // Keyed reconciliation, not positional `.map()`: `virtualRow.key`
              // is stable per logical row even as the overscan window shifts,
              // matching react-virtual's own `key={virtualRow.key}`.
              (virtualRow) => virtualRow.key,
              (virtualRow) =>
                html`
                  <div
                    data-index=${virtualRow.index}
                    class="absolute top-0 left-0 w-full"
                    style="transform: translateY(${virtualRow.start}px)"
                  >
                    <contact-row
                      .api=${this.api.field(`${virtualRow.index}`)}
                      .index=${virtualRow.index}
                    ></contact-row>
                  </div>
                `,
            )
            : ""}
        </div>
      </div>
    `;
  }
}

__decorate(
  [property({ attribute: false })],
  ContactList.prototype,
  "api",
  void 0,
);
__decorate(
  [property({ type: Number })],
  ContactList.prototype,
  "count",
  void 0,
);

customElements.define("contact-list", ContactList);

export type { Contact } from "./ContactRow.ts";

declare global {
  interface HTMLElementTagNameMap {
    "contact-list": ContactList;
  }
}
