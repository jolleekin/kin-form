import { LoginForm } from "./LoginForm.tsx";

// A Server Component on purpose: this is what exercises Kin Form's React
// bindings under SSR (a plain client-only page would never hit that path).
export default function Page() {
  return (
    <main style={{ maxWidth: 320, margin: "4rem auto" }}>
      <h1>Sign in</h1>
      <LoginForm />
    </main>
  );
}
