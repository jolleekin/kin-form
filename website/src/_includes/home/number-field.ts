
const valueFormatter: ValueFormatter<number | null> = (value) =>
  value !== null ? String(value) : "";

@customElement("number-field")
export class NumberField extends FormField<number | null> {
  constructor() {
    super();
    this.value = null;
  }

  @property()
  label = "";

  override valueFormatter = valueFormatter;

  override valueParser: ValueParser<number | null> = Number;

  protected override sanitizeValue(value: number | null): number | null {
    // NaN -> null.
    return value === value ? value : null;
  }

  #handleChange(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.value = input.value;

    // This ensures the UI is in sync with the sanitized value.
    // For example
    // - "abc" and "xyz" map to `null`. The input's value should be `""`.
    // - "01" and "001" map to `1`. The input's value should be "1".
    input.value = this.valueAsString;
  }

  protected override render(): unknown {
    return html`
      <label part="label">${this.label}</label>
      <div part="content">
        <input
          part="input"
          type="text"
          .disabled=${this.disabled}
          .value=${this.valueAsString}
          @blur=${this.handleBlur}
          @change=${this.#handleChange}
        />
        ${renderStatus(this)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "number-field": NumberField;
  }
}
