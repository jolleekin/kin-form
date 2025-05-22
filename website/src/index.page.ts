import { escape } from "@std/html";

import {
  FeatureCard,
  FeatureCardProps,
} from "./_includes/components/feature-card.ts";
import { html } from "./_includes/utils.ts";
import { TabButton } from "./_includes/components/tab-button.ts";

// Page data.

export const layout = "layouts/main.ts";

export const head = html`
  <script src="/js/tab-view.js" type="module"></script>
`;

//

const lit =
  '<a class="text-primary hover:underline" href="https://lit.dev" target="_blank">Lit</a>';

const features: FeatureCardProps[] = [
  {
    title: "Fast",
    description: `Leverage ${lit}'s efficient rendering for the highest performance.`,
  },
  {
    title: "Type-safe",
    description:
      "First-class TypeScript support with autocompletion and type inference, minimizing runtime bugs",
  },
  {
    title: "Any-level validation",
    description:
      "Synchronous and asynchronous validation at any level (leaf field, field group, or the whole form)",
  },
  {
    title: "Dependent field validation",
    description:
      "Automatically validate dependent fields when the fields they depend on change values",
  },
  {
    title: "Flexible form structure",
    description:
      "Easily choose between nested and flattened form structures, or use them both",
  },
  {
    title: "Flexible field components",
    description:
      "Create custom fields by extending <code>FormField</code> and <code>FieldGroup</code>, " +
      "or use the generic <code>&lt;kin-field&gt;</code> and <code>&lt;kin-field-group&gt;</code> elements",
  },
  {
    title: "Array operations",
    description:
      "Built-in support for array operations (insert, move, push, remove, and replace)",
  },
  {
    title: "Minimum dependencies",
    description: `Only depends on ${lit}`,
  },
];

const tabs = ["form-demo.ts", "text-field.ts", "number-field.ts", "utils.ts"];

export default function () {
  return html`
    <div
      class="w-dvw max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-y-16 flex-1 pb-16"
    >
      <div class="flex flex-col items-center gap-6 pt-16">
        <span class="text-3xl text-center text-balance">
          A <span class="font-bold">fast</span>,
          <span class="font-bold">flexible</span>, and
          <span class="font-bold">type-safe</span> form management library for
          ${lit}
        </span>
        <pre
          class="rounded-md bg-neutral-50 dark:bg-neutral-800"
        ><code class="language-sh p-2!">deno add jsr:@kin/form
 pnpm add jsr:@kin/form # v10.9.0+
 yarn add jsr:@kin/form # v4.9+
 npx  jsr add @kin/form
</code></pre>
        <a
          class="inline-flex rounded-full h-10 px-6 items-center justify-center bg-primary text-white"
          href="docs/introduction/getting-started"
          >Get Started</a
        >
      </div>

      <div
        class="gap-4 grid grid-rows-[auto] grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      >
        ${features.map(FeatureCard).join("")}
      </div>

      <fluent-tab-view
        class="min-h-96"
        panels-class="bg-neutral-50 dark:bg-neutral-800"
      >
        ${tabs
          .map(
            (name) => html`
              ${TabButton({ name })}
              <pre
                class="shadow-sm"
                data-line="5-10"
              ><code class="language-ts">${escape(
                Deno.readTextFileSync(`src/_includes/home/${name}`)
              )}</code></pre>
            `
          )
          .join("")}
      </fluent-tab-view>
    </div>
  `;
}
