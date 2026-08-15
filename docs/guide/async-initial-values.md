# Async Initial Values

`initialValue` is only read once, at construction. It's also the
[dirty-tracking baseline](/guide/dirty-tracking-and-reset), so nothing refreshes
it automatically afterward. When the real initial value comes from an async
source (an API call, a `useQuery`), there are two ways to get it in.

## Placeholder + `reset()`

Construct the form immediately with a placeholder value, then move both the
value and the dirty baseline to the real data via `reset()` once it arrives.

::: code-group

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

```ts [Lit]
@customElement("profile-form")
class ProfileForm extends LitElement {
  #form = new FormApi({
    initialValue: { firstName: "", lastName: "" },
    onSubmit: async (form) => {
      await saveProfile(form.value);
    },
  });

  @state()
  accessor #loading = true;

  override connectedCallback() {
    super.connectedCallback();
    fetchProfile().then((data) => {
      this.#form.reset(data);
      this.#loading = false;
    });
  }

  override render() {
    if (this.#loading) return html`<p>Loading...</p>`;

    return html`
      <form @submit=${this.#form.handleSubmit}>
        <text-field
          .api=${this.#form.field("firstName")}
          label="First name"
        ></text-field>
        <text-field
          .api=${this.#form.field("lastName")}
          label="Last name"
        ></text-field>
      </form>
    `;
  }
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

```ts [Lit]
// One element, not two: a Lit property isn't readable until after the
// constructor runs, so a resolved value can't be handed in as a `.prop` and
// constructed from in the same pass the way a React prop can. Delaying the
// `FormApi` itself, inside the element that fetches it, sidesteps that.
@customElement("profile-form")
class ProfileForm extends LitElement {
  @state()
  accessor #form: FormApi<Profile> | undefined;

  override connectedCallback() {
    super.connectedCallback();
    fetchProfile().then((data) => {
      this.#form = new FormApi({
        initialValue: data,
        onSubmit: (form) => saveProfile(form.value),
      });
    });
  }

  override render() {
    if (!this.#form) return html`<p>Loading...</p>`;
    const form = this.#form;

    return html`
      <form @submit=${form.handleSubmit}>
        <text-field
          .api=${form.field("firstName")}
          label="First name"
        ></text-field>
        <text-field
          .api=${form.field("lastName")}
          label="Last name"
        ></text-field>
      </form>
    `;
  }
}
```

:::

## What's next

- [Dirty Tracking & Reset](/guide/dirty-tracking-and-reset) — how the baseline
  works
