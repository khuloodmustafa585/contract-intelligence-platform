"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Hexagon, Brain, Shield, Activity, Cpu, GitBranch } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
}

const CAPABILITIES = [
  { icon: Brain,     label: "NEURAL CONTRACT PARSING",    sub: "7-layer semantic extraction model"  },
  { icon: Shield,    label: "RISK INTELLIGENCE ENGINE",   sub: "Real-time clause threat scoring"    },
  { icon: Activity,  label: "OBLIGATION SURVEILLANCE",    sub: "Automated milestone enforcement"    },
  { icon: Cpu,       label: "PRECEDENT-AWARE REASONING",  sub: "100M+ legal document corpus"        },
  { icon: GitBranch, label: "VERSION DIFF ANALYSIS",      sub: "Redline intelligence layer"         },
];

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: "#040b1c" }}>

      {/* ── Ambient Background ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Primary indigo orb */}
        <motion.div
          animate={{ y: [0, -28, 0], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            top: "-15%",
            left: "40%",
            width: 700,
            height: 500,
            background: "radial-gradient(ellipse, rgba(99,102,241,0.16) 0%, transparent 70%)",
            filter: "blur(70px)",
          }}
        />
        {/* Cyan accent orb */}
        <motion.div
          animate={{ y: [0, 22, 0], opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          style={{
            position: "absolute",
            bottom: "5%",
            right: "10%",
            width: 450,
            height: 380,
            background: "radial-gradient(ellipse, rgba(34,211,238,0.1) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        {/* Deep base glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse 90% 60% at 60% 40%, rgba(49,46,129,0.1) 0%, transparent 70%)",
          }}
        />
        {/* Neural grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(99,102,241,0.028) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99,102,241,0.028) 1px, transparent 1px)
            `,
            backgroundSize: "72px 72px",
            maskImage: "radial-gradient(ellipse 95% 95% at 55% 50%, black 10%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 95% 95% at 55% 50%, black 10%, transparent 100%)",
          }}
        />
      </div>

      {/* ── Left Intelligence Panel ── */}
      <motion.aside
        initial={{ opacity: 0, x: -32 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex w-[460px] shrink-0 flex-col justify-between relative z-10"
        style={{
          background: "rgba(3, 8, 20, 0.97)",
          borderRight: "1px solid rgba(99,102,241,0.08)",
          padding: "48px 40px",
        }}
      >
        {/* Left panel inner ambient */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{
            background: "radial-gradient(ellipse 70% 50% at -10% 40%, rgba(99,102,241,0.09) 0%, transparent 60%)",
          }}
        />

        {/* Brand mark */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{
                  background: "linear-gradient(135deg, #5046e5 0%, #4338ca 100%)",
                  boxShadow: "0 0 40px rgba(99,102,241,0.55), inset 0 1px 0 rgba(255,255,255,0.12)",
                }}
              >
                <Hexagon size={21} className="text-white" fill="rgba(255,255,255,0.08)" strokeWidth={1.5} />
              </div>
              <div
                className="absolute inset-[-5px] rounded-[16px] animate-ping-slow"
                style={{ border: "1px solid rgba(99,102,241,0.3)" }}
              />
            </div>
            <div>
              <p className="font-bold text-sm tracking-[0.12em] uppercase" style={{ color: "#c7d2f8" }}>
                Contract Lens
              </p>
              <p className="font-mono-label" style={{ color: "#1e2d47", fontSize: "0.58rem" }}>
                INTELLIGENCE SUITE · BUILD 4.2.1
              </p>
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="relative z-10">
          <div className="mb-5 flex items-center gap-3">
            <div
              className="h-px w-10 shrink-0"
              style={{ background: "linear-gradient(90deg, rgba(99,102,241,0.7), rgba(34,211,238,0.4), transparent)" }}
            />
            <span className="font-mono-label" style={{ color: "#3a3a7c", fontSize: "0.58rem" }}>
              DIGITAL JURIST FRAMEWORK
            </span>
          </div>

          <h1
            className="text-[2.3rem] font-bold leading-[1.12] tracking-tight mb-5"
            style={{ color: "#dae2fd" }}
          >
            The AI Operating
            <br />
            System for{" "}
            <br />
            <span
              style={{
                background: "linear-gradient(90deg, #818cf8 0%, #22d3ee 65%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Legal Intelligence
            </span>
          </h1>

          <p
            className="text-sm leading-relaxed mb-8"
            style={{ color: "#1e2d47", maxWidth: "320px" }}
          >
            Enterprise contract intelligence powered by large legal language models.
            Analyze risk, extract obligations, enforce compliance — at scale.
          </p>

          {/* Capability nodes */}
          <div className="space-y-2.5">
            {CAPABILITIES.map(({ icon: Icon, label, sub }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.08, duration: 0.5, ease: "easeOut" }}
                className="flex items-start gap-3"
              >
                <div
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: "rgba(99,102,241,0.07)",
                    border: "1px solid rgba(99,102,241,0.15)",
                  }}
                >
                  <Icon size={12} style={{ color: "#5046e5" }} />
                </div>
                <div>
                  <p className="font-mono-label" style={{ color: "#4f5c78", fontSize: "0.6rem" }}>{label}</p>
                  <p className="text-xs" style={{ color: "#1a2538" }}>{sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom intel */}
        <div className="relative z-10 space-y-4">
          {/* Live status */}
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2.5"
            style={{
              background: "rgba(16,185,129,0.04)",
              border: "1px solid rgba(16,185,129,0.09)",
            }}
          >
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-mono-label" style={{ color: "#047857", fontSize: "0.57rem" }}>
              NEURAL ANALYSIS ACTIVE · 847 CONTRACTS PROCESSED TODAY
            </span>
          </div>

          {/* Quote */}
          <div
            className="rounded-xl p-4"
            style={{
              background: "rgba(99,102,241,0.04)",
              border: "1px solid rgba(99,102,241,0.08)",
            }}
          >
            <p className="text-xs italic leading-relaxed mb-3" style={{ color: "#2e3d5a" }}>
              "Reduced our contract review cycle from 14 days to 47 minutes.
              Contract Lens caught liability exposures our team had missed for years."
            </p>
            <div className="flex items-center gap-2">
              <div
                className="h-6 w-6 rounded-full shrink-0"
                style={{ background: "linear-gradient(135deg, #6366f1 0%, #22d3ee 100%)" }}
              />
              <div>
                <p className="text-xs font-semibold" style={{ color: "#64748b" }}>Sarah Chen</p>
                <p className="font-mono-label" style={{ color: "#1a2538", fontSize: "0.54rem" }}>
                  GENERAL COUNSEL · APEX CORP
                </p>
              </div>
            </div>
          </div>

          {/* Compliance row */}
          <div className="flex items-center gap-4 flex-wrap">
            {["SOC 2 TYPE II", "ISO 27001", "GDPR", "CCPA", "AES-256"].map((b) => (
              <span key={b} className="font-mono-label" style={{ color: "#141e30", fontSize: "0.54rem" }}>
                {b}
              </span>
            ))}
          </div>
        </div>
      </motion.aside>

      {/* ── Right Auth Slot ── */}
      <div className="flex flex-1 items-center justify-center relative z-10 px-6 py-10">
        {children}
      </div>
    </div>
  );
}
