# Common Pitfalls

Every entry here is silent: nothing throws, nothing fails to type-check, the UI
just doesn't do what you'd expect. Each one links to the guide that covers the
mechanism in full; this page is only the "watch out for this" index.

## Watching in the same component that owns the form

<FrameworkText>
<template #react>

Calling `useWatch` in the same component that calls `useForm` re-renders the
whole form on every change, exactly what `useForm` not subscribing by itself is
meant to avoid.

</template>
<template #lit>

Creating a `WatchController` in the same component that creates a `FormApi`
re-renders the whole form on every change, exactly what a plain `#form` class
field (rather than some subscribing helper) is meant to avoid.

</template>
</FrameworkText>

Extract the subscription and the UI it drives into their own component instead.
See [Reactivity](/guide/reactivity).

## `disabled` cascades through state, not through the DOM

Setting `form.disabled = true` reaches every registered field's
`FieldApi.disabled`, but nothing on screen changes until a field's own component
actually reads it. A `TextField` that never reads `field.disabled` leaves its
`<input>` editable no matter what `disabled` says.

Combine the field's own `disabled` with a `disabled` prop the caller can also
set (`disabled={disabled || field.disabled}` in React,
`this.disabled || field.disabled` in Lit) so both an ancestor cascade and a
one-off override work. See [Basic](/guide/basic) and
[Submission Handling](/guide/submission-handling).

## Reassigning `validators`/`dependents` doesn't revalidate by itself

Passing a fresh `validators` array on every render (a validator factory like
`required()` returns a new closure each call) doesn't trigger a new validation
run on its own — only an actual value change or an explicit `validate(true)`
does. A field can look like it's still validating against its old rules if
you're watching for some other signal that the option "took effect."

This is deliberate, not a bug: reacting to the reference change alone would turn
every render into a validation run. Cache the array yourself (`useMemo` in
React, a class field in Lit) if you want reassigning the same set to be a true
no-op. See [Per-node Validation](/guide/per-node-validation).

## Reading a sibling's value inside a validator isn't a dependency

A validator can read any other field's value directly (`form.value.password`),
but that read isn't tracked. Without declaring `dependents`, editing `password`
won't re-run `confirmPassword`'s validator, leaving a stale "Passwords must
match" error until `confirmPassword` is next edited or blurred itself.

See [Linked Fields](/guide/linked-fields).

## Index as a list key

Keying an array's rendered rows on their index, instead of the item's own `id`,
misattributes uncontrolled DOM state (focus, cursor position, scroll) to the
wrong row after a reorder: the item that _renders_ at index 2 changes, but the
component/element instance React/Lit reuses for index 2 doesn't.

Use `FieldApi.id` as the key instead. See
[Dynamic Arrays](/guide/dynamic-arrays).

## `handleSubmit` doesn't move the dirty baseline

A successful `onSubmit` doesn't reset anything on its own: `dirty` (and the
reset baseline it's computed from) stay exactly where they were before you
submitted, so a form that just saved successfully still reports `dirty: true`.

Call `form.reset()` or `form.reset(saved)` to reset the baseline. See
[Dirty Tracking & Reset](/guide/dirty-tracking-and-reset).

## `field.id` in server-rendered markup

::: info

React only — there's no SSR-oriented guide for the Lit binding in this repo yet.

:::

`field.id` is a stable, module-level counter: good for a React `key` since it
survives array reorders, but not seeded the same way on the server and the
client. Rendering it into an actual DOM attribute (an `<input id={field.id}>` /
`<label htmlFor={field.id}>` pair, say) mismatches during hydration. Use
`useId()` for a DOM id instead, and keep `field.id` scoped to `key`.

See [Server-Side Rendering (SSR)](/guide/ssr) for the full guide.
