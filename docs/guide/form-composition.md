# Form Composition

<FrameworkText>
<template #react>

`Watch` is convenient for a field that appears once, but repeating a render prop
doesn't scale past a couple of fields. For anything reused (a text input, an
address block, a line-item list, a submit button), build a named, typed
component around `useWatch` once and reuse it.

</template>
<template #lit>

`watch` is convenient for a field that appears once, but repeating it doesn't
scale past a couple of fields. For anything reused (a text input, an address
block, a line-item list, a submit button), build a named custom element around
`WatchController` once and reuse it.

</template>
</FrameworkText>

## Leaf fields: `TextField`, `NumberField`

[Basic](/guide/basic) builds `TextField` from scratch. `NumberField` follows the
same recipe, differing only in the input's markup and value parsing. Once these
exist, a form body reads as configuration rather than repeated wiring:

::: code-group

```tsx [React]
<TextField
  api={form.field("email", { validators: [required(), email()] })}
  label="Email"
/>
<NumberField api={form.field("age")} label="Age" />
```

```ts [Lit]
html`
  <text-field
    .api=${form.field("email", { validators: [required(), email()] })}
    label="Email"
  ></text-field>
  <number-field .api=${form.field("age")} label="Age"></number-field>
`;
```

:::

<FrameworkText>
<template #react>

Both take an already-resolved `api: FieldApi<TValue, TParentValue>` rather than
`parent`+`name`: the caller resolves the field (and its `validators`,
`dependents`, ...) once, at the call site, via `parent.field(name, options)`.
`TextField`/`NumberField` only need to know they're rendering _some_
`FieldApi<string, TParentValue>`/`FieldApi<number, TParentValue>`, not where in
the tree it lives or how it was configured.

</template>
<template #lit>

Both take an already-resolved `.api: FieldApi<TValue, unknown>` property rather
than `parent`+`name`: the caller resolves the field (and its `validators`,
`dependents`, ...) once, at the call site, via `parent.field(name, options)`.
`text-field`/`number-field` only need to know they're rendering _some_
`FieldApi<string, unknown>`/`FieldApi<number, unknown>`, not where in the tree
it lives or how it was configured.

</template>
</FrameworkText>

## Nested fields: `AddressField`

A component composes fields (leaf or nested) under its own slice of the value,
as a resolved field. It doesn't need the dotted path leading to it, only that it
owns an `Address`:

::: code-group

```tsx [React]
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

```ts [Lit]
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { type FieldApi } from "@kintools/form-lit";
import "./text-field.ts";

@customElement("address-field")
class AddressField extends LitElement {
  @property({ attribute: false })
  accessor api!: FieldApi<Address, unknown>;

  override render() {
    return html`
      <fieldset>
        <text-field .api=${this.api.field("line1")} label="Line 1"></text-field>
        <text-field .api=${this.api.field("city")} label="City"></text-field>
      </fieldset>
    `;
  }
}

// Usage.
html`
  <address-field .api=${form.field("shipping")}></address-field>
  <address-field .api=${form.field("billing")}></address-field>
`;
```

:::

### Reacting to the field's own state

<FrameworkText>
<template #react>

`AddressField` above doesn't re-render when the passed-in `api` changes. To
re-render when something on that `api` changes, use `useWatch`:

</template>
<template #lit>

`AddressField` above doesn't update when something on the passed-in `.api`
changes. To update when it does, use `WatchController`:

</template>
</FrameworkText>

::: code-group

```tsx [React]
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

```ts [Lit]
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { type FieldApi, WatchController } from "@kintools/form-lit";
import "./text-field.ts";

@customElement("address-field")
class AddressField extends LitElement {
  @property({ attribute: false })
  accessor api!: FieldApi<Address, unknown>;

  #watch = new WatchController(
    this,
    () => this.api,
    (f) => [f.invalid, f.touched] as const,
  );

  override render() {
    const [invalid, touched] = this.#watch.value;
    return html`
      <fieldset>
        ${invalid && touched
          ? html`<p>Please fix the highlighted fields.</p>`
          : ""}
        <text-field .api=${this.api.field("line1")} label="Line 1"></text-field>
        <text-field .api=${this.api.field("city")} label="City"></text-field>
      </fieldset>
    `;
  }
}
```

:::

## Arrays: `ItemsField`

<FrameworkText>
<template #react>

An array component composes the same way, plus array mutation helpers and a
stable React key. Use `field.id` (or `group.id`), not the array index, as the
`key`: index-as-key misattributes uncontrolled DOM state (focus, cursor
position) to the wrong row after a reorder, since the item that _renders_ at
index 2 changes but the component instance React reuses for index 2 doesn't:

</template>
<template #lit>

An array component composes the same way, plus array mutation helpers and
`lit-html`'s
[`repeat`](https://lit.dev/docs/templates/lists/#the-repeat-directive)
directive, keyed on `field.id` (or `group.id`), not the array index:
index-as-key misattributes uncontrolled DOM state (focus, cursor position) to
the wrong row after a reorder, since the item that _renders_ at index 2 changes
but the element instance Lit reuses for index 2 doesn't:

</template>
</FrameworkText>

::: code-group

```tsx [React]
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

```ts [Lit]
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { type FieldApi, WatchController } from "@kintools/form-lit";
import "./text-field.ts";

@customElement("items-field")
class ItemsField extends LitElement {
  @property({ attribute: false })
  accessor api!: FieldApi<Item[], unknown>;

  #watch = new WatchController(this, () => this.api, (g) => g.value);

  override render() {
    const value = this.#watch.value;
    return html`
      ${repeat(
        value,
        (_item, i) => this.api.field(`${i}`).id,
        (_item, i) => {
          const item = this.api.field(`${i}`);
          return html`
            <item-field
              .item=${item}
              .onRemove=${() => this.api.removeItem("", i)}
            ></item-field>
          `;
        },
      )}
      <button type="button" @click=${() => this.api.pushItem("", { code: "" })}>
        Add item
      </button>
    `;
  }
}

@customElement("item-field")
class ItemField extends LitElement {
  @property({ attribute: false })
  accessor item!: FieldApi<Item, Item[]>;

  @property({ attribute: false })
  accessor onRemove!: () => void;

  override render() {
    return html`
      <text-field .api=${this.item.field("code")} label="Code"></text-field>
      <button type="button" @click=${() => this.onRemove()}>Remove</button>
    `;
  }
}
```

:::

<FrameworkText>
<template #react>

`ItemsField` itself needs `useWatch(api, (g) => g.value)` to re-render when the
array changes; `api.field(i)` resolves the stable `item.id` without subscribing
to each item.

</template>
<template #lit>

`ItemsField` itself needs a `select` of `(g) => g.value` to update when the
array changes; `api.field(i)` resolves the stable `item.id` without subscribing
to each item.

</template>
</FrameworkText>

`Item` here is a nested object, so each element is decomposed into its own
`FieldApi` too, hence `ItemField` taking a resolved `item`. For a leaf item type
(e.g. `string[]`), the same `api.field(i)` call works unchanged: there's no
separate array-of-leaves API.

## `SubmitButton`

[Basic](/guide/basic) builds a `SubmitButton` that disables while `submitting`.
This one also disables while the form isn't `dirty` (nothing to submit until
something's changed), but the shape is the same:

<FrameworkText>
<template #react>

`useWatch` directly, no render prop, so every form in the app agrees on when
submission is disabled:

</template>
<template #lit>

`WatchController` directly, no `watch` directive, so every form in the app
agrees on when submission is disabled:

</template>
</FrameworkText>

::: code-group

```tsx [React]
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

```ts [Lit]
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { type FormApi, WatchController } from "@kintools/form-lit";

@customElement("submit-button")
class SubmitButton extends LitElement {
  @property({ attribute: false })
  accessor api!: FormApi<unknown>;

  #watch = new WatchController(
    this,
    () => this.api,
    (f) => [f.submitting, f.dirty] as const,
  );

  override render() {
    const [submitting, dirty] = this.#watch.value;
    return html`
      <button type="submit" ?disabled=${submitting || !dirty}>
        <slot></slot>
      </button>
    `;
  }
}
```

:::

## Putting it together

::: code-group

```tsx [React]
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

```ts [Lit]
import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { FormApi } from "@kintools/form-lit";
import { email, required } from "@kintools/form-validators";
import "./text-field.ts";
import "./address-field.ts";
import "./items-field.ts";
import "./submit-button.ts";

@customElement("checkout-form")
class CheckoutForm extends LitElement {
  #form = new FormApi<Checkout>({
    initialValue: {
      email: "",
      items: [],
      shipping: emptyAddress,
    },
    onSubmit: async (form) => {
      await placeOrder(form.value);
    },
  });

  override render() {
    return html`
      <form @submit=${this.#form.handleSubmit}>
        <text-field
          .api=${this.#form.field("email", {
            validators: [required(), email()],
          })}
          label="Email"
        ></text-field>
        <address-field .api=${this.#form.field("shipping")}></address-field>
        <items-field .api=${this.#form.field("items")}></items-field>
        <submit-button .api=${this.#form}>Place order</submit-button>
      </form>
    `;
  }
}
```

:::

<FrameworkText>
<template #react>

Reach for `<Watch>` directly when prototyping or when a field appears once.
Promote to a named component the moment the same shape shows up twice.

</template>
<template #lit>

Reach for `watch` directly when prototyping or when a field appears once.
Promote to a named custom element the moment the same shape shows up twice.

</template>
</FrameworkText>
