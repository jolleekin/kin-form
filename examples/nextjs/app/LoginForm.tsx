"use client";

import { useForm, Watch } from "@kintools/form-react";
import { email, minLength, required } from "@kintools/form-validators";
import { TextField } from "./TextField.tsx";

type Login = {
  email: string;
  password: string;
};

export function LoginForm() {
  const form = useForm<Login>({
    initialValue: { email: "", password: "" },
    onSubmit: (form) => {
      alert(`Welcome back, ${form.value.email}!`);
    },
  });

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={form.handleSubmit}
      noValidate
    >
      <TextField
        api={form.field("email", {
          validators: [
            required("Email is required"),
            email("Enter a valid email address"),
          ],
        })}
        label="Email"
        type="email"
      />

      <TextField
        api={form.field("password", {
          validators: [
            required("Password is required"),
            minLength(8, "Password must be at least 8 characters"),
          ],
        })}
        label="Password"
        type="password"
      />

      <Watch api={form} select={(f) => f.submitting}>
        {(_form, submitting) => (
          <button
            className="mt-2 h-10 rounded border bg-neutral-50"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        )}
      </Watch>
    </form>
  );
}
