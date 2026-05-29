"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle, CheckCircle2, Loader2, Mail, ShieldCheck,
} from "lucide-react";
import { verifyEmail, resendVerification } from "@/services/api";
import AuthLayout from "@/components/auth/AuthLayout";
import PremiumInput from "@/components/auth/PremiumInput";
import GlowButton from "@/components/auth/GlowButton";
import OtpInput from "@/components/auth/OtpInput";

const RESEND_COOLDOWN = 60;

function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at < 0) return email;
  const user = email.slice(0, at);
  const domain = email.slice(at);
  const visible = Math.min(2, user.length);
  return user.slice(0, visible) + "*".repeat(Math.max(0, user.length - visible)) + domain;
}

/* ─── Inner content (needs useSearchParams → must be inside Suspense) ─── */
function VerifyContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const emailParam   = searchParams.get("email") ?? "";

  const [email,         setEmail]         = useState(emailParam);
  const [code,          setCode]          = useState("");
  const [error,         setError]         = useState("");
  const [success,       setSuccess]       = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg,     setResendMsg]     = useState("");
  const [cooldown,      setCooldown]      = useState(0);

  // Count down the resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const canSubmit = email.trim().length > 0 && code.length === 6 && !loading && !success;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    setResendMsg("");
    try {
      await verifyEmail({ email: email.trim().toLowerCase(), code });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Verification failed. Please check your code and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0 || resendLoading || !email.trim()) return;
    setResendLoading(true);
    setError("");
    setResendMsg("");
    try {
      await resendVerification({ email: email.trim().toLowerCase() });
      setResendMsg("A new code has been sent to your email.");
      setCooldown(RESEND_COOLDOWN);
      setCode("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to resend. Please try again."
      );
    } finally {
      setResendLoading(false);
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
          <div className="mb-9 flex items-center gap-3">
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
              className="text-sm font-semibold tracking-wide"
              style={{ color: "#c7d2f8" }}
            >
              Contract Lens
            </span>
          </div>

          {/* Mail icon badge */}
          <motion.div
            animate={success ? { scale: [1, 1.12, 1] } : {}}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              background: success
                ? "rgba(16,185,129,0.10)"
                : "rgba(99,102,241,0.08)",
              border: `1px solid ${
                success ? "rgba(16,185,129,0.22)" : "rgba(99,102,241,0.18)"
              }`,
              transition: "background 0.4s, border-color 0.4s",
            }}
          >
            {success ? (
              <ShieldCheck size={24} style={{ color: "#34d399" }} />
            ) : (
              <Mail size={24} style={{ color: "#818cf8" }} />
            )}
          </motion.div>

          {/* Header */}
          <div className="mb-8">
            <h1
              className="font-bold leading-tight mb-2.5"
              style={{ color: "#dae2fd", fontSize: "1.75rem" }}
            >
              Verify Your{" "}
              <span
                style={{
                  background: "linear-gradient(90deg, #818cf8 0%, #22d3ee 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Email
              </span>
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "#4f6080" }}>
              {emailParam ? (
                <>
                  Enter the 6-digit code sent to{" "}
                  <span style={{ color: "#6b7fa0", fontWeight: 500 }}>
                    {maskEmail(emailParam)}
                  </span>
                  .
                </>
              ) : (
                "Enter your email address and the 6-digit verification code we sent you."
              )}
            </p>
          </div>

          {/* Success banner */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.22 }}
                className="flex items-center gap-2.5 overflow-hidden rounded-xl px-4 py-3.5 text-sm"
                style={{
                  background: "rgba(16,185,129,0.06)",
                  border: "1px solid rgba(16,185,129,0.2)",
                  color: "#34d399",
                }}
              >
                <CheckCircle2 size={16} className="shrink-0" />
                Email verified! Redirecting to sign in&hellip;
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

          {/* Resend success banner */}
          <AnimatePresence>
            {resendMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.22 }}
                className="flex items-center gap-2.5 overflow-hidden rounded-xl px-4 py-3.5 text-sm"
                style={{
                  background: "rgba(16,185,129,0.06)",
                  border: "1px solid rgba(16,185,129,0.2)",
                  color: "#34d399",
                }}
              >
                <CheckCircle2 size={16} className="shrink-0" />
                {resendMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={submit} className="space-y-6">
            {/* Email field — only shown when not supplied via query param */}
            {!emailParam && (
              <PremiumInput
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@lawfirm.com"
                icon={<Mail size={15} />}
                disabled={loading || success}
              />
            )}

            {/* OTP code field */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "12px",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  color: "#4f6080",
                }}
              >
                Verification Code
              </label>
              <OtpInput
                length={6}
                value={code}
                onChange={setCode}
                disabled={loading || success}
                autoFocus
              />
              <p
                className="mt-2.5 text-xs"
                style={{ color: "#2e3d5a" }}
              >
                Code expires in 10&nbsp;minutes.
              </p>
            </div>

            {/* Submit button */}
            <div style={{ paddingTop: "2px" }}>
              <GlowButton
                type="submit"
                fullWidth
                loading={loading}
                disabled={!canSubmit}
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Verifying&hellip;
                  </>
                ) : success ? (
                  <>
                    <CheckCircle2 size={15} />
                    Verified!
                  </>
                ) : (
                  "Verify Email"
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
          </div>

          {/* Resend section */}
          <p className="text-center text-sm" style={{ color: "#4f6080" }}>
            Didn&apos;t receive the email?{" "}
            {cooldown > 0 ? (
              <span style={{ color: "#3a5070" }}>
                Resend in{" "}
                <span style={{ color: "#4f6080", fontVariantNumeric: "tabular-nums" }}>
                  {cooldown}s
                </span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading || !email.trim() || success}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: resendLoading || !email.trim() || success ? "not-allowed" : "pointer",
                  color: resendLoading || !email.trim() || success ? "#3a5070" : "#818cf8",
                  fontWeight: 500,
                  fontSize: "inherit",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  transition: "opacity 0.2s",
                  opacity: resendLoading || !email.trim() || success ? 0.5 : 1,
                }}
                className="hover:opacity-75"
              >
                {resendLoading ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Sending&hellip;
                  </>
                ) : (
                  "Resend verification code"
                )}
              </button>
            )}
          </p>

          {/* Sign-in link */}
          <p
            className="text-center text-sm"
            style={{ color: "#4f6080", marginTop: "12px" }}
          >
            Already verified?{" "}
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

/* ─── Page export — wraps content in Suspense for useSearchParams ─── */
export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  );
}
