// deno-lint-ignore-file no-explicit-any
import { html } from "../utils.ts";

interface NavItemProps {
  /** 0, 1 */
  level: number;
  href: string;
  content?: string;
  isActive?: boolean;
  target?: HTMLAnchorElement["target"];
}

export function SideBarNavItem({
  level,
  href,
  content,
  isActive,
  target,
}: NavItemProps) {
  return html`
    <a
      class="${["ps-0", "ps-10"][level]} pe-4 py-2 rounded-sm flex text-inherit 
        ${isActive
        ? "bg-black/5 dark:bg-white/5 relative before:absolute before:start-7 before:top-2/7 before:bottom-2/7 before:rounded-full before:w-1 before:bg-primary"
        : "hover:bg-black/3 hover:dark:bg-white/3"}"
      href="${href}"
      ${target ? `target="${target}"` : ("" as any)}
      ${isActive ? 'aria-current="true"' : ("" as any)}
      >${content}</a
    >
  `;
}
