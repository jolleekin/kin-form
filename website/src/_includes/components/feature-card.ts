import { html } from "../utils.ts";

export interface FeatureCardProps {
  title: string;
  description: string;
}

export function FeatureCard({ title, description }: FeatureCardProps) {
  return html`
    <div
      class="flex-1 rounded-lg shadow-sm p-6 bg-neutral-50 dark:bg-neutral-800"
    >
      <h3 class="text-xl text-neutral-900 dark:text-white mb-2">
        ${title}
      </h3>
      <p class="text-neutral-500 dark:text-neutral-300">${description}</p>
    </div>
  `;
}
