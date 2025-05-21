export const layout = "layouts/docs.ts";

// Remove the order number prefixes.
export function url(page: Lume.Page): string {
  return page.data.url.replaceAll(/\/\d+\./g, "/");
}
