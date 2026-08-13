# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## What this is

`kin-form` is a framework-agnostic form-state library, published as JSR
packages, structured as a Deno workspace with four members:

- `core/` (`@kin-form/core`) — the actual form engine (`FieldApi`, `FormApi`).
  No UI framework dependency. Kept deliberately small and stable — it's just the
  state machine.
- `react/` (`@kin-form/react`) — React bindings (`useForm`, `useWatch`,
  `useMultistep`, `Watch`) on top of `core`.
- `react-devtools/` (`@kin-form/react-devtools`) — a development-only inspector
  panel (`DevtoolsProvider`, `useFormDevtools`) for visualizing a `react/`
  form's live tree state: every registered field/group's `value`, `error`,
  `touched`, and `validating`, as they change. Built on `react/`, not `core/`
  directly.
- `validators/` (`@kin-form/validators`) — common validator factories
  (`required`, `minLength`, `maxLength`, `min`, `max`, `url`, `email`,
  `pattern`, `maxFileSize`) plus `toSchemaValidator()`, a whole-group/whole-form
  adapter for any [Standard Schema](https://standardschema.dev)-compliant
  library (zod v4+, valibot v1+, ...). Split out from `core` on purpose:
  validator wording/edge cases churn far more than the engine does, so it's
  versioned separately.

There is no bundler/build step for development — this is Deno-native TypeScript,
run and type-checked directly.

`react/`'s files each import `core` via the package specifier `@kin-form/core`,
resolved through the Deno workspace (no explicit `imports` entry needed in
`react/deno.json` for that). `deno check react/index.ts` currently passes.

## Commands

Run everything from the repo root (`d:\kin\kin-form`), which is the Deno
workspace root (`deno.json` lists
`workspace: ["core", "docs", "examples/*", "react", "react-devtools", "validators"]`).

```sh
# Run all tests in a package
deno test core/

# Run a single test file
deno test core/FieldApi.test.ts

# Run a single test/step by name (Deno.test uses t.step(...) for sub-cases)
deno test core/FieldApi.test.ts --filter "should update value"

# react/ tests render into a DOM (via @testing-library/react), which Deno
# doesn't provide natively, so every react/*.test.tsx imports
# react/_test-setup.ts first to register Happy DOM's globals. That import
# reads NODE_ENV, so react/ tests need --allow-env (a "test" task wraps this
# — see react/deno.json):
deno task --cwd react test
# equivalent to: deno test --allow-env react/

# Type-check a file (both core and react currently pass)
deno check core/index.ts
deno check react/index.ts

# Lint / format
deno lint core/
deno fmt --check core/
```

## Conventions

### Member ordering

Classes: all fields together, then the constructor, then all methods.

- Fields: public fields/getters/setters first, then private fields. Not
  alphabetized — keep fields that back one accessor pair (a getter/setter) or
  that support one another physically close.
- Methods: not grouped by access level and not alphabetized. Group by
  feature/narrative instead — a public method immediately followed by the
  private helper(s) it alone uses, in the order those helpers are actually
  needed; independent methods ordered however best tells the story of the class
  (e.g. construction → lifecycle → teardown). Keeping a private helper next to
  the public surface it supports reads better than scattering implementation
  details into an alphabetized private-methods bucket at the bottom.

Modules (non-class files): exported members first, module-private helpers after,
in narrative/call order — not alphabetical.

## Architecture

### Class hierarchy

```
BaseApi
  └─ FieldApi<TValue, TParentValue>        (value/error/touched/validating/validators, handleBlur/handleChange, lazy child registry + array helpers)
       └─ FormApi<TValue>                  (root: parent=null, name="", adds submit/reset)
```

There is no separate node/group class anymore — `FieldApi` alone plays both
roles. Whether a given field is treated as a leaf (bind `handleChange` to one
control) or decomposed into children (call `.field(name)` per sub-path when its
value is a nested object/array) is entirely up to the caller; nothing in the
class enforces one or the other, and the same instance can be read either way.

- **`BaseApi`** (`core/BaseApi.ts`) — just a pub/sub primitive: `subscribe(cb)`
  / `notify()`. Everything else is built on top of this for reactivity.
  `batch(fn)` defers `notify()` calls triggered during `fn` so they coalesce
  into one flush per affected instance; batching is scoped per tree via the
  `root` getter (`FieldApi` overrides it to walk up to the ultimate `parent`),
  so two unrelated trees (e.g. two independent forms) never coalesce each
  other's notifications just because their mutations happened to run inside the
  same synchronous call.
- **`FieldApi`** (`core/FieldApi.ts`) — a node in the form's tree: `value`,
  `error`, `touched`, `validating`, `dirty`, `validators`, plus
  `handleBlur`/`handleChange` (the DOM-event-shaped convenience handlers meant
  to be bound straight to a single input — bindable regardless of whether this
  field is being used as a leaf or a group, though on a group `handleBlur`
  touches every descendant too, since the `touched` setter cascades). `dirty` is
  `!deepEqual(value, initialValue)` (cached, recomputed by `#recomputeDirty`
  from `valueChanged` and from the `initialValue` setter itself, not on every
  read) — `initialValue` (protected get/set) is this field's own slice of
  `parent`'s `initialValue`, all the way up to the root's actually-stored
  `#initialValue` (the only place a baseline is physically stored; every other
  field's is purely derived). Unlike `touched`/`invalid`/`validating`, the
  recompute itself needs no aggregation from `children` — a group's `value` is
  already the union of every descendant's value (via `kChildValueChanged`), so
  one `deepEqual` against the group's own `initialValue` slice already reflects
  changes anywhere underneath it. Moving `initialValue` (only
  `FormApi.reset`/`resetField` do) cascades a recompute down through `children`
  via `kParentInitialValueChanged`, the same way `kParentSchemaErrorsChanged`
  cascades schema errors — needed because a `reset`/`resetField` call can move
  the baseline to a value that already matches the current live value, so the
  `value` setter's reference-equality check short-circuits before `valueChanged`
  ever runs. Also holds `#children: Map<DeepKey<TValue>, FieldApi>`, a registry
  of child fields created lazily via `field(name)`, with array mutation helpers
  (`pushItem`, `insertItem`, `moveItem`, `swapItems`, `removeItem`,
  `replaceItem`) and aggregation of `touched`/`invalid`/`validating` up from
  children (`#anyChildTouched` etc., updated via the parent/child protocol
  defined by `core/FieldApi.internal.ts`'s `Symbol` keys —
  `kChildInvalidChanged`, `kChildTouchedChanged`, `kChildValidatingChanged`,
  `kChildValueChanged` called by a child on its `parent`; `kParentValueChanged`,
  `kParentInitialValueChanged`, `kParentSchemaErrorsChanged` called by a parent
  on a child. A `Symbol` key can't be reached via `.` access from outside the
  module that holds it, so these never leak into autocomplete on a `FieldApi`
  value). Setting `value` triggers `valueChanged()`, which syncs children down,
  schedules validation, and notifies the parent
  (`parent[kChildValueChanged](this)`). `validators` (and `dependents`) accept
  either an array or a single bare value (`ArrayOr<...>`, normalized via
  `makeArray`), run in order; the first truthy result wins — validators must not
  throw. `ValidatorResult` (`ValidationError`, plus `false`/`undefined` as
  convenient falsy shorthands) is normalized down to `ValidationError`
  (`string | null`) before being stored as `error`. Debouncing, coalescing
  concurrent `validate()`/`waitForValidation()` calls, and discarding stale
  async results (so a superseded run never clobbers a newer one) are all handled
  by `DebouncedTask` (`core/utils/debounced-task.ts`), which `FieldApi`
  delegates to rather than implementing itself. Array mutation helpers both
  update the immutable value (via `updateIn`) _and_ re-key `#children` so field
  identity follows array index shifts, via one shared
  `#rekeyArrayFields(base, remapIndex)` helper. `moveItem` shifts everything
  between the two indices (like removing and re-inserting the item elsewhere);
  `swapItems` only exchanges the two endpoints.
- **`FormApi`** (`core/FormApi.ts`) — the tree root: a `FieldApi` with `parent`
  `null` and `name` `""`. Adds `submitting`, `reset` (moves `initialValue`,
  inherited from `FieldApi`, and clears `touched` for the whole tree),
  `resetField` (same, scoped to one path — moves that path's slice of both
  `initialValue` and `value` unconditionally, but only clears `touched` if a
  field is actually registered there; never registers one just to reset it — see
  `#findRegisteredField`, which walks already-registered `children` the same way
  `field()`'s own `#assertNoPathCollision` does, without creating), and
  `handleSubmit` (optionally takes an `{ preventDefault(): void }`-shaped event,
  so it's bindable straight to `<form onSubmit={form.handleSubmit}>` with no
  wrapper needed, while still working unchanged from a React Native `onPress` or
  any other caller with no event to pass), which waits for pending validation,
  calls `onSubmitInvalid` if invalid, otherwise calls `onSubmit`/`onSubmitError`
  — unlike `reset`, doesn't move `initialValue` on its own; call
  `reset(form.value)` after a successful submit if the baseline should follow it
  too.

Data flow is bidirectional: setting `field.value` propagates **up** into the
parent's value via `setIn`; setting a field's `value` propagates values **down**
to child fields implicitly (children read via `getIn(parent.value, name)` at
construction, and are otherwise driven by their own `value` setter).

### Path-based typing (`core/types.ts`)

`DeepKey<T>` and `DeepValue<T, Key>` are recursive conditional types that
compute all dot-joined string paths into a (possibly nested/array) type `T`, and
the value type at a given path. This is what makes `field("address.line1")` or
`field("items.0.code")` type-check against the form's value type. Depth defaults
to, and is capped at, 9 (`Prev` tuple trick, terminating at `Prev[0] = never`)
for TS perf — 10 levels of nesting (0 through 9) are checked; value types nested
deeper than that stop being checked.

`DeepKey<T>` never includes `""` — a field name can't be "no path", so
`field()`/`dependents`/`#children` all reject it at the type level.
`DeepKeyOrRoot<T> = "" | DeepKey<T>` is the separate, wider type for the handful
of places `""` is a real, intentional value meaning "this node itself": the
array-mutation methods (`pushItem` and siblings, see their own doc comments),
`getIn`/`setIn`/`updateIn`/`splitPath`, a field's own `name` (`""` for the tree
root — see `FormApi`), and `schemaErrorMap`/`SchemaValidator` (`""` is an issue
with no `path`, i.e. concerning a group's value as a whole).

`core/utils/immutable.ts` (`getIn`/`setIn`/`updateIn`/`splitPath`/`clone`)
implements the runtime counterpart: dot-path strings are split into keys
(numeric segments become array indices), and `updateIn` clones only the objects
along the path (structural sharing), not the whole tree.

### Validation dependents

A field can declare `dependents: DeepKey<TParentValue>[]` — other sibling field
paths to re-validate whenever _this_ field's value changes. Wired up in
`FieldApi#validateDependents`, called from `[kChildValueChanged]`.

For non-validation side effects of a value change (e.g. clearing a sibling
field), `FieldApiOptions.onValueChanged` is called from `FieldApi#valueChanged`,
after parent bubbling and gated on `#constructing` (not `#notifiesParent`) so it
fires for any settled value change — user-driven or a parent push-down like
`form.reset()` — but not the initial value seeded at construction. Refreshed
unconditionally in `updateOptions`, the same treatment `FormApi` gives
`onSubmit`.

### React bindings (`react/`)

Thin wrappers, one hook/component per file: `useForm` creates a `FormApi` once
via `useState(() => new FormApi(opts))`, then calls `form.updateOptions(opts)`
every render so `onSubmit`/`onSubmitInvalid`/`onSubmitError` (and
validators/dependents) stay in sync with the latest render's closures instead of
going stale — `FormApi` overrides `updateOptions` for this (see
`core/FormApi.ts`). There's no separate resolve-and-subscribe hook — a field is
resolved via `parent.field(name, options)` directly (creating lazily, matching
by `DeepKey` name — used for both leaf fields and group-like fields, since
`FieldApi` no longer distinguishes them; safe to call inline in JSX on every
render, since `options` is applied to an already-registered field via
`updateOptions` the same way every time) and subscribed via `useWatch`
(`useSyncExternalStore` underneath), re-rendering on every notify by default or,
when `select` is given, only when the selected value it returns changes
(compared shallowly by default — own keys for a record, index-by-index for an
array/tuple — so a selector can return a fresh literal every call without
forcing extra re-renders). `Watch` is the render-prop form of `useWatch`, for an
already-resolved `FieldApi`/`FormApi` — its `children` always receives the api
as the first argument, plus the selected value as the second when `select` is
given. Resolving a field and rendering/watching it are deliberately two separate
steps as of 2026-07-19 — no `useField`-style hook that does both at once, and no
`Field` component (`Watch` covers that render-prop case now, taking an
already-resolved api the same way it always did) — since calling `field()`
directly with a positional `name` argument infers reliably where `useField`'s
object-bag argument didn't, and a reusable component accepting an
already-resolved `api: FieldApi<TValue, TParentValue>` never needs to erase or
otherwise reconcile a mismatched grandparent type the way one accepting
`parent`+`name` did.
