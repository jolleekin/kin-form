import { html } from "../utils.ts";

export function MenuButton() {
  return html`
    <button
      id="menu-button"
      class="-ms-4 w-12 h-12 rounded flex items-center justify-center
        hover:bg-black/5 dark:hover:bg-white/5 lg:hidden"
    >
      <svg class="w-5 h-5" fill="none" viewBox="0 0 20 20">
        <path
          d="M2 4.75c0-.41.34-.75.75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 5c0-.41.34-.75.75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 9.75ZM2.75 14a.75.75 0 0 0 0 1.5h14.5a.75.75 0 0 0 0-1.5H2.75Z"
          fill="currentColor"
        />
      </svg>
    </button>
  `;
}
