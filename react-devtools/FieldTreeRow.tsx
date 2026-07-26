/**
 * A recursive tree row rendering one `FieldApi`, via
 * {@linkcode FieldTreeRow}.
 *
 * @module
 */

import { type CSSProperties, type ReactNode, useState } from "react";
import { useNodeVersion } from "./useNodeVersion.ts";
import { colors, monoFont } from "./styles.ts";
import type { AnyNode } from "./types.ts";

/** Props for {@linkcode FieldTreeRow}. */
export type FieldTreeRowProps = {
  node: AnyNode;
  /** Nesting depth, for indentation — `0` for the tree's root. */
  depth: number;
};

// A node's `children` keys are dotted paths *relative to that node* and can
// be any depth (e.g. "items.0.label"), not just a direct child name — see
// `FieldApi.field`'s `DeepKey` typing. `Map` iteration order also doesn't
// track current array order: `swapItems`/`moveItem` re-key existing entries
// in place without reordering the `Map` itself. So for an array-valued node,
// sort by the numeric first segment of each key instead of trusting
// iteration order; a non-array node's registration order is stable and left
// alone.
function sortedFields(node: AnyNode): AnyNode[] {
  const entries = [...node.children.entries()];
  if (!Array.isArray(node.value)) {
    return entries.map(([, field]) => field);
  }

  return entries
    .map(([key, field], i) => ({ field, index: Number(key.split(".")[0]), i }))
    .sort((a, b) =>
      Number.isNaN(a.index) || Number.isNaN(b.index)
        ? a.i - b.i
        : a.index - b.index
    )
    .map((e) => e.field);
}

function formatValue(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value instanceof File) return `File(${value.name})`;
  if (value instanceof Date) return value.toISOString();

  try {
    const json = JSON.stringify(value);
    return json.length > 60 ? json.slice(0, 60) + "…" : json;
  } catch {
    return String(value);
  }
}

// Hoisted module-level constants, not object literals inline in JSX — built
// once, not re-allocated on every render. `rowBaseStyle` holds everything
// that doesn't vary per row; `depth`'s indentation is the one thing that
// does, so it's spread in at the callsite instead of living here.
const rowBaseStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  padding: "2px 8px",
  fontFamily: monoFont,
  fontSize: 12,
  lineHeight: "20px",
  whiteSpace: "nowrap",
};

const disclosureStyle: CSSProperties = {
  background: "none",
  border: "none",
  color: colors.textDim,
  cursor: "pointer",
  padding: 0,
  width: 20,
  fontSize: 20,
  lineHeight: 1,
};

const disclosureSpacerStyle: CSSProperties = { width: 20 };

const nameStyle: CSSProperties = { color: colors.accent };

const valueStyle: CSSProperties = {
  color: colors.text,
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const errorStyle: CSSProperties = { color: colors.invalid };

const detailsToggleStyle: CSSProperties = {
  background: "none",
  border: "none",
  color: colors.textDim,
  cursor: "pointer",
  padding: 0,
  fontFamily: monoFont,
  fontSize: 11,
};

const detailsListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  padding: "2px 8px",
  fontFamily: monoFont,
  fontSize: 11,
  lineHeight: "16px",
  color: colors.textDim,
};

const detailRowStyle: CSSProperties = {
  display: "flex",
  gap: 6,
  whiteSpace: "normal",
  wordBreak: "break-word",
};

const detailLabelStyle: CSSProperties = { flexShrink: 0 };

const detailValueStyle: CSSProperties = { color: colors.text };

const badgeColor = {
  touched: colors.touched,
  validating: colors.validating,
  invalid: colors.invalid,
  dirty: colors.dirty,
} as const;

function Badge({
  label,
  kind,
}: {
  label: string;
  kind: "touched" | "validating" | "invalid" | "dirty";
}): ReactNode {
  const color = badgeColor[kind];
  return (
    <span
      style={{
        color,
        border: `1px solid ${color}`,
        borderRadius: 4,
        fontSize: 10,
        padding: "0 4px",
        lineHeight: "16px",
      }}
    >
      {label}
    </span>
  );
}

/**
 * One row per `FieldApi`, recursing into a node's own
 * {@linkcode sortedFields} for its children — deliberately built the same
 * way real Kin Form UI is: each row subscribes only to its own node via
 * {@linkcode useNodeVersion}, so an edit to one field re-renders that row
 * (and whichever ancestors' aggregate flags it flips), not the whole tree.
 *
 * Whether a row renders as expandable is decided by `children.size`, not a
 * type check — a node whose value happens to be an object/array but hasn't
 * had `field()` called on any of its sub-paths yet (e.g. its inputs haven't
 * rendered) shows as a leaf until something registers into it, matching
 * "leaf vs. decomposed is a usage choice, not a data-shape fact."
 */
export function FieldTreeRow({ node, depth }: FieldTreeRowProps): ReactNode {
  useNodeVersion(node);
  const [expanded, setExpanded] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const hasChildren = node.children.size > 0;

  return (
    <>
      <div style={{ ...rowBaseStyle, paddingLeft: 8 + depth * 24 }}>
        {hasChildren
          ? (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              style={disclosureStyle}
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? "▾" : "▸"}
            </button>
          )
          : <span style={disclosureSpacerStyle} />}
        <span style={nameStyle}>{node.name || "(root)"}</span>
        {!hasChildren && (
          <span style={valueStyle}>{formatValue(node.value)}</span>
        )}
        {node.touched && <Badge label="touched" kind="touched" />}
        {node.dirty && <Badge label="dirty" kind="dirty" />}
        {node.validating && <Badge label="validating" kind="validating" />}
        {node.invalid && <Badge label="invalid" kind="invalid" />}
        {node.error || node.schemaError
          ? (
            <span style={errorStyle}>
              {String(node.error ?? node.schemaError)}
            </span>
          )
          : null}
        <button
          type="button"
          onClick={() => setDetailsOpen((o) => !o)}
          style={detailsToggleStyle}
          aria-label={detailsOpen ? "Hide details" : "Show details"}
        >
          {detailsOpen ? "▾ details" : "▸ details"}
        </button>
      </div>
      {detailsOpen && <NodeDetails node={node} depth={depth} />}
      {hasChildren && expanded && (
        <div>
          {sortedFields(node).map((field) => (
            <FieldTreeRow key={field.id} node={field} depth={depth + 1} />
          ))}
        </div>
      )}
    </>
  );
}

// The expanded state a node's "▸ details" toggle reveals — every property
// `FieldTreeRow`'s own compact row doesn't already surface as a badge or
// inline preview. Kept as a separate disclosure from `expanded` (which
// governs `children`) so inspecting one node's full state doesn't force
// every descendant's rows to grow too.
function NodeDetails(
  { node, depth }: { node: AnyNode; depth: number },
): ReactNode {
  const schemaErrorEntries = node.schemaErrorMap
    ? Object.entries(node.schemaErrorMap)
    : null;

  return (
    <div
      style={{ ...detailsListStyle, paddingLeft: 8 + depth * 24 + 24 }}
    >
      <div style={detailRowStyle}>
        <span style={detailLabelStyle}>value:</span>
        <span style={detailValueStyle}>{formatValue(node.value)}</span>
      </div>
      <div style={detailRowStyle}>
        <span style={detailLabelStyle}>error:</span>
        <span style={detailValueStyle}>{String(node.error)}</span>
      </div>
      <div style={detailRowStyle}>
        <span style={detailLabelStyle}>schemaError:</span>
        <span style={detailValueStyle}>{String(node.schemaError)}</span>
      </div>
      <div style={detailRowStyle}>
        <span style={detailLabelStyle}>schemaErrorMap:</span>
        <span style={detailValueStyle}>
          {schemaErrorEntries
            ? schemaErrorEntries
              .map(([path, message]) => `${path || "(self)"}: ${message}`)
              .join(", ")
            : "null"}
        </span>
      </div>
      <div style={detailRowStyle}>
        <span style={detailLabelStyle}>validators:</span>
        <span style={detailValueStyle}>{node.validators.length}</span>
      </div>
      <div style={detailRowStyle}>
        <span style={detailLabelStyle}>children:</span>
        <span style={detailValueStyle}>{node.children.size}</span>
      </div>
    </div>
  );
}
