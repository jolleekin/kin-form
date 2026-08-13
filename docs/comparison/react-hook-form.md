# vs React Hook Form

React Hook Form is the most widely used of the three (by a wide and growing
margin), so it's the one worth the deepest comparison. This page works through
the same topics the [guide](/guide/) covers, one at a time, against
`react-hook-form@7.81.0`.

## Field registration & binding model

### Native input

<SideBySide>

::: code-group

```tsx [Kin Form]
import { useForm, Watch } from "@kin-form/react";
import { required } from "@kin-form/validators";

type LoginValues = { email: string };

function LoginForm() {
  const form = useForm<LoginValues>({
    initialValue: { email: "" },
    onSubmit: (form) => login(form.value),
  });

  return (
    <form onSubmit={form.handleSubmit}>
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

```tsx [React Hook Form]
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
    <form onSubmit={handleSubmit((values) => login(values))}>
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

```tsx [Kin Form]
import { useForm, Watch } from "@kin-form/react";
import { required } from "@kin-form/validators";

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

```tsx [React Hook Form]
import { Controller, useForm } from "react-hook-form";

type ProfileValues = { country: string };

function ProfileForm() {
  const { control, handleSubmit } = useForm<ProfileValues>({
    defaultValues: { country: "" },
  });

  return (
    <form onSubmit={handleSubmit((values) => save(values))}>
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

## Nested groups & arrays as first-class nodes

<SideBySide>

::: code-group

```tsx [Kin Form]
import { useForm, Watch } from "@kin-form/react";

function Form() {
  const form = useForm<{ items: string[] }>({ initialValue: { items: [] } });

  const items = form.field("items", {
    validators: (g) => (g.value.length > 0 ? null : "Add at least one item"),
  });

  return (
    <>
      {/* Doesn't cause whole form re-render when items's state changes */}
      <Watch api={items} select={(f) => [f.error, f.value] as const}>
        {(_f, [error, value]) => (
          <>
            {value.map((_, i) => {
              const field = items.field(`${i}`);
              return (
                <Watch key={field.id} api={field}>
                  {(f) => (
                    <div>
                      <TextInput value={f.value} onChange={f.handleChange} />
                      <button
                        disabled={i === 0}
                        onClick={() => items.moveItem("", i, i - 1)}
                      >
                        Move up
                      </button>
                      <button
                        disabled={i === value.length - 1}
                        onClick={() => items.moveItem("", i, i + 1)}
                      >
                        Move down
                      </button>
                      <button onClick={() => items.removeItem("", i)}>
                        Remove
                      </button>
                    </div>
                  )}
                </Watch>
              );
            })}
            {error && <span>{error}</span>}
          </>
        )}
      </Watch>

      <button onClick={() => items.pushItem("", "")}>Add</button>
    </>
  );
}
```

```tsx [React Hook Form]
import {
  Controller,
  useFieldArray,
  useForm,
  useFormState,
} from "react-hook-form";

function Form() {
  // Items must be objects, not bare strings — `useFieldArray` only matches
  // arrays of non-primitive values.
  const { control } = useForm<{ items: { value: string }[] }>({
    defaultValues: { items: [] },
  });

  // Two separate hooks for logic and state. Both are called in `Form`
  // itself, so their state changes (add/remove/reorder, items errors)
  // re-render the whole form — narrowing via `name` only limits *which*
  // changes trigger that, not the blast radius when one does.
  const { fields, append, move, remove } = useFieldArray({
    control,
    name: "items",
    rules: {
      validate: (value) => value.length > 0 || "Add at least one item",
    },
  });
  const { errors } = useFormState({ control, name: "items" });

  return (
    <>
      {fields.map((f, i) => (
        <div key={f.id}>
          <Controller
            control={control}
            name={`items.${i}.value`}
            render={({ field }) => (
              <TextInput value={field.value} onChange={field.onChange} />
            )}
          />
          <button
            disabled={i === 0}
            onClick={() => move(i, i - 1)}
          >
            Move up
          </button>
          <button
            disabled={i === fields.length - 1}
            onClick={() => move(i, i + 1)}
          >
            Move down
          </button>
          <button onClick={() => remove(i)}>Remove</button>
        </div>
      ))}
      {errors.items?.root?.message && <span>{errors.items.root.message}</span>}
      <button onClick={() => append({ value: "" })}>Add</button>
    </>
  );
}
```

:::

</SideBySide>

**What's different:**

|                          | Kin Form                                      | React Hook Form                                     |
| ------------------------ | --------------------------------------------- | --------------------------------------------------- |
| What holds the array     | `FieldApi` — the array _is_ a node            | `useFieldArray` for logic, `useFormState` for state |
| Array-level validation   | The field's own `validators`                  | `useFieldArray`'s own `rules` — a separate API      |
| Item identity on reorder | Field identity follows the item via re-keying | `fields[i].id` from the hook                        |

Both are shown inlined in `Form` above; see
[Form composition](#form-composition) below for wrapping either side's array
into a reusable component instead.

## Per-node validation: when it runs, and debouncing

<SideBySide>

::: code-group

```tsx [Kin Form]
import { useForm, Watch } from "@kin-form/react";

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

```tsx [React Hook Form]
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

- Kin Form: `toSchemaValidator()` from `@kin-form/validators`
- React Hook Form: `standardSchemaResolver` from `@hookform/resolvers`

Both adapters can be used with any Standard Schema library: zod, valibot, ...

<SideBySide>

::: code-group

```tsx [Kin Form]
import { useForm, Watch } from "@kin-form/react";
import { required, toSchemaValidator } from "@kin-form/validators";
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

```tsx [React Hook Form]
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

```tsx [Kin Form]
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
          validators: [
            (field) =>
              field.value !== form.value.password
                ? "Passwords must match"
                : null,
          ],
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

```tsx [React Hook Form]
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

```tsx [Kin Form]
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

```tsx [React Hook Form]
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

|                  | Kin Form                                        | React Hook Form                              |
| ---------------- | ----------------------------------------------- | -------------------------------------------- |
| Whole-form dirty | `form.dirty`                                    | `formState.isDirty`                          |
| Per-field dirty  | `field.dirty` — a plain property on every field | `formState.dirtyFields` — nested boolean map |
| Reset            | `form.reset(value?)` — moves the baseline too   | `reset(values?, keepStateOptions)`           |
| Reset one field  | `form.resetField(name, value?)` — same idea     | `resetField(name, options?)`                 |

## Submission handling

Both separate "the form failed validation" from "submission itself succeeded,"
but only one also separates "submission itself failed."

<SideBySide>

::: code-group

```tsx [Kin Form]
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

```tsx [React Hook Form]
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

```tsx [Kin Form]
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

```tsx [React Hook Form]
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

React Hook Form's `watch()` subscribing the _calling component_ is a common
footgun: it's easy to reach for it inside a large form component and
re-introduce a re-render on every keystroke across the whole thing, which is why
the docs recommend `useWatch()` instead for anything beyond reading a value once
at submit time. React Hook Form also splits _value_ from _field state_ (errors,
touched, dirty, ...) into two separate hooks: `useWatch` only watches values, so
reading a field's error or touched status means also subscribing to
`useFormState`. `FieldApi` carries both on the same object, so Kin Form's single
`useWatch`, via `select`, subscribes to either, or both together, in one call.

<SideBySide>

::: code-group

```tsx [Kin Form]
import { type FieldApi, useWatch } from "@kin-form/react";

function Field<TParentValue>({ api }: { api: FieldApi<string, TParentValue> }) {
  // One hook covers both value and field state.
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

```tsx [React Hook Form]
import { useFormState, useWatch } from "react-hook-form";
import type { FieldValues, UseControllerProps } from "react-hook-form";

function Field<T extends FieldValues>(
  { control, name }: UseControllerProps<T>,
) {
  // Value and field state are two separate subscriptions.
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

|                         | Kin Form                                   | React Hook Form                                                                                             |
| ----------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Default subscription    | `useWatch(api)` — isolated per field/form  | `watch()` — re-renders the whole calling component                                                          |
| Narrowing               | `select: (f) => ...` on the same hook      | `useWatch({ control, name })` — separate hook                                                               |
| Value vs field state    | One `useWatch(api, select)` returning both | `useWatch` + `useFormState` — two hooks, combined by hand                                                   |
| Arbitrary derived value | `useWatch(api, select, equal?)`            | Not supported — `useWatch({ control, name })` only subscribes to a whole path; combine/derive by hand after |

## Form composition

Both let you build a reusable field component (leaf or group/array alike)
instead of repeating markup at every call site.

### Leaf field

<SideBySide>

::: code-group

```tsx [Kin Form]
import { type FieldApi, useWatch } from "@kin-form/react";

function TextField<TParent>(
  { api, label }: { api: FieldApi<string, TParent>; label: string },
) {
  const field = useWatch(api);

  return (
    <label>
      {label}
      <input
        value={field.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
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

```tsx [React Hook Form]
import { useController } from "react-hook-form";
import type { FieldValues, UseControllerProps } from "react-hook-form";

function TextField<T extends FieldValues>(
  { label, ...controllerProps }: UseControllerProps<T> & { label: string },
) {
  const { field, fieldState } = useController(controllerProps);

  return (
    <label>
      {label}
      <input {...field} />
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

|                         | Kin Form                                                                                          | React Hook Form                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Reusable field prop bag | An already-resolved `api: FieldApi<...>`, passed in directly                                      | `UseControllerProps` — `control`+`name`+rules                            |
| Type-safety on `name`   | Checked once, where `form.field(name, options)` is called — not re-derived inside every component | `FieldPath<T>` catches a typo'd `name` as a compile error, per call site |

### Group/array field

The [nested groups & arrays](#nested-groups-arrays-as-first-class-nodes) example
above, wrapped into a reusable component instead of inlined in `Form`:

<SideBySide>

::: code-group

```tsx [Kin Form]
import { FieldApi, useForm, useWatch, Watch } from "@kin-form/react";

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
            field={field}
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
  { field, onMoveUp, onMoveDown, onRemove }: {
    field: FieldApi<string, string[]>;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    onRemove: () => void;
  },
) {
  return (
    <Watch api={field}>
      {(f) => (
        <div>
          <TextInput value={f.value} onChange={f.handleChange} />
          <button disabled={!onMoveUp} onClick={onMoveUp}>Move up</button>
          <button disabled={!onMoveDown} onClick={onMoveDown}>Move down</button>
          <button onClick={onRemove}>Remove</button>
        </div>
      )}
    </Watch>
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

```tsx [React Hook Form]
import {
  Controller,
  useFieldArray,
  useForm,
  useFormState,
} from "react-hook-form";
import type {
  FieldArrayPath,
  FieldValues,
  Path,
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
        <div key={f.id}>
          <Controller
            control={props.control}
            // Cast needed, for the same reason as above.
            name={`${props.name}.${i}.value` as Path<TFieldValues>}
            render={({ field }) => (
              <TextInput value={field.value} onChange={field.onChange} />
            )}
          />
          <button
            disabled={i === 0}
            onClick={() => move(i, i - 1)}
          >
            Move up
          </button>
          <button
            disabled={i === fields.length - 1}
            onClick={() => move(i, i + 1)}
          >
            Move down
          </button>
          <button onClick={() => remove(i)}>Remove</button>
        </div>
      ))}
      {rootError?.message && <span>{rootError.message}</span>}
      <button onClick={() => append({ value: "" } as never)}>Add</button>
    </>
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

|                    | Kin Form                                                     | React Hook Form                                        |
| ------------------ | ------------------------------------------------------------ | ------------------------------------------------------ |
| Reusable component | Yes — pass a resolved `FieldApi` down                        | Yes — pass `control`+`name` down (or `useFormContext`) |
| Typesafety         | Fully type-safe — `DeepKey<T>` needs no cast, generic or not | Casts needed — `TFieldValues`/`TName` are generic      |

## Multistep forms

Neither ships an official multi-step/wizard _component_. Kin Form ships a
dedicated hook instead, [`useMultistep`](/guide/multistep); React Hook Form's
docs demonstrate the hand-rolled version.

<SideBySide>

::: code-group

```tsx [Kin Form]
import { useForm, useMultistep, Watch } from "@kin-form/react";

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
  const { stepName, stepField, next } = useMultistep(
    form,
    ["credentials", "address"] as const,
  );

  return (
    <form onSubmit={form.handleSubmit}>
      {stepName === "credentials" && (
        <>
          <Watch api={stepField.field("email")}>
            {(f) => <TextInput value={f.value} onChange={f.handleChange} />}
          </Watch>
          <Watch api={stepField.field("password")}>
            {(f) => (
              <TextInput
                type="password"
                value={f.value}
                onChange={f.handleChange}
              />
            )}
          </Watch>
        </>
      )}
      {stepName === "address" && (
        <Watch api={stepField.field("line1")}>
          {(f) => <TextInput value={f.value} onChange={f.handleChange} />}
        </Watch>
      )}
      <button type="button" onClick={next}>Next</button>
    </form>
  );
}
```

```tsx [React Hook Form]
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

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

  const next = async () => {
    // Manually validate this step's fields.
    const valid = await trigger(stepFields[step]);
    if (valid) setStep((s) => s + 1);
  };

  return (
    <form onSubmit={handleSubmit(signUp)}>
      {step === 0 && (
        <>
          <Controller
            control={control}
            name="credentials.email"
            render={({ field }) => (
              <TextInput value={field.value} onChange={field.onChange} />
            )}
          />
          <Controller
            control={control}
            name="credentials.password"
            render={({ field }) => (
              <TextInput
                type="password"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </>
      )}
      {step === 1 && (
        <Controller
          control={control}
          name="address.line1"
          render={({ field }) => (
            <TextInput value={field.value} onChange={field.onChange} />
          )}
        />
      )}
      <button type="button" onClick={next}>Next</button>
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
