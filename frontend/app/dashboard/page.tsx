"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  Clock,
  FileText,
  Plus,
  TrendingUp,
  Zap,
} from "lucide-react";
import { api, DashboardMetrics } from "@/services/api";
import { StatusBadge } from "@/components/common/StatusBadge";
import AppShell from "@/components/layout/AppShell";

function MetricCard({
  label,
  value,
  icon: Icon,
  accent,
  href,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accent: string;
  href?: string;
}) {
  const content = (
    <div
      className={`
        group relative overflow-hidden rounded-2xl border p-5 transition-all duration-200
        bg-[#0d1528] border-[rgba(99,131,200,0.12)]
        hover:border-[rgba(99,131,200,0.25)] hover:shadow-lg
      `}
    >
      <div className={`absolute right-0 top-0 h-24 w-24 rounded-full blur-3xl opacity-20 ${accent}`} />
      <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${accent} bg-opacity-10`}>
        <Icon size={19} className="text-current opacity-80" />
      </div>
      <p className="text-3xl font-bold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-400">{label}</p>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : <div>{content}</div>;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard()
      .then(setMetrics)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Total Contracts",   value: metrics?.total_contracts ?? 0,    icon: FileText,      accent: "bg-blue-500 text-blue-400",    href: "/contracts" },
    { label: "High Risk",         value: metrics?.high_risk_contracts ?? 0, icon: AlertTriangle, accent: "bg-red-500 text-red-400",     href: "/risks" },
    { label: "Expiring Soon",     value: metrics?.expiring_soon ?? 0,       icon: Clock,         accent: "bg-amber-500 text-amber-400" },
    { label: "Unread Alerts",     value: metrics?.unread_alerts ?? 0,       icon: Bell,          accent: "bg-violet-500 text-violet-400", href: "/alerts" },
  ];

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 page-header">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Zap size={15} className="text-blue-400" />
            <span className="text-xs font-medium uppercase tracking-widest text-blue-400/70">
              Live Intelligence
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            Contract analytics, deadlines, and processing activity.
          </p>
        </div>
        <Link
          href="/upload"
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Upload Contract
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-[rgba(239,68,68,0.08)] px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Metric cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 skeleton rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {cards.map((c) => (
            <MetricCard key={c.label} {...c} />
          ))}
        </div>
      )}

      {/* Lower section */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Recent uploads */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[rgba(99,131,200,0.1)] px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-200">Recent Uploads</h2>
            <Link href="/contracts" className="text-xs text-blue-400 hover:underline">
              View all →
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3 p-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 skeleton rounded-lg" />
              ))}
            </div>
          ) : metrics?.recent_uploads?.length ? (
            <div className="divide-y divide-[rgba(99,131,200,0.07)]">
              {metrics.recent_uploads.map((contract) => (
                <Link
                  key={contract.id}
                  href={`/contracts/${contract.id}`}
                  className="flex items-center justify-between px-5 py-3.5 transition hover:bg-[rgba(99,131,200,0.04)]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText size={15} className="flex-shrink-0 text-slate-500" />
                    <span className="truncate text-sm text-slate-200">{contract.title}</span>
                  </div>
                  <div className="ml-4 flex flex-shrink-0 items-center gap-3">
                    <StatusBadge status={contract.status} />
                    <span className="text-xs text-slate-500">
                      {contract.created_at
                        ? new Date(contract.created_at).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="p-6 text-sm text-slate-500">
              No contracts uploaded yet.{" "}
              <Link href="/upload" className="text-blue-400 hover:underline">
                Upload one now →
              </Link>
            </p>
          )}
        </div>

        {/* Deadlines + stats */}
        <div className="space-y-4">
          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp size={15} className="text-blue-400" />
              <h2 className="text-sm font-semibold text-slate-200">Deadlines</h2>
            </div>
            <div className="space-y-3">
              {[
                {
                  label: "Upcoming obligations",
                  value: metrics?.upcoming_obligations ?? 0,
                  accent: "text-amber-400",
                  href: "/obligations",
                },
                {
                  label: "Overdue obligations",
                  value: metrics?.overdue_obligations ?? 0,
                  accent: "text-red-400",
                  href: "/obligations",
                },
                {
                  label: "Overdue contracts",
                  value: metrics?.overdue_contracts ?? 0,
                  accent: "text-red-300",
                  href: "/contracts",
                },
              ].map(({ label, value, accent, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center justify-between rounded-lg border border-[rgba(99,131,200,0.07)] bg-[rgba(13,21,40,0.5)] px-4 py-3 text-sm transition hover:border-[rgba(99,131,200,0.15)]"
                >
                  <span className="text-slate-400">{label}</span>
                  <span className={`font-semibold ${accent}`}>{value}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Zap size={15} className="text-indigo-400" />
              <h2 className="text-sm font-semibold text-slate-200">Quick Actions</h2>
            </div>
            <div className="space-y-2">
              <Link href="/upload" className="btn-ghost flex w-full items-center justify-center gap-2 text-sm">
                <Plus size={15} /> Upload Contract
              </Link>
              <Link href="/ask-ai" className="btn-ghost flex w-full items-center justify-center gap-2 text-sm">
                <Zap size={15} /> Ask AI a Question
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
