"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, EyeOff, Loader2, AlertCircle, Mail, Lock,
} from "lucide-react";
import { loginUser } from "@/services/api";
import AuthLayout from "@/components/auth/AuthLayout";
import PremiumInput from "@/components/auth/PremiumInput";
import GlowButton from "@/components/auth/GlowButton";

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showPw,   setShowPw]   = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await loginUser({ email, password });
      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid credentials. Please try again."
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
                "linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.7) 30%, rgba(34,211,238,0.5) 65%, transparent 100%)",
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

          {/* Header */}
          <div className="mb-8">
            <h1
              className="font-bold leading-tight mb-2.5"
              style={{ color: "#dae2fd", fontSize: "1.75rem" }}
            >
              Welcome{" "}
              <span
                style={{
                  background: "linear-gradient(90deg, #818cf8 0%, #22d3ee 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                back
              </span>
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "#4f6080" }}>
              Sign in to your workspace to continue.
            </p>
          </div>

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
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@lawfirm.com"
              icon={<Mail size={15} />}
            />

            <div>
              <PremiumInput
                label="Password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
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

              {/* Forgot password */}
              <div className="mt-3 flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium transition-opacity hover:opacity-75"
                  style={{ color: "#4f6080" }}
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <div style={{ paddingTop: "2px" }}>
              <GlowButton type="submit" fullWidth loading={loading} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
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

          {/* Create account link */}
          <p className="text-center text-sm" style={{ color: "#4f6080" }}>
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium transition-opacity hover:opacity-75"
              style={{ color: "#818cf8" }}
            >
              Create account
            </Link>
          </p>
        </div>
      </motion.div>
    </AuthLayout>
  );
}
