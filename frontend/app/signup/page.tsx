"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { registerUser } from "@/services/api";

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await registerUser(form);
      setMessage("Account created. Check your email for the verification code before signing in.");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-24 text-slate-100">
      <form onSubmit={submit} className="mx-auto max-w-md rounded-lg border border-slate-800 bg-slate-900 p-8">
        <h1 className="text-2xl font-semibold">Create account</h1>
        <p className="mt-2 text-sm text-slate-400">Start analyzing contracts securely.</p>
        {message && <div className="mt-5 rounded-lg border border-emerald-900 bg-emerald-950/40 p-3 text-sm text-emerald-200">{message}</div>}
        {error && <div className="mt-5 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>}
        {(["full_name", "email", "password"] as const).map((field) => (
          <label key={field} className="mt-4 block text-sm text-slate-300">
            {field === "full_name" ? "Full name" : field[0].toUpperCase() + field.slice(1)}
            <input className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-sky-500" value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} type={field === "password" ? "password" : field === "email" ? "email" : "text"} required />
          </label>
        ))}
        <button disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-2 font-medium text-slate-950 disabled:opacity-60">
          <UserPlus size={18} /> {loading ? "Creating..." : "Create account"}
        </button>
      </form>
    </main>
  );
}
