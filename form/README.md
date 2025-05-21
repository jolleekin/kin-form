# Kin Form

A fast, flexible, and type-safe form management library for [Lit].

## Documentation

See the full documentation at [kin-form.deno.dev][website].

## Installation

```sh
deno add jsr:@kin/form
npx  jsr add @kin/form
pnpm add jsr:@kin/form
yarn add jsr:@kin/form
```

## Key Features

| Feature                        | Description                                                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| **Fast**                       | Leverages [Lit]'s efficient rendering for the highest performance                                                               |
| **Type-safe**                  | First-class TypeScript support with autocompletion and type inference, minimizing runtime bugs                                  |
| **Any-level validation**       | Synchronous and asynchronous validation at any field level (leaf field, field group, or the whole form)                         |
| **Dependent field validation** | Automatically validate dependent fields when the fields they depend on change values                                            |
| **Flexible form structure**    | Easily choose between nested and flattened form structures, or use them both                                                    |
| **Flexible field components**  | Create custom fields by extending `FormField` and `FieldGroup`, or use the generic `<kin-field>` and `kin-field-group` elements |
| **Array operations**           | Built-in support for array operations (insert, move, push, remove, and replace)                                                 |
| **Minimum Dependencies**       | Only depends on [Lit]                                                                                                           |

## Example

```ts
interface Model {
  name: string;
  level: number | null;
  dateOfBith: Date | null;
}

@customElement("form-demo")
export class FormDemo extends LitElement {
  #form = new FormController<Model>(this, {
    initialValue: {
      name: "",
      level: null,
      dateOfBirth: null,
    },
    onSubmit: (form) => {
      console.log(form.value);
    },
  });

  protected override render(): unknown {
    const { field, handleSubmit, submitting } = this.#form;

    return html`
      <!-- Use custom elements that extend FormField -->
      <text-field label="Name" ${field("name")}></text-field>
      <number-field label="Level" ${field("level")}></number-field>

      <!-- Use <kin-field> with a custom template -->
      <kin-field
        ${field("dateOfBirth")}
        .template=${(f: KinField<Date | null>) => html`
          <label>Date of birth</label>
          <input
            type="date"
            .valueAsDate=${f.value}
            @blur=${f.handleBlur}
            @change=${(evt: Event) => {
              f.handleChange(evt, (evt.target as HTMLInputElement).valueAsDate);
            }}
          />
          ${f.touched && f.error ? html`<div>${f.error}</div>` : nothing}
        `}
      ></kin-field>

      <button .disabled=${submitting} @click=${handleSubmit}>Save</button>
    `;
  }
}
```

[Lit]: https://lit.dev
[website]: https://kin-form.deno.dev
