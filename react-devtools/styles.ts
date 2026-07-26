/**
 * Shared color/font constants for the devtools panel's inline styles.
 *
 * Internal, not exported via index.ts — the panel renders with its own
 * fixed dark styling regardless of the host page's theme, the same way most
 * devtools overlays do, rather than trying to match the app around it.
 *
 * @module
 */

export const colors = {
  bg: "#1e1e1e",
  bgAlt: "#252526",
  border: "#3c3c3c",
  text: "#d4d4d4",
  textDim: "#8a8a8a",
  accent: "#4fc1ff",
  valid: "#4ec9b0",
  invalid: "#f14c4c",
  touched: "#dcdcaa",
  validating: "#c586c0",
  dirty: "#4ec9b0",
} as const;

export const monoFont: string =
  '"SF Mono", "Cascadia Code", Consolas, "Courier New", monospace';
