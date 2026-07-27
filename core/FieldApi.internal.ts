/**
 * Symbol keys for `FieldApi`'s parent/child protocol methods: calls made
 * across instances (parent to child, child to parent) that stay internal to
 * `FieldApi.ts`. A symbol key can't be reached via `.` access from outside
 * the module that holds the symbol, so these never show up in autocomplete
 * for a `FieldApi` value, unlike a `_`-prefixed method name.
 *
 * Not part of `@kin-form/core`'s public exports; `index.ts` never imports
 * this file. Only `FieldApi.ts` itself imports these to define/call the
 * methods; test files import them too, to spy on one directly.
 *
 * Each constant is left with its inferred `unique symbol` type (no `: symbol`
 * annotation): that's what lets TypeScript treat `[kDestroy]`/etc. as
 * distinct, independently-typed class members instead of merging them all
 * into one indistinguishable `symbol`-keyed signature.
 *
 * @module
 */

/** Key for the method that tears down a field and its own children. */
export const kDestroy = Symbol("destroy");

/** Key for the method a child calls on its parent when its `invalid` changes. */
export const kChildInvalidChanged = Symbol("childInvalidChanged");

/** Key for the method a child calls on its parent when its `touched` changes. */
export const kChildTouchedChanged = Symbol("childTouchedChanged");

/** Key for the method a child calls on its parent when its `validating` changes. */
export const kChildValidatingChanged = Symbol("childValidatingChanged");

/** Key for the method a child calls on its parent when its `value` changes. */
export const kChildValueChanged = Symbol("childValueChanged");

/** Key for the method a parent calls on a child when the parent's `value` changes. */
export const kParentValueChanged = Symbol("parentValueChanged");

/** Key for the method a parent calls on a child when the parent's `initialValue` changes. */
export const kParentInitialValueChanged = Symbol(
  "parentInitialValueChanged",
);

/** Key for the method a parent calls on a child when the parent's `schemaErrorMap` changes. */
export const kParentSchemaErrorsChanged = Symbol(
  "parentSchemaErrorsChanged",
);

/** Key for the method that resolves a schema error for a dot-joined path against an ancestor's `schemaValidator`. */
export const kResolveSchemaError = Symbol("resolveSchemaError");

/** Key for the method that renames a field, used only by this class's own array-rekeying helpers. */
export const kSetName = Symbol("setName");
