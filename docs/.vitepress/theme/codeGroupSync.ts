import { watch } from "vue";
import { selectedFramework } from "./store.ts";

export const frameworks = [
  { id: "react", label: "React" },
  { id: "lit", label: "Lit" },
];

function syncCodeGroups(fwId: string): void {
  if (typeof document === "undefined") return;
  const fw = frameworks.find((f) => f.id === fwId);
  if (!fw) return;

  const labels = document.querySelectorAll(".vp-code-group .tabs label");
  labels.forEach((label) => {
    if (label.textContent?.trim() !== fw.label) return;

    const inputId = label.getAttribute("for");
    const input = inputId
      ? document.getElementById(inputId) as HTMLInputElement | null
      : null;
    if (!input || input.checked) return;

    // Flip the tab the same way VitePress's own code-group handler does
    // (vitepress/dist/client/app/composables/codeGroups.js), but without a
    // real `.click()`: that also fires VitePress's own click listener, which
    // calls `label.scrollIntoView({ block: 'nearest' })` on every group this
    // syncs, not just the one the user actually clicked, dragging the page
    // toward whichever code-group happens to sync last.
    const group = input.closest(".vp-code-group");
    const blocks = group?.querySelector(".blocks");
    if (!group || !blocks) return;

    const inputs = Array.from(group.querySelectorAll("input"));
    const i = inputs.indexOf(input);
    const current = Array.from(blocks.children).find((c) =>
      c.classList.contains("active")
    );
    const next = blocks.children[i];
    if (!next || current === next) return;

    input.checked = true;
    current?.classList.remove("active");
    next.classList.add("active");
  });
}

// Keeps every `::: code-group`'s active tab and the shared `selectedFramework`
// store in sync in both directions: clicking a tab updates the store, and a
// store change (e.g. from the switcher dropdown) re-syncs every group on the
// page. Called once from `Layout.vue`, which mounts on every page including
// the homepage, so a tab click on a page without the switcher UI still
// updates the store for pages that read it later.
export function setupCodeGroupSync(): void {
  // Wait a tick for code groups to mount.
  setTimeout(() => syncCodeGroups(selectedFramework.value), 10);

  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const label = target.closest(".vp-code-group .tabs label");
    if (label) {
      const text = label.textContent?.trim();
      const fw = frameworks.find((f) => f.label === text);
      if (fw && fw.id !== selectedFramework.value) {
        selectedFramework.value = fw.id;
      }
    }
  });

  watch(selectedFramework, syncCodeGroups);
}
