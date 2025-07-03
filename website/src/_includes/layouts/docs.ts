import { Node } from "lume_markdown_plugins/toc/mod.ts";

import { MenuButton } from "../components/menu-button.ts";
import { SideBarNavItem } from "../components/side-bar-nav-item.ts";
import { TocItem } from "../components/toc-item.ts";
import { html } from "../utils.ts";

export const layout = "layouts/main.ts";

export const head = html`
  <script src="/js/copy-button.js" type="module"></script>
`;

const { version } = JSON.parse(Deno.readTextFileSync("../form/deno.json"));

const hr = html`<hr class="my-0.75 h-0.5 opacity-20" />`;

const windowNewIcon = html`
  <svg class="mx-2.5" fill="none" viewBox="0 0 20 20" width="20" height="20">
    <path
      d="M9.52 6a.5.5 0 0 0 0 1h2.77l-4.14 4.15a.5.5 0 0 0 .7.7L13 7.71v2.77a.5.5 0 0 0 1 0V6.5a.5.5 0 0 0-.5-.5H9.52Zm3.25 11a2.5 2.5 0 0 0 2.47-2.11A2.5 2.5 0 0 0 17 12.5v-7A2.5 2.5 0 0 0 14.5 3h-7a2.5 2.5 0 0 0-2.4 1.8A2.5 2.5 0 0 0 3 7.27v6.23A3.5 3.5 0 0 0 6.5 17h6.27ZM4 7.27c0-.66.42-1.21 1-1.42v6.65A2.5 2.5 0 0 0 7.5 15h6.68c-.2.58-.76 1-1.41 1H6.5A2.5 2.5 0 0 1 4 13.5V7.27ZM7.5 4h7c.83 0 1.5.67 1.5 1.5v7c0 .83-.67 1.5-1.5 1.5h-7A1.5 1.5 0 0 1 6 12.5v-7C6 4.67 6.67 4 7.5 4Z"
      fill="currentColor"
    ></path>
  </svg>
`;

type Data = Lume.Data & {
  toc: Node[];
  csbTitle?: string;
  csbBasename?: string;
};

export default function ({
  content,
  search,
  title,
  url,
  toc,
  csbTitle,
  csbBasename,
}: Data) {
  const pageGroups = Object.entries(
    Object.groupBy(search.pages("url*=/docs/", "page.src.path"), (p) =>
      p.url.match(/\/docs\/([^\/]+)/)![1].toUpperCase()
    ) as Record<string, Lume.Data[]>
  );

  return html`
    <div
      id="nav-view"
      class="w-full max-w-8xl mx-auto px-2 sm:px-4 lg:px-6 grid grid-cols-[auto_1fr_auto] relative group"
    >
      <div
        id="backdrop"
        class="bg-white/40 dark:bg-black/40 inset-0 fixed z-10 backdrop-blur-sm
          hidden group-open:block lg:hidden lg:group-open:hidden"
      ></div>
      <aside
        class="bg-neutral-50 dark:bg-neutral-800 lg:bg-transparent lg:dark:bg-transparent shadow
         fixed z-20 left-0 w-67 top-14 h-[calc(100dvh_-_56px)] overflow-y-auto
         -translate-x-full group-open:translate-x-0 
         lg:sticky lg:translate-x-0 lg:shadow-none transition-transform"
      >
        <div class="px-2 py-1 flex flex-col gap-1">
          ${pageGroups
            .map(([key, pages]) => {
              const isActive = pages.some((p) => p.url === url);

              return html`<details class="group/details" open>
                <summary
                  class="py-2 flex items-center cursor-pointer rounded-sm text-current/60
                  ${isActive
                    ? "bg-black/10 dark:bg-white/10 group-open/details:bg-transparent " +
                      "hover:group-open/details:bg-black/4 hover:group-open/details:dark:bg-white/4 " +
                      "relative before:absolute before:start-0 before:top-2/7 before:bottom-2/7 before:rounded-full before:w-1 before:bg-primary group-open/details:before:hidden"
                    : "hover:bg-black/4 hover:dark:bg-white/4"}"
                >
                  <!-- Chevron-right icon -->
                  <svg
                    class="mx-2.5 group-open/details:rotate-90 transition-transform"
                    fill="none"
                    viewBox="0 0 20 20"
                    width="20"
                    height="20"
                  >
                    <path
                      d="M7.65 4.15c.2-.2.5-.2.7 0l5.49 5.46c.21.22.21.57 0 .78l-5.49 5.46a.5.5 0 0 1-.7-.7L12.8 10 7.65 4.85a.5.5 0 0 1 0-.7Z"
                      fill="currentColor"
                    />
                  </svg>
                  <span class="flex-1">${key}</span>
                </summary>
                <div class="flex flex-col gap-1 mt-1">
                  ${pages
                    .map((p) =>
                      SideBarNavItem({
                        level: 1,
                        href: p.url,
                        content: p.title ?? p.basename,
                        isActive: p.url === url,
                      })
                    )
                    .join("")}
                </div>
              </details>`;
            })
            .join(hr)}
          ${hr}
          ${SideBarNavItem({
            level: 0,
            href: `https://jsr.io/@kin/form@${version}/doc`,
            content: html`${windowNewIcon}<span class="flex-1">API</span>`,
            target: "blank",
          })}
        </div>
      </aside>

      <main
        class="docs mb-20 pb-5 px-2 sm:px-4 lg:px-6 overflow-x-hidden
          "
      >
        <header class="flex items-center pt-4 mb-4 z-1">
          ${MenuButton()}
          <h1 class="text-3xl">${title}</h1>
        </header>
        ${content}
        ${csbTitle
          ? html`
              <iframe
                src="https://codesandbox.io/p/devbox/${csbBasename}?embed=1&file=%2Fsrc%2Fkin-form-example.ts"
                style="width:100%; flex: 1; border:0; border-radius: 4px; overflow:hidden;"
                title="${csbTitle}"
                sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
              ></iframe>
            `
          : ""}
      </main>

      ${toc.length
        ? html`
            <aside
              id="toc"
              class="flex-col gap-1 sticky top-14 w-64 h-[calc(100dvh_-_56px)]
                px-6 py-3 hidden lg:flex"
            >
              <h2>On this page</h2>
              <div
                class="flex flex-col relative 
                  before:absolute before:top-0 before:bottom-0 before:start-0
                  before:w-1 before:bg-current/10 before:rounded-full"
              >
                <div
                  id="toc-active-indicator"
                  class="absolute w-1 rounded-full bg-primary"
                ></div>
                ${toc.map(TocItem).join("")}
              </div>
            </aside>
          `
        : ""}
    </div>
    <script type="module">
      const $ = (selector) => document.querySelector(selector);

      for (const el of document.querySelectorAll("pre > code")) {
        const button = document.createElement("copy-button");
        el.parentElement.appendChild(button);
      }

      // Primary nav pane toggle.

      const navView = $("#nav-view");
      $("#menu-button").onclick = () => {
        if (navView.hasAttribute("open")) {
          navView.removeAttribute("open");
        } else {
          navView.setAttribute("open", "");
        }
      };

      $("#backdrop").onscroll = (evt) => evt.preventDefault();

      $("#backdrop").onclick = () => {
        navView.removeAttribute("open");
      };

      // Hightlight TOC items on scroll.

      const tocAnchors = $("#toc").querySelectorAll("a");
      if (tocAnchors.length > 0) {
        const main = $("main");
        const headerAnchors = document.querySelectorAll(".header-anchor");
        const tocActiveIndicator = $("#toc-active-indicator");

        function updateToc() {
          let indicatorTop = null;
          let indicatorBottom = 0;

          for (let i = 0; i < headerAnchors.length; ++i) {
            const top = headerAnchors[i].getBoundingClientRect().top;
            const bottom =
              i + 1 < headerAnchors.length
                ? headerAnchors[i + 1].getBoundingClientRect().top
                : main.getBoundingClientRect().bottom;

            const visibleTop = Math.max(56 /* top header height */, top);
            const visibleBottom = Math.min(innerHeight, bottom);

            if (visibleBottom > visibleTop) {
              const { offsetTop, offsetHeight } = tocAnchors[i];
              indicatorTop ??=
                ((visibleTop - top) / (bottom - top)) * offsetHeight +
                offsetTop;
              indicatorBottom =
                ((visibleBottom - top) / (bottom - top)) * offsetHeight +
                offsetTop;
            }
          }

          tocActiveIndicator.style.top = indicatorTop + "px";
          tocActiveIndicator.style.height =
            indicatorBottom - indicatorTop + "px";
        }

        document.addEventListener("scroll", updateToc);
        window.addEventListener("resize", updateToc);

        Promise.resolve().then(updateToc);
      }
    </script>
  `;
}
