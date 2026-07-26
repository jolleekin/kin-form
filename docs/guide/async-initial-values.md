# Async Initial Values

`initialValue` is only read once, at construction. It's also the
[dirty-tracking baseline](/guide/dirty-tracking-and-reset), so nothing refreshes
it automatically afterward. When the real initial value comes from an async
source (an API call, a `useQuery`), there are two ways to get it in.

## Placeholder + `reset()`

Construct the form immediately with a placeholder value, then move both the
value and the dirty baseline to the real data via `reset()` once it arrives.

::: code-group

```ts [Vanilla]
const form = new FormApi({
  initialValue: { firstName: "", lastName: "" },
  onSubmit: async (form) => {
    await saveProfile(form.value);
  },
});

const data = await fetchProfile();
form.reset(data);
```

```tsx [React]
function ProfileForm() {
  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
  });

  const form = useForm({
    initialValue: { firstName: "", lastName: "" },
    onSubmit: async (form) => {
      await saveProfile(form.value);
    },
  });

  useEffect(() => {
    if (data) form.reset(data);
  }, [data]);

  if (isLoading) return <p>Loading...</p>;

  return (
    <form onSubmit={form.handleSubmit}>
      <TextField api={form.field("firstName")} label="First name" />
      <TextField api={form.field("lastName")} label="Last name" />
    </form>
  );
}
```

:::

`reset(data)` both populates the fields and moves the dirty baseline to `data`,
so the form isn't reported `dirty` just because its value moved from the empty
placeholder to the loaded one.

## Delay mounting the form

Don't construct the form until the real value is ready — a loading page renders
first, then a separate form component mounts once data has resolved, with the
real value passed straight in as `initialValue`. No placeholder, no `reset()`
call.

::: code-group

```ts [Vanilla]
const data = await fetchProfile();

const form = new FormApi({
  initialValue: data,
  onSubmit: async (form) => {
    await saveProfile(form.value);
  },
});
```

```tsx [React]
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
    onSubmit: (form) => saveProfile(form.value),
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <TextField api={form.field("firstName")} label="First name" />
      <TextField api={form.field("lastName")} label="Last name" />
    </form>
  );
}
```

:::

## What's next

- [Dirty Tracking & Reset](/guide/dirty-tracking-and-reset) — how the baseline
  works
