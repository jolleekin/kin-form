# vs React Hook Form

React Hook Form is the most widely used of the three (by a wide and growing
margin), so it's the one worth the deepest comparison. This page works through
the same topics the [guide](/guide/) covers, one at a time, against
`react-hook-form@7.81.0`.

## Field registration & binding model

### Native input

<SideBySide>

::: code-group

```tsx{15} [Kin Form]
import { useForm, Watch } from "@kintools/form-react";
import { required } from "@kintools/form-validators";

type LoginValues = { email: string };

function LoginForm() {
  const form = useForm<LoginValues>({
    initialValue: { email: "" },
    onSubmit: (form) => login(form.value),
  });

  return (
    <form onSubmit={form.handleSubmit}>
      {/* Only re-renders when the email field changes. */}
      <Watch api={form.field("email", { validators: required("Required") })}>
        {(field) => (
          <>
            <input
              value={field.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.error && <span>{field.error}</span>}
          </>
        )}
      </Watch>

      <button type="submit">Log in</button>
    </form>
  );
}
```

```tsx{15} [React Hook Form]
import { useForm } from "react-hook-form";

type LoginValues = { email: string };

function LoginForm() {
  const {
    register,
    handleSubmit,
    // Form-wide, not scoped to email — re-renders on any field's state change.
    formState: { errors },
  } = useForm<LoginValues>({ defaultValues: { email: "" } });

  return (
    <form onSubmit={handleSubmit(login)}>
      <input {...register("email", { required: "Required" })} />
      {errors.email && <span>{errors.email.message}</span>}

      <button type="submit">Log in</button>
    </form>
  );
}
```

:::

</SideBySide>

**What's different:**

|                      | Kin Form                                       | React Hook Form                            |
| -------------------- | ---------------------------------------------- | ------------------------------------------ |
| Binding model        | Controlled everywhere (`value`/`handleChange`) | Uncontrolled (`register` + ref) by default |
| One-off native input | `<Watch>` render prop — more ceremony inline   | `{...register(name)}` — one line           |

For a handful of native inputs each used once, `register` genuinely produces
less code. Kin Form's bet is the opposite: build the field components once
(`TextField`, `AddressField`, `SubmitButton`; see
[Form composition](#form-composition) below), and every call site collapses to
one line too, typed against that form's value shape. That pays off fast across
many forms or a shared field library; for a single one-off form, `<Watch>`
inline is the right call.

This is the only section using a bare `<input>`/`register`, since wrapping one
in `Controller` just to force it controlled wouldn't prove anything. Everywhere
else, both sides bind to a controlled `<TextInput>` component, so
`Controller`/`useController` only shows up where it's actually earning its keep.

### Non-native input

<SideBySide>

::: code-group

```tsx{14} [Kin Form]
import { useForm, Watch } from "@kintools/form-react";
import { required } from "@kintools/form-validators";

type ProfileValues = { country: string };

function ProfileForm() {
  const form = useForm<ProfileValues>({
    initialValue: { country: "" },
    onSubmit: (form) => save(form.value),
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <Watch api={form.field("country", { validators: required("Required") })}>
        {(field) => (
          <>
            <CountrySelect value={field.value} onChange={field.handleChange} />
            {field.error && <span>{field.error}</span>}
          </>
        )}
      </Watch>

      <button type="submit">Save</button>
    </form>
  );
}
```

```tsx{13-15} [React Hook Form]
import { Controller, useForm } from "react-hook-form";

type ProfileValues = { country: string };

function ProfileForm() {
  const { control, handleSubmit } = useForm<ProfileValues>({
    defaultValues: { country: "" },
  });

  return (
    <form onSubmit={handleSubmit(save)}>
      <Controller
        control={control}
        name="country"
        rules={{ required: "Required" }}
        render={({ field, fieldState }) => (
          <>
            <CountrySelect value={field.value} onChange={field.onChange} />
            {fieldState.error && <span>{fieldState.error.message}</span>}
          </>
        )}
      />

      <button type="submit">Save</button>
    </form>
  );
}
```

:::

</SideBySide>

**What's different:**

|                   | Kin Form                        | React Hook Form                         |
| ----------------- | ------------------------------- | --------------------------------------- |
| Non-native inputs | Same `Watch` as any other field | Needs `Controller` — a second primitive |

Nested groups and arrays are `FieldApi` nodes too, not a separate hook or a
special case — see [Array field](#array-field) and
[Nested group field](#nested-group-field) under
[Form composition](#form-composition) below for the full comparison, shown as
reusable components rather than inlined in one form.

## Per-node validation: when it runs, and debouncing

<SideBySide>

::: code-group

```tsx{13} [Kin Form]
import { useForm, Watch } from "@kintools/form-react";

function SignupForm() {
  const form = useForm<{ username: string }>({
    initialValue: { username: "" },
  });

  return (
    <Watch
      api={form.field("username", {
        asyncValidator: async (field) =>
          (await checkUsernameTaken(field.value)) ? "Username taken" : null,
        validationDebounceMs: 300,
      })}
    >
      {(field) => (
        <TextInput value={field.value} onChange={field.handleChange} />
      )}
    </Watch>
  );
}
```

```tsx{10-17} [React Hook Form]
import { Controller, useForm } from "react-hook-form";
import { useMemo } from "react";
import debounce from "lodash/debounce";

function SignupForm() {
  const { control } = useForm<{ username: string }>({
    mode: "onChange", // form-wide — every field revalidates on every change
  });

  // Hand-rolled.
  const debouncedCheck = useMemo(
    () =>
      debounce(async (value: string) => {
        return await checkUsernameTaken(value) ? "Username taken" : true;
      }, 300),
    [],
  );

  return (
    <Controller
      control={control}
      name="username"
      rules={{ validate: debouncedCheck }}
      render={({ field }) => (
        <TextInput value={field.value} onChange={field.onChange} />
      )}
    />
  );
}
```

:::

</SideBySide>

**What's different:**

|                      | Kin Form                                                                         | React Hook Form                                     |
| -------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------- |
| When validation runs | `validators` run synchronously on every value change; `asyncValidator` debounced | Form-wide `mode`/`reValidateMode` setting           |
| Debouncing           | `validationDebounceMs` — applies to `asyncValidator` only                        | Hand-rolled inside `validate` (no built-in option)  |
| Rule composition     | Array of `validators`, checked in order, first truthy wins                       | Multiple rules for one field via `register` options |

## Schema validation

Both need a thin adapter from a separate package to plug a schema in:

- Kin Form: `toSchemaValidator()` from `@kintools/form-validators`
- React Hook Form: `standardSchemaResolver` from `@hookform/resolvers`

Both adapters can be used with any Standard Schema library: zod, valibot, ...

<SideBySide>

::: code-group

```tsx{20-21} [Kin Form]
import { useForm, Watch } from "@kintools/form-react";
import { required, toSchemaValidator } from "@kintools/form-validators";
import { z } from "zod";

const signupSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});
type Signup = z.infer<typeof signupSchema>;

function SignupForm() {
  const form = useForm<Signup>({
    initialValue: { email: "", password: "" },
    schemaValidator: toSchemaValidator(signupSchema),
  });

  return (
    <Watch api={form.field("email", { validators: required("Required") })}>
      {(field) => {
        // Both channels are live at once, not one overriding the other.
        const error = field.error ?? field.schemaError;
        return (
          <>
            <TextInput value={field.value} onChange={field.handleChange} />
            {error && <span>{error}</span>}
          </>
        );
      }}
    </Watch>
  );
}
```

```tsx{21-22} [React Hook Form]
import { Controller, useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";

const signupSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});
type Signup = z.infer<typeof signupSchema>;

function SignupForm() {
  const { control } = useForm<Signup>({
    defaultValues: { email: "", password: "" },
    resolver: standardSchemaResolver(signupSchema),
  });

  return (
    <Controller
      control={control}
      name="email"
      // A `rules.validate` passed here would silently never run — the
      // resolver has taken over.
      render={({ field, fieldState }) => (
        <>
          <TextInput value={field.value} onChange={field.onChange} />
          {fieldState.error && <span>{fieldState.error.message}</span>}
        </>
      )}
    />
  );
}
```

:::

</SideBySide>

**What's different:**

|                               | Kin Form                                                                                                                             | React Hook Form                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Schema scope                  | Any node — field, group, or the whole form — can have its own `schemaValidator`                                                      | One `resolver`, for the whole form                                                                                 |
| Per-field rules once wired up | `schemaValidator` runs _alongside_ per-field `validators`, not instead of them                                                       | `resolver` replaces `register`'s own rules for the fields it covers — `required`/`pattern`/`validate` stop running |
| Where schema issues land      | A field's own `schemaError`, kept separate from `error` — the field decides how to combine them (`field.error ?? field.schemaError`) | Same `errors` as per-field rules — schema output replaces them, so there's nothing to combine                      |

## Cross-field validation

Both support it, but from opposite ends of the relationship, and with different
amounts of wiring.

<SideBySide>

::: code-group

```tsx{8,20-22} [Kin Form]
function SignupForm() {
  const form = useForm<Signup>({
    initialValue: { email: "", password: "", confirmPassword: "" },
  });

  return (
    <>
      <Watch api={form.field("password", { dependents: ["confirmPassword"] })}>
        {(field) => (
          <TextInput
            type="password"
            value={field.value}
            onChange={field.handleChange}
          />
        )}
      </Watch>

      <Watch
        api={form.field("confirmPassword", {
          validators: (field) => field.value !== form.value.password
            ? "Passwords must match"
            : null,
        })}
      >
        {(field) => (
          <>
            <TextInput
              type="password"
              value={field.value}
              onChange={field.handleChange}
            />
            {field.error && <span>{field.error}</span>}
          </>
        )}
      </Watch>
    </>
  );
}
```

```tsx{17-18,28-29} [React Hook Form]
function SignupForm() {
  const { control, trigger, getValues } = useForm<Signup>({
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  return (
    <>
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <TextInput
            type="password"
            value={field.value}
            onChange={(value) => {
              field.onChange(value);
              // Manual trigger.
              trigger("confirmPassword");
            }}
          />
        )}
      />

      <Controller
        control={control}
        name="confirmPassword"
        rules={{
          validate: (value) =>
            value === getValues("password") || "Passwords must match",
        }}
        render={({ field, fieldState }) => (
          <>
            <TextInput
              type="password"
              value={field.value}
              onChange={field.onChange}
            />
            {fieldState.error && <span>{fieldState.error.message}</span>}
          </>
        )}
      />
    </>
  );
}
```

:::

</SideBySide>

**What's different:**

|                     | Kin Form                                            | React Hook Form                                                                                               |
| ------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Where it's declared | Declarative on the source field (`dependents` list) | Manual `trigger()` call on the source field                                                                   |
| Wiring              | Nothing extra — `dependents` handles the refire     | `getValues()` in `validate` to read the other value, `trigger()` from the source field's `onChange` to refire |
| Multiple dependents | One `dependents` array covers all of them           | One `trigger()` call per dependent field, by hand                                                             |

## Dirty tracking & reset

Both track dirtiness at both levels (whole form and per field), but differently.

<SideBySide>

::: code-group

```tsx{14,20} [Kin Form]
function ProfileForm() {
  const form = useForm({
    initialValue: { firstName: "", lastName: "" },
    onSubmit: (form) => save(form.value),
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <Watch api={form.field("firstName")}>
        {(field) => (
          <>
            <TextInput value={field.value} onChange={field.handleChange} />
            {/* Field level dirty */}
            {field.dirty && <span>Edited</span>}
          </>
        )}
      </Watch>

      {/* Form level dirty */}
      <Watch api={form} select={(f) => f.dirty}>
        {(f, dirty) => (
          <button disabled={!dirty} onClick={f.reset}>
            Discard changes
          </button>
        )}
      </Watch>
    </form>
  );
}
```

```tsx{6,23,25} [React Hook Form]
function ProfileForm() {
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, dirtyFields },
  } = useForm({
    defaultValues: { firstName: "", lastName: "" },
  });

  return (
    <form onSubmit={handleSubmit(save)}>
      <Controller
        control={control}
        name="firstName"
        render={({ field }) => (
          <TextInput value={field.value} onChange={field.onChange} />
        )}
      />
      {/* Looks scoped to firstName, but the subscription (established when
          dirtyFields was pulled off formState above) is to the whole object:
          this re-renders when ANY field becomes dirty, not just firstName. */}
      {dirtyFields.firstName && <span>Edited</span>}

      <button disabled={!isDirty} onClick={reset}>
        Discard changes
      </button>
    </form>
  );
}
```

:::

</SideBySide>

**What's different:**

|                  | Kin Form                                                                                                                                | React Hook Form                                                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Whole-form dirty | `form.dirty`                                                                                                                            | `formState.isDirty`                                                                                                                        |
| Per-field dirty  | `field.dirty` inside a `Watch`/`useWatch` scoped to that field — the subscription unit is the field itself, not which property you read | `formState.dirtyFields` — reading `.firstName` still subscribes to the whole object, so any field becoming dirty re-renders this component |
| Reset            | `form.reset(value?)` — moves the baseline too                                                                                           | `reset(values?, keepStateOptions)`                                                                                                         |
| Reset one field  | `form.resetField(name, value?)` — same idea                                                                                             | `resetField(name, options?)`                                                                                                               |

## Submission handling

Both separate "the form failed validation" from "submission itself succeeded,"
but only one also separates "submission itself failed."

<SideBySide>

::: code-group

```tsx{6-11} [Kin Form]
const form = useForm<Signup>({
  initialValue: { email: "", password: "" },
  onSubmit: async (form) => {
    await signUp(form.value);
  },
  onSubmitInvalid: (form) => {
    form.touched = true; // reveal errors on never-blurred fields
  },
  onSubmitError: (form, error) => {
    toast.error("Sign up failed"); // called automatically, no wrapper needed
  },
});

// handleSubmit itself calls preventDefault when given an event.
<form onSubmit={form.handleSubmit}>
```

```tsx{9-12} [React Hook Form]
const { handleSubmit } = useForm<Signup>({
  defaultValues: { email: "", password: "" },
});

<form onSubmit={handleSubmit(
  async (values) => {
    try {
      await signUp(values);
    } catch {
      // Must be wrapped manually — no dedicated "submission failed" callback.
      toast.error("Sign up failed");
    }
  },
  (errors) => {
    // Validation failed.
  },
)}>
```

:::

</SideBySide>

**What's different:**

|                          | Kin Form                                                                                                                                                   | React Hook Form                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Validation failed        | `onSubmitInvalid`                                                                                                                                          | `onInvalid` callback (2nd arg to `handleSubmit`)      |
| `onSubmit` itself throws | `onSubmitError`, invoked automatically                                                                                                                     | Rethrown after updating state — no dedicated callback |
| Binding to `<form>`      | `onSubmit={form.handleSubmit}`                                                                                                                             | `onSubmit={handleSubmit(onValid, onInvalid)}`         |
| Preventing page reload   | Automatic when given an event — `handleSubmit`'s `event` param is optional, so the same call also works from a React Native `onPress` with nothing to pass | Automatic — `handleSubmit` calls it internally        |

## Async initial values

This is a place React Hook Form is genuinely nicer.

<SideBySide>

::: code-group

```tsx{7-8} [Kin Form]
function ProfilePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
  });

  if (isLoading) return <p>Loading...</p>;
  return <ProfileForm initialValue={data} />;
}

function ProfileForm({ initialValue }: { initialValue: Profile }) {
  const form = useForm({
    initialValue,
    onSubmit: (form) => save(form.value),
  });

  return (
    <form onSubmit={form.handleSubmit}>
      {/* ... */}
    </form>
  );
}
```

```tsx{3} [React Hook Form]
function ProfilePage() {
  const { register, handleSubmit, formState: { isLoading } } = useForm({
    defaultValues: fetchProfile, // resolved automatically
  });

  if (isLoading) return <p>Loading...</p>;

  return (
    <form onSubmit={handleSubmit(save)}>
      {/* ... */}
    </form>
  );
}
```

:::

</SideBySide>

**What's different:**

|                        | Kin Form                                                                                  | React Hook Form                                                   |
| ---------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Async defaults         | `initialValue` is synchronous only, read once at construction                             | `defaultValues` accepts an async function, resolved automatically |
| Loading state          | Whatever your data-fetching hook already gives you (e.g. `useQuery`'s `isLoading`)        | `formState.isLoading`, built in                                   |
| Populating once loaded | `ProfileForm` doesn't mount until data arrives — `initialValue` is already the real value | Automatic — same component, `defaultValues` resolves in place     |

## Reactivity & selective re-rendering

**Kin Form**: `FieldApi` carries its own state (`value`, `error`, `touched`,
`dirty`, ...) all on the same object, so `useWatch`, via `select`, subscribes to
any of it, or several pieces together, in one call.

**React Hook Form** splits _value_ from the rest of a field's state into
separate hooks instead: `useWatch` only watches values, so reading a field's
error or touched status means also subscribing to `useFormState`.

<SideBySide>

::: code-group

```tsx{5-8} [Kin Form]
import { type FieldApi, useWatch } from "@kintools/form-react";

function Field<TParentValue>({ api }: { api: FieldApi<string, TParentValue> }) {
  // One hook covers all field state (including value).
  const [value, error] = useWatch(
    api,
    (f) => [f.value, f.touched ? f.error : null] as const,
  );

  return (
    <label>
      <input value={value} />
      {error && <span>{error}</span>}
    </label>
  );
}

<Field api={form.field("email")} />;
```

```tsx{8-9,12-14} [React Hook Form]
import { useFormState, useWatch } from "react-hook-form";
import type { FieldValues, UseControllerProps } from "react-hook-form";

function Field<T extends FieldValues>(
  { control, name }: UseControllerProps<T>,
) {
  // Value and other field state are two separate subscriptions.
  const value = useWatch({ control, name });
  const { errors, touchedFields } = useFormState({ control, name });

  // Casts needed — T is generic, so `name` can't be narrowed to a literal key.
  const touched = (touchedFields as Record<string, boolean>)[name];
  const error = touched &&
    (errors as Record<string, { message?: string }>)[name]?.message;

  return (
    <label>
      <input value={value} />
      {error && <span>{error}</span>}
    </label>
  );
}

<Field control={control} name="email" />;
```

:::

</SideBySide>

**What's different:**

|                      | Kin Form                                                       | React Hook Form                                                                   |
| -------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Default subscription | `useWatch(api)` — isolated per field/form                      | `useWatch({ control, name })` — isolated per value                                |
| Deriving a value     | `select: (f) => ...`, deduped via `equal` (shallow by default) | `compute: (value) => ...`, deep-equal deduped — transforms the watched value only |
| Value vs field state | One `useWatch(api, select)` covers both                        | `useWatch` + `useFormState` — two separate hooks, combined by hand                |

## Form composition

Both let you build a reusable field component (leaf or group/array alike)
instead of repeating markup at every call site. The type parameter shape is
where the two diverge:

- **Kin Form**: `FieldApi<TValue, TParentValue = never>` decouples a field's own
  value type from its parent form's shape, so a component only ever needs to
  know `TValue` — `TParentValue` stays an opaque pass-through it never inspects.
- **React Hook Form**: `Control<TFieldValues>` parameterizes the field by the
  _whole_ form instead, so a shared component built against it either
  re-parameterizes itself over whatever form it's dropped into (generics leaking
  through every reusable component's signature) or drops to loosely-typed props.

The examples below reuse `TextField`/`AddressField` within one form; the same
signatures generalize across completely unrelated forms too, with zero per-form
coupling.

React Hook Form also has an official addon for this gap,
[`@hookform/lenses`](https://github.com/react-hook-form/lenses). A
`Lens<TValue>` prop looks like `FieldApi<TValue, TParentValue>` on the surface,
but it's another abstraction layer wrapping the same `register`/`useController`/
`useFieldArray` underneath, not a change to them. The comparison below is
against core React Hook Form, without this addon.

### Leaf field

<SideBySide>

::: code-group

```tsx{4} [Kin Form]
import { type FieldApi, useWatch } from "@kintools/form-react";

function TextField<TParent>(
  { api, label }: { api: FieldApi<string, TParent>; label: string },
) {
  const field = useWatch(api);

  return (
    <label>
      {label}
      <TextInput
        value={field.value}
        onBlur={field.handleBlur}
        onChange={field.handleChange}
      />
      {field.invalid && field.touched && <span>{field.error}</span>}
    </label>
  );
}

<TextField
  api={form.field("email", { validators: required() })}
  label="Email"
/>;
```

```tsx{11} [React Hook Form]
import { useController } from "react-hook-form";
import type {
  FieldPathByValue,
  FieldValues,
  UseControllerProps,
} from "react-hook-form";

function TextField<T extends FieldValues>(
  { label, ...controllerProps }:
    // FieldPathByValue<T, string> — every path whose value is a string.
    & UseControllerProps<T, FieldPathByValue<T, string>>
    & { label: string },
) {
  const { field, fieldState } = useController(controllerProps);

  return (
    <label>
      {label}
      <TextInput
        value={field.value}
        onBlur={field.onBlur}
        onChange={field.onChange}
      />
      {fieldState.invalid && <span>{fieldState.error?.message}</span>}
    </label>
  );
}

<TextField
  control={control}
  name="email"
  rules={{ required: "Required" }}
  label="Email"
/>;
```

:::

</SideBySide>

The shapes end up close in spirit (both return one component reusable across
every form), but the type-safety story differs:

**What's different:**

|                         | Kin Form                                                                                          | React Hook Form                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Reusable field prop bag | An already-resolved `api: FieldApi<...>`, passed in directly                                      | `UseControllerProps` — `control`+`name`+rules                                                                                 |
| Type-safety on `name`   | Checked once, where `form.field(name, options)` is called — not re-derived inside every component | `FieldPath<T>` catches a typo'd `name` as a compile error, per call site                                                      |
| Type-safety on value    | `FieldApi<string, TParent>` — only a `string`-valued field type-checks, nothing extra needed      | Needs `FieldPathByValue<T, string>` in place of `FieldPath<T>` — plain `FieldPath<T>` alone accepts a field of any value type |
| Cross-form reuse        | Same component, unmodified, across unrelated forms — `TParentValue` is never inspected            | Needs re-parameterizing per form's `TFieldValues`, or `Control<any>`                                                          |

### Nested group field

A reusable component for a nested object (an address, reused for both shipping
and billing) instead of an array:

<SideBySide>

::: code-group

```tsx{6} [Kin Form]
import { type FieldApi } from "@kintools/form-react";

type Address = { line1: string; city: string };

function AddressField<TParentValue>(
  { api }: { api: FieldApi<Address, TParentValue> },
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

```tsx{10,18,23} [React Hook Form]
import type {
  FieldPathByValue,
  FieldValues,
  UseControllerProps,
} from "react-hook-form";

type Address = { line1: string; city: string };

function AddressField<T extends FieldValues>(
  { control, name }: UseControllerProps<T, FieldPathByValue<T, Address>>,
) {
  return (
    <fieldset>
      <TextField
        control={control}
        // Cast needed: TypeScript can't prove a concatenated string is
        // a member of FieldPathByValue<T, string>.
        name={`${name}.line1` as FieldPathByValue<T, string>}
        label="Line 1"
      />
      <TextField
        control={control}
        name={`${name}.city` as FieldPathByValue<T, string>}
        label="City"
      />
    </fieldset>
  );
}

<AddressField control={control} name="shipping" />
<AddressField control={control} name="billing" />
```

:::

</SideBySide>

**What's different:**

|                              | Kin Form                                                                                    | React Hook Form                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Reusable nested-group prop   | An already-resolved `api: FieldApi<Address, TParentValue>` — same shape as any other field  | `control` + `name` — a path prefix, not a resolved field                                                           |
| Type-safety at the call site | Automatic — `FieldApi<Address, TParentValue>` only accepts a field whose value is `Address` | `FieldPathByValue<T, Address>` gets there, but it's a library-specific escape hatch most RHF users never reach for |
| Building child paths         | `api.field("line1")` — relative, same call as any top-level field                           | Template-string concatenation (`` `${name}.line1` ``)                                                              |
| Type-safety on children      | Checked through `DeepKey<Address>` regardless of how deep `api` is nested                   | Still needs a cast: TS can't prove a concatenated string is a member of `FieldPathByValue<T, string>`              |

### Array field

An array (unlike the [group above](#nested-group-field)) also needs stable item
identity across a reorder, plus its own mutation helpers:

<SideBySide>

::: code-group

```tsx{4,15,33} [Kin Form]
import { FieldApi, useForm, useWatch } from "@kintools/form-react";

function ItemsField<TParentValue>(
  { api }: { api: FieldApi<string[], TParentValue> },
) {
  // Selective re-rendering.
  const [error, value] = useWatch(api, (f) => [f.error, f.value] as const);

  return (
    <>
      {value.map((_, i) => {
        const field = api.field(`${i}`);
        return (
          <ItemField
            key={field.id}
            api={field}
            onMoveUp={i > 0 ? () => api.moveItem("", i, i - 1) : undefined}
            onMoveDown={i < value.length - 1
              ? () => api.moveItem("", i, i + 1)
              : undefined}
            onRemove={() => api.removeItem("", i)}
          />
        );
      })}
      {error && <span>{error}</span>}
      <button onClick={() => api.pushItem("", "")}>Add</button>
    </>
  );
}

function ItemField(
  { api, onMoveUp, onMoveDown, onRemove }: {
    api: FieldApi<string, string[]>;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    onRemove: () => void;
  },
) {
  useWatch(api);

  return (
    <div>
      <TextInput
         value={api.value}
         onBlur={api.handleBlur}
         onChange={api.handleChange}
      />
      <button disabled={!onMoveUp} onClick={onMoveUp}>Move up</button>
      <button disabled={!onMoveDown} onClick={onMoveDown}>Move down</button>
      <button onClick={onRemove}>Remove</button>
    </div>
  );
}

function Form() {
  const form = useForm<{ items: string[] }>({ initialValue: { items: [] } });

  <ItemsField
    api={form.field("items", {
      validators: (g) => (g.value.length > 0 ? null : "Add at least one item"),
    })}
  />;
}
```

```tsx{21-22,25-27,33,53} [React Hook Form]
import {
  useController,
  useFieldArray,
  useForm,
  useFormState,
} from "react-hook-form";
import type {
  FieldArrayPath,
  FieldPathByValue,
  FieldValues,
  Path,
  UseControllerProps,
  UseFieldArrayProps,
} from "react-hook-form";

function ItemsField<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues> & FieldArrayPath<TFieldValues>,
>(props: UseFieldArrayProps<TFieldValues, TName>) {
  // Two separate hooks for logic and state.
  const { fields, append, move, remove } = useFieldArray(props);
  const { errors } = useFormState(props);

  // Cast needed — TName is generic, so it can't be narrowed to a literal key.
  const rootError = errors[props.name]?.root as
    | { message?: string }
    | undefined;

  return (
    <>
      {fields.map((f, i) => (
        <ItemField
          key={f.id}
          control={props.control}
          // Cast needed, for the same reason as AddressField's children.
          name={`${props.name}.${i}.value` as FieldPathByValue<
            TFieldValues,
            string
          >}
          onMoveUp={i > 0 ? () => move(i, i - 1) : undefined}
          onMoveDown={i < fields.length - 1 ? () => move(i, i + 1) : undefined}
          onRemove={() => remove(i)}
        />
      ))}
      {rootError?.message && <span>{rootError.message}</span>}
      <button onClick={() => append({ value: "" } as never)}>Add</button>
    </>
  );
}

function ItemField<TFieldValues extends FieldValues>(
  { control, name, onMoveUp, onMoveDown, onRemove }:
    & UseControllerProps<TFieldValues, FieldPathByValue<TFieldValues, string>>
    & {
      onMoveUp?: () => void;
      onMoveDown?: () => void;
      onRemove: () => void;
    },
) {
  const { field } = useController({ control, name });

  return (
    <div>
      <TextInput
        value={field.value}
        onBlur={field.onBlur}
        onChange={field.onChange}
      />
      <button disabled={!onMoveUp} onClick={onMoveUp}>Move up</button>
      <button disabled={!onMoveDown} onClick={onMoveDown}>Move down</button>
      <button onClick={onRemove}>Remove</button>
    </div>
  );
}

function Form() {
  const { control } = useForm<{ items: { value: string }[] }>({
    defaultValues: { items: [] },
  });

  <ItemsField
    control={control}
    name="items"
    rules={{
      validate: (value) => value.length > 0 || "Add at least one item",
    }}
  />;
}
```

:::

</SideBySide>

**What's different:**

|                          | Kin Form                                                     | React Hook Form                                        |
| ------------------------ | ------------------------------------------------------------ | ------------------------------------------------------ |
| What holds the array     | `FieldApi` — the array _is_ a node                           | `useFieldArray` for logic, `useFormState` for state    |
| Array-level validation   | The field's own `validators`                                 | `useFieldArray`'s own `rules` — a separate API         |
| Item identity on reorder | Field identity follows the item via re-keying                | `fields[i].id` from the hook                           |
| Reusable component       | Yes — pass a resolved `FieldApi` down                        | Yes — pass `control`+`name` down (or `useFormContext`) |
| Typesafety               | Fully type-safe — `DeepKey<T>` needs no cast, generic or not | Casts needed — `TFieldValues`/`TName` are generic      |

## Multistep forms

Neither ships an official multi-step/wizard _component_. Kin Form ships a
dedicated hook instead, [`useMultistep`](/guide/multistep); React Hook Form's
docs demonstrate the hand-rolled version.

<SideBySide>

::: code-group

```tsx{16-20,28-29,35-37} [Kin Form]
import { useForm, useMultistep } from "@kintools/form-react";

type Signup = {
  credentials: { email: string; password: string };
  address: { line1: string };
};

function SignupWizard() {
  const form = useForm<Signup>({
    initialValue: signupDefaults,
    onSubmit: signUp,
  });

  // `stepField` is the FieldApi for the current step.
  // `next` checks if the current step is valid before advancing.
  const { stepName, stepField, isLastStep, next } = useMultistep(
    form,
     // Step names, matching form's value shape.
    ["credentials", "address"] as const,
  );

  return (
    <form onSubmit={form.handleSubmit}>
      {stepName === "credentials" && (
        <>
          {/* Field names are relative to the current step,
           so it's easy to extract a step's UI into a reusable component. */}
          <TextField api={stepField.field("email")} label="Email" />
          <TextField api={stepField.field("password")} label="Password" />
        </>
      )}
      {stepName === "address" && (
        <TextField api={stepField.field("line1")} label="Line 1" />
      )}
      {isLastStep
        ? <button type="submit">Sign up</button>
        : <button type="button" onClick={next}>Next</button>}
    </form>
  );
}
```

```tsx{10-13,23,27,38,43,51-53} [React Hook Form]
import { useState } from "react";
import { useForm } from "react-hook-form";

type Signup = {
  credentials: { email: string; password: string };
  address: { line1: string };
};

// Must list all fields of each step.
const stepFields = [
  ["credentials.email", "credentials.password"],
  ["address.line1"],
] as const;

function SignupWizard() {
  const { control, trigger, handleSubmit } = useForm<Signup>({
    defaultValues: {
      credentials: { email: "", password: "" },
      address: { line1: "" },
    },
  });
  const [step, setStep] = useState(0);
  const isLastStep = step === stepFields.length - 1;

  const next = async () => {
    // Manually validate this step's fields.
    const valid = await trigger(stepFields[step]);
    if (valid) setStep((s) => s + 1);
  };

  return (
    <form onSubmit={handleSubmit(signUp)}>
      {step === 0 && (
        <>
          <TextField
            control={control}
            {/* Field names are absolute. */}
            name="credentials.email"
            label="Email"
          />
          <TextField
            control={control}
            name="credentials.password"
            label="Password"
          />
        </>
      )}
      {step === 1 && (
        <TextField control={control} name="address.line1" label="Line 1" />
      )}
      {isLastStep
        ? <button type="submit">Sign up</button>
        : <button type="button" onClick={next}>Next</button>}
    </form>
  );
}
```

:::

</SideBySide>

**What's different:**

|                          | Kin Form                                                  | React Hook Form                                |
| ------------------------ | --------------------------------------------------------- | ---------------------------------------------- |
| Step-validation ceremony | `useMultistep`'s `next()` — touch + wait + gate, built in | Hand-rolled per wizard (`trigger([...names])`) |
| Step ↔ field mapping     | Each step _is_ a `FieldApi` (`stepNames` entries)         | A field-name list you maintain per step        |
| Branching/redirecting    | `onBeforeNext` can redirect to an arbitrary step name     | Custom `step` state logic                      |
