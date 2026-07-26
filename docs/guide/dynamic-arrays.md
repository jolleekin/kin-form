# Dynamic Arrays

Every [`FieldApi`](/guide/nested-objects) exposes array mutation helpers —
called with a path whose value is an array — that update the immutable value
**and** re-key the field registry, so field identity survives a reorder:

```ts
form.pushItem("items", newItem);
form.insertItem("items", 2, newItem);
form.swapItems("items", 0, 2);
form.moveItem("items", 0, 3);
form.removeItem("items", 1);
form.replaceItem("items", 1, updatedItem);
```

`swapItems` exchanges only the two given indices; everything between stays
untouched. `moveItem` shifts every item strictly between `fromIndex` and
`toIndex` one slot over — the same result as splicing the item out and
re-inserting it elsewhere. `removeItem` unregisters the removed item's field(s)
first, so they don't leak.

## Addressing the node's own value

Every array method also accepts `""` for `name`, addressing **the node's own
value** — for a reusable component that receives a
`FieldApi<Item[], TParentValue>` and shouldn't need the dotted path to it:

::: code-group

```ts [Vanilla]
function bindArrayField<Item, TParentValue>(
  api: FieldApi<Item[], TParentValue>,
  addButton: HTMLButtonElement,
  newItem: () => Item,
) {
  addButton.addEventListener("click", () => api.pushItem("", newItem()));
}
```

```tsx [React]
function ArrayField<Item, TParentValue>(
  {
    api,
    newItem,
  }: {
    api: FieldApi<Item[], TParentValue>;
    newItem: () => Item;
  },
) {
  return <button onClick={() => api.pushItem("", newItem())}>Add</button>;
}

// Usage.
<ArrayField api={parent.field("items")} newItem={() => makeItem()} />;
```

:::

## Why re-keying matters

Without re-keying, a field bound to array index 2 would silently read/write
whatever value now lives at index 2 after a reorder, not the item the user was
actually editing. `id` (see [Concepts](/guide/concepts#shared-state)) stays
stable across a reorder even as `name` (the index-based path) changes — the
right key for a React list (`key={field.id}` instead of `key={index}`).

## What's next

- [`FieldApi`](https://jsr.io/@kin-form/core/doc/index.ts/~/FieldApi) — full
  reference on JSR, including the field registry
