"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Eye, EyeOff, Loader2, UserPlus, Zap } from "lucide-react";
import { registerUser } from "@/services/api";

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: { preventDefault(): void }) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await registerUser(form);
      setMessage("Account created. Check your email for a verification code.");
      setTimeout(() => router.push("/verification"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    { key: "full_name" as const, label: "Full name",    type: "text",     placeholder: "Jane Smith" },
    { key: "email"     as const, label: "Work email",   type: "email",    placeholder: "you@company.com" },
    { key: "password"  as const, label: "Password",     type: "password", placeholder: "Min. 8 characters" },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080d1a] px-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white leading-none">Contract Lens</p>
            <p className="text-[10px] uppercase tracking-widest text-blue-400/70">Intelligence Suite</p>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="rounded-2xl border border-[rgba(99,131,200,0.15)] bg-[#0d1528] p-8 shadow-2xl shadow-black/40"
        >
          <h1 className="text-xl font-bold text-white">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">
            Start analyzing contracts with AI-powered intelligence.
          </p>

          {message && (
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-[rgba(34,197,94,0.07)] px-4 py-3 text-sm text-emerald-300">
              <CheckCircle2 size={16} className="flex-shrink-0" /> {message}
            </div>
          )}
          {error && (
            <div className="mt-5 rounded-xl border border-red-500/20 bg-[rgba(239,68,68,0.08)] px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="mt-6 space-y-4">
            {fields.map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">{label}</label>
                <div className="relative">
                  <input
                    className="input-base w-full"
                    style={{ paddingRight: key === "password" ? "2.5rem" : undefined }}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    type={key === "password" ? (showPassword ? "text" : "password") : type}
                    placeholder={placeholder}
                    required
                    autoComplete={key === "password" ? "new-password" : key === "email" ? "email" : "name"}
                  />
                  {key === "password" && (
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-6 flex w-full items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Creating account…</>
            ) : (
              <><UserPlus size={16} /> Create account</>
            )}
          </button>

          <p className="mt-5 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-400 hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
