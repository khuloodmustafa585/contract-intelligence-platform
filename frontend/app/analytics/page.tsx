"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  ShieldAlert,
  Timer,
  ClipboardList,
  Bell,
  AlertCircle,
  TrendingUp,
  Activity,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import GlassCard from "@/components/ui/GlassCard";
import MetricCard from "@/components/ui/MetricCard";
import { api } from "@/services/api";

type Metrics = {
  total_contracts: number;
  high_risk_contracts: number;
  expiring_soon: number;
  overdue_contracts: number;
  upcoming_obligations: number;
  overdue_obligations: number;
  unread_alerts: number;
};

function BarChart({
  data,
}: {
  data: { label: string; value: number; color: string; max: number }[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {data.map(({ label, value, color, max }) => (
        <div key={label}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "7px",
            }}
          >
            <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>{label}</span>
            <span
              style={{
                fontSize: "0.78rem",
                color,
                fontFamily: "var(--font-mono, monospace)",
                fontWeight: 600,
              }}
            >
              {value}
            </span>
          </div>
          <div
            style={{
              height: "6px",
              borderRadius: "999px",
              overflow: "hidden",
              background: "rgba(99,102,241,0.10)",
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: "999px",
                transition: "width 0.7s ease",
                width: max > 0 ? `${Math.min(100, (value / max) * 100)}%` : "0%",
                background: color,
                boxShadow: `0 0 8px ${color}60`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    api.dashboard()
      .then((data) => setMetrics(data as Metrics))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const maxVal = metrics
    ? Math.max(
        metrics.total_contracts,
        metrics.high_risk_contracts,
        metrics.expiring_soon,
        metrics.overdue_contracts,
        1
      )
    : 1;

  const kpiCards = [
    { label: "Total Contracts",      value: metrics?.total_contracts ?? 0,      icon: FileText,      accent: "indigo"  as const },
    { label: "High Risk",            value: metrics?.high_risk_contracts ?? 0,  icon: ShieldAlert,   accent: "danger"  as const },
    { label: "Expiring Soon",        value: metrics?.expiring_soon ?? 0,        icon: Timer,         accent: "warning" as const },
    { label: "Unread Alerts",        value: metrics?.unread_alerts ?? 0,        icon: Bell,          accent: "cyan"    as const },
    { label: "Overdue Contracts",    value: metrics?.overdue_contracts ?? 0,    icon: AlertCircle,   accent: "danger"  as const },
    { label: "Upcoming Obligations", value: metrics?.upcoming_obligations ?? 0, icon: ClipboardList, accent: "success" as const },
    { label: "Overdue Obligations",  value: metrics?.overdue_obligations ?? 0,  icon: ClipboardList, accent: "warning" as const },
  ];

  return (
    <AppShell>
      {/* Ambient glow — consistent with dashboard / risks */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "700px",
          height: "500px",
          background:
            "radial-gradient(ellipse at 80% -10%, rgba(99,102,241,0.055) 0%, transparent 60%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ── Page container — matches dashboard / risks pattern ── */}
      <div
        style={{
          maxWidth: "1380px",
          margin: "0 auto",
          padding: "48px 52px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* ── Page header ──────────────────────────────────────────── */}
        <div style={{ marginBottom: "40px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                height: "4px",
                width: "24px",
                borderRadius: "999px",
                background: "linear-gradient(90deg, #6366f1, #22d3ee)",
              }}
            />
            <span
              style={{
                color: "#6366f1",
                fontSize: "0.65rem",
                fontFamily: "var(--font-mono, monospace)",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Portfolio Analytics
            </span>
          </div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              color: "#dae2fd",
              letterSpacing: "-0.02em",
              marginBottom: "6px",
            }}
          >
            Analytics
          </h1>
          <p style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.6 }}>
            Operational view of contract risk, deadlines, and processing volume.
          </p>
        </div>

        {/* ── Error banner ─────────────────────────────────────────── */}
        {error && (
          <div
            style={{
              marginBottom: "28px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "14px 18px",
              borderRadius: "14px",
              fontSize: "0.82rem",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.20)",
              color: "#f87171",
            }}
          >
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* ── KPI row — top 4 cards ────────────────────────────────── */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4"
          style={{ gap: "20px", marginBottom: "28px" }}
        >
          {kpiCards.slice(0, 4).map((card, i) => (
            <MetricCard key={card.label} {...card} loading={loading} delay={i * 60} />
          ))}
        </div>

        {/* ── Main 2-col grid ──────────────────────────────────────── */}
        <div
          className="grid lg:grid-cols-[1fr_340px]"
          style={{ gap: "20px", alignItems: "start" }}
        >
          {/* ── Left: bar charts ──────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Contract Risk Distribution */}
            <GlassCard style={{ padding: "24px 28px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "9px",
                    background: "rgba(99,102,241,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Activity size={14} style={{ color: "#818cf8" }} />
                </div>
                <div>
                  <p
                    style={{
                      fontSize: "0.88rem",
                      fontWeight: 600,
                      color: "#dae2fd",
                      lineHeight: 1.3,
                    }}
                  >
                    Contract Risk Distribution
                  </p>
                  <p style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "2px" }}>
                    Breakdown by risk category and expiry status
                  </p>
                </div>
              </div>

              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i}>
                      <div className="skeleton h-2.5 w-1/3 rounded mb-2" />
                      <div className="skeleton h-1.5 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : metrics ? (
                <BarChart
                  data={[
                    { label: "Total Contracts",   value: metrics.total_contracts,    color: "#818cf8", max: maxVal },
                    { label: "High Risk",         value: metrics.high_risk_contracts, color: "#f87171", max: maxVal },
                    { label: "Expiring Soon",     value: metrics.expiring_soon,       color: "#fbbf24", max: maxVal },
                    { label: "Overdue Contracts", value: metrics.overdue_contracts,   color: "#f87171", max: maxVal },
                  ]}
                />
              ) : null}
            </GlassCard>

            {/* Obligation Status */}
            <GlassCard style={{ padding: "24px 28px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "9px",
                    background: "rgba(34,211,238,0.10)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <ClipboardList size={14} style={{ color: "#22d3ee" }} />
                </div>
                <div>
                  <p
                    style={{
                      fontSize: "0.88rem",
                      fontWeight: 600,
                      color: "#dae2fd",
                      lineHeight: 1.3,
                    }}
                  >
                    Obligation Status
                  </p>
                  <p style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "2px" }}>
                    Upcoming vs overdue obligation tracking
                  </p>
                </div>
              </div>

              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {[1, 2].map((i) => (
                    <div key={i}>
                      <div className="skeleton h-2.5 w-1/3 rounded mb-2" />
                      <div className="skeleton h-1.5 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : metrics ? (
                <BarChart
                  data={[
                    {
                      label: "Upcoming Obligations",
                      value: metrics.upcoming_obligations,
                      color: "#22d3ee",
                      max: Math.max(
                        metrics.upcoming_obligations,
                        metrics.overdue_obligations,
                        1
                      ),
                    },
                    {
                      label: "Overdue Obligations",
                      value: metrics.overdue_obligations,
                      color: "#fbbf24",
                      max: Math.max(
                        metrics.upcoming_obligations,
                        metrics.overdue_obligations,
                        1
                      ),
                    },
                  ]}
                />
              ) : null}
            </GlassCard>
          </div>

          {/* ── Right: supplemental KPIs + AI + risk score ────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Bottom 3 KPI cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {kpiCards.slice(4).map((card, i) => (
                <MetricCard key={card.label} {...card} loading={loading} delay={i * 60} />
              ))}
            </div>

            {/* AI Portfolio Intelligence — real computed insights */}
            {!loading && metrics && (
              <div style={{ borderRadius: "16px", background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.16)", overflow: "hidden" }}>
                {/* Header */}
                <div style={{ padding: "14px 18px 10px", borderBottom: "1px solid rgba(99,102,241,0.10)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                    <Activity size={12} style={{ color: "#818cf8" }} />
                    <p style={{ fontSize: "0.6rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "var(--font-mono,monospace)" }}>
                      Portfolio Intelligence
                    </p>
                    <div className="ml-auto animate-pulse" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#6366f1" }} />
                  </div>
                  <p style={{ fontSize: "0.65rem", color: "#475569" }}>AI-derived observations from your contract data</p>
                </div>
                {/* Observations */}
                <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    metrics.total_contracts === 0
                      ? { icon: "📁", text: "Upload your first contract to begin generating portfolio insights.", accent: "#818cf8" }
                      : metrics.high_risk_contracts === 0
                      ? { icon: "✅", text: `All ${metrics.total_contracts} contracts in your portfolio show no high-severity risk exposure.`, accent: "#34d399" }
                      : { icon: "⚠️", text: `${metrics.high_risk_contracts} of ${metrics.total_contracts} contract${metrics.total_contracts !== 1 ? "s" : ""} (${Math.round((metrics.high_risk_contracts / metrics.total_contracts) * 100)}%) carry high-severity clauses requiring legal review.`, accent: "#f87171" },
                    metrics.expiring_soon > 0
                      ? { icon: "⏱️", text: `${metrics.expiring_soon} contract${metrics.expiring_soon !== 1 ? "s" : ""} expire within the next 30 days — initiate renewal or renegotiation.`, accent: "#fbbf24" }
                      : null,
                    metrics.overdue_obligations > 0
                      ? { icon: "🔴", text: `${metrics.overdue_obligations} obligation${metrics.overdue_obligations !== 1 ? "s are" : " is"} overdue. Assign owners and resolve immediately.`, accent: "#f87171" }
                      : metrics.upcoming_obligations > 0
                      ? { icon: "📋", text: `${metrics.upcoming_obligations} obligation${metrics.upcoming_obligations !== 1 ? "s" : ""} due within 30 days — review the obligations tracker.`, accent: "#fbbf24" }
                      : { icon: "✅", text: "No upcoming obligation deadlines detected in the next 30 days.", accent: "#34d399" },
                    metrics.unread_alerts > 0
                      ? { icon: "🔔", text: `${metrics.unread_alerts} unread alert${metrics.unread_alerts !== 1 ? "s" : ""} require your attention.`, accent: "#818cf8" }
                      : null,
                  ].filter(Boolean).map((obs, i) => obs && (
                    <div key={i} style={{ display: "flex", gap: "8px", padding: "8px 10px", borderRadius: "10px", background: `${obs.accent}0d`, border: `1px solid ${obs.accent}22` }}>
                      <span style={{ fontSize: "0.75rem", flexShrink: 0 }}>{obs.icon}</span>
                      <p style={{ fontSize: "0.72rem", color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>{obs.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio Risk Score */}
            <GlassCard style={{ padding: "24px 28px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "9px",
                    background: "rgba(16,185,129,0.10)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <TrendingUp size={14} style={{ color: "#10b981" }} />
                </div>
                <div>
                  <p
                    style={{
                      fontSize: "0.88rem",
                      fontWeight: 600,
                      color: "#dae2fd",
                      lineHeight: 1.3,
                    }}
                  >
                    Risk Score
                  </p>
                  <p style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "2px" }}>
                    Portfolio health index
                  </p>
                </div>
              </div>

              {loading ? (
                <div>
                  <div className="skeleton h-12 w-24 rounded mb-3" />
                  <div className="skeleton h-2.5 w-40 rounded" />
                </div>
              ) : metrics ? (
                <>
                  <div
                    style={{
                      fontSize: "3rem",
                      fontWeight: 700,
                      fontFamily: "var(--font-mono, monospace)",
                      lineHeight: 1,
                      marginBottom: "8px",
                      color:
                        metrics.high_risk_contracts === 0
                          ? "#34d399"
                          : metrics.high_risk_contracts > 3
                          ? "#f87171"
                          : "#fbbf24",
                    }}
                  >
                    {metrics.total_contracts === 0
                      ? "—"
                      : Math.round(
                          100 -
                            (metrics.high_risk_contracts /
                              Math.max(metrics.total_contracts, 1)) *
                              100
                        )}
                    {metrics.total_contracts > 0 && (
                      <span
                        style={{
                          fontSize: "1rem",
                          marginLeft: "4px",
                          color: "#64748b",
                        }}
                      >
                        /100
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: "0.73rem", color: "#64748b", lineHeight: 1.5 }}>
                    Portfolio health score based on risk distribution
                  </p>
                </>
              ) : null}
            </GlassCard>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
