/**
 * A `useState`/`useEffect`-based re-render trigger for a devtools row
 * displaying an arbitrary `FieldApi`, via {@linkcode useNodeVersion}.
 *
 * @module
 */

import { useEffect, useState } from "react";
import type { AnyNode } from "./types.ts";

/**
 * Re-renders the calling component on any change to `node` itself
 * (value/error/touched/invalid/validating, via the same `subscribe` every
 * other Kin Form binding uses) and also on
 * {@linkcode FieldApi.onChildrenChanged} — a *separate* channel that
 * fires when a field is registered into or unregistered from `children`,
 * which `subscribe` alone doesn't reliably cover. Subscribed unconditionally
 * (not gated on `node.children.size`, which is just a snapshot at mount
 * time) so a node whose fields haven't rendered yet still notifies this row
 * once they do — a genuine leaf simply never fires that channel.
 *
 * Plain `useState`/`useEffect` rather than `useSyncExternalStore`: the two
 * channels don't share a single comparable snapshot value to hand
 * `getSnapshot`, and this is a dev-only introspection panel, not a path
 * where `useSyncExternalStore`'s tearing guarantees matter.
 *
 * `node` is `AnyNode` (see `types.ts`) rather than a precisely-typed
 * `FieldApi`, for the same reason `useWatch`'s implementation
 * (in `react/`) is loosely typed.
 */
export function useNodeVersion(node: AnyNode): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // Defers the actual state update to a microtask. Both `subscribe` and
    // `onChildrenChanged` can fire synchronously from within a *different*
    // component's render: `parent.field(name, options)` lazily constructs a
    // field directly in a render body, and that construction synchronously
    // notifies an already-subscribed observer like this one — calling
    // `setTick` right there trips React's "Cannot update a component while
    // rendering a
    // different component" warning. A microtask moves the update outside
    // whatever render pass triggered it, with no perceptible delay for a
    // devtools panel.
    const bump = () => {
      queueMicrotask(() => {
        if (!cancelled) setTick((t) => t + 1);
      });
    };
    const unsubscribers = [node.subscribe(bump), node.onChildrenChanged(bump)];

    return () => {
      cancelled = true;
      for (const unsubscribe of unsubscribers) unsubscribe();
    };
  }, [node]);

  return tick;
}
