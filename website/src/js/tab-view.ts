import { LitElement, html } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { watch } from "./decorators/watch.ts";
import { off, on } from "./dom/event.ts";

@customElement("fluent-tab-view")
export class FluentTabView extends LitElement {
  @property()
  theme: "light" | "dark" | "inherit" = "inherit";

  @property({ attribute: "nav-class" })
  navClass = "";

  @property({ attribute: "panels-class" })
  panelsClass = "";

  @property({ type: Number, reflect: true })
  selectedIndex = 0;

  @query("[part=nav]", true)
  private readonly _nav!: HTMLDivElement;

  @query("[part=selected-indicator]", true)
  private readonly _selectedIndicator!: HTMLDivElement;

  #tabs: HTMLButtonElement[] = [];
  #panels: HTMLElement[] = [];

  override connectedCallback(): void {
    super.connectedCallback();
    this.classList.add("flex", "flex-col");
    on(window, "theme-changed", this.themeChanged);
  }

  override disconnectedCallback(): void {
    off(window, "theme-changed", this.themeChanged);
    super.disconnectedCallback();
  }

  @watch("theme")
  protected themeChanged = () => {
    const isDark =
      this.theme !== "inherit"
        ? this.theme === "dark"
        : document.documentElement.classList.contains("dark");
    this.classList.toggle("dark", isDark);
  };

  @watch("selectedIndex", { waitUntilFirstUpdate: true })
  protected selectedIndexChanged(newIndex: number): void {
    this.#tabs.forEach((tab, i) => {
      if (i === newIndex) {
        tab.setAttribute("selected", "");
      } else {
        tab.removeAttribute("selected");
      }
    });
    this.#panels.forEach((panel, i) => (panel.hidden = i !== newIndex));

    const selectedTab = this.#tabs[newIndex];
    const { _nav, _selectedIndicator } = this;
    if (selectedTab) {
      const navRect = _nav.getBoundingClientRect();
      const tabRect = selectedTab.getBoundingClientRect();

      _selectedIndicator.hidden = false;
      _selectedIndicator.style.translate =
        _nav.scrollLeft + tabRect.left - navRect.left + "px";
      _selectedIndicator.style.width = `calc(${tabRect.width}px - 2 * ${10})`;

      // scrollIntoViewIfNeeded(selectedTab, _nav, "x");
    } else {
      _selectedIndicator.hidden = true;
    }
  }

  #navSlotChange(event: Event): void {
    const slot = event.target as HTMLSlotElement;
    this.#tabs = slot.assignedElements() as HTMLButtonElement[];
    this.selectedIndexChanged(this.selectedIndex);
  }

  #bodySlotChange(event: Event): void {
    const slot = event.target as HTMLSlotElement;
    this.#panels = slot.assignedElements() as HTMLElement[];
    this.selectedIndexChanged(this.selectedIndex);
  }

  #handleClick(event: MouseEvent): void {
    const tab = this.#findTab(event);
    if (tab === undefined) return;

    this.selectedIndex = this.#tabs.indexOf(tab);
  }

  #findTab(event: Event): HTMLButtonElement | undefined {
    if (event.defaultPrevented) return;

    const tab = (event.target as HTMLElement).closest("button");
    if (!tab) return;

    const tabView = tab.closest("fluent-tab-view");
    if (tabView !== this) return;

    return tab;
  }

  protected override render(): unknown {
    return html`
      <link rel="stylesheet" href="/global.css" />
      <div class="flex ${this.navClass}" part="nav" @click=${this.#handleClick}>
        <slot name="nav" @slotchange=${this.#navSlotChange}></slot>
        <div part="selected-indicator"></div>
      </div>
      <slot
        class="block flex-1 ${this.panelsClass}"
        part="body"
        @slotchange=${this.#bodySlotChange}
      ></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "fluent-tab-view": FluentTabView;
  }
  interface HTMLElementEventMap {
    "theme-changed": Event;
  }
}
