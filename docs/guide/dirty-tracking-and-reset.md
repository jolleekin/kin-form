# Dirty Tracking & Reset

## Dirty tracking

`dirty` lives on `FieldApi`, so any field in the form tree can report whether
its `value` differs from its slice of the baseline:

```ts
form.dirty;

form.field("address").dirty;

form.field("address").field("line1").dirty;
```

It's a deep-equality check against the baseline. An edit undone (e.g. typed,
then typed back) makes `dirty` `false` again. A group's `dirty` needs no
separate aggregation: its `value` already unions every descendant's, so one
check against its baseline slice covers everything underneath.

The baseline is set once, at construction, and only moves via
`reset()`/`resetField()` — not on every render, even with a fresh `initialValue`
object each time (as a re-rendering React hook would pass). This keeps it stable
no matter how often `updateOptions` runs underneath.

## Resetting the whole form

```ts
// Discard edits, back to the original initial value.
form.reset();

// Resets the form to a new baseline after a successful submission.
const saved = await save(form.value);
form.reset(saved);
```

`reset(value)` restores `value` (defaulting to the current baseline) and clears
`touched` throughout the tree. The value cascades to every registered field, so
validation re-runs against it instead of leaving stale errors. Passing an
explicit `value` also moves the dirty baseline to it.

## Resetting a single field

`resetField`, on `FormApi`, is the same idea scoped to one field:

```ts
// Discard edits to just this one field.
form.resetField("email");

// After successfully saving just this field.
const saved = await saveEmail(form.field("email").value);
form.resetField("email", saved);
```

It moves that field's slice of the baseline (defaulting to its current value, a
no-op) the same way `reset` does for the whole tree — siblings and the rest of
the baseline stay untouched. If the field is currently registered (mounted),
`resetField` also restores its `value` and clears its `touched`. If not, only
the baseline moves — it never registers a field just to reset it, so a
conditionally-rendered field you haven't mounted yet stays unregistered but
starts clean whenever it does.

## What's next

- [`FormApi`](https://jsr.io/@kin-form/core/doc/index.ts/~/FormApi) — full
  reference on JSR
