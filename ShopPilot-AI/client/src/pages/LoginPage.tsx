import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

export function LoginPage() {
  const { login, register, demo } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("demo@shopilot.ai");
  const [password, setPassword] = useState("Demo@123");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "register") await register(name, email, password);
      else await login(email, password);
      nav("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-serif text-4xl">{mode === "login" ? "Welcome back" : "Create account"}</h1>
      <p className="mt-2 text-sm text-ink-500">Use the demo accounts for the internship walkthrough.</p>

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <button
          className="btn-primary"
          type="button"
          onClick={async () => {
            await demo("customer");
            nav("/agent");
          }}
        >
          Demo customer
        </button>
        <button
          className="btn-ghost"
          type="button"
          onClick={async () => {
            await demo("merchant");
            nav("/dashboard");
          }}
        >
          Demo merchant
        </button>
      </div>

      <form onSubmit={onSubmit} className="card mt-8 space-y-3 p-6">
        {mode === "register" && (
          <input
            className="w-full rounded-lg border border-ink-200 bg-transparent px-3 py-2 text-sm dark:border-ink-700"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}
        <input
          className="w-full rounded-lg border border-ink-200 bg-transparent px-3 py-2 text-sm dark:border-ink-700"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full rounded-lg border border-ink-200 bg-transparent px-3 py-2 text-sm dark:border-ink-700"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="btn-primary w-full" type="submit" disabled={busy}>
          {mode === "login" ? "Sign in" : "Create account"}
        </button>
        <button
          className="w-full text-center text-sm text-ink-500"
          type="button"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Need an account?" : "Already have an account?"}
        </button>
      </form>

      <p className="mt-6 text-xs text-ink-400">
        demo@shopilot.ai / Demo@123 · merchant@shopilot.ai / Merchant@123
      </p>
    </div>
  );
}
