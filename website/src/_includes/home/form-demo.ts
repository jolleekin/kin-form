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
