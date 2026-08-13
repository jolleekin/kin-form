import { html } from "lit";
import { FormApi, type Validator } from "@kin-form/lit";
import { email, minLength, required } from "@kin-form/validators";
import "./components/SubmitButton.ts";
import "./components/TextField.ts";

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
        <reusable-fields-text-field
          .api=${form.field("email", { validators: emailValidators })}
          type="email"
          label="Email"
          required
          autocomplete="email"
        ></reusable-fields-text-field>

        <reusable-fields-text-field
          .api=${form.field("password", { validators: passwordValidators })}
          type="password"
          label="Password"
          required
          autocomplete="current-password"
        ></reusable-fields-text-field>

        <reusable-fields-submit-button
          .api=${form}
          button-class="w-full"
          pending-label="Signing in…"
          label="Sign in"
        ></reusable-fields-submit-button>
      </form>
    </div>
  `;
}
