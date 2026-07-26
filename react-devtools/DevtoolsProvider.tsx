/**
 * The devtools panel's root component and context, via
 * {@linkcode DevtoolsProvider}.
 *
 * @module
 */

import { type Context, createContext, type ReactNode, useState } from "react";
import { DevtoolsRegistry } from "./DevtoolsRegistry.ts";
import { DevtoolsPanel, type DockPosition } from "./DevtoolsPanel.tsx";

/**
 * `null` outside any `DevtoolsProvider` — {@linkcode useFormDevtools} treats
 * that as "no devtools mounted" and registers nothing.
 */
export const DevtoolsContext: Context<DevtoolsRegistry | null> = createContext<
  DevtoolsRegistry | null
>(null);

/** Props for {@linkcode DevtoolsProvider}. */
export type DevtoolsProviderProps = {
  children: ReactNode;
  /** Initial corner to dock the panel into. Defaults to `"bottom-right"`. */
  initialPosition?: DockPosition;
};

/**
 * The devtools context provider. Mount once, near the root of the app
 * (typically only in development). Renders `children` untouched and adds
 * the devtools panel alongside them.
 *
 * Any {@linkcode useFormDevtools} call anywhere under `children` finds this
 * provider via context and registers its form into the same registry the
 * panel reads from — without a `DevtoolsProvider` ancestor, those calls are
 * no-ops (see {@linkcode useFormDevtools}'s comment for why that matters).
 */
export function DevtoolsProvider({
  children,
  initialPosition,
}: DevtoolsProviderProps): ReactNode {
  const [registry] = useState(() => new DevtoolsRegistry());

  return (
    <DevtoolsContext value={registry}>
      {children}
      <DevtoolsPanel registry={registry} initialPosition={initialPosition} />
    </DevtoolsContext>
  );
}
