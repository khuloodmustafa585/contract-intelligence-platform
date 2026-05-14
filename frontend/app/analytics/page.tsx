"use client";

import { useEffect, useState } from "react";
import {
  BarChart2,
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
import AIInsightPanel from "@/components/ui/AIInsightPanel";
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

function BarChart({ data }: { data: { label: string; value: number; color: string; max: number }[] }) {
  return (
    <div className="space-y-3">
      {data.map(({ label, value, color, max }) => (
        <div key={label}>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span style={{ color: "#94a3b8" }}>{label}</span>
            <span style={{ color, fontFamily: "var(--font-mono,monospace)" }}>{value}</span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: "rgba(99,102,241,0.10)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
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
    { label: "Total Contracts",      value: metrics?.total_contracts ?? 0,       icon: FileText,     accent: "indigo"  as const },
    { label: "High Risk",            value: metrics?.high_risk_contracts ?? 0,   icon: ShieldAlert,  accent: "danger"  as const },
    { label: "Expiring Soon",        value: metrics?.expiring_soon ?? 0,         icon: Timer,        accent: "warning" as const },
    { label: "Unread Alerts",        value: metrics?.unread_alerts ?? 0,         icon: Bell,         accent: "cyan"    as const },
    { label: "Overdue Contracts",    value: metrics?.overdue_contracts ?? 0,     icon: AlertCircle,  accent: "danger"  as const },
    { label: "Upcoming Obligations", value: metrics?.upcoming_obligations ?? 0,  icon: ClipboardList,accent: "success" as const },
    { label: "Overdue Obligations",  value: metrics?.overdue_obligations ?? 0,   icon: ClipboardList,accent: "warning" as const },
  ];

  return (
    <AppShell>
      <div className="px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1 w-6 rounded-full" style={{ background: "linear-gradient(90deg, #6366f1, #22d3ee)" }} />
            <span className="font-mono-label" style={{ color: "#6366f1", fontSize: "0.65rem" }}>Portfolio Analytics</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#dae2fd" }}>Analytics</h1>
          <p className="mt-1 text-sm" style={{ color: "#64748b" }}>
            Operational view of contract risk, deadlines, and processing volume.
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.20)", color: "#f87171" }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 mb-6">
          {kpiCards.slice(0, 4).map((card, i) => (
            <MetricCard key={card.label} {...card} loading={loading} delay={i * 60} />
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">

          {/* Bar Charts */}
          <div className="space-y-5">
            <GlassCard className="p-5">
              <div className="flex items-center gap-2 mb-5">
                <Activity size={15} style={{ color: "#6366f1" }} />
                <p className="text-sm font-semibold" style={{ color: "#dae2fd" }}>Contract Risk Distribution</p>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3,4].map((i) => <div key={i} className="skeleton h-6 rounded" />)}
                </div>
              ) : metrics ? (
                <BarChart data={[
                  { label: "Total Contracts",   value: metrics.total_contracts,    color: "#818cf8", max: maxVal },
                  { label: "High Risk",         value: metrics.high_risk_contracts,color: "#f87171", max: maxVal },
                  { label: "Expiring Soon",     value: metrics.expiring_soon,      color: "#fbbf24", max: maxVal },
                  { label: "Overdue Contracts", value: metrics.overdue_contracts,  color: "#f87171", max: maxVal },
                ]} />
              ) : null}
            </GlassCard>

            <GlassCard className="p-5">
              <div className="flex items-center gap-2 mb-5">
                <ClipboardList size={15} style={{ color: "#22d3ee" }} />
                <p className="text-sm font-semibold" style={{ color: "#dae2fd" }}>Obligation Status</p>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[1,2].map((i) => <div key={i} className="skeleton h-6 rounded" />)}
                </div>
              ) : metrics ? (
                <BarChart data={[
                  { label: "Upcoming Obligations", value: metrics.upcoming_obligations, color: "#22d3ee", max: Math.max(metrics.upcoming_obligations, metrics.overdue_obligations, 1) },
                  { label: "Overdue Obligations",  value: metrics.overdue_obligations,  color: "#fbbf24", max: Math.max(metrics.upcoming_obligations, metrics.overdue_obligations, 1) },
                ]} />
              ) : null}
            </GlassCard>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Additional KPIs */}
            <div className="grid grid-cols-1 gap-4">
              {kpiCards.slice(4).map((card, i) => (
                <MetricCard key={card.label} {...card} loading={loading} delay={i * 60} />
              ))}
            </div>

            {/* AI Insight */}
            {!loading && metrics && (
              <AIInsightPanel title="Portfolio Intelligence">
                {metrics.high_risk_contracts === 0
                  ? "Your contract portfolio shows no high-risk exposure. Continue monitoring for clause changes during active negotiations."
                  : `${metrics.high_risk_contracts} high-risk contract${metrics.high_risk_contracts > 1 ? "s" : ""} require attention. ${metrics.expiring_soon > 0 ? `Additionally, ${metrics.expiring_soon} contract${metrics.expiring_soon > 1 ? "s are" : " is"} expiring soon.` : ""}`}
              </AIInsightPanel>
            )}

            {/* Trend indicator */}
            <GlassCard className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={15} style={{ color: "#10b981" }} />
                <p className="text-sm font-semibold" style={{ color: "#dae2fd" }}>Risk Score</p>
              </div>
              {metrics && (
                <>
                  <div
                    className="text-5xl font-bold mb-2"
                    style={{
                      color: metrics.high_risk_contracts === 0 ? "#34d399"
                        : metrics.high_risk_contracts > 3 ? "#f87171" : "#fbbf24",
                      fontFamily: "var(--font-mono,monospace)",
                    }}
                  >
                    {metrics.total_contracts === 0
                      ? "—"
                      : Math.round(100 - (metrics.high_risk_contracts / Math.max(metrics.total_contracts, 1)) * 100)
                    }
                    {metrics.total_contracts > 0 && (
                      <span className="text-lg ml-1" style={{ color: "#64748b" }}>/100</span>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: "#64748b" }}>
                    Portfolio health score based on risk distribution
                  </p>
                </>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
