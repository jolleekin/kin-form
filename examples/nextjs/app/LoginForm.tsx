"use client";

import { useForm, Watch } from "@kin-form/react";
import { email, minLength, required } from "@kin-form/validators";

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
    <form onSubmit={form.handleSubmit} noValidate>
      <Watch
        api={form.field("email", {
          validators: [
            required("Email is required"),
            email("Enter a valid email address"),
          ],
        })}
      >
        {(field) => (
          <div>
            <label htmlFor="email">Email</label>
            <br />
            <input
              id="email"
              type="email"
              value={field.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
            {field.invalid && field.touched && <p>{field.error}</p>}
          </div>
        )}
      </Watch>

      <Watch
        api={form.field("password", {
          validators: [
            required("Password is required"),
            minLength(8, "Password must be at least 8 characters"),
          ],
        })}
      >
        {(field) => (
          <div>
            <label htmlFor="password">Password</label>
            <br />
            <input
              id="password"
              type="password"
              value={field.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
            {field.invalid && field.touched && <p>{field.error}</p>}
          </div>
        )}
      </Watch>

      <Watch api={form} select={(f) => f.submitting}>
        {(_form, submitting) => (
          <button type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        )}
      </Watch>
    </form>
  );
}
