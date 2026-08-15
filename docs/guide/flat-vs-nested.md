# Flat vs. Nested Structure

Kin Form doesn't force one tree shape for a nested value. You can build a form
structure that mirrors it exactly, with one `FieldApi` per object/array level,
or flatten some subtrees, or flatten the whole thing to dotted paths off the
form root. The choice is made independently at each level, not picked for you.
Default to flat; reach for a nested field only where it needs its own node: its
own `validators`/`schemaValidator`, its own aggregated `touched`/`invalid`, or
stable per-item identity for a reorderable array.

It's the same call a React app makes about where state lives: most of it doesn't
need to be in the root component, but the piece genuinely local to one part of
the tree owns itself there instead of being threaded down from the top. A Kin
Form nested field is that same move applied to one slice of the form: `value`
stays one coherent object across the tree either way; a nested field just lets a
slice of it additionally own its _own_ `error`/`touched`/`validating` and
validators, where that's worth it.

Nested structure is native, not a workaround bolted onto a flat model, which is
what makes it possible to pull a subtree into a reusable field component that
only needs to know its own slice of the form, not the whole shape. An
`AddressField` built against `FieldApi<Address, TParentValue>` works the same
whether it's mounted at `shipping`, `billing`, or any other path in any other
form; see
[Nested fields: `AddressField`](/guide/form-composition#nested-fields-addressfield).

Both examples below address the same model, using the `TextField` from
[Form Composition](/guide/form-composition#leaf-fields-textfield-numberfield):

```ts
type Item = {
  code: string;
  quantity: number;
};

type Checkout = {
  email: string;
  shipping: {
    line1: string;
    city: string;
  };
  items: Item[];
};
```

## Nested: a field per level

A `FieldApi` per object/array level: `shipping` and each `items` entry are
resolved nodes of their own, with `email` staying a direct child of the form:

```
FormApi<Checkout>
├─ field("email")      FieldApi<string>
├─ field("shipping")   FieldApi<{ line1: string; city: string }>
│    ├─ field("line1")  FieldApi<string>
│    └─ field("city")   FieldApi<string>
└─ field("items")      FieldApi<Item[]>
     └─ field("0")       FieldApi<Item>
          ├─ field("code")      FieldApi<string>
          └─ field("quantity")  FieldApi<number>
```

::: code-group

```tsx [React]
function CheckoutForm() {
  const form = useForm<Checkout>({ initialValue });
  const shippingGroup = form.field("shipping");

  return (
    <form onSubmit={form.handleSubmit}>
      <fieldset>
        <legend>Shipping address</legend>
        <TextField api={shippingGroup.field("line1")} label="Line 1" />
        <TextField api={shippingGroup.field("city")} label="City" />
      </fieldset>

      <Watch api={form.field("items")}>
        {(items) => (
          <>
            {items.value.map((_, i) => {
              const item = items.field(`${i}`);
              return (
                <div key={item.id}>
                  <TextField api={item.field("code")} label="Code" />
                  <NumberField api={item.field("quantity")} label="Quantity" />
                  <button
                    type="button"
                    onClick={() => items.removeItem("", i)}
                  >
                    Remove
                  </button>
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => items.pushItem("", { code: "", quantity: 1 })}
            >
              Add item
            </button>
          </>
        )}
      </Watch>
    </form>
  );
}
```

```ts [Lit]
import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { FormApi, watch } from "@kin-form/lit";
import "./text-field.ts";
import "./number-field.ts";

@customElement("checkout-form")
class CheckoutForm extends LitElement {
  #form = new FormApi<Checkout>({ initialValue });
  #shippingGroup = this.#form.field("shipping");

  override render() {
    return html`
      <form @submit=${this.#form.handleSubmit}>
        <fieldset>
          <legend>Shipping address</legend>
          <text-field
            .api=${this.#shippingGroup.field("line1")}
            label="Line 1"
          ></text-field>
          <text-field
            .api=${this.#shippingGroup.field("city")}
            label="City"
          ></text-field>
        </fieldset>

        ${watch(
          this.#form.field("items"),
          (items) =>
            html`
              ${repeat(
                items.value,
                (_item, i) => items.field(`${i}`).id,
                (_item, i) => {
                  const item = items.field(`${i}`);
                  return html`
                    <div>
                      <text-field
                        .api=${item.field("code")}
                        label="Code"
                      ></text-field>
                      <number-field
                        .api=${item.field("quantity")}
                        label="Quantity"
                      ></number-field>
                      <button
                        type="button"
                        @click=${() => items.removeItem("", i)}
                      >
                        Remove
                      </button>
                    </div>
                  `;
                },
              )}

              <button
                type="button"
                @click=${() => items.pushItem("", { code: "", quantity: 1 })}
              >
                Add item
              </button>
            `,
        )}
      </form>
    `;
  }
}
```

:::

Each level is its own node: `shippingGroup.invalid`/`shippingGroup.touched`
aggregate from just its own children, and `shippingGroup` can carry `validators`
or a `schemaValidator` scoped to the address alone. See
[Nested Objects](/guide/nested-objects) and
[Form Composition](/guide/form-composition#nested-fields-addressfield) for
building reusable `AddressField`/`ItemsField` components.

## Flat: dotted paths off the root

No intermediate `shipping` or `items.0` node is ever resolved: every leaf is a
direct child of the form, addressed by its full dotted path.

```
FormApi<Checkout>
├─ field("email")             FieldApi<string>
├─ field("shipping.line1")    FieldApi<string>
├─ field("shipping.city")     FieldApi<string>
├─ field("items.0.code")      FieldApi<string>
└─ field("items.0.quantity")  FieldApi<number>
```

::: code-group

```tsx [React]
function CheckoutForm() {
  const form = useForm<Checkout>({ initialValue });

  const addItem = useCallback(() => {
    form.pushItem("items", { code: "", quantity: 1 });
  }, [form]);

  return (
    <form onSubmit={form.handleSubmit}>
      <fieldset>
        <legend>Shipping address</legend>
        <TextField api={form.field("shipping.line1")} label="Line 1" />
        <TextField api={form.field("shipping.city")} label="City" />
      </fieldset>

      <Watch api={form} select={(f) => f.value.items}>
        {(form, items) => (
          <>
            {items.map((_, i) => (
              <div key={i}>
                <TextField
                  api={form.field(`items.${i}.code`)}
                  label="Code"
                />
                <NumberField
                  api={form.field(`items.${i}.quantity`)}
                  label="Quantity"
                />
                <button onClick={() => form.removeItem("items", i)}>
                  Remove
                </button>
              </div>
            ))}
            <button onClick={addItem}>
              Add item
            </button>
          </>
        )}
      </Watch>
    </form>
  );
}
```

```ts [Lit]
import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { FormApi, watch } from "@kin-form/lit";
import "./text-field.ts";
import "./number-field.ts";

@customElement("checkout-form")
class CheckoutForm extends LitElement {
  #form = new FormApi<Checkout>({ initialValue });

  readonly #addItem = () => {
    this.#form.pushItem("items", { code: "", quantity: 1 });
  };

  override render() {
    return html`
      <form @submit=${this.#form.handleSubmit}>
        <fieldset>
          <legend>Shipping address</legend>
          <text-field
            .api=${this.#form.field("shipping.line1")}
            label="Line 1"
          ></text-field>
          <text-field
            .api=${this.#form.field("shipping.city")}
            label="City"
          ></text-field>
        </fieldset>

        ${watch(
          this.#form,
          (f) => f.value.items,
          (form, items) =>
            html`
              ${repeat(
                items,
                (_item, i) => i,
                (_item, i) =>
                  html`
                    <div>
                      <text-field
                        .api=${form.field(`items.${i}.code`)}
                        label="Code"
                      ></text-field>
                      <number-field
                        .api=${form.field(`items.${i}.quantity`)}
                        label="Quantity"
                      ></number-field>
                      <button
                        type="button"
                        @click=${() => form.removeItem("items", i)}
                      >
                        Remove
                      </button>
                    </div>
                  `,
              )}
              <button type="button" @click=${this.#addItem}>Add item</button>
            `,
        )}
      </form>
    `;
  }
}
```

:::

There's no `shipping`-level or `items`-level aggregate state: every field
reports directly to `form`. See
[Resolve the intermediate field first](/guide/nested-objects#resolve-the-intermediate-field-first).

:::: tip

The [array mutation helpers](/guide/dynamic-arrays) still work without resolving
`items` as its own field: they only need the array's name, not a resolved node,
e.g. `form.pushItem("items", { code: "", quantity: 1 })`. What's missing is a
stable per-item key, since that only exists on a resolved `FieldApi`.

If reordering is needed, stamp one on yourself. A `Symbol`-keyed property stays
out of `Object.keys`/`JSON.stringify` (so it won't leak into submission or trip
up a schema's `.strict()`), unlike a regular field:

::: code-group

```tsx [React]
let itemKey = 0;
const ITEM_KEY = Symbol();

type Item = {
  code: string;
  quantity: number;
  [ITEM_KEY]: number;
};

const addItem = useCallback(() => {
  form.pushItem("items", {
    code: "",
    quantity: 1,
    [ITEM_KEY]: ++itemKey,
  });
}, [form]);

<div key={item[ITEM_KEY]}>
```

```ts [Lit]
let itemKey = 0;
const ITEM_KEY = Symbol();

type Item = {
  code: string;
  quantity: number;
  [ITEM_KEY]: number;
};

// A stable class-field reference needs no dependency array, unlike useCallback.
readonly #addItem = () => {
  this.#form.pushItem("items", {
    code: "",
    quantity: 1,
    [ITEM_KEY]: ++itemKey,
  });
};

// repeat(items, (item) => item[ITEM_KEY], ...)
```

:::

::::

## `schemaValidator` works either way

A [schema validator](/guide/schema-validation) checks the whole tree in one pass
and already produces a flat, dot-joined path -> message map (`schemaErrorMap`);
`field.schemaError` reads a field's own slice by walking up through any
intermediate fields to find it. So unlike hand-written per-field `validators`, a
`schemaValidator` doesn't push you toward one shape over the other: nest where
it's worth its own `validators`/aggregate `touched`/`invalid`, stay flat where
it isn't, without worrying about where the schema was attached.

Hand-written per-field `validators` don't have that shortcut: a node boundary is
the only way to scope aggregate `invalid`/`touched` to a subtree, or attach a
cross-field validator to just that subtree. That's where nested structure earns
its keep.

## Mixing the two

Nothing stops you from resolving some levels as their own nested fields and
leaving others flat in the same tree, e.g. keep `shipping` as its own field (its
own validators, its own "please fix the address" banner) while leaving `items`
flat because item-level errors are read straight off a schema's
`schemaErrorMap`. That's the default outcome, not a special case: most real
forms end up a mix, the same way most React trees mix lifted and component-local
state without it being notable.

```
FormApi<Checkout>
├─ field("email")             FieldApi<string>
├─ field("shipping")          FieldApi<{ line1: string; city: string }>
│    ├─ field("line1")        FieldApi<string>
│    └─ field("city")         FieldApi<string>
├─ field("items.0.code")      FieldApi<string>
└─ field("items.0.quantity")  FieldApi<number>
```

## What's next

- [Nested Objects](/guide/nested-objects) and
  [Dynamic Arrays](/guide/dynamic-arrays) — everything the child registry adds
- [Schema Validation](/guide/schema-validation) — `schemaErrorMap`, and how
  `schemaError` resolves through nested fields
- [Form Composition](/guide/form-composition) — reusable field components for
  either shape
