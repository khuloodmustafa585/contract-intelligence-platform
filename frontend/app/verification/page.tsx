"use client";

import Link from "next/link";
import { Hexagon, Mail, CheckCircle2, ArrowRight } from "lucide-react";

export default function VerificationPage() {

  return (
    <div
      className="flex min-h-screen items-center justify-center px-6"
      style={{ background: "#0b1326" }}
    >
      <div className="pointer-events-none fixed inset-0" style={{ background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.07) 0%, transparent 70%)" }} />

      <div className="relative w-full max-w-sm text-center">
        <div
          className="rounded-2xl px-8 py-10"
          style={{
            background: "rgba(19,27,46,0.8)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(99,102,241,0.16)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
          }}
        >
          {/* Brand */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", boxShadow: "0 0 24px rgba(99,102,241,0.4)" }}>
              <Hexagon size={20} className="text-white" fill="rgba(255,255,255,0.12)" />
            </div>
            <span className="text-sm font-bold" style={{ color: "#dae2fd" }}>Contract Lens</span>
          </div>

          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl mx-auto" style={{ background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.20)" }}>
            <Mail size={28} style={{ color: "#818cf8" }} />
          </div>

          <h1 className="text-xl font-bold mb-2" style={{ color: "#dae2fd" }}>Check your email</h1>
          <p className="text-sm mb-6" style={{ color: "#64748b" }}>
            We sent a verification link to your email address. Click the link to activate your workspace.
          </p>

          <div className="space-y-3">
            {/* Redirect to the real verify page where the user can enter their code */}
            <Link
              href="/verify"
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.22)", color: "#818cf8" }}
            >
              <CheckCircle2 size={14} /> Enter verification code
            </Link>

            <Link
              href="/login"
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "white", boxShadow: "0 0 20px rgba(99,102,241,0.3)" }}
            >
              Go to login <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
