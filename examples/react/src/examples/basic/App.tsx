import { useForm, type Validator, Watch } from "@kintools/form-react";
import { useFormDevtools } from "@kintools/form-devtools-react";
import { email, minLength, required } from "@kintools/form-validators";
import { SubmitButton } from "./components/SubmitButton.tsx";

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

export default function App() {
  const form = useForm<Login>({
    initialValue: { email: "", password: "" },
    onSubmit: async (form) => {
      // Simulate a network request.
      await new Promise((resolve) => setTimeout(resolve, 800));
      alert(`Welcome back, ${form.value.email}!`);
    },
  });

  useFormDevtools(form);

  return (
    <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-md">
      <h1 className="text-xl font-semibold text-gray-900">Sign in</h1>
      <p className="mt-1 text-sm text-gray-500">
        Use any email and an 8+ character password.
      </p>

      <form
        className="mt-6 space-y-4"
        onSubmit={form.handleSubmit}
        noValidate
      >
        <Watch api={form.field("email", { validators: emailValidators })}>
          {(field) => (
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={field.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                className={inputClasses(field.invalid && field.touched)}
              />
              {field.invalid && field.touched && (
                <p className="mt-1 text-sm text-red-600">{field.error}</p>
              )}
            </div>
          )}
        </Watch>

        <Watch
          api={form.field("password", { validators: passwordValidators })}
        >
          {(field) => (
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={field.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                className={inputClasses(field.invalid && field.touched)}
              />
              {field.invalid && field.touched && (
                <p className="mt-1 text-sm text-red-600">{field.error}</p>
              )}
            </div>
          )}
        </Watch>
        <SubmitButton api={form} className="w-full" pendingLabel="Signing in…">
          Sign in
        </SubmitButton>
      </form>
    </div>
  );
}
