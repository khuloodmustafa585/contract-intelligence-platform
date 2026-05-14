"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogIn, Eye, EyeOff, Loader2, AlertCircle,
  Mail, Lock, ArrowRight, Fingerprint, Wifi, Hexagon,
} from "lucide-react";
import { loginUser } from "@/services/api";
import AuthLayout from "@/components/auth/AuthLayout";
import PremiumInput from "@/components/auth/PremiumInput";
import GlowButton from "@/components/auth/GlowButton";
import SecurityBadge from "@/components/auth/SecurityBadge";

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
        err instanceof Error
          ? err.message
          : "Authentication failed. Verify credentials and retry."
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
        {/* Secure connection status bar */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="mb-4 flex items-center justify-between rounded-lg px-3.5 py-2"
          style={{
            background: "rgba(16,185,129,0.04)",
            border: "1px solid rgba(16,185,129,0.1)",
          }}
        >
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-mono-label" style={{ color: "#059669", fontSize: "0.57rem" }}>
              SECURE SESSION ESTABLISHED
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wifi size={9} style={{ color: "#1a2538" }} />
            <span className="font-mono-label" style={{ color: "#1a2538", fontSize: "0.54rem" }}>
              TLS 1.3
            </span>
          </div>
        </motion.div>

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
              "0 0 80px rgba(99,102,241,0.07)",
              "inset 0 1px 0 rgba(255,255,255,0.04)",
              "inset 0 -1px 0 rgba(0,0,0,0.3)",
            ].join(", "),
            padding: "36px",
          }}
        >
          {/* Top gradient accent line */}
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.85) 30%, rgba(34,211,238,0.65) 65%, transparent 100%)",
            }}
          />

          {/* Corner ambient glow */}
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
              filter: "blur(24px)",
            }}
          />
          <div
            className="pointer-events-none absolute -bottom-12 -left-8 h-28 w-28 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />

          {/* Mobile brand */}
          <div className="lg:hidden mb-7 flex items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: "linear-gradient(135deg, #5046e5 0%, #4338ca 100%)",
                boxShadow: "0 0 28px rgba(99,102,241,0.5)",
              }}
            >
              <Hexagon size={18} className="text-white" fill="rgba(255,255,255,0.08)" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-bold tracking-[0.1em] uppercase" style={{ color: "#c7d2f8" }}>
                Contract Lens
              </p>
              <p className="font-mono-label" style={{ color: "#1e2d47", fontSize: "0.56rem" }}>
                INTELLIGENCE SUITE
              </p>
            </div>
          </div>

          {/* Card header */}
          <div className="mb-7 flex items-start justify-between gap-4">
            <div>
              <p className="font-mono-label mb-2" style={{ color: "#1a2538", fontSize: "0.57rem" }}>
                SECURE SESSION · ENCRYPTED · AUTH MODULE 4.2
              </p>
              <h2 className="text-[1.6rem] font-bold leading-tight" style={{ color: "#dae2fd" }}>
                Welcome back,{" "}
                <span
                  style={{
                    background: "linear-gradient(90deg, #818cf8 0%, #22d3ee 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Counselor
                </span>
              </h2>
              <p className="mt-1.5 text-sm" style={{ color: "#1e2d47" }}>
                Authenticate to access your intelligence workspace
              </p>
            </div>
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: "rgba(99,102,241,0.07)",
                border: "1px solid rgba(99,102,241,0.14)",
                boxShadow: "0 0 20px rgba(99,102,241,0.1)",
              }}
            >
              <Fingerprint size={20} style={{ color: "#5046e5" }} />
            </div>
          </div>

          {/* Error toast */}
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
              label="IDENTITY · WORK EMAIL"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="agent@lawfirm.com"
              icon={<Mail size={14} />}
            />

            <div>
              <PremiumInput
                label="CREDENTIAL · PASSPHRASE"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
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
              <div className="mt-2.5 flex justify-end">
                <Link
                  href="/forgot-password"
                  className="font-mono-label transition-colors hover:text-[#5046e5]"
                  style={{ color: "#1a2538", fontSize: "0.58rem" }}
                >
                  RECOVER ACCESS →
                </Link>
              </div>
            </div>

            <div className="pt-1">
              <GlowButton type="submit" fullWidth loading={loading} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    AUTHENTICATING...
                  </>
                ) : (
                  <>
                    <LogIn size={14} />
                    INITIATE SESSION
                    <ArrowRight size={13} />
                  </>
                )}
              </GlowButton>
            </div>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: "rgba(99,102,241,0.07)" }} />
            <span className="font-mono-label" style={{ color: "#141e30", fontSize: "0.55rem" }}>
              NEW OPERATIVE
            </span>
            <div className="h-px flex-1" style={{ background: "rgba(99,102,241,0.07)" }} />
          </div>

          {/* Register CTA */}
          <Link href="/signup" className="block">
            <GlowButton variant="ghost" fullWidth>
              REQUEST WORKSPACE ACCESS
            </GlowButton>
          </Link>

          {/* Bottom session metadata */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="h-1 w-1 rounded-full bg-emerald-600" />
              <span className="font-mono-label" style={{ color: "#0f1e30", fontSize: "0.54rem" }}>
                END-TO-END ENCRYPTED
              </span>
            </div>
            <span className="font-mono-label" style={{ color: "#0f1e30", fontSize: "0.54rem" }}>
              CONTRACT LENS © 2025
            </span>
          </div>
        </div>

        {/* Security badges below card */}
        <div className="mt-5">
          <SecurityBadge />
        </div>
      </motion.div>
    </AuthLayout>
  );
}
