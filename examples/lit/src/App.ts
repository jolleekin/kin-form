/// <reference types="vite/client" />
import { html, LitElement } from "lit";
import { until } from "lit/directives/until.js";
import { examples } from "./registry.ts";
import "./index.css";

function readSlugFromHash(): string {
  const slug = globalThis.location.hash.slice(1);
  return examples.some((example) => example.slug === slug)
    ? slug
    : examples[0].slug;
}

export class ExamplesApp extends LitElement {
  #slug = examples[0].slug;

  readonly #onHashChange = (): void => {
    this.#slug = readSlugFromHash();
    this.requestUpdate();
  };

  override createRenderRoot(): this {
    return this;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.#slug = readSlugFromHash();
    globalThis.addEventListener("hashchange", this.#onHashChange);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    globalThis.removeEventListener("hashchange", this.#onHashChange);
  }

  override render(): unknown {
    const selected = examples.find((example) => example.slug === this.#slug)!;

    return html`
      <div class="flex min-h-screen bg-gray-50">
        <nav class="w-64 shrink-0 border-r border-gray-200 bg-white">
          <div class="border-b border-gray-200 px-4 py-4">
            <h2 class="text-sm font-semibold text-gray-900">
              Kin Form Examples
            </h2>
          </div>
          <ul class="py-2">
            ${examples.map((example, index) =>
              html`
                <li>
                  <a
                    href="#${example.slug}"
                    class="flex items-center gap-2 px-4 py-2 text-sm ${example
                        .slug === selected.slug
                      ? "bg-blue-50 font-medium text-blue-700"
                      : "text-gray-600 hover:bg-gray-50"}"
                  >
                    <span class="text-xs tabular-nums text-gray-400">
                      ${String(index + 1).padStart(2, "0")}
                    </span>
                    ${example.title}
                  </a>
                </li>
              `
            )}
          </ul>
        </nav>

        <main class="min-w-0 flex-1 flex flex-col">
          <div class="border-b border-gray-200 bg-white px-12 py-4">
            <h1 class="text-3xl font-semibold text-gray-900">
              ${selected.title}
            </h1>
            <p class="mt-2 max-w-2xl text-gray-600">${selected.description}</p>
          </div>
          <div class="flex-1 flex items-start p-12">
            ${until(
              selected.load().then((module) => module.default()),
              html`
                <div class="px-6 py-8 text-sm text-gray-400">Loading…</div>
              `,
            )}
          </div>
        </main>
      </div>
    `;
  }
}

customElements.define("examples-app", ExamplesApp);

declare global {
  interface HTMLElementTagNameMap {
    "examples-app": ExamplesApp;
  }
}
