import { html } from "../utils.ts";

export function TabButton({ name }: { name: string }) {
  return html`
    <button
      class="p-3 -outline-offset-2 rounded-t-sm
            hover:bg-neutral-50/50 selected:bg-white selected:shadow-sm
            dark:hover:bg-neutral-800/50 dark:selected:bg-neutral-800"
      slot="nav"
    >
      ${name}
    </button>
  `;
}
