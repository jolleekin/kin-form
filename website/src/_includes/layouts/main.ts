import { html } from "../utils.ts";

export default function ({ content, head, title, url }: Lume.Data) {
  return html`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title ? title + " - Kin Form" : "Kin Form"}</title>
        <link rel="stylesheet" href="/css/prism/dark.css" id="prism" />
        <link rel="stylesheet" href="/global.css" />
        ${head ?? ""}
        <script>
          function setTheme(isDark) {
            document.documentElement.classList.toggle("dark", isDark);
            document.getElementById("prism").href =
              "/css/prism/" + (isDark ? "dark" : "light") + ".css";
          }

          setTheme(
            localStorage.theme === "dark" ||
              (!("theme" in localStorage) &&
                matchMedia("(prefers-color-scheme: dark)").matches)
          );
        </script>
      </head>
      <body
        class="m-0 min-h-dvh grid grid-rows-[auto_1fr_auto] bg-neutral-100 text-gray-700 dark:bg-neutral-900 dark:text-gray-200 overscroll-none"
      >
        <header
          class="sticky top-0 z-30 bg-neutral-100 dark:bg-neutral-900 inset-shadow-b dark:shadow-neutral-500"
        >
          <div class="w-full max-w-8xl mx-auto px-2 sm:px-4 lg:px-6">
            <nav class="flex justify-between h-14 px-2">
              <div class="flex items-center">
                <a href="/" class="flex items-center">
                  <span
                    class="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
                    >Kin Form</span
                  >
                </a>
              </div>
              <div class="flex gap-x-6">
                <a
                  href="/docs/introduction/getting-started"
                  class="inline-flex items-center px-1 hover:text-primary ${url.includes(
                    "/docs"
                  )
                    ? "relative before:absolute before:start-0 before:bottom-0 before:end-0 before:rounded-full before:h-1 before:bg-primary"
                    : ""}"
                  >Docs</a
                >
                <button
                  id="theme-toggle"
                  class="px-1 hover:text-primary"
                  title="Toggle dark mode"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-6 w-6 hidden dark:block"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-6 w-6 block dark:hidden"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                </button>
                <a
                  class="inline-flex items-center px-1 hover:text-primary"
                  href="https://github.com/jolleekin/kin-form"
                  target="_blank"
                  title="GitHub repository"
                >
                  <svg
                    id="github"
                    viewBox="0 0 24 24"
                    width="24"
                    fill="currentColor"
                  >
                    <path
                      d="M12,2C6.48,2,2,6.59,2,12.25c0,4.53,2.87,8.37,6.84,9.73c0.5,0.09,0.68-0.22,0.68-0.49c0-0.24-0.01-0.89-0.01-1.74c-2.78,0.62-3.37-1.37-3.37-1.37c-0.45-1.18-1.11-1.5-1.11-1.5c-0.91-0.64,0.07-0.62,0.07-0.62c1,0.07,1.53,1.06,1.53,1.06c0.89,1.57,2.34,1.11,2.91,0.85c0.09-0.66,0.35-1.11,0.63-1.37c-2.22-0.26-4.56-1.14-4.56-5.07c0-1.12,0.39-2.03,1.03-2.75c-0.1-0.26-0.45-1.3,0.1-2.71c0,0,0.84-0.28,2.75,1.05c0.8-0.23,1.65-0.34,2.5-0.34c0.85,0,1.7,0.12,2.5,0.34c1.91-1.33,2.75-1.05,2.75-1.05c0.55,1.41,0.2,2.45,0.1,2.71c0.64,0.72,1.03,1.63,1.03,2.75c0,3.94-2.34,4.81-4.57,5.06c0.36,0.32,0.68,0.94,0.68,1.9c0,1.37-0.01,2.48-0.01,2.81c0,0.27,0.18,0.59,0.69,0.49c3.97-1.36,6.83-5.2,6.83-9.73C22,6.59,17.52,2,12,2"
                    ></path>
                  </svg>
                </a>
              </div>
            </nav>
          </div>
        </header>
        ${content}
        <footer class="flex justify-center py-4 -mt-14 relative z-30">
          Created with ♥️ by&nbsp;
          <a
            class="hover:text-primary"
            href="https://github.com/jolleekin"
            target="_blank"
            >Man Hoang (Kin)</a
          >
        </footer>
        <script>
          const themeToggle = document.getElementById("theme-toggle");

          themeToggle.addEventListener("click", () => {
            if (document.documentElement.classList.contains("dark")) {
              setTheme(false);
              localStorage.theme = "light";
            } else {
              setTheme(true);
              localStorage.theme = "dark";
            }
            window.dispatchEvent(new Event("theme-changed"));
          });
        </script>
      </body>
    </html>
  `;
}
