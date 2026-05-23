"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, EyeOff, Loader2, AlertCircle, CheckCircle2,
  User, Mail, Lock,
} from "lucide-react";
import { registerUser } from "@/services/api";
import AuthLayout from "@/components/auth/AuthLayout";
import PremiumInput from "@/components/auth/PremiumInput";
import GlowButton from "@/components/auth/GlowButton";

const STRENGTH_META = [
  { label: "",       color: "#1e2d47" },
  { label: "Weak",   color: "#ef4444" },
  { label: "Fair",   color: "#f59e0b" },
  { label: "Good",   color: "#22d3ee" },
  { label: "Strong", color: "#10b981" },
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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const strength     = passwordStrength(form.password);
  const strengthMeta = STRENGTH_META[strength];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await registerUser(form);
      setMessage("Account created. Check your email to verify before signing in.");
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
        style={{ width: "100%", maxWidth: "540px" }}
      >
        {/* Glass card */}
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{
            background: "rgba(6, 11, 24, 0.92)",
            backdropFilter: "blur(40px) saturate(180%)",
            WebkitBackdropFilter: "blur(40px) saturate(180%)",
            border: "1px solid rgba(99,102,241,0.15)",
            boxShadow: [
              "0 0 0 1px rgba(99,102,241,0.04)",
              "0 40px 100px rgba(0,0,0,0.7)",
              "0 0 80px rgba(99,102,241,0.07)",
              "inset 0 1px 0 rgba(255,255,255,0.05)",
            ].join(", "),
            padding: "52px 48px 48px",
          }}
        >
          {/* Top accent line */}
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.5) 30%, rgba(99,102,241,0.7) 65%, transparent 100%)",
            }}
          />

          {/* Brand */}
          <div className="mb-12 flex items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{
                background: "linear-gradient(135deg, #5046e5 0%, #4338ca 100%)",
                boxShadow: "0 0 24px rgba(99,102,241,0.5)",
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span
              className="text-2xl font-semibold tracking-wide"
              style={{ color: "#c7d2f8" }}
            >
              Contract Lens
            </span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1
              className="font-bold leading-tight mb-2.5"
              style={{ color: "#dae2fd", fontSize: "1.25rem" }}
            >
              Create Your{" "}
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
            <p className="text-sm leading-relaxed" style={{ color: "#4f6080" }}>
              AI-powered legal intelligence, built for your team.
            </p>
          </div>

          {/* Success banner */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.22 }}
                className="flex items-start gap-2.5 overflow-hidden rounded-xl px-4 py-3.5 text-sm"
                style={{
                  background: "rgba(16,185,129,0.06)",
                  border: "1px solid rgba(16,185,129,0.2)",
                  color: "#34d399",
                }}
              >
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                {message}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.22 }}
                className="flex items-center gap-2.5 overflow-hidden rounded-xl px-4 py-3.5 text-sm"
                style={{
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.18)",
                  color: "#f87171",
                }}
              >
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={submit} className="space-y-6">
            <PremiumInput
              label="Full Name"
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
              autoComplete="name"
              placeholder="Jane Smith"
              icon={<User size={15} />}
            />

            <PremiumInput
              label="Work Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
              placeholder="jane@lawfirm.com"
              icon={<Mail size={15} />}
            />

            {/* Password + strength */}
            <div>
              <PremiumInput
                label="Password"
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                icon={<Lock size={15} />}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="transition-opacity hover:opacity-70"
                    style={{ display: "flex", alignItems: "center" }}
                  >
                    {showPw
                      ? <EyeOff size={15} style={{ color: "#4f6080" }} />
                      : <Eye size={15} style={{ color: "#4f6080" }} />}
                  </button>
                }
              />

              <AnimatePresence>
                {form.password.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                    style={{ marginTop: "10px" }}
                  >
                    <div className="flex gap-1.5 mb-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-0.5 flex-1 rounded-full"
                          style={{
                            background: i <= strength ? strengthMeta.color : "rgba(99,102,241,0.1)",
                            transition: "background 0.3s ease",
                          }}
                        />
                      ))}
                    </div>
                    {strength > 0 && (
                      <p
                        className="text-xs"
                        style={{ color: strengthMeta.color, transition: "color 0.3s" }}
                      >
                        {strengthMeta.label} password
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <PremiumInput
              label="Confirm Password"
              type={showConfirmPw ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Re-enter your password"
              icon={<Lock size={15} />}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowConfirmPw((v) => !v)}
                  className="transition-opacity hover:opacity-70"
                  style={{ display: "flex", alignItems: "center" }}
                >
                  {showConfirmPw
                    ? <EyeOff size={15} style={{ color: "#4f6080" }} />
                    : <Eye size={15} style={{ color: "#4f6080" }} />}
                </button>
              }
            />

            <div style={{ paddingTop: "6px" }}>
              <GlowButton
                type="submit"
                fullWidth
                loading={loading}
                disabled={loading || !!message}
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Creating account...
                  </>
                ) : message ? (
                  <>
                    <CheckCircle2 size={15} />
                    Redirecting...
                  </>
                ) : (
                  "Create Account"
                )}
              </GlowButton>
            </div>
          </form>

          {/* Divider */}
          <div
            className="flex items-center gap-3"
            style={{ marginTop: "28px", marginBottom: "20px" }}
          >
            <div className="h-px flex-1" style={{ background: "rgba(99,102,241,0.1)" }} />
            <span className="text-xs" style={{ color: "#2e3d5a" }}>or</span>
            <div className="h-px flex-1" style={{ background: "rgba(99,102,241,0.1)" }} />
          </div>

          {/* Sign in link */}
          <p className="text-center text-sm" style={{ color: "#4f6080" }}>
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium transition-opacity hover:opacity-75"
              style={{ color: "#818cf8" }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </AuthLayout>
  );
}
