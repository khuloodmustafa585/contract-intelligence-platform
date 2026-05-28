"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  ShieldAlert,
  BookOpen,
  Sparkles,
  ClipboardList,
  Bot,
  ArrowRight,
  CheckCircle2,
  Zap,
} from "lucide-react";

/* ─── Feature cards ──────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: FileText,
    title: "AI Contract Analysis",
    description:
      "Extract clauses, obligations, and key terms instantly. Full document intelligence in seconds, not hours.",
    color: "#818cf8",
    bg: "rgba(99,102,241,0.07)",
    border: "rgba(99,102,241,0.18)",
    glow: "rgba(99,102,241,0.12)",
  },
  {
    icon: ShieldAlert,
    title: "Risk Detection",
    description:
      "Automatically identify high-risk clauses and legal exposure before they become costly problems.",
    color: "#f87171",
    bg: "rgba(239,68,68,0.07)",
    border: "rgba(239,68,68,0.18)",
    glow: "rgba(239,68,68,0.10)",
  },
  {
    icon: BookOpen,
    title: "Clause Intelligence",
    description:
      "Search, compare, and understand clauses across your entire portfolio in plain language.",
    color: "#22d3ee",
    bg: "rgba(34,211,238,0.07)",
    border: "rgba(34,211,238,0.16)",
    glow: "rgba(34,211,238,0.10)",
  },
  {
    icon: Sparkles,
    title: "AI Summaries",
    description:
      "Get concise, structured summaries of complex legal documents — ready for executives and counsel alike.",
    color: "#a78bfa",
    bg: "rgba(139,92,246,0.07)",
    border: "rgba(139,92,246,0.18)",
    glow: "rgba(139,92,246,0.10)",
  },
  {
    icon: Bot,
    title: "Ask AI",
    description:
      "Ask natural language questions and get precise answers grounded in exact clause text — never hallucinated.",
    color: "#818cf8",
    bg: "rgba(99,102,241,0.07)",
    border: "rgba(99,102,241,0.16)",
    glow: "rgba(99,102,241,0.10)",
  },
  {
    icon: ClipboardList,
    title: "Obligation Tracking",
    description:
      "Auto-extract and monitor all obligations, deadlines, and action items across your contract portfolio.",
    color: "#fbbf24",
    bg: "rgba(245,158,11,0.07)",
    border: "rgba(245,158,11,0.18)",
    glow: "rgba(245,158,11,0.10)",
  },
];

const STATS = [
  { value: "10×",   label: "Faster contract review" },
  { value: "99%",   label: "Clause extraction accuracy" },
  { value: "< 30s", label: "Full document analysis" },
];

const COMPLIANCE = ["SOC 2 Type II", "ISO 27001", "AES-256", "GDPR Compliant"];

/* ─── Reusable entrance animation ────────────────────────────────── */
function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const, delay },
  };
}

/* ─── Styled link buttons (avoids invalid <a><button> nesting) ───── */
function PrimaryLink({
  href,
  children,
  size = "md",
}: {
  href: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const [hovered, setHovered] = useState(false);
  const pad =
    size === "lg" ? "15px 32px" : size === "sm" ? "8px 18px" : "13px 26px";
  const fs = size === "lg" ? "0.95rem" : size === "sm" ? "0.82rem" : "0.88rem";
  return (
    <motion.div
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.975 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
    >
      <Link
        href={href}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: pad,
          borderRadius: "12px",
          background: "linear-gradient(135deg, #5046e5 0%, #4338ca 55%, #3730a3 100%)",
          color: "#dde5ff",
          fontSize: fs,
          fontWeight: 600,
          textDecoration: "none",
          border: "1px solid rgba(129,140,248,0.22)",
          boxShadow: hovered
            ? "0 0 52px rgba(99,102,241,0.55), 0 0 100px rgba(99,102,241,0.16), 0 6px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12)"
            : "0 0 28px rgba(99,102,241,0.30), 0 4px 18px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
          transition: "box-shadow 0.25s ease",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Shimmer sweep */}
        <motion.span
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.07) 50%, transparent 100%)",
            pointerEvents: "none",
          }}
          initial={{ x: "-100%" }}
          animate={{ x: hovered ? "200%" : "-100%" }}
          transition={{ duration: 0.55, ease: "easeInOut" }}
        />
        {children}
      </Link>
    </motion.div>
  );
}

function GhostLink({
  href,
  children,
  size = "md",
}: {
  href: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const [hovered, setHovered] = useState(false);
  const pad =
    size === "lg" ? "15px 32px" : size === "sm" ? "8px 18px" : "13px 26px";
  const fs = size === "lg" ? "0.95rem" : size === "sm" ? "0.82rem" : "0.88rem";
  return (
    <motion.div
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.975 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
    >
      <Link
        href={href}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: pad,
          borderRadius: "12px",
          background: "rgba(7,12,26,0.80)",
          color: hovered ? "#94a3b8" : "#4f6080",
          fontSize: fs,
          fontWeight: 600,
          textDecoration: "none",
          border: `1px solid ${hovered ? "rgba(99,102,241,0.28)" : "rgba(99,102,241,0.12)"}`,
          transition: "border-color 0.2s, color 0.2s",
        }}
      >
        {children}
      </Link>
    </motion.div>
  );
}

/* ─── Brand mark (same SVG as auth pages) ────────────────────────── */
function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${size * 0.28}px`,
        background: "linear-gradient(135deg, #5046e5 0%, #4338ca 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 0 22px rgba(99,102,241,0.45)",
      }}
    >
      <svg
        width={size * 0.44}
        height={size * 0.44}
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
  );
}

/* ─── Page ───────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div
      style={{
        background: "#040b1c",
        minHeight: "100vh",
        overflowX: "hidden",
      }}
    >
      {/* ── Ambient background ─────────────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          overflow: "hidden",
        }}
      >
        {/* Primary indigo glow */}
        <motion.div
          animate={{ y: [0, -32, 0], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            top: "-12%",
            left: "28%",
            width: 900,
            height: 640,
            background:
              "radial-gradient(ellipse, rgba(99,102,241,0.20) 0%, transparent 70%)",
            filter: "blur(90px)",
          }}
        />
        {/* Cyan accent glow */}
        <motion.div
          animate={{ y: [0, 26, 0], opacity: [0.14, 0.28, 0.14] }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5,
          }}
          style={{
            position: "absolute",
            bottom: "8%",
            right: "6%",
            width: 560,
            height: 420,
            background:
              "radial-gradient(ellipse, rgba(34,211,238,0.11) 0%, transparent 70%)",
            filter: "blur(75px)",
          }}
        />
        {/* Bottom purple glow */}
        <motion.div
          animate={{ x: [0, 22, 0], opacity: [0.10, 0.20, 0.10] }}
          transition={{
            duration: 19,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 9,
          }}
          style={{
            position: "absolute",
            bottom: "-4%",
            left: "8%",
            width: 640,
            height: 440,
            background:
              "radial-gradient(ellipse, rgba(139,92,246,0.13) 0%, transparent 70%)",
            filter: "blur(85px)",
          }}
        />
        {/* Subtle grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(99,102,241,0.022) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99,102,241,0.022) 1px, transparent 1px)
            `,
            backgroundSize: "72px 72px",
            maskImage:
              "radial-gradient(ellipse 80% 70% at 50% 20%, black 10%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 70% at 50% 20%, black 10%, transparent 100%)",
          }}
        />
      </div>

      {/* ── Navigation ─────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(4,11,28,0.85)",
          backdropFilter: "blur(28px) saturate(160%)",
          WebkitBackdropFilter: "blur(28px) saturate(160%)",
          borderBottom: "1px solid rgba(99,102,241,0.10)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 40px",
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
            <BrandMark size={30} />
            <span
              style={{
                fontSize: "0.95rem",
                fontWeight: 700,
                color: "#c7d2f8",
                letterSpacing: "-0.01em",
              }}
            >
              Contract Lens
            </span>
          </div>

          {/* Nav actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <GhostLink href="/login" size="sm">
              Sign In
            </GhostLink>
            <PrimaryLink href="/signup" size="sm">
              Get Started
            </PrimaryLink>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          paddingTop: "96px",
          paddingBottom: "72px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 40px",
          }}
        >
          {/* Eyebrow badge */}
          <motion.div
            {...fadeUp(0)}
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "28px",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "6px 16px",
                borderRadius: "999px",
                background: "rgba(99,102,241,0.10)",
                border: "1px solid rgba(99,102,241,0.24)",
              }}
            >
              <Zap size={11} style={{ color: "#818cf8" }} />
              <span
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 600,
                  color: "#818cf8",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  fontFamily: "var(--font-mono, monospace)",
                }}
              >
                AI-Powered Legal Intelligence
              </span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            {...fadeUp(0.08)}
            style={{
              fontSize: "clamp(2.4rem, 5.5vw, 4.4rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.035em",
              color: "#dae2fd",
              margin: "0 auto 22px",
              maxWidth: "860px",
            }}
          >
            Transform Contracts Into{" "}
            <span
              style={{
                background:
                  "linear-gradient(90deg, #818cf8 0%, #22d3ee 55%, #a78bfa 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Intelligent Insights
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            {...fadeUp(0.14)}
            style={{
              fontSize: "1.05rem",
              lineHeight: 1.75,
              color: "#4f6080",
              maxWidth: "540px",
              margin: "0 auto 48px",
            }}
          >
            AI-powered contract analysis, risk detection, clause extraction, and
            legal intelligence — built for modern legal teams.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            {...fadeUp(0.2)}
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <PrimaryLink href="/signup" size="lg">
              Get Started Free
              <ArrowRight size={15} />
            </PrimaryLink>
            <GhostLink href="/login" size="lg">
              Sign In
            </GhostLink>
          </motion.div>

          {/* Trust micro-copy */}
          <motion.p
            {...fadeUp(0.26)}
            style={{
              marginTop: "22px",
              fontSize: "0.72rem",
              color: "#2e3d5a",
              letterSpacing: "0.01em",
            }}
          >
            No credit card required · Enterprise-grade security · Set up in minutes
          </motion.p>
        </div>
      </section>

      {/* ── Stats bar ──────────────────────────────────────────────── */}
      <motion.section
        {...fadeUp(0.30)}
        style={{
          position: "relative",
          zIndex: 1,
          padding: "0 40px 88px",
        }}
      >
        <div
          style={{
            maxWidth: "760px",
            margin: "0 auto",
          }}
        >
          <div
            className="grid grid-cols-1 sm:grid-cols-3"
            style={{
              gap: "1px",
              borderRadius: "20px",
              overflow: "hidden",
              background: "rgba(99,102,241,0.10)",
              border: "1px solid rgba(99,102,241,0.14)",
            }}
          >
            {STATS.map(({ value, label }) => (
              <div
                key={label}
                style={{
                  padding: "30px 24px",
                  textAlign: "center",
                  background: "rgba(6,11,24,0.92)",
                }}
              >
                <p
                  style={{
                    fontSize: "2.1rem",
                    fontWeight: 800,
                    fontFamily: "var(--font-mono, monospace)",
                    background:
                      "linear-gradient(135deg, #818cf8 0%, #22d3ee 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    marginBottom: "6px",
                    lineHeight: 1,
                  }}
                >
                  {value}
                </p>
                <p
                  style={{
                    fontSize: "0.78rem",
                    color: "#4f6080",
                    lineHeight: 1.5,
                  }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── Features ───────────────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          padding: "0 40px 96px",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {/* Section header */}
          <motion.div
            {...fadeUp(0)}
            style={{ textAlign: "center", marginBottom: "56px" }}
          >
            <p
              style={{
                fontSize: "0.62rem",
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#6366f1",
                fontFamily: "var(--font-mono, monospace)",
                marginBottom: "14px",
              }}
            >
              Platform Capabilities
            </p>
            <h2
              style={{
                fontSize: "clamp(1.65rem, 3vw, 2.5rem)",
                fontWeight: 700,
                color: "#dae2fd",
                letterSpacing: "-0.025em",
                marginBottom: "14px",
                lineHeight: 1.2,
              }}
            >
              Everything your legal team needs
            </h2>
            <p
              style={{
                fontSize: "0.92rem",
                color: "#4f6080",
                maxWidth: "440px",
                margin: "0 auto",
                lineHeight: 1.7,
              }}
            >
              One platform to analyze, understand, and manage your entire
              contract portfolio.
            </p>
          </motion.div>

          {/* Feature grid */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            style={{ gap: "16px" }}
          >
            {FEATURES.map(
              ({ icon: Icon, title, description, color, bg, border, glow }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.52,
                    ease: [0.22, 1, 0.36, 1],
                    delay: 0.06 + i * 0.07,
                  }}
                  whileHover={{ y: -3, transition: { duration: 0.18 } }}
                  style={{
                    padding: "28px 28px 26px",
                    borderRadius: "20px",
                    background: "rgba(6,11,24,0.88)",
                    border: `1px solid ${border}`,
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    position: "relative",
                    overflow: "hidden",
                    cursor: "default",
                  }}
                >
                  {/* Corner ambient glow */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: "-28px",
                      right: "-28px",
                      width: "130px",
                      height: "130px",
                      borderRadius: "50%",
                      background: glow,
                      filter: "blur(45px)",
                      pointerEvents: "none",
                    }}
                  />

                  {/* Icon chip */}
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "13px",
                      background: bg,
                      border: `1px solid ${border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "20px",
                      position: "relative",
                    }}
                  >
                    <Icon size={18} style={{ color }} />
                  </div>

                  <h3
                    style={{
                      fontSize: "0.92rem",
                      fontWeight: 600,
                      color: "#dae2fd",
                      marginBottom: "9px",
                      lineHeight: 1.3,
                      position: "relative",
                    }}
                  >
                    {title}
                  </h3>
                  <p
                    style={{
                      fontSize: "0.78rem",
                      color: "#4f6080",
                      lineHeight: 1.75,
                      position: "relative",
                    }}
                  >
                    {description}
                  </p>
                </motion.div>
              )
            )}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA card ────────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          padding: "0 40px 88px",
        }}
      >
        <motion.div
          {...fadeUp(0)}
          style={{
            maxWidth: "720px",
            margin: "0 auto",
            textAlign: "center",
            padding: "64px 48px 56px",
            borderRadius: "24px",
            background: "rgba(6,11,24,0.92)",
            border: "1px solid rgba(99,102,241,0.18)",
            backdropFilter: "blur(40px) saturate(160%)",
            WebkitBackdropFilter: "blur(40px) saturate(160%)",
            boxShadow: [
              "0 0 0 1px rgba(99,102,241,0.04)",
              "0 40px 100px rgba(0,0,0,0.55)",
              "0 0 80px rgba(99,102,241,0.06)",
              "inset 0 1px 0 rgba(255,255,255,0.04)",
            ].join(", "),
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Top accent line */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "1px",
              background:
                "linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.7) 30%, rgba(34,211,238,0.5) 70%, transparent 100%)",
            }}
          />

          {/* Trust checks */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "28px",
              marginBottom: "32px",
              flexWrap: "wrap",
            }}
          >
            {["No credit card required", "Enterprise security", "Set up in minutes"].map(
              (item) => (
                <div
                  key={item}
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <CheckCircle2
                    size={13}
                    style={{ color: "#34d399", flexShrink: 0 }}
                  />
                  <span style={{ fontSize: "0.75rem", color: "#4f6080" }}>
                    {item}
                  </span>
                </div>
              )
            )}
          </div>

          <h2
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
              fontWeight: 700,
              color: "#dae2fd",
              letterSpacing: "-0.025em",
              marginBottom: "14px",
              lineHeight: 1.2,
            }}
          >
            Start analyzing contracts{" "}
            <span
              style={{
                background:
                  "linear-gradient(90deg, #818cf8 0%, #22d3ee 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              today
            </span>
          </h2>

          <p
            style={{
              fontSize: "0.88rem",
              color: "#4f6080",
              lineHeight: 1.75,
              maxWidth: "400px",
              margin: "0 auto 40px",
            }}
          >
            Join legal teams using Contract Lens to cut review time, detect risk
            faster, and never miss a deadline.
          </p>

          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <PrimaryLink href="/signup" size="lg">
              Create Free Account
              <ArrowRight size={15} />
            </PrimaryLink>
            <GhostLink href="/login" size="lg">
              Sign In
            </GhostLink>
          </div>

          <p
            style={{
              marginTop: "24px",
              fontSize: "0.72rem",
              color: "#2e3d5a",
            }}
          >
            Already have an account?{" "}
            <Link
              href="/login"
              style={{ color: "#818cf8", textDecoration: "none" }}
            >
              Sign in here
            </Link>
          </p>
        </motion.div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer
        style={{
          position: "relative",
          zIndex: 1,
          borderTop: "1px solid rgba(99,102,241,0.08)",
          padding: "28px 40px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <BrandMark size={22} />
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#2e3d5a" }}>
              Contract Lens
            </span>
            <span style={{ color: "#1a2540", fontSize: "0.78rem" }}>
              · {new Date().getFullYear()}
            </span>
          </div>

          {/* Compliance badges */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >
            {COMPLIANCE.map((b) => (
              <span
                key={b}
                style={{
                  fontSize: "0.59rem",
                  color: "#1a2540",
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {b}
              </span>
            ))}
          </div>

          {/* Links */}
          <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
            <Link
              href="/login"
              style={{ fontSize: "0.78rem", color: "#2e3d5a", textDecoration: "none" }}
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              style={{ fontSize: "0.78rem", color: "#2e3d5a", textDecoration: "none" }}
            >
              Sign Up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
