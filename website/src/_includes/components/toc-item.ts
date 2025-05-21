import { Node as TocNode } from "lume_markdown_plugins/toc/mod.ts";

import { html } from "../utils.ts";

export function TocItem(item: TocNode): string {
  return html`
    <a class="ps-4 py-1 hover:underline" href="#${item.slug}">${item.text}</a>
  `;
}
