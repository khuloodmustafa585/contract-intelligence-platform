"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, EyeOff, Loader2, AlertCircle, CheckCircle2,
  User, Mail, Lock, ArrowRight, Shield, Hexagon,
} from "lucide-react";
import { registerUser } from "@/services/api";
import AuthLayout from "@/components/auth/AuthLayout";
import PremiumInput from "@/components/auth/PremiumInput";
import GlowButton from "@/components/auth/GlowButton";
import SecurityBadge from "@/components/auth/SecurityBadge";

const STRENGTH_META = [
  { label: "",       color: "#1e2d47" },
  { label: "WEAK",   color: "#ef4444" },
  { label: "FAIR",   color: "#f59e0b" },
  { label: "GOOD",   color: "#22d3ee" },
  { label: "STRONG", color: "#10b981" },
];

function passwordStrength(pw: string): number {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8)           s++;
  if (/[A-Z]/.test(pw))         s++;
  if (/[0-9]/.test(pw))         s++;
  if (/[^A-Za-z0-9]/.test(pw))  s++;
  return s;
}

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);

  const strength     = passwordStrength(form.password);
  const strengthMeta = STRENGTH_META[strength];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await registerUser(form);
      setMessage(
        "Workspace provisioned. Check your email to verify your account before signing in."
      );
      setTimeout(() => router.push("/login"), 2800);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Registration failed. Please retry."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        className="w-full max-w-[440px]"
      >
        {/* Main glass card */}
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{
            background: "rgba(6, 11, 24, 0.93)",
            backdropFilter: "blur(40px) saturate(200%)",
            WebkitBackdropFilter: "blur(40px) saturate(200%)",
            border: "1px solid rgba(99,102,241,0.13)",
            boxShadow: [
              "0 0 0 1px rgba(99,102,241,0.04)",
              "0 40px 100px rgba(0,0,0,0.75)",
              "0 0 80px rgba(34,211,238,0.05)",
              "inset 0 1px 0 rgba(255,255,255,0.04)",
              "inset 0 -1px 0 rgba(0,0,0,0.3)",
            ].join(", "),
            padding: "36px",
          }}
        >
          {/* Top accent — cyan-to-indigo gradient (differentiates register from login) */}
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.65) 30%, rgba(99,102,241,0.85) 65%, transparent 100%)",
            }}
          />

          {/* Corner glows */}
          <div
            className="pointer-events-none absolute -left-10 -top-10 h-36 w-36 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 70%)",
              filter: "blur(24px)",
            }}
          />
          <div
            className="pointer-events-none absolute -right-8 -bottom-10 h-28 w-28 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />

          {/* Brand */}
          <div className="mb-7 flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: "linear-gradient(135deg, #5046e5 0%, #4338ca 100%)",
                boxShadow: "0 0 32px rgba(99,102,241,0.5)",
              }}
            >
              <Hexagon size={20} className="text-white" fill="rgba(255,255,255,0.08)" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-bold tracking-[0.1em] uppercase" style={{ color: "#c7d2f8" }}>
                Contract Lens
              </p>
              <p className="font-mono-label" style={{ color: "#1e2d47", fontSize: "0.56rem" }}>
                INTELLIGENCE SUITE · NEW OPERATIVE
              </p>
            </div>
          </div>

          {/* Header */}
          <div className="mb-6">
            <p className="font-mono-label mb-2" style={{ color: "#1a2538", fontSize: "0.57rem" }}>
              WORKSPACE PROVISIONING · SECURE REGISTRATION
            </p>
            <h1 className="text-[1.6rem] font-bold leading-tight" style={{ color: "#dae2fd" }}>
              Initialize Your{" "}
              <span
                style={{
                  background: "linear-gradient(90deg, #22d3ee 0%, #818cf8 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Workspace
              </span>
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: "#1e2d47" }}>
              Deploy your AI-powered legal intelligence environment
            </p>
          </div>

          {/* Success banner */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.22 }}
                className="flex items-start gap-2 overflow-hidden rounded-xl px-4 py-3 text-xs"
                style={{
                  background: "rgba(16,185,129,0.06)",
                  border: "1px solid rgba(16,185,129,0.2)",
                  color: "#34d399",
                }}
              >
                <CheckCircle2 size={13} className="shrink-0 mt-0.5" />
                {message}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.22 }}
                className="flex items-center gap-2 overflow-hidden rounded-xl px-4 py-3 text-xs"
                style={{
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.18)",
                  color: "#f87171",
                }}
              >
                <AlertCircle size={13} className="shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={submit} className="space-y-4">
            <PremiumInput
              label="OPERATIVE NAME"
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
              autoComplete="name"
              placeholder="Jane Smith"
              icon={<User size={14} />}
            />

            <PremiumInput
              label="IDENTITY · WORK EMAIL"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
              placeholder="jane@lawfirm.com"
              icon={<Mail size={14} />}
            />

            {/* Password with strength meter */}
            <div>
              <PremiumInput
                label="CREDENTIAL · PASSPHRASE"
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                icon={<Lock size={14} />}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="transition-opacity hover:opacity-70"
                  >
                    {showPw
                      ? <EyeOff size={14} style={{ color: "#2a3550" }} />
                      : <Eye size={14} style={{ color: "#2a3550" }} />}
                  </button>
                }
              />

              {/* Strength indicator */}
              <AnimatePresence>
                {form.password.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2.5 overflow-hidden"
                  >
                    <div className="flex gap-1 mb-1.5">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-0.5 flex-1 rounded-full"
                          style={{
                            background:
                              i <= strength
                                ? strengthMeta.color
                                : "rgba(99,102,241,0.1)",
                            transition: "background 0.3s ease",
                          }}
                        />
                      ))}
                    </div>
                    {strength > 0 && (
                      <p
                        className="font-mono-label"
                        style={{ color: strengthMeta.color, fontSize: "0.56rem", transition: "color 0.3s" }}
                      >
                        PASSPHRASE STRENGTH · {strengthMeta.label}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="pt-1">
              <GlowButton
                type="submit"
                fullWidth
                loading={loading}
                disabled={loading || !!message}
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    PROVISIONING WORKSPACE...
                  </>
                ) : message ? (
                  <>
                    <CheckCircle2 size={14} />
                    REDIRECTING TO LOGIN...
                  </>
                ) : (
                  <>
                    <Shield size={14} />
                    INITIALIZE WORKSPACE
                    <ArrowRight size={13} />
                  </>
                )}
              </GlowButton>
            </div>
          </form>

          {/* Terms */}
          <p
            className="mt-4 text-center font-mono-label leading-relaxed"
            style={{ color: "#0f1e30", fontSize: "0.53rem" }}
          >
            BY REGISTERING YOU ACCEPT THE{" "}
            <span style={{ color: "#1e2d47" }}>ENTERPRISE TERMS OF SERVICE</span>
            {" "}AND{" "}
            <span style={{ color: "#1e2d47" }}>PRIVACY FRAMEWORK</span>
          </p>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: "rgba(99,102,241,0.07)" }} />
            <span className="font-mono-label" style={{ color: "#141e30", fontSize: "0.55rem" }}>
              EXISTING OPERATIVE
            </span>
            <div className="h-px flex-1" style={{ background: "rgba(99,102,241,0.07)" }} />
          </div>

          {/* Login CTA */}
          <Link href="/login" className="block">
            <GlowButton variant="ghost" fullWidth>
              SIGN IN TO WORKSPACE
            </GlowButton>
          </Link>

          {/* Bottom metadata */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="h-1 w-1 rounded-full bg-emerald-700" />
              <span className="font-mono-label" style={{ color: "#0f1e30", fontSize: "0.54rem" }}>
                END-TO-END ENCRYPTED
              </span>
            </div>
            <span className="font-mono-label" style={{ color: "#0f1e30", fontSize: "0.54rem" }}>
              CONTRACT LENS © 2025
            </span>
          </div>
        </div>

        {/* Security badges */}
        <div className="mt-5">
          <SecurityBadge />
        </div>
      </motion.div>
    </AuthLayout>
  );
}
