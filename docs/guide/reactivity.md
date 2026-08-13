# Reactivity

Every node in the tree (field, group, or form) is a pub/sub primitive under the
hood: `subscribe(cb)` registers a callback, and any state change (`value`,
`error`, `touched`, `validating`, ...) calls `notify()`, invoking every
subscriber.

```ts
const unsubscribe = field.subscribe(() => {
  console.log(field.name, field.value);
});

// Later, when no longer needed:
unsubscribe();
```

::: info

Registering or unregistering a child field doesn't notify through this channel;
that's `onChildrenChanged`, meant for introspection tooling like devtools.

:::

## Batching

A single logical change can touch more than one node: setting a field's `value`
also updates the parent group's aggregate state. These are coalesced: within one
synchronous operation, each affected node notifies its subscribers **once**, not
once per intermediate mutation. Batching is scoped per tree, so mutating two
unrelated forms in the same call never coalesces one form's notifications with
the other's.

Call `batch` on any node in the tree: it always coalesces across the whole tree,
not just the node you called it on. For example, updating two sub-paths of
`form.value` directly with `setIn`:

```ts
let notifications = 0;
form.subscribe(() => ++notifications);

form.batch(() => {
  form.field("email").value = "";
  form.field("password").value = "";
});

console.log(notifications); // 1, not 2.
```

Without `batch`, the same two assignments would notify `form`'s subscribers
twice, once per `value` set.

## Subscribing from your UI layer

<FrameworkSnippet>
<template #react>

`useWatch` (or `Watch`, its render-prop form) subscribes the calling component
via `useSyncExternalStore`, re-rendering on every notify by default:

```tsx
const field = useWatch(parent.field("email"));
```

</template>
</FrameworkSnippet>

### Narrowing what runs

<FrameworkSnippet>
<template #react>

Pass `select` to re-render only when the properties you actually read change:

::: code-group

```tsx [React]
const [value, invalid, touched] = useWatch(
  parent.field("email"),
  (f) => [f.value, f.invalid, f.touched] as const,
);
```

:::

`select`'s result is compared shallowly by default (own keys for a record,
index-by-index for an array/tuple), so returning a fresh literal like the tuple
above doesn't force a re-render on every notify.

</template>
</FrameworkSnippet>

### Selecting a derived value

<FrameworkSnippet>
<template #react>

`Watch` is a general-purpose subscription component for any already-resolved
`FieldApi`/`FormApi`, without writing a custom component around `useWatch`.
`children` always receives the field/form as its first argument; pass `select`
to narrow the subscription to a selected value, passed as `children`'s second
argument.

```tsx
// Re-render only when `submitting || !dirty` changes.
<Watch api={form} select={(f) => f.submitting || !f.dirty}>
  {(form, disabled) => (
    <button type="submit" disabled={disabled}>
      Save
    </button>
  )}
</Watch>

// Re-render only when the selected value changes.
<Watch api={itemsGroup} select={(g) => g.value.length}>
  {(_group, count) => <span>{count} items</span>}
</Watch>
```

`useWatch` is the hook `Watch` is built on — use it directly to build reusable
components such as `TextField`, `AddressField`, `SubmitButton`, and so on.

</template>
</FrameworkSnippet>

## What's next

- [Listeners](/guide/listeners) — `onValueChanged`, the value-specific case
  built on top of this
