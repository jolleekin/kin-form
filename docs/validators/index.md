# Validators

Common validator factories for `@kin-form`, published as `@kin-form/validators`.
Split out from `@kin-form/core` on purpose: validator wording and edge cases
churn far more than the engine does, so it's versioned separately.

## Install

::: code-group

```sh [npm]
npx jsr add @kin-form/validators
```

```sh [pnpm]
pnpm add jsr:@kin-form/validators
```

```sh [deno]
deno add jsr:@kin-form/validators
```

:::

## Available validators

| Validator                      | Flags                                                                             |
| ------------------------------ | --------------------------------------------------------------------------------- |
| `required(message?)`           | A missing value: `null`/`undefined`, an all-whitespace string, or an empty array. |
| `minLength(min, message?)`     | A string or array shorter than `min`.                                             |
| `maxLength(max, message?)`     | A string or array longer than `max`.                                              |
| `min(min, message?)`           | A number smaller than `min`.                                                      |
| `max(max, message?)`           | A number larger than `max`.                                                       |
| `url(message?)`                | A non-empty string that isn't a valid URL (per the `URL` constructor).            |
| `email(message?)`              | A non-empty string that isn't a valid email address.                              |
| `pattern(regex, message?)`     | A non-empty string that doesn't match `regex`.                                    |
| `maxFileSize(bytes, message?)` | A `File` larger than `bytes`.                                                     |
| `password(options, message?)`  | A non-empty string that doesn't meet every enabled rule.                          |

The format-specific validators (`url`, `email`, `pattern`) deliberately pass an
empty value through instead of also flagging it — combine them with `required()`
for a mandatory field, or use them alone for a field that's optional but must be
well-formed when present. `maxFileSize` passes through a missing file the same
way.

```ts
form.field("email", {
  validators: [required("Email is required"), email("Enter a valid email")],
});
```

## Default messages as i18n keys

Every factory's default `message` is its own name (`"required"`, `"minLength"`,
`"maxLength"`, `"min"`, `"max"`, `"url"`, `"email"`, `"pattern"`,
`"maxFileSize"`, `"password"`) — not an English sentence — so it doubles as a
stable i18n lookup key rather than display text:

```tsx
{
  field.invalid && field.touched && <span>{t(field.error)}</span>;
}
```

Pass an explicit `message` to skip localization and show literal text instead,
e.g. `required("This field is required")`.

## `password`

Reports one shared `message` for any failing rule rather than identifying which
one — pair it with a requirements checklist in the UI (rendered from the same
options) rather than relying on `message` to explain what's missing:

```ts
form.field("password", {
  validators: [
    password({ minLength: 8, digit: true, upper: true, symbol: true }),
  ],
});
```

| Option      | Requires                                 |
| ----------- | ---------------------------------------- |
| `minLength` | Minimum string length.                   |
| `maxLength` | Maximum string length.                   |
| `digit`     | At least one digit (`0`-`9`).            |
| `upper`     | At least one uppercase letter.           |
| `lower`     | At least one lowercase letter.           |
| `symbol`    | At least one non-alphanumeric character. |

A rule left `undefined` isn't checked.

## `toSchemaValidator()` — Standard Schema adapter

Adapts any [Standard Schema](https://standardschema.dev)-compliant library (zod
v4+, valibot v1+, arktype, ...) into a `SchemaValidator`, for
whole-group/whole-form validation. Attach it as a group's or form's
`schemaValidator`, and it runs the group's own `~standard` validation and
populates `schemaErrorMap` — a flat, dot-joined path -> message map — from the
result's issues:

```ts
import { z } from "zod";
import { toSchemaValidator } from "@kin-form/validators/index.ts";

const form = useForm({
  initialValue: { email: "", password: "" },
  schemaValidator: toSchemaValidator(signupSchema),
});
```

Each issue's `path` becomes a key in that map (e.g. `"address.line1"`), so a
child field with that exact `name` can read its own slice of it via
`field.schemaError`, without any per-field wiring. Use it for whole-tree schema
validation; individual fields should keep using regular field validators
(`required`, `pattern`, a hand-written one, ...) rather than a schema of their
own — mixing the two invites them to disagree.
