import type { ReactNode } from "react";
import { type FieldApi, useWatch } from "@kintools/form-react";

export type ArrayFieldProps<TParentValue, TItem> = {
  api: FieldApi<TItem[], TParentValue>;
  label: ReactNode;
  newItem: () => TItem;
  // Derives a stable React list key from an item, e.g. an id embedded on it
  // at creation (see `reusable-array`'s `teamMembers`). Falls back to the
  // array index when omitted, e.g. for primitive items with nothing to key
  // off (`skills`) — see the caveat on that fallback below.
  itemKey?: (item: TItem) => string | number | bigint;
  children: (
    api: FieldApi<TItem[], TParentValue>,
    index: number,
  ) => ReactNode;
};

// Generic array editor: works for any item type (primitive or object) at any
// path, because `group`'s own value already *is* the array — array methods
// are called on it with `""` (see `DeepKeyOrRoot`'s doc comment in
// `core/types.ts`) — so this only ever needs a `FieldApi<TItem[]>`, resolved
// and passed in by the caller, and never has to know where it's mounted.
// `children` renders one item's fields, given `group` (to resolve each
// item's own fields off of) and that item's `index` (to build its field
// names from, e.g. `${index}` for a primitive item or `${index}.code` for an
// object one).
export function ArrayField<TParentValue, TItem>({
  api,
  label,
  newItem,
  itemKey,
  children,
}: ArrayFieldProps<TParentValue, TItem>): ReactNode {
  const value = useWatch(api, (f) => f.value);

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <button
          type="button"
          onClick={() => api.pushItem("", newItem())}
          className="text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          + Add
        </button>
      </div>

      <div className="mt-2 space-y-2">
        {value.map((item, index) => (
          // Falling back to `index` when no `itemKey` is given does have the
          // usual React list caveat: if an earlier row is removed while a
          // later row holds focus, the browser keeps focus on the same DOM
          // node, which now silently renders a different item underneath it.
          // Field *state* stays correct either way (`moveItem`/`swapItems`
          // re-key every field to its new index before updating `value`),
          // but that's about the field, not the DOM node holding it.
          <div
            key={itemKey?.(item) ?? index}
            className="flex items-start gap-2"
          >
            <div className="flex-1">
              {children(api, index)}
            </div>
            <div className="flex flex-col gap-1 pt-1">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => api.moveItem("", index, index - 1)}
                className="text-xs text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Move up"
              >
                ▲
              </button>
              <button
                type="button"
                disabled={index === value.length - 1}
                onClick={() => api.moveItem("", index, index + 1)}
                className="text-xs text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Move down"
              >
                ▼
              </button>
              <button
                type="button"
                onClick={() => api.removeItem("", index)}
                className="text-xs text-red-500 hover:text-red-600"
                aria-label="Remove"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        {value.length === 0 && (
          <p className="text-sm text-gray-400">None yet.</p>
        )}
      </div>
    </div>
  );
}
