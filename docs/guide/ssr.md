# Server-Side Rendering (SSR)

::: info

React only for now: other framework bindings are planned, and Lit's own SSR
story (`@lit-labs/ssr`) is a separate concern this guide doesn't cover.

:::

`@kin-form/react`'s bindings render on the server without any extra setup.
`useWatch`/`Watch` are backed by `useSyncExternalStore` with a proper
`getServerSnapshot`, so a form built the normal way, following the
[Basic](/guide/basic) guide, just works.

## `field.id` in server-rendered markup

`field.id` is a plain, module-level counter (`let nextId = 0`): stable across
array reorders, which is what makes it a good React `key` (see
[Dynamic Arrays](/guide/dynamic-arrays)), but not seeded the same way on the
server and the client. Rendering it into an actual DOM attribute, like an
`<input id={field.id}>` / `<label htmlFor={field.id}>` pair, mismatches during
hydration.

Use `useId()` for a DOM id instead, and keep `field.id` scoped to `key`:

```tsx
function TextField(
  { api, label }: { api: FieldApi<string, unknown>; label: string },
) {
  const field = useWatch(api);
  const reactId = useId();
  const inputId = `${field.name}-${reactId}`;

  return (
    <div>
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        value={field.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
      />
    </div>
  );
}
```

## Passing server-loaded data in as `initialValue`

When the real initial value is already available on the server (e.g. a Next.js
Server Component that fetched it before rendering), pass it straight into
`initialValue` on the client component that calls `useForm`. There's no
placeholder to reconcile and no `reset()` call needed: the value is there before
`useForm` ever runs.

```tsx
// Server Component
export default async function Page() {
  const profile = await fetchProfile();
  return <ProfileForm initialValue={profile} />;
}

// Client Component
"use client";
function ProfileForm({ initialValue }: { initialValue: Profile }) {
  const form = useForm({
    initialValue,
    onSubmit: (form) => saveProfile(form.value),
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <TextField api={form.field("firstName")} label="First name" />
    </form>
  );
}
```

This is the same "delay mounting the form" pattern from
[Async Initial Values](/guide/async-initial-values), just with the server doing
the waiting instead of a client-side loading state.

## Full example

[`examples/nextjs`](https://github.com/jolleekin/kin-form/tree/main/examples/nextjs)
in the repo is a minimal Next.js App Router app (a Server Component page
rendering a client-component `LoginForm`) that exists specifically to exercise
these bindings under a real SSR framework, not just a client-only dev server.

## What's next

- [Async Initial Values](/guide/async-initial-values): the placeholder vs.
  delayed-mount tradeoff this guide's last section builds on
- [Common Pitfalls](/guide/common-pitfalls): the short version of the `field.id`
  gotcha above
