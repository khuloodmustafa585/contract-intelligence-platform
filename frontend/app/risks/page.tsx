"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  BarChart2,
  Flag,
  Shield,
  Scale,
  Upload,
  TrendingDown,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import RiskBadge from "@/components/ui/RiskBadge";
import MetricCard from "@/components/ui/MetricCard";
import { api, Risk } from "@/services/api";

/* ─── Shared card style ──────────────────────────────────────────── */
const CARD: React.CSSProperties = {
  background:           "rgba(10, 20, 38, 0.65)",
  border:               "1px solid rgba(255,255,255,0.06)",
  boxShadow:            "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
  borderRadius:         "20px",
  backdropFilter:       "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  overflow:             "hidden",
};

const DIVIDER: React.CSSProperties = {
  borderBottom: "1px solid rgba(255,255,255,0.05)",
};

/* ─── Fade animation ─────────────────────────────────────────────── */
function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Filters ────────────────────────────────────────────────────── */
const FILTERS = [
  { id: "all",        label: "All Risks"    },
  { id: "high",       label: "High Risk"    },
  { id: "compliance", label: "Compliance"   },
  { id: "expiring",   label: "Expiring"     },
  { id: "review",     label: "Needs Review" },
];

/* ─── Helpers ────────────────────────────────────────────────────── */
function deriveStatus(severity: string): { label: string; color: string; bg: string } {
  const s = severity?.toLowerCase() ?? "";
  if (s === "critical" || s === "high")
    return { label: "Flagged",      color: "#f87171", bg: "rgba(239,68,68,0.1)"   };
  if (s === "medium" || s === "moderate")
    return { label: "Needs Review", color: "#fbbf24", bg: "rgba(245,158,11,0.1)"  };
  return   { label: "Monitored",   color: "#34d399", bg: "rgba(16,185,129,0.1)"  };
}

function formatRiskType(type: string): string {
  if (!type) return "Unknown";
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ─── Page Header ────────────────────────────────────────────────── */
function PageHeader({
  activeFilter,
  setActiveFilter,
  total,
}: {
  activeFilter: string;
  setActiveFilter: (f: string) => void;
  total: number;
}) {
  return (
    <div style={{ marginBottom: "40px" }}>
      {/* Eyebrow */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
        <div
          style={{
            width: "20px",
            height: "3px",
            borderRadius: "999px",
            background: "linear-gradient(90deg, #ef4444, #f59e0b)",
          }}
        />
        <span
          style={{
            fontSize: "0.6rem",
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#ef4444",
            fontFamily: "var(--font-mono, monospace)",
          }}
        >
          Risk Intelligence
        </span>
      </div>

      {/* Title row */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "8px" }}>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            lineHeight: 1.15,
            background: "linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Risk Insights
        </h1>
        {total > 0 && (
          <span
            style={{
              fontSize: "0.72rem",
              color: "#475569",
              marginBottom: "4px",
            }}
          >
            {total} risk{total !== 1 ? "s" : ""} detected
          </span>
        )}
      </div>

      <p style={{ fontSize: "0.85rem", color: "#475569", marginBottom: "24px", lineHeight: 1.6 }}>
        AI-detected risk clauses and compliance issues across your contract portfolio.
      </p>

      {/* Filter pills */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          padding: "10px 12px",
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.05)",
          borderRadius: "14px",
          width: "fit-content",
        }}
      >
        {FILTERS.map((f) => {
          const active = f.id === activeFilter;
          const isHigh = f.id === "high";
          return (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              style={{
                padding: "6px 16px",
                borderRadius: "999px",
                fontSize: "0.78rem",
                fontWeight: active ? 600 : 400,
                color: active ? "#f1f5f9" : "#475569",
                background: active
                  ? isHigh
                    ? "rgba(239,68,68,0.18)"
                    : "rgba(59,130,246,0.18)"
                  : "transparent",
                border: active
                  ? isHigh
                    ? "1px solid rgba(239,68,68,0.3)"
                    : "1px solid rgba(59,130,246,0.3)"
                  : "1px solid transparent",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  const el = e.currentTarget as HTMLElement;
                  el.style.color = "#94a3b8";
                  el.style.background = "rgba(255,255,255,0.06)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  const el = e.currentTarget as HTMLElement;
                  el.style.color = "#475569";
                  el.style.background = "transparent";
                }
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Detected Risks Table ───────────────────────────────────────── */
function DetectedRisksTable({
  risks,
  loading,
}: {
  risks: Risk[];
  loading: boolean;
}) {
  const COLS = "2.2fr 1.2fr 0.9fr 2fr 1fr 0.9fr";

  return (
    <div style={CARD}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "20px 24px",
          ...DIVIDER,
        }}
      >
        <div
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "10px",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <ShieldAlert size={13} style={{ color: "#f87171" }} />
        </div>
        <span style={{ flex: 1, fontSize: "0.875rem", fontWeight: 600, color: "#f1f5f9" }}>
          Detected Risks
        </span>
        {!loading && (
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 500,
              color: "#475569",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "999px",
              padding: "2px 10px",
            }}
          >
            {risks.length} items
          </span>
        )}
      </div>

      {/* Column headers */}
      {!loading && risks.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: COLS,
            padding: "10px 24px",
            background: "rgba(255,255,255,0.015)",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          {["Contract / Risk", "Clause Type", "Severity", "AI Explanation", "Status", "Date"].map((h) => (
            <span
              key={h}
              style={{
                fontSize: "0.58rem",
                fontWeight: 600,
                color: "#334155",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              {h}
            </span>
          ))}
        </div>
      )}

      {/* Rows */}
      {loading ? (
        <div style={{ padding: "4px 0" }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: COLS,
                alignItems: "center",
                padding: "16px 24px",
                gap: "8px",
                borderBottom: i < 5 ? "1px solid rgba(255,255,255,0.03)" : "none",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div className="skeleton h-3.5 w-40 rounded" />
                <div className="skeleton h-2.5 w-20 rounded" />
              </div>
              <div className="skeleton h-5 w-24 rounded-lg" />
              <div className="skeleton h-5 w-14 rounded-full" />
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-5 w-20 rounded-full" />
              <div className="skeleton h-3 w-16 rounded" />
            </div>
          ))}
        </div>
      ) : risks.length === 0 ? (
        /* Empty state */
        <div
          style={{
            padding: "56px 32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "18px",
              background: "rgba(239,68,68,0.07)",
              border: "1px solid rgba(239,68,68,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShieldAlert size={22} style={{ color: "#f87171", opacity: 0.7 }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#64748b", marginBottom: "6px" }}>
              No risks detected
            </p>
            <p style={{ fontSize: "0.78rem", color: "#334155", lineHeight: 1.6, maxWidth: "280px" }}>
              Upload and analyze contracts to discover risk clauses and compliance issues across your portfolio.
            </p>
          </div>
          <Link
            href="/upload"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 20px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #3b82f6, #2563eb)",
              color: "#ffffff",
              fontSize: "0.8rem",
              fontWeight: 500,
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
            }}
          >
            <Upload size={13} />
            Upload Contract
          </Link>
        </div>
      ) : (
        <div>
          {risks.map((risk, i) => {
            const status = deriveStatus(risk.severity);
            return (
              <Link
                key={risk.id}
                href={`/contracts/${risk.contract_id}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: COLS,
                  alignItems: "center",
                  padding: "15px 24px",
                  gap: "8px",
                  borderBottom: i < risks.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
                  textDecoration: "none",
                  transition: "background 0.12s ease",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.025)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.background = "transparent")
                }
              >
                {/* Contract / Risk */}
                <div style={{ minWidth: 0, paddingRight: "12px" }}>
                  <p
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 500,
                      color: "#e2e8f0",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      marginBottom: "2px",
                    }}
                  >
                    {risk.title}
                  </p>
                  <p style={{ fontSize: "0.68rem", color: "#334155" }}>
                    Contract #{risk.contract_id}
                  </p>
                </div>

                {/* Clause Type */}
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 500,
                    color: "#64748b",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "6px",
                    padding: "3px 8px",
                    display: "inline-block",
                    width: "fit-content",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "100%",
                  }}
                >
                  {formatRiskType(risk.risk_type)}
                </span>

                {/* Severity */}
                <div>
                  <RiskBadge level={risk.severity} />
                </div>

                {/* AI Explanation */}
                <p
                  style={{
                    fontSize: "0.72rem",
                    color: "#475569",
                    lineHeight: 1.5,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    paddingRight: "8px",
                  }}
                  title={risk.explanation ?? ""}
                >
                  {risk.explanation
                    ? risk.explanation.slice(0, 85) + (risk.explanation.length > 85 ? "…" : "")
                    : "—"}
                </p>

                {/* Status pill */}
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    fontSize: "0.66rem",
                    fontWeight: 600,
                    padding: "3px 9px",
                    borderRadius: "999px",
                    color: status.color,
                    background: status.bg,
                    width: "fit-content",
                  }}
                >
                  <span
                    style={{
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      background: status.color,
                      flexShrink: 0,
                    }}
                  />
                  {status.label}
                </span>

                {/* Date */}
                <span style={{ fontSize: "0.7rem", color: "#334155" }}>
                  {risk.created_at
                    ? new Date(risk.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day:   "numeric",
                        year:  "2-digit",
                      })
                    : "—"}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── AI Risk Summary Panel ──────────────────────────────────────── */
function AIRiskSummaryPanel({
  risks,
  loading,
}: {
  risks: Risk[];
  loading: boolean;
}) {
  const highRisks = risks.filter((r) =>
    ["high", "critical"].includes(r.severity?.toLowerCase())
  );
  const topRisk = highRisks[0];

  const clauseCounts = risks.reduce(
    (acc, r) => {
      const type = r.risk_type || "Unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const topClause = Object.entries(clauseCounts).sort((a, b) => b[1] - a[1])[0];

  const warnings = [
    highRisks.length > 0
      ? `${highRisks.length} high-severity clause${highRisks.length > 1 ? "s" : ""} require immediate legal review before contract execution.`
      : null,
    topClause
      ? `Most common issue: "${formatRiskType(topClause[0])}" appearing in ${topClause[1]} location${topClause[1] > 1 ? "s" : ""} across your portfolio.`
      : null,
    topRisk?.suggested_action ?? null,
    risks.length > 0
      ? "Ensure all flagged clauses are reviewed by your legal team before finalizing agreements."
      : null,
  ].filter(Boolean) as string[];

  const badgeFor = (i: number, isUrgent: boolean) => {
    if (isUrgent)
      return {
        label: "Urgent",
        style: {
          background: "rgba(239,68,68,0.12)",
          color: "#f87171",
          border: "1px solid rgba(239,68,68,0.2)",
        } as React.CSSProperties,
        rowBg:     "rgba(239,68,68,0.04)",
        rowBorder: "1px solid rgba(239,68,68,0.12)",
      };
    if (i === 1)
      return {
        label: "Pattern",
        style: {
          background: "rgba(245,158,11,0.1)",
          color: "#fbbf24",
          border: "1px solid rgba(245,158,11,0.2)",
        } as React.CSSProperties,
        rowBg:     "rgba(245,158,11,0.025)",
        rowBorder: "1px solid rgba(255,255,255,0.05)",
      };
    return {
      label: "Recommendation",
      style: {
        background: "rgba(59,130,246,0.1)",
        color: "#60a5fa",
        border: "1px solid rgba(59,130,246,0.2)",
      } as React.CSSProperties,
      rowBg:     "rgba(255,255,255,0.02)",
      rowBorder: "1px solid rgba(255,255,255,0.05)",
    };
  };

  return (
    <div style={{ ...CARD, display: "flex", flexDirection: "column" }}>
      {/* Gradient header */}
      <div
        style={{
          padding: "20px 24px 16px",
          background: "linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(59,130,246,0.06) 100%)",
          ...DIVIDER,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "9px",
              background: "rgba(139,92,246,0.15)",
              border: "1px solid rgba(139,92,246,0.22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Sparkles size={13} style={{ color: "#a78bfa" }} />
          </div>
          <span style={{ flex: 1, fontSize: "0.875rem", fontWeight: 600, color: "#f1f5f9" }}>
            AI Risk Summary
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              background: "rgba(139,92,246,0.1)",
              border: "1px solid rgba(139,92,246,0.18)",
              borderRadius: "999px",
              padding: "3px 10px",
            }}
          >
            <div
              className="animate-pulse"
              style={{
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: "#a78bfa",
              }}
            />
            <span style={{ fontSize: "0.58rem", color: "#a78bfa", fontWeight: 500 }}>Live</span>
          </div>
        </div>
        <p style={{ fontSize: "0.7rem", color: "#475569" }}>
          AI-generated legal risk intelligence
        </p>
      </div>

      {/* Body */}
      <div style={{ padding: "16px 20px", flex: 1, display: "flex", flexDirection: "column", gap: "0" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div className="skeleton h-2 w-16 rounded mb-2.5" />
                <div className="skeleton h-3 w-full rounded mb-1.5" />
                <div className="skeleton h-3 w-4/5 rounded" />
              </div>
            ))}
          </div>
        ) : risks.length === 0 ? (
          /* Empty state */
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "32px 16px",
              gap: "14px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "16px",
                background: "rgba(139,92,246,0.08)",
                border: "1px solid rgba(139,92,246,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={20} style={{ color: "#a78bfa", opacity: 0.6 }} />
            </div>
            <div>
              <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                No risk data yet
              </p>
              <p style={{ fontSize: "0.72rem", color: "#334155", lineHeight: 1.65 }}>
                Analyze contracts to generate AI-powered risk intelligence and legal insights.
              </p>
            </div>
            <Link
              href="/upload"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 18px",
                borderRadius: "9px",
                background: "rgba(139,92,246,0.1)",
                border: "1px solid rgba(139,92,246,0.2)",
                color: "#a78bfa",
                fontSize: "0.78rem",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              <Upload size={12} />
              Upload Contract
            </Link>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {warnings.slice(0, 4).map((text, i) => {
                const isUrgent = i === 0 && highRisks.length > 0;
                const badge = badgeFor(i, isUrgent);
                return (
                  <div
                    key={i}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "11px",
                      background: badge.rowBg,
                      border: badge.rowBorder,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        fontSize: "0.58rem",
                        fontWeight: 700,
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        padding: "2px 7px",
                        borderRadius: "999px",
                        marginBottom: "7px",
                        ...badge.style,
                      }}
                    >
                      {badge.label}
                    </span>
                    <p style={{ fontSize: "0.74rem", color: "#64748b", lineHeight: 1.6 }}>
                      {text}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Flagged clause snippet */}
            {topRisk?.source_snippet && (
              <div
                style={{
                  marginTop: "10px",
                  padding: "12px 14px",
                  borderRadius: "11px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderLeft: "3px solid rgba(239,68,68,0.45)",
                }}
              >
                <p
                  style={{
                    fontSize: "0.58rem",
                    fontWeight: 700,
                    color: "#ef4444",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: "7px",
                  }}
                >
                  Flagged Clause
                </p>
                <p
                  style={{
                    fontSize: "0.72rem",
                    color: "#64748b",
                    lineHeight: 1.65,
                    fontStyle: "italic",
                  }}
                >
                  &ldquo;
                  {topRisk.source_snippet.slice(0, 150)}
                  {topRisk.source_snippet.length > 150 ? "…" : ""}
                  &rdquo;
                </p>
              </div>
            )}

            <Link
              href="/ask-ai"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                marginTop: "12px",
                padding: "10px",
                borderRadius: "11px",
                background: "rgba(139,92,246,0.07)",
                border: "1px solid rgba(139,92,246,0.18)",
                color: "#a78bfa",
                fontSize: "0.78rem",
                fontWeight: 500,
                textDecoration: "none",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.7")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
            >
              <Sparkles size={12} />
              Ask AI to analyze risks
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Risk Distribution Card ─────────────────────────────────────── */
function RiskDistributionCard({
  risks,
  loading,
}: {
  risks: Risk[];
  loading: boolean;
}) {
  const total  = risks.length;
  const high   = risks.filter((r) => ["high", "critical"].includes(r.severity?.toLowerCase())).length;
  const medium = risks.filter((r) => ["medium", "moderate"].includes(r.severity?.toLowerCase())).length;
  const low    = risks.filter((r) => r.severity?.toLowerCase() === "low").length;
  const denom  = total || 1;

  const rows = [
    { label: "Critical / High", value: high,   color: "#ef4444", glow: "rgba(239,68,68,0.35)",  track: "rgba(239,68,68,0.07)"  },
    { label: "Medium",          value: medium, color: "#f59e0b", glow: "rgba(245,158,11,0.3)",  track: "rgba(245,158,11,0.07)" },
    { label: "Low",             value: low,    color: "#10b981", glow: "rgba(16,185,129,0.3)",  track: "rgba(16,185,129,0.07)" },
  ];

  return (
    <div style={CARD}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "20px 24px",
          ...DIVIDER,
        }}
      >
        <div
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "10px",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <BarChart2 size={13} style={{ color: "#f87171" }} />
        </div>
        <span style={{ flex: 1, fontSize: "0.875rem", fontWeight: 600, color: "#f1f5f9" }}>
          Risk Distribution
        </span>
        <Link
          href="/analytics"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "0.72rem",
            fontWeight: 500,
            color: "#3b82f6",
            textDecoration: "none",
          }}
        >
          Details <ArrowRight size={10} />
        </Link>
      </div>

      <div style={{ padding: "20px 24px" }}>
        {/* Total badge */}
        {!loading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "20px",
              padding: "10px 14px",
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: "10px",
            }}
          >
            <span style={{ fontSize: "0.72rem", color: "#475569" }}>Total risks detected</span>
            <span
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: total > 0 ? "#f1f5f9" : "#334155",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {total}
            </span>
          </div>
        )}
        {loading && <div className="skeleton h-10 w-full rounded-xl mb-5" />}

        {rows.map(({ label, value, color, glow, track }) => {
          const pct = total > 0 ? Math.round((value / denom) * 100) : 0;
          return (
            <div key={label} style={{ marginBottom: "18px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      background: color,
                      boxShadow: `0 0 7px ${glow}`,
                    }}
                  />
                  <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>{label}</span>
                </div>
                {loading ? (
                  <div className="skeleton h-3.5 w-8 rounded" />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: "#475569",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {pct}%
                    </span>
                    <span
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        color: value > 0 ? color : "#1e293b",
                        fontVariantNumeric: "tabular-nums",
                        minWidth: "16px",
                        textAlign: "right",
                      }}
                    >
                      {value}
                    </span>
                  </div>
                )}
              </div>
              <div
                style={{
                  height: "5px",
                  borderRadius: "999px",
                  background: track,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: "999px",
                    width: loading ? "0%" : `${Math.max(pct, value > 0 ? 4 : 0)}%`,
                    background: `linear-gradient(90deg, ${color}99, ${color})`,
                    boxShadow: `0 0 8px ${glow}`,
                    transition: "width 0.9s cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                />
              </div>
            </div>
          );
        })}

        {!loading && total === 0 && (
          <p style={{ fontSize: "0.75rem", color: "#334155", textAlign: "center", paddingTop: "8px" }}>
            No risks detected in your portfolio
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Top Clause Issues Card ─────────────────────────────────────── */
function TopClauseIssuesCard({
  risks,
  loading,
}: {
  risks: Risk[];
  loading: boolean;
}) {
  const clauseCounts = risks.reduce(
    (acc, r) => {
      const type = r.risk_type || "Unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const topClauses = Object.entries(clauseCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxCount = topClauses[0]?.[1] ?? 1;

  const CLAUSE_COLORS = ["#f87171", "#fbbf24", "#818cf8", "#60a5fa", "#34d399", "#a78bfa"];

  return (
    <div style={CARD}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "20px 24px",
          ...DIVIDER,
        }}
      >
        <div
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "10px",
            background: "rgba(99,102,241,0.1)",
            border: "1px solid rgba(99,102,241,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Flag size={13} style={{ color: "#818cf8" }} />
        </div>
        <span style={{ flex: 1, fontSize: "0.875rem", fontWeight: 600, color: "#f1f5f9" }}>
          Common Clause Issues
        </span>
      </div>

      <div style={{ padding: "20px 24px" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div className="skeleton h-3 w-28 rounded" />
                  <div className="skeleton h-3 w-6 rounded" />
                </div>
                <div className="skeleton h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : topClauses.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
              padding: "28px 0",
              textAlign: "center",
            }}
          >
            <Flag size={24} style={{ color: "#334155" }} />
            <p style={{ fontSize: "0.78rem", color: "#334155" }}>No clause data available</p>
            <p style={{ fontSize: "0.7rem", color: "#1e293b", lineHeight: 1.5 }}>
              Analyze contracts to see common risk patterns.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {topClauses.map(([type, count], i) => {
              const pct = Math.round((count / maxCount) * 100);
              const color = CLAUSE_COLORS[i] ?? "#64748b";
              return (
                <div key={type}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "7px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: color,
                        }}
                      />
                      <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                        {formatRiskType(type)}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        color: "#f1f5f9",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {count}
                    </span>
                  </div>
                  <div
                    style={{
                      height: "4px",
                      borderRadius: "999px",
                      background: "rgba(255,255,255,0.04)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: "999px",
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${color}77, ${color})`,
                        transition: "width 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Compliance Score Card ──────────────────────────────────────── */
function ComplianceScoreCard({
  risks,
  loading,
}: {
  risks: Risk[];
  loading: boolean;
}) {
  const highCount   = risks.filter((r) => ["high", "critical"].includes(r.severity?.toLowerCase())).length;
  const mediumCount = risks.filter((r) => ["medium", "moderate"].includes(r.severity?.toLowerCase())).length;
  const lowCount    = risks.filter((r) => r.severity?.toLowerCase() === "low").length;

  const highPenalty   = Math.min(highCount * 10, 50);
  const mediumPenalty = Math.min(mediumCount * 5, 25);
  const score =
    risks.length === 0
      ? 100
      : Math.max(30, Math.round(100 - highPenalty - mediumPenalty));

  const scoreColor = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  const scoreLabel = score >= 80 ? "Compliant" : score >= 60 ? "Needs Attention" : "At Risk";
  const circumference = 2 * Math.PI * 38;
  const dash = (score / 100) * circumference;

  const breakdown = [
    { label: "High / Critical",  penalty: highPenalty,   color: "#f87171" },
    { label: "Medium risks",     penalty: mediumPenalty, color: "#fbbf24" },
    { label: "Low severity",     penalty: 0,             color: "#34d399", note: lowCount > 0 ? `${lowCount} items` : "None" },
  ];

  return (
    <div style={CARD}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "20px 24px",
          ...DIVIDER,
        }}
      >
        <div
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "10px",
            background: "rgba(16,185,129,0.1)",
            border: "1px solid rgba(16,185,129,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Shield size={13} style={{ color: "#34d399" }} />
        </div>
        <span style={{ flex: 1, fontSize: "0.875rem", fontWeight: 600, color: "#f1f5f9" }}>
          Compliance Score
        </span>
        <Link
          href="/analytics"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "0.72rem",
            fontWeight: 500,
            color: "#3b82f6",
            textDecoration: "none",
          }}
        >
          Details <ArrowRight size={10} />
        </Link>
      </div>

      <div style={{ padding: "20px 24px" }}>
        {loading ? (
          <>
            <div className="skeleton h-24 w-24 rounded-full mx-auto mb-4" />
            <div className="skeleton h-3.5 w-20 rounded mx-auto mb-6" />
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <div className="skeleton h-2.5 w-24 rounded" />
                  <div className="skeleton h-2.5 w-12 rounded" />
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Gauge */}
            <div
              style={{
                position: "relative",
                width: "100px",
                height: "100px",
                margin: "0 auto 12px",
              }}
            >
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${circumference}`}
                  transform="rotate(-90 50 50)"
                  style={{
                    transition: "stroke-dasharray 1s cubic-bezier(0.22, 1, 0.36, 1)",
                    filter: `drop-shadow(0 0 6px ${scoreColor}88)`,
                  }}
                />
              </svg>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "1.6rem",
                    fontWeight: 700,
                    color: "#f8fafc",
                    lineHeight: 1,
                  }}
                >
                  {score}
                </span>
                <span style={{ fontSize: "0.58rem", color: "#475569", marginTop: "2px" }}>/100</span>
              </div>
            </div>

            {/* Label */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <p style={{ fontSize: "0.82rem", fontWeight: 600, color: scoreColor }}>
                {scoreLabel}
              </p>
              <p style={{ fontSize: "0.68rem", color: "#334155", marginTop: "3px" }}>
                Based on risk severity profile
              </p>
            </div>

            {/* Score breakdown */}
            <div
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: "12px",
                padding: "12px 14px",
              }}
            >
              <p
                style={{
                  fontSize: "0.58rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#334155",
                  marginBottom: "10px",
                }}
              >
                Score Breakdown
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {breakdown.map(({ label, penalty, color, note }) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div
                        style={{
                          width: "5px",
                          height: "5px",
                          borderRadius: "50%",
                          background: color,
                        }}
                      />
                      <span style={{ fontSize: "0.7rem", color: "#64748b" }}>{label}</span>
                    </div>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 500,
                        color: penalty > 0 ? "#f87171" : "#475569",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {note ?? (penalty > 0 ? `−${penalty} pts` : "No penalty")}
                    </span>
                  </div>
                ))}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: "8px",
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                    marginTop: "2px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <TrendingDown size={10} style={{ color: scoreColor }} />
                    <span style={{ fontSize: "0.7rem", color: "#64748b" }}>Final score</span>
                  </div>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: scoreColor }}>
                    {score} / 100
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function RisksPage() {
  const [risks,        setRisks]        = useState<Risk[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    api
      .risks()
      .then(setRisks)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const highCount   = risks.filter((r) => ["high", "critical"].includes(r.severity?.toLowerCase())).length;
  const mediumCount = risks.filter((r) => ["medium", "moderate"].includes(r.severity?.toLowerCase())).length;
  const reviewCount = risks.filter((r) => !!r.suggested_action).length;

  const filteredRisks = useMemo(() => {
    if (activeFilter === "all") return risks;
    if (activeFilter === "high")
      return risks.filter((r) => ["high", "critical"].includes(r.severity?.toLowerCase()));
    if (activeFilter === "compliance")
      return risks.filter((r) => {
        const rt = r.risk_type?.toLowerCase() ?? "";
        return rt.includes("compliance") || rt.includes("gdpr") || rt.includes("regulation") || rt.includes("data") || rt.includes("privacy");
      });
    if (activeFilter === "expiring")
      return risks.filter((r) => {
        const rt = r.risk_type?.toLowerCase() ?? "";
        return rt.includes("expir") || rt.includes("terminat") || rt.includes("renew") || rt.includes("notice");
      });
    if (activeFilter === "review")
      return risks.filter((r) => !!r.suggested_action);
    return risks;
  }, [risks, activeFilter]);

  const kpiCards = [
    { label: "High Risk",         value: highCount,   icon: ShieldAlert,   accent: "danger"  as const, subtitle: "Requires immediate action"   },
    { label: "Compliance Issues", value: mediumCount, icon: Scale,         accent: "warning" as const, subtitle: "Medium severity items"        },
    { label: "Needs Review",      value: reviewCount, icon: CheckCircle2,  accent: "cyan"    as const, subtitle: "Suggested actions pending"    },
    { label: "Total Flagged",     value: risks.length, icon: Flag,         accent: "indigo"  as const, subtitle: "Across all contracts"         },
  ];

  return (
    <AppShell>
      {/* Ambient page glow */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "600px",
          height: "400px",
          background: "radial-gradient(ellipse at 70% 0%, rgba(239,68,68,0.055) 0%, transparent 65%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div style={{ maxWidth: "1380px", margin: "0 auto", padding: "48px 52px", position: "relative", zIndex: 1 }}>

        {/* Page header + filter pills */}
        <FadeUp>
          <PageHeader
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            total={filteredRisks.length}
          />
        </FadeUp>

        {/* Error */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "32px",
              padding: "14px 20px",
              borderRadius: "14px",
              background: "rgba(239,68,68,0.07)",
              border: "1px solid rgba(239,68,68,0.14)",
              color: "#f87171",
              fontSize: "0.82rem",
            }}
          >
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* KPI Row */}
        <FadeUp delay={0.06}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "20px",
              marginBottom: "32px",
            }}
          >
            {kpiCards.map((card) => (
              <MetricCard key={card.label} {...card} loading={loading} />
            ))}
          </div>
        </FadeUp>

        {/* Main grid: table (2/3) + AI panel (1/3) */}
        <FadeUp delay={0.1}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 380px",
              gap: "20px",
              marginBottom: "20px",
              alignItems: "start",
            }}
          >
            <DetectedRisksTable risks={filteredRisks} loading={loading} />
            <AIRiskSummaryPanel risks={risks} loading={loading} />
          </div>
        </FadeUp>

        {/* Analytics row */}
        <FadeUp delay={0.14}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "20px",
              marginBottom: "32px",
            }}
          >
            <RiskDistributionCard risks={risks} loading={loading} />
            <TopClauseIssuesCard  risks={risks} loading={loading} />
            <ComplianceScoreCard  risks={risks} loading={loading} />
          </div>
        </FadeUp>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "28px",
            borderTop: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            {["SOC 2 Type II", "ISO 27001", "AES-256", "GDPR"].map((b) => (
              <span
                key={b}
                style={{
                  fontSize: "0.62rem",
                  color: "#334155",
                  letterSpacing: "0.07em",
                  fontWeight: 500,
                  textTransform: "uppercase",
                }}
              >
                {b}
              </span>
            ))}
          </div>
          <span style={{ fontSize: "0.7rem", color: "#1e293b" }}>
            Contract Lens · {new Date().getFullYear()}
          </span>
        </div>

      </div>
    </AppShell>
  );
}
