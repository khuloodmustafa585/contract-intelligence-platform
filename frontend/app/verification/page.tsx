"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, Mail, RotateCcw, Zap } from "lucide-react";

export default function VerificationPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

  async function verify(event: { preventDefault(): void }) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Verification failed");
      setSuccess("Email verified! Redirecting to login…");
      setTimeout(() => router.push("/login"), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (!email) { setError("Enter your email first."); return; }
    setResending(true);
    setError("");
    try {
      const res = await fetch(`${API}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Resend failed");
      setSuccess("Verification code resent. Check your inbox.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Resend failed");
    } finally {
      setResending(false);
    }
  }

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
          onSubmit={verify}
          className="rounded-2xl border border-[rgba(99,131,200,0.15)] bg-[#0d1528] p-8 shadow-2xl shadow-black/40"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(59,130,246,0.1)] border border-blue-500/20">
            <Mail size={20} className="text-blue-400" />
          </div>

          <h1 className="text-xl font-bold text-white">Verify your email</h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter the 6-digit code sent to your inbox.
          </p>

          {success && (
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-[rgba(34,197,94,0.07)] px-4 py-3 text-sm text-emerald-300">
              <CheckCircle2 size={16} className="flex-shrink-0" /> {success}
            </div>
          )}
          {error && (
            <div className="mt-5 rounded-xl border border-red-500/20 bg-[rgba(239,68,68,0.08)] px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Email</label>
              <input
                className="input-base w-full"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Verification code</label>
              <input
                className="input-base w-full text-center text-xl tracking-[0.5em] font-mono"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="btn-primary mt-6 flex w-full items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Verifying…</>
            ) : (
              <><CheckCircle2 size={16} /> Verify email</>
            )}
          </button>

          <button
            type="button"
            onClick={resend}
            disabled={resending}
            className="btn-ghost mt-3 flex w-full items-center justify-center gap-2 text-sm"
          >
            {resending ? (
              <><Loader2 size={14} className="animate-spin" /> Resending…</>
            ) : (
              <><RotateCcw size={14} /> Resend code</>
            )}
          </button>

          <p className="mt-5 text-center text-sm text-slate-600">
            <Link href="/login" className="text-blue-400 hover:underline">Back to sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
