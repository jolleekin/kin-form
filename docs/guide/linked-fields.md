# Linked Fields

Every node is the same [`FieldApi`](/guide/concepts) class, so `dependents`
works the same on a leaf field, group, or the form root.

Declare `dependents` to re-validate sibling fields whenever _this_ field's value
changes:

```ts
form.field("password", {
  dependents: ["confirmPassword"],
  validators: required("Password is required"),
});
form.field("confirmPassword", {
  validators: (field) =>
    field.value !== form.value.password ? "Passwords must match" : null,
});
```

Every time `password` changes, `confirmPassword` is force-validated.
`dependents` paths are relative to this field's parent, not the form root, so a
nested field only reaches its own siblings, not the whole tree.

`dependents` only re-runs a sibling's _validators_ — it can't push a new value
or run arbitrary code. For that, see [Listeners](/guide/listeners).

## Multiple dependents

`dependents` accepts a single path or array, so one field can fan out to several
siblings:

```ts
form.field("country", {
  dependents: ["state", "postalCode"],
});
```

## `dependents` vs. reading the sibling directly

A validator can always read another field's value directly (as
`confirmPassword`'s does, via `form.value.password`) without a `dependents`
declaration — `dependents` only controls _when it re-runs_. Without it, editing
`password` wouldn't re-validate `confirmPassword`, leaving a stale "Passwords
must match" error until it's next edited or blurred.
