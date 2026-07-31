/**
 * Shared type alias for a `FieldApi` of unknown value type, used throughout
 * the devtools UI.
 *
 * @module
 */

import type { FieldApi, FormApi } from "@kin-form/core";

// `any` type arguments here (not `unknown`) because a concrete
// `FieldApi<TValue, TParentValue>` isn't structurally assignable to any
// shared bound: `validators`/`handleChange` recurse back into `FieldApi`
// itself, defeating `unknown` substitution (see `useWatch.ts` in
// `react/` for the same failure worked out in detail). Centralized here so
// that reasoning is written once instead of repeated at every callsite that
// needs a loosely-typed node.
/** A {@linkcode FieldApi} of unknown value/parent-value type. */
// deno-lint-ignore no-explicit-any
export type AnyNode = FieldApi<any, any> | FormApi<any>;
