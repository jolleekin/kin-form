/**
 * The devtools panel UI, via {@linkcode DevtoolsPanel}: a toggleable,
 * dockable overlay showing the selected form's live field tree.
 *
 * @module
 */

import {
  type CSSProperties,
  type ReactNode,
  useState,
  useSyncExternalStore,
} from "react";
import type { FormApi } from "@kin-form/core/index.ts";
import type { DevtoolsRegistry } from "./DevtoolsRegistry.ts";
import { FieldTreeRow } from "./FieldTreeRow.tsx";
import { colors, monoFont } from "./styles.ts";

/**
 * The 4 corners the panel can be docked to. Exported (re-exported via
 * `index.ts`) so `DevtoolsProvider`'s `initialPosition` prop can be typed
 * against it.
 */
export type DockPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

/** Props for {@linkcode DevtoolsPanel}. */
export type DevtoolsPanelProps = {
  registry: DevtoolsRegistry;
  /**
   * Corner to dock into before the user has picked one.
   * Defaults to `"bottom-right"`.
   */
  initialPosition?: DockPosition;
};

const DOCK_POSITION_STORAGE_KEY = "kin-form-devtools:position";

// `iconX`/`iconY` place the filled corner square within `DockIcon`'s 16x16
// viewBox — order matches reading order.
const DOCK_POSITIONS: readonly {
  value: DockPosition;
  iconX: number;
  iconY: number;
  label: string;
}[] = [
  { value: "top-left", iconX: 3, iconY: 3, label: "Dock top-left" },
  { value: "top-right", iconX: 10, iconY: 3, label: "Dock top-right" },
  { value: "bottom-left", iconX: 3, iconY: 10, label: "Dock bottom-left" },
  {
    value: "bottom-right",
    iconX: 10,
    iconY: 10,
    label: "Dock bottom-right",
  },
];

// Small "viewport with a filled corner" glyph indicating which corner a
// button docks to. Uses `currentColor` so it inherits the button's
// active/inactive color.
function DockIcon({ x, y }: { x: number; y: number }): ReactNode {
  return (
    <svg width={20} height={20} viewBox="0 0 20 20">
      <rect
        x={1.5}
        y={1.5}
        width={17}
        height={17}
        rx={2}
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
      />
      <rect x={x} y={y} width={7} height={7} rx={1} fill="currentColor" />
    </svg>
  );
}

function isDockPosition(value: string | null): value is DockPosition {
  return DOCK_POSITIONS.some((p) => p.value === value);
}

// Guards both SSR (no `localStorage`) and privacy-mode browsers, where
// merely *accessing* `localStorage` can throw.
function readStoredPosition(fallback: DockPosition): DockPosition {
  try {
    const stored = localStorage.getItem(DOCK_POSITION_STORAGE_KEY);
    return isDockPosition(stored) ? stored : fallback;
  } catch {
    return fallback;
  }
}

function storePosition(position: DockPosition): void {
  try {
    localStorage.setItem(DOCK_POSITION_STORAGE_KEY, position);
  } catch {
    // Ignore write failures (e.g. storage disabled/full).
  }
}

// The side each corner anchors to, so the toggle button and panel can be
// offset from the near edges instead of always `bottom`/`right`.
function insetStyle(position: DockPosition, nearOffset: number): CSSProperties {
  const [vSide, hSide] = position.split("-") as [
    "top" | "bottom",
    "left" | "right",
  ];
  return { [vSide]: nearOffset, [hSide]: 12 } as CSSProperties;
}

// Hoisted module-level constants, not object literals inline in JSX — built
// once, not re-allocated on every render. The position-dependent inset
// (`insetStyle`) is merged in at render time since it varies with state.
const toggleBaseStyle: CSSProperties = {
  position: "fixed",
  zIndex: 2147483647,
  background: colors.bg,
  color: colors.accent,
  border: `1px solid ${colors.border}`,
  borderRadius: 4,
  fontFamily: monoFont,
  fontSize: 13,
  lineHeight: "16px",
  padding: "4px 8px",
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.4)",
};

const panelBaseStyle: CSSProperties = {
  position: "fixed",
  zIndex: 2147483647,
  width: 420,
  height: 420,
  background: colors.bg,
  color: colors.text,
  border: `1px solid ${colors.border}`,
  borderRadius: 4,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)",
};

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "8px 12px",
  borderBottom: `1px solid ${colors.border}`,
  fontFamily: monoFont,
  fontSize: 13,
  lineHeight: "16px",
};

const selectStyle: CSSProperties = {
  background: colors.bgAlt,
  color: colors.text,
  border: `1px solid ${colors.border}`,
  borderRadius: 4,
  fontFamily: monoFont,
  fontSize: 13,
  lineHeight: "16px",
  padding: "5px 8px",
  flex: 1,
};

const cornerGroupStyle: CSSProperties = {
  display: "flex",
  gap: 4,
  marginLeft: "auto",
};

const cornerButtonBaseStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: 4,
};

const treeStyle: CSSProperties = {
  overflow: "auto",
  flex: 1,
};

const emptyStyle: CSSProperties = {
  padding: 8,
  color: colors.textDim,
  fontFamily: monoFont,
  fontSize: 13,
  lineHeight: "16px",
};

function flagLabel(form: FormApi<unknown>): string {
  const flags = [form.dirty && "dirty", form.submitting && "submitting"].filter(
    Boolean,
  );
  return flags.length > 0 ? ` (${flags.join(", ")})` : "";
}

/**
 * The floating devtools panel. Mounted once by {@linkcode DevtoolsProvider}.
 * Subscribes to `registry` for the live set of registered forms, and — only
 * for whichever one is currently selected — renders {@linkcode FieldTreeRow}
 * for its tree.
 */
export function DevtoolsPanel({
  registry,
  initialPosition = "bottom-right",
}: DevtoolsPanelProps): ReactNode {
  useSyncExternalStore(registry.subscribe, registry.getVersion);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [position, setPosition] = useState<DockPosition>(() =>
    readStoredPosition(initialPosition)
  );

  const forms = [...registry.forms.values()];
  // Falls back to `forms[0]` whenever `selectedId` doesn't resolve to a
  // currently-registered form — not just when it's `null` — so selecting a
  // form that later unregisters (e.g. its owning component unmounts) lands
  // on another registered form instead of a blank "no form" pane while the
  // dropdown still lists others.
  const selected =
    (selectedId != null ? registry.forms.get(selectedId) : null) ??
      forms[0] ?? null;

  function selectPosition(next: DockPosition) {
    setPosition(next);
    storePosition(next);
  }

  return (
    <>
      <button
        type="button"
        style={{ ...toggleBaseStyle, ...insetStyle(position, 12) }}
        onClick={() => setOpen((o) => !o)}
      >
        Kin Form ({forms.length})
      </button>
      {open && (
        <div style={{ ...panelBaseStyle, ...insetStyle(position, 48) }}>
          <div style={headerStyle}>
            <span>Form:</span>
            <select
              style={selectStyle}
              value={selected?.id ?? ""}
              onChange={(e) => setSelectedId(Number(e.target.value))}
            >
              {forms.length === 0 && (
                <option value="">(none registered)</option>
              )}
              {forms.map((form) => (
                <option key={form.id} value={form.id}>
                  {registry.getFormName(form.id) ?? `#${form.id}`}
                  {flagLabel(form)}
                </option>
              ))}
            </select>
            <div style={cornerGroupStyle}>
              {DOCK_POSITIONS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  title={p.label}
                  style={{
                    ...cornerButtonBaseStyle,
                    color: position === p.value
                      ? colors.accent
                      : colors.textDim,
                  }}
                  onClick={() => selectPosition(p.value)}
                >
                  <DockIcon x={p.iconX} y={p.iconY} />
                </button>
              ))}
            </div>
          </div>
          <div style={treeStyle}>
            <div style={{ width: "max-content" }}>
              {selected
                ? (
                  <FieldTreeRow
                    // A cast, not a structurally-typed pass-through: `FormApi<unknown>`
                    // is fixed at `TParentValue = never`, and `never` in a
                    // contravariant (function-parameter) position defeats
                    // `AnyNode` substitution several layers down through
                    // `validators`/`handleChange` — see `types.ts`'s comment.
                    node={selected}
                    depth={0}
                  />
                )
                : (
                  <div style={emptyStyle}>
                    No form has called useFormDevtools yet.
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
