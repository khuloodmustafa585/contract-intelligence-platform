"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Clock,
  FileText,
  TrendingUp,
} from "lucide-react";
import { api, AnalyticsCharts, DashboardMetrics } from "@/services/api";
import AppShell from "@/components/layout/AppShell";

function SimpleBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 flex-shrink-0 truncate text-xs text-slate-400 capitalize">{label.replace(/_/g, " ")}</div>
      <div className="flex-1 overflow-hidden rounded-full bg-[rgba(99,131,200,0.08)] h-2">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-8 text-right text-xs font-medium text-slate-300">{value}</div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [charts, setCharts] = useState<AnalyticsCharts | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.dashboard(), api.charts()])
      .then(([m, c]) => { setMetrics(m); setCharts(c); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const metricCards = [
    { label: "Total Contracts",   value: metrics?.total_contracts ?? 0,    icon: FileText,      color: "text-blue-400" },
    { label: "High Risk",         value: metrics?.high_risk_contracts ?? 0, icon: AlertTriangle, color: "text-red-400" },
    { label: "Expiring Soon",     value: metrics?.expiring_soon ?? 0,       icon: Clock,         color: "text-amber-400" },
    { label: "Unread Alerts",     value: metrics?.unread_alerts ?? 0,       icon: Bell,          color: "text-violet-400" },
    { label: "Upcoming Obligs.",  value: metrics?.upcoming_obligations ?? 0,icon: TrendingUp,    color: "text-emerald-400" },
    { label: "Overdue Obligs.",   value: metrics?.overdue_obligations ?? 0, icon: Clock,         color: "text-red-400" },
  ];

  const maxRiskSeverity = Math.max(0, ...(charts?.risk_by_severity.map((r) => r.value) ?? []));
  const maxRiskType     = Math.max(0, ...(charts?.risk_by_type.map((r) => r.value) ?? []));
  const maxContractStatus = Math.max(0, ...(charts?.contract_by_status.map((r) => r.value) ?? []));
  const maxObligStatus  = Math.max(0, ...(charts?.obligation_by_status.map((r) => r.value) ?? []));

  const severityColors: Record<string, string> = {
    high: "bg-red-500", medium: "bg-amber-500", low: "bg-emerald-500",
  };
  const typeColors = ["bg-blue-500", "bg-violet-500", "bg-indigo-500", "bg-teal-500", "bg-rose-500"];
  const statusColors: Record<string, string> = {
    completed: "bg-emerald-500", failed: "bg-red-500", processing: "bg-blue-500",
    parsed: "bg-teal-500", indexing: "bg-violet-500", analysis_pending: "bg-indigo-500",
    uploaded: "bg-slate-400",
  };

  return (
    <AppShell>
      <div className="page-header">
        <div className="mb-1 flex items-center gap-2">
          <BarChart3 size={15} className="text-blue-400" />
          <span className="text-xs font-medium uppercase tracking-widest text-blue-400/70">
            Insights
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="mt-1 text-sm text-slate-400">
          Operational view of contract risk, deadlines, and processing volume.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-500/20 bg-[rgba(239,68,68,0.08)] px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* KPI row */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 mb-6">
          {[...Array(6)].map((_, i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 mb-6">
          {metricCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl border border-[rgba(99,131,200,0.1)] bg-[#0d1528] p-5">
              <Icon size={16} className={color} />
              <p className="mt-3 text-3xl font-bold text-white">{value}</p>
              <p className="mt-1 text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts grid */}
      {loading ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-48 skeleton rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">

          {/* Risk by severity */}
          <div className="rounded-2xl border border-[rgba(99,131,200,0.1)] bg-[#0d1528] p-5">
            <h3 className="mb-4 text-sm font-semibold text-slate-200">Risk by Severity</h3>
            {(charts?.risk_by_severity.length ?? 0) === 0 ? (
              <p className="text-xs text-slate-600">No risk data yet.</p>
            ) : (
              <div className="space-y-3">
                {charts!.risk_by_severity.map((row) => (
                  <SimpleBar
                    key={row.label}
                    label={row.label}
                    value={row.value}
                    max={maxRiskSeverity}
                    color={severityColors[row.label] ?? "bg-slate-500"}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Risk by type */}
          <div className="rounded-2xl border border-[rgba(99,131,200,0.1)] bg-[#0d1528] p-5">
            <h3 className="mb-4 text-sm font-semibold text-slate-200">Risk by Type</h3>
            {(charts?.risk_by_type.length ?? 0) === 0 ? (
              <p className="text-xs text-slate-600">No risk data yet.</p>
            ) : (
              <div className="space-y-3">
                {charts!.risk_by_type.map((row, i) => (
                  <SimpleBar
                    key={row.label}
                    label={row.label}
                    value={row.value}
                    max={maxRiskType}
                    color={typeColors[i % typeColors.length]}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Contract by status */}
          <div className="rounded-2xl border border-[rgba(99,131,200,0.1)] bg-[#0d1528] p-5">
            <h3 className="mb-4 text-sm font-semibold text-slate-200">Contracts by Status</h3>
            {(charts?.contract_by_status.length ?? 0) === 0 ? (
              <p className="text-xs text-slate-600">No contract data yet.</p>
            ) : (
              <div className="space-y-3">
                {charts!.contract_by_status.map((row) => (
                  <SimpleBar
                    key={row.label}
                    label={row.label}
                    value={row.value}
                    max={maxContractStatus}
                    color={statusColors[row.label] ?? "bg-slate-500"}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Obligation by status */}
          <div className="rounded-2xl border border-[rgba(99,131,200,0.1)] bg-[#0d1528] p-5">
            <h3 className="mb-4 text-sm font-semibold text-slate-200">Obligations by Status</h3>
            {(charts?.obligation_by_status.length ?? 0) === 0 ? (
              <p className="text-xs text-slate-600">No obligation data yet.</p>
            ) : (
              <div className="space-y-3">
                {charts!.obligation_by_status.map((row) => (
                  <SimpleBar
                    key={row.label}
                    label={row.label}
                    value={row.value}
                    max={maxObligStatus}
                    color={statusColors[row.label] ?? "bg-amber-500"}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Upload activity */}
          {(charts?.upload_activity.length ?? 0) > 0 && (
            <div className="rounded-2xl border border-[rgba(99,131,200,0.1)] bg-[#0d1528] p-5 lg:col-span-2">
              <h3 className="mb-4 text-sm font-semibold text-slate-200">Upload Activity (Last 14 Days)</h3>
              <div className="flex items-end gap-1.5 h-24">
                {(() => {
                  const maxCount = Math.max(1, ...charts!.upload_activity.map((r) => r.count));
                  return charts!.upload_activity.map((row) => (
                    <div key={row.day} className="flex flex-1 flex-col items-center gap-1 group">
                      <div
                        className="w-full rounded-t bg-blue-500/60 transition-all duration-500 group-hover:bg-blue-500"
                        style={{ height: `${Math.max(4, (row.count / maxCount) * 88)}px` }}
                        title={`${row.day}: ${row.count} upload${row.count !== 1 ? "s" : ""}`}
                      />
                      <span className="text-[8px] text-slate-700 truncate w-full text-center">
                        {row.day.slice(5)}
                      </span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Link to contracts */}
      <div className="mt-6 text-center">
        <Link href="/contracts" className="text-sm text-blue-400 hover:underline">
          View all contracts →
        </Link>
      </div>
    </AppShell>
  );
}
