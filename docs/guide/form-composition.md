# Form Composition

::: info

React only for now — other framework bindings are planned.

:::

`Watch` is convenient for a field that appears once, but repeating a render prop
doesn't scale past a couple of fields. For anything reused — a text input, an
address block, a line-item list, a submit button — build a named, typed
component around `useWatch` once and reuse it.

## Leaf fields: `TextField`, `NumberField`

[Basic](/guide/basic) builds `TextField` from scratch, promoting it from a
one-off `Watch` render prop once the same shape appears twice. `NumberField`
follows the same recipe, differing only in the `<input type="number">` markup
and value parsing. Once these exist, a form body reads as configuration rather
than repeated wiring:

```tsx
<TextField
  api={form.field("email", { validators: [required(), email()] })}
  label="Email"
/>
<NumberField api={form.field("age")} label="Age" />
```

Both take an already-resolved `api: FieldApi<TValue, TParentValue>` rather than
`parent`+`name` — the caller resolves the field (and its `validators`,
`dependents`, ...) once, at the call site, via `parent.field(name, options)`.
`TextField`/`NumberField` only need to know they're rendering _some_
`FieldApi<string, TParentValue>`/`FieldApi<number, TParentValue>`, not where in
the tree it lives or how it was configured.

## Nested fields: `AddressField`

A component composes fields — leaf or nested — under its own slice of the value,
as a resolved field. It doesn't need the dotted path leading to it, only that it
owns an `Address`:

```tsx
function AddressField<TParentValue>(
  { api }: { api: FieldApi<Address, TParentValue> }
) {
  return (
    <fieldset>
      <TextField api={api.field("line1")} label="Line 1" />
      <TextField api={api.field("city")} label="City" />
    </fieldset>
  );
}

<AddressField api={form.field("shipping")} />
<AddressField api={form.field("billing")} />
```

### Reacting to the field's own state

`AddressField` above doesn't re-render when the passed-in `api` changes. To
re-render when something on that `api` changes, use `useWatch`:

```tsx
function AddressField<TParentValue>(
  { api }: { api: FieldApi<Address, TParentValue> },
) {
  const [invalid, touched] = useWatch(
    api,
    (f) => [f.invalid, f.touched] as const,
  );

  return (
    <fieldset>
      {invalid && touched && <p>Please fix the highlighted fields.</p>}
      <TextField api={api.field("line1")} label="Line 1" />
      <TextField api={api.field("city")} label="City" />
    </fieldset>
  );
}
```

## Arrays: `ItemsField`

An array component composes the same way, plus array mutation helpers and a
stable React key. Use `field.id` (or `group.id`), not the array index, as the
`key` — index-as-key misattributes uncontrolled DOM state (focus, cursor
position) to the wrong row after a reorder, since the item that _renders_ at
index 2 changes but the component instance React reuses for index 2 doesn't:

```tsx
function ItemsField<TParentValue>(
  { api }: { api: FieldApi<Item[], TParentValue> },
) {
  const value = useWatch(api, (g) => g.value);

  return (
    <>
      {value.map((_, i) => {
        const item = api.field(`${i}`);
        return (
          <ItemField
            key={item.id}
            item={item}
            onRemove={() => api.removeItem("", i)}
          />
        );
      })}
      <button onClick={() => api.pushItem("", { code: "" })}>Add item</button>
    </>
  );
}

function ItemField(
  { item, onRemove }: {
    item: FieldApi<Item, Item[]>;
    onRemove: () => void;
  },
) {
  return (
    <div>
      <TextField api={item.field("code")} label="Code" />
      <button onClick={onRemove}>Remove</button>
    </div>
  );
}
```

`ItemsField` itself needs `useWatch(api, (g) => g.value)` to re-render when the
array changes; `api.field(i)` resolves the stable `item.id` without subscribing
to each item.

`Item` here is a nested object, so each element is decomposed into its own
`FieldApi` too — hence `ItemField` taking a resolved `item`. For a leaf item
type (e.g. `string[]`), the same `api.field(i)` call works unchanged — there's
no separate array-of-leaves API.

## `SubmitButton`

[Basic](/guide/basic) builds a `SubmitButton` that disables while `submitting`.
This one also disables while the form isn't `dirty` — nothing to submit until
something's changed — but the shape is the same: `useWatch` directly, no render
prop, so every form in the app agrees on when submission is disabled:

```tsx
function SubmitButton<TValue>(
  { api, children }: { api: FormApi<TValue>; children: React.ReactNode },
) {
  const [submitting, dirty] = useWatch(
    api,
    (f) => [f.submitting, f.dirty] as const,
  );

  return (
    <button type="submit" disabled={submitting || !dirty}>
      {children}
    </button>
  );
}
```

## Putting it together

```tsx
function CheckoutForm() {
  const form = useForm<Checkout>({
    initialValue: {
      email: "",
      items: [],
      shipping: emptyAddress,
    },
    onSubmit: async (form) => {
      await placeOrder(form.value);
    },
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <TextField
        api={form.field("email", { validators: [required(), email()] })}
        label="Email"
      />
      <AddressField api={form.field("shipping")} />
      <ItemsField api={form.field("items")} />
      <SubmitButton api={form}>Place order</SubmitButton>
    </form>
  );
}
```

Reach for `<Watch>` directly when prototyping or when a field appears once.
Promote to a named component the moment the same shape shows up twice.
