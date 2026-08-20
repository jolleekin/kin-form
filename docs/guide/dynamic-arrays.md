# Dynamic Arrays

Every [`FieldApi`](/guide/nested-objects) exposes array mutation helpers, called
with a path whose value is an array, that update the immutable value **and**
re-key the field registry, so field identity survives a reorder:

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
`toIndex` one slot over, the same result as splicing the item out and
re-inserting it elsewhere. `removeItem` unregisters the removed item's field(s)
first, so they don't leak.

## Addressing the node's own value

Every array method also accepts `""` for `name`, addressing **the node's own
value**, for a reusable component that receives a
`FieldApi<Item[], TParentValue>` and shouldn't need the dotted path to it:

::: code-group

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

```ts [Lit]
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { type FieldApi } from "@kintools/form-lit";

@customElement("array-field")
class ArrayField<Item> extends LitElement {
  @property({ attribute: false })
  accessor api!: FieldApi<Item[], unknown>;

  @property({ attribute: false })
  accessor newItem!: () => Item;

  override render() {
    return html`
      <button @click=${() => this.api.pushItem("", this.newItem())}>
        Add
      </button>
    `;
  }
}

// Usage.
html`
  <array-field .api=${parent.field("items")} .newItem=${() =>
    makeItem()}></array-field>
`;
```

:::

## Why re-keying matters

Without re-keying, a field bound to array index 2 would silently read/write
whatever value now lives at index 2 after a reorder, not the item the user was
actually editing. `id` (see [Concepts](/guide/concepts#shared-state)) stays
stable across a reorder even as `name` (the index-based path) changes: it's the
right list key (`key={field.id}` in React, or `lit-html`'s
[`repeat`](https://lit.dev/docs/templates/lists/#the-repeat-directive) directive
keyed on `field.id` in Lit) instead of the index.

## What's next

- [`FieldApi`](https://jsr.io/@kintools/form-core/doc/index.ts/~/FieldApi) —
  full reference on JSR, including the field registry
