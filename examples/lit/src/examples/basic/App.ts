import { html } from "lit";
import { FormApi, type Validator, watch } from "@kintools/form-lit";
import { email, minLength, required } from "@kintools/form-validators";
import "./components/SubmitButton.ts";

type Login = {
  email: string;
  password: string;
};

const emailValidators: Validator<string, Login>[] = [
  required("Email is required"),
  email("Enter a valid email address"),
];

const passwordValidators: Validator<string, Login>[] = [
  required("Password is required"),
  minLength(8, "Password must be at least 8 characters"),
];

const inputClasses = (invalid: boolean) =>
  `mt-1 block w-full rounded-md border px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 ${
    invalid
      ? "border-red-400 focus:border-red-400 focus:ring-red-200"
      : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
  }`;

export default function App(): unknown {
  const form = new FormApi<Login>({
    initialValue: { email: "", password: "" },
    onSubmit: async (form) => {
      // Simulate a network request.
      await new Promise((resolve) => setTimeout(resolve, 800));
      alert(`Welcome back, ${form.value.email}!`);
    },
  });

  return html`
    <div class="w-full max-w-sm rounded-lg bg-white p-8 shadow-md">
      <h1 class="text-xl font-semibold text-gray-900">Sign in</h1>
      <p class="mt-1 text-sm text-gray-500">
        Use any email and an 8+ character password.
      </p>

      <form class="mt-6 space-y-4" @submit=${form.handleSubmit} novalidate>
        ${watch(
          form.field("email", { validators: emailValidators }),
          (field) =>
            html`
              <div>
                <label
                  for="email"
                  class="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autocomplete="email"
                  .value=${field.value}
                  @blur=${field.handleBlur}
                  @input=${(event: Event) =>
                    field.handleChange(
                      (event.target as HTMLInputElement).value,
                    )}
                  class=${inputClasses(field.invalid && field.touched)}
                >
                ${field.invalid && field.touched
                  ? html`
                    <p class="mt-1 text-sm text-red-600">${field.error}</p>
                  `
                  : ""}
              </div>
            `,
        )}

        ${watch(
          form.field("password", { validators: passwordValidators }),
          (field) =>
            html`
              <div>
                <label
                  for="password"
                  class="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autocomplete="current-password"
                  .value=${field.value}
                  @blur=${field.handleBlur}
                  @input=${(event: Event) =>
                    field.handleChange(
                      (event.target as HTMLInputElement).value,
                    )}
                  class=${inputClasses(field.invalid && field.touched)}
                >
                ${field.invalid && field.touched
                  ? html`
                    <p class="mt-1 text-sm text-red-600">${field.error}</p>
                  `
                  : ""}
              </div>
            `,
        )}

        <basic-submit-button
          .api=${form}
          button-class="w-full"
          pending-label="Signing in…"
          label="Sign in"
        ></basic-submit-button>
      </form>
    </div>
  `;
}
