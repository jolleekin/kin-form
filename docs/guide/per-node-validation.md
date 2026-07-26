# Per-node Validation

## Two kinds of validation

kin-form has two independent validation mechanisms, and most forms use both:

- **Per-node validation** (this page) — `validators`/`asyncValidator`, attached
  to any individual field, group, or form. Each node owns its own rule(s) and
  its own `error`.
- **[Schema validation](/guide/schema-validation)** — a single `schemaValidator`
  attached to a group or form, validating the _whole subtree's_ value in one
  pass (typically with zod/valibot) and reporting results back onto individual
  fields by path, without each field needing its own rule.

They're additive, not exclusive: a field's `error` (from its own
`validators`/`asyncValidator`) and its `schemaError` (its slice of a parent's
whole-tree schema result) are tracked separately, and neither overwrites the
other — `invalid` is `true` if either is set or any child is invalid. Reach for
per-node validation for rules that live naturally on one field (`required`,
`min`, an async uniqueness check); reach for schema validation when you already
have — or want — one schema describing the whole form, or for a check spanning
several fields at once (a cross-field `.refine()`) without hand-wiring
[dependents](/guide/linked-fields).

## Validators

Validators are plain, synchronous functions, run against any node in the tree —
a field, a group, or the form itself:

```ts
export type Validator<TValue, TParentValue = never> = (
  field: FieldApi<TValue, TParentValue>,
) => ValidatorResult;
```

A validator reads `field.value` (or anything else it needs) and returns a falsy
result when valid, or a `string` error message when not. Validators must not
throw, and run **immediately** — on every value change, with no debounce.

```ts
form.field("email", {
  validators: [required("Email is required"), email("Enter a valid email")],
});
```

Validators run **in order**; the first truthy result wins. A single validator
(not wrapped in an array) is also accepted. See [Validators](/validators/) for
the built-in factories (`required`, `minLength`, `email`, `password`, ...), or
[Schema Validation](/guide/schema-validation) to validate a whole group or form
with zod/valibot instead of one hand-written validator per field.

Reassigning `validators` to a new value does **not** itself trigger a new
validation run — it takes effect the next time something actually triggers one
(a value change, or an explicit `validate(true)` call). This is deliberate:
validator factories return a new closure on every call, so re-running on
reference change alone would turn every render into a validation run —
notifying subscribers, triggering a re-render, reassigning validators again, a
self-sustaining loop. If a field's validators rarely change and you want
reassigning the same set to be a cheap no-op, cache the array yourself (a
module-level constant, or `useMemo` in React).

## Async validator, and debouncing

For a check that's expensive or needs to hit a server (an availability check
against a username, say), `asyncValidator` is a separate, **singular** option —
not another `validators` entry:

```ts
export type AsyncValidator<TValue, TParentValue = never> = (
  field: FieldApi<TValue, TParentValue>,
) => ValidatorResult | Promise<ValidatorResult>;
```

```ts
form.field("username", {
  validators: [required("Required"), minLength(3, "Too short")],
  asyncValidator: async (field) =>
    (await checkUsernameTaken(field.value)) ? "Username taken" : null,
  validationDebounceMs: 300,
});
```

It only runs once every `validators` entry has already passed — an
expensive/network-calling check never fires for a value already known invalid
by a cheap one. `validators` are always immediate, never debounced;
`asyncValidator` and [`schemaValidator`](/guide/schema-validation) are the two
places `validationDebounceMs` applies. Rapid successive changes (fast typing)
coalesce into a single run fired after the debounce window, rather than one per
keystroke. `handleBlur` flushes any still-pending debounced run immediately, so
the user isn't left waiting out the window after moving on from the field.

Singular, unlike `validators` — there's no real use case for stacking multiple
async checks on one field the way there is for small sync rules; combine them
yourself inside that one function if you need more than one, e.g.
`async (field) => (await checkA(field)) ?? (await checkB(field))`.

While `asyncValidator` is in flight, `validating` is `true` on that node and
every ancestor up to the root. Concurrent or redundant `validate()` calls join
a single in-flight run instead of stacking up duplicate work, and if a newer
run supersedes an older one, the older result is discarded when it resolves —
it can never clobber a fresher answer.

## Running validation explicitly

```ts
await emailField.validate();
const error = emailField.error;
```

Safe to call concurrently and redundantly — `asyncValidator` runs at most once
per generation of `value`/`asyncValidator`, and a plain `validate()` doesn't
re-run `validators` at all (they're already current from the last value
change). Pass `validate(true)` to force a full re-run — including `validators`
— when something a validator reads changed out of band (not reflected in this
node's own `value`, `validators`, or `asyncValidator` — e.g. external state, or
a sibling field this one isn't a [dependent](/guide/linked-fields) of):

```ts
// Re-check "available" against a username tracked outside the form tree.
await form.field("username").validate(true);
```

`waitForValidation()` resolves once any pending/in-flight run settles.

## `validators` on nested fields and forms

Because every node is the same `FieldApi`, a nested field or the form itself
can carry its own `validators` too, independent of its children's — useful for
a single rule spanning multiple fields rather than living on any one of them:

```ts
form.field("shipping", {
  validators: [
    (group) =>
      group.value.country === "US" && !group.value.state
        ? "State is required for US addresses"
        : null,
  ],
});
```

This is still _per-node_ validation — one message, on this one group's own
`error` — not [schema validation](/guide/schema-validation)'s `schemaErrorMap`.
Reach for this when you have one or two ad hoc cross-field rules; reach for
`schemaValidator` when you want a whole schema (and its own per-path messages)
validating the group at once.

A group's `invalid` reflects **itself or any descendant** — so a group-level
error like this surfaces the same way a child field's error would. For a rule
that only needs to _re-run a sibling's own validators_ rather than add a new
one, see [Linked Fields](/guide/linked-fields) instead.
