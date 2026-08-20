# Schema Validation

The second validation mechanism. See
[Per-node Validation](/guide/per-node-validation#two-kinds-of-validation) for
how it relates to `validators`. `toSchemaValidator()` (from
`@kintools/form-validators`) adapts any
[Standard Schema](https://standardschema.dev)-compliant library (zod v4+,
valibot v1+, arktype, ...) into a `SchemaValidator` that validates a whole
group's or form's value in one pass.

Pass it as `schemaValidator`, not `validators`, since it's a distinct option on
`FieldApi`/`FormApi`:

```ts
const checkoutSchema = z.object({
  email: z.string().email(),
  items: z.array(z.object({ code: z.string() })).min(1),
});

const form = new FormApi({
  initialValue: { email: "", items: [] },
  schemaValidator: toSchemaValidator(checkoutSchema),
});
```

## Reading the result

Running the schema populates `schemaErrorMap`, a flat dot-joined path -> message
map (e.g. `{ "email": "Invalid email", "items.0.code": "Required" }`) built from
every issue's `path`. A field reads its own slice via `field.schemaError`, with
no per-field wiring needed, even through
[intermediate fields](/guide/nested-objects), since the lookup walks up `parent`
until it finds a map with an answer:

::: code-group

```tsx [React]
{
  field.invalid && field.touched && (
    <span>{field.error ?? field.schemaError}</span>
  );
}
```

```ts [Lit]
field.invalid && field.touched
  ? html`<span>${field.error ?? field.schemaError}</span>`
  : "";
```

:::

An issue with no `path` (e.g. a schema-level `.refine()`) maps to the group's
own `""` key — read via `form.schemaErrorMap?.[""]`, or `form.schemaError`,
which checks `""` first before falling back to a parent's slice.

## `schemaErrorMap` vs. `error`

`schemaErrorMap` is kept separate from `error` (a field's own message from
`validators`). Nothing is overwritten — a field can carry both a hand-written
validator's `error` and a schema's `schemaError` at once.

## Works the same nested or flat

One schema covers the whole subtree, so nested fields don't need
[intermediate fields](/guide/nested-objects) just to be addressed: a schema on
`form` validates `contact.name` or `guests.0.email` whether or not anything
called `field("contact")` first:

::: code-group

```tsx [React]
const form = useForm({
  initialValue: { contact: { name: "", email: "" }, guests: [] },
  schemaValidator: toSchemaValidator(registrationSchema),
});

// Flat — reads form's own schemaErrorMap directly.
<TextField api={form.field("contact.name")} label="Name" />;

// Nested — same schemaError, found by walking up through `contact`.
const contact = form.field("contact");
<TextField api={contact.field("name")} label="Name" />;
```

```ts [Lit]
const form = new FormApi({
  initialValue: { contact: { name: "", email: "" }, guests: [] },
  schemaValidator: toSchemaValidator(registrationSchema),
});

// Flat — reads form's own schemaErrorMap directly.
html`<text-field .api=${form.field("contact.name")} label="Name"></text-field>`;

// Nested — same schemaError, found by walking up through `contact`.
const contact = form.field("contact");
html`<text-field .api=${contact.field("name")} label="Name"></text-field>`;
```

:::

Exception: if `contact` has its own `schemaValidator`, it takes precedence over
`form`'s for everything under it. The nearer validator always wins, so
`contact.name` would read from `contact`'s own map instead. An issue on the
array itself (e.g. Zod's `.min(1, "Add at least one guest")` on `guests`) has no
field at that exact path, so read it off the map directly:
`form.schemaErrorMap?.guests`. See
[Flat vs. Nested Structure](/guide/flat-vs-nested) for when nesting is still
worth it.

## Debouncing

Like `asyncValidator`, runs are debounced by `validationDebounceMs` (default
`0`), with the same debounce/coalescing/`handleBlur`-flush behavior as
[described here](/guide/per-node-validation#async-validator-and-debouncing).
