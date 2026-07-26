/**
 * `@kin-form/core` — the framework-agnostic form engine: `FieldApi` and
 * `FormApi`.
 *
 * @module
 */

export * from "./FieldApi.ts";
export * from "./FormApi.ts";
export * from "./types.ts";
export { getIn, setIn, updateIn } from "./utils/immutable.ts";
export { shallowEqual } from "./utils/shallow-equal.ts";
