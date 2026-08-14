import { LoginForm } from "./LoginForm.tsx";

// A Server Component on purpose: this is what exercises Kin Form's React
// bindings under SSR (a plain client-only page would never hit that path).
export default function Page() {
  return (
    <main className="max-w-sm mx-auto mt-16">
      <h1 className="text-4xl mb-3">Sign in</h1>
      <LoginForm />
    </main>
  );
}
