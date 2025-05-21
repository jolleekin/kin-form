import { css, CSSResultGroup, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

import { on } from "./dom/event.ts";

@customElement("copy-button")
export class CopyButton extends LitElement {
  static override styles: CSSResultGroup = css`
    :host {
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 60px;
    }
  `;

  constructor() {
    super();
    on(this, "click", this.#handleClick);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute("tabindex", "0");
    this.textContent = "Copy";
  }

  async #handleClick(): Promise<void> {
    await navigator.clipboard.writeText(
      this.previousElementSibling!.textContent!
    );
    this.textContent = "Copied";
    setTimeout(() => (this.textContent = "Copy"), 1000);
  }

  protected override render(): unknown {
    return html`<slot></slot>`;
  }
  // protected override render(): unknown {
  //   return html`
  //     <svg
  //       fill="currentColor"
  //       width="1em"
  //       height="1em"
  //       viewBox="0 0 20 20"
  //       xmlns="http://www.w3.org/2000/svg"
  //     >
  //       <path
  //         d="M8 2a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2h6a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8ZM7 4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4ZM4 6a2 2 0 0 1 1-1.73V14.5A2.5 2.5 0 0 0 7.5 17h6.23A2 2 0 0 1 12 18H7.5A3.5 3.5 0 0 1 4 14.5V6Z"
  //         fill="currentColor"
  //       ></path>
  //     </svg>
  //   `;
  // }
}

declare global {
  interface HTMLElementTagNameMap {
    "copy-button": CopyButton;
  }
}
