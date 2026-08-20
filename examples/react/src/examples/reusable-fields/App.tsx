import { useForm, type Validator } from "@kintools/form-react";
import { useFormDevtools } from "@kintools/form-devtools-react";
import { email, minLength, required } from "@kintools/form-validators";
import { SubmitButton } from "./components/SubmitButton.tsx";
import { TextField } from "./components/TextField.tsx";

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
        <TextField
          api={form.field("email", { validators: emailValidators })}
          type="email"
          label="Email"
          required
          autoComplete="email"
        />

        <TextField
          api={form.field("password", { validators: passwordValidators })}
          type="password"
          label="Password"
          required
          autoComplete="current-password"
        />

        <SubmitButton api={form} className="w-full" pendingLabel="Signing in…">
          Sign in
        </SubmitButton>
      </form>
    </div>
  );
}
