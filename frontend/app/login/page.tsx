"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { loginUser } from "@/services/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await loginUser({ email, password });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-24 text-slate-100">
      <form onSubmit={submit} className="mx-auto max-w-md rounded-lg border border-slate-800 bg-slate-900 p-8">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-slate-400">Access your contract intelligence workspace.</p>
        {error && <div className="mt-5 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>}
        <label className="mt-6 block text-sm text-slate-300">Email</label>
        <input className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-sky-500" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        <label className="mt-4 block text-sm text-slate-300">Password</label>
        <input className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-sky-500" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        <button disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-2 font-medium text-slate-950 disabled:opacity-60">
          <LogIn size={18} /> {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
