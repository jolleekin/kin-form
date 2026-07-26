# Listeners

For side effects of a value change, use `onValueChanged`:

```ts
form.field("country", {
  onValueChanged() {
    form.field("province").value = "";
  },
});
```

It fires whenever `value` settles to something new, from any source , but not
for the initial value seeded at construction. Like `validators`/`dependents`,
it's refreshed on every `field` call, so a caller passing a fresh closure each
time (e.g. a React re-render) never invokes a stale one. This works identically
on any node — leaf, nested field, or the form root — since it's a plain
`FieldApiOptions` option, not something bolted onto leaves specifically.

## At the form root: persisting form state

Since every nested field's change bubbles up into the root's own `value`, one
`onValueChanged` on the form reacts to _any_ edit in the tree, without wiring a
handler onto each individual field:

::: code-group

```ts [Vanilla]
const form = new FormApi({
  initialValue: draft,
  onValueChanged: (form) => {
    localStorage.setItem("draft", JSON.stringify(form.value));
  },
});
```

```ts [React]
const form = useForm({
  initialValue: draft,
  onValueChanged: (form) => {
    localStorage.setItem("draft", JSON.stringify(form.value));
  },
});
```

:::

## Debouncing

`onValueChanged` fires on every settled change — for a text input bound via
`handleChange`, that's every keystroke. Unlike `asyncValidator`
(`validationDebounceMs`), there's no built-in debounce for `onValueChanged`:
it's a synchronous, no-return-value callback, so debouncing it is just wrapping
it in a timer. That's left to you on purpose — trailing vs. leading edge,
`maxWait`, and so on are real choices a single built-in policy wouldn't fit
everyone.

::: code-group

```ts [Vanilla]
function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  ms: number,
): (...args: Args) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

const form = new FormApi({
  initialValue: draft,
  onValueChanged: debounce(
    (form) => localStorage.setItem("draft", JSON.stringify(form.value)),
    500,
  ),
});
```

```tsx [React]
// Memoize the debounced function so it survives useForm's every-render
// updateOptions refresh instead of resetting its timer on every keystroke.
const persist = useMemo(
  () => debounce((form: FormApi<Draft>) => saveDraft(form.value), 500),
  [],
);
const form = useForm({
  initialValue: draft,
  onValueChanged: persist,
});
```

:::

## Listening for `touched`/`invalid`/`validating`

There's no dedicated callback for those — `onValueChanged` is deliberately
scoped to values, the case that comes up most in practice (validation side
effects, persistence). To react to a different property, subscribe directly —
see [Reactivity](/guide/reactivity).

::: code-group

```ts [Vanilla]
field.subscribe(() => {
  if (field.touched) reportFieldTouched(field.name);
});
```

```tsx [React]
const touched = useWatch(field, (f) => f.touched);

useEffect(() => {
  if (touched) reportFieldTouched(field.name);
}, [touched]);
```

:::
