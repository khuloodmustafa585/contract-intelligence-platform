"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, AlertCircle, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import GlassCard from "@/components/ui/GlassCard";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api, Alert } from "@/services/api";

const TYPE_MAP: Record<string, { color: string; bg: string; border: string }> = {
  expiry:    { color: "#f87171", bg: "rgba(239,68,68,0.10)",  border: "rgba(239,68,68,0.20)"  },
  renewal:   { color: "#fbbf24", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.20)" },
  overdue:   { color: "#f87171", bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.16)"  },
  deadline:  { color: "#fbbf24", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.16)" },
  high_risk: { color: "#f87171", bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.16)"  },
};
const DEFAULT_TYPE = { color: "#818cf8", bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.16)" };

export default function AlertsPage() {
  const [alerts, setAlerts]   = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  async function load() {
    const data = await api.alerts();
    setAlerts(data);
  }

  useEffect(() => {
    let active = true;
    api.alerts()
      .then((data) => { if (active) setAlerts(data); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const unread = alerts.filter((a) => a.status !== "read");
  const read   = alerts.filter((a) => a.status === "read");

  function markRead(id: number) {
    api.markAlertRead(id).then(load).catch(() => undefined);
  }

  return (
    <AppShell>
      <div className="px-8 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1 w-6 rounded-full" style={{ background: "linear-gradient(90deg, #6366f1, #ef4444)" }} />
              <span className="font-mono-label" style={{ color: "#6366f1", fontSize: "0.65rem" }}>Notification Center</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#dae2fd" }}>Alerts</h1>
            <p className="mt-1 text-sm" style={{ color: "#64748b" }}>
              Deadline, renewal, overdue, and risk notifications across your portfolio.
            </p>
          </div>
          {unread.length > 0 && (
            <div
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold"
              style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.20)", color: "#f87171" }}
            >
              <Bell size={14} />
              {unread.length} unread
            </div>
          )}
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.20)", color: "#f87171" }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {loading ? (
          <LoadingState rows={5} type="list" />
        ) : alerts.length === 0 ? (
          <GlassCard>
            <EmptyState
              icon={CheckCircle2}
              title="All clear"
              description="No alerts to display. Your portfolio is up to date."
            />
          </GlassCard>
        ) : (
          <div className="space-y-5">
            {/* Unread */}
            {unread.length > 0 && (
              <div>
                <p className="font-mono-label mb-3" style={{ color: "#6366f1", fontSize: "0.62rem" }}>
                  Unread — {unread.length}
                </p>
                <GlassCard>
                  {unread.map((alert, i) => {
                    const t = TYPE_MAP[alert.alert_type?.toLowerCase()] ?? DEFAULT_TYPE;
                    return (
                      <div
                        key={alert.id}
                        className="flex items-start gap-4 px-6 py-4 animate-fade-up"
                        style={{
                          animationDelay: `${i * 40}ms`,
                          borderBottom: i < unread.length - 1 ? "1px solid rgba(99,102,241,0.07)" : "none",
                        }}
                      >
                        <div
                          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                          style={{ background: t.bg, border: `1px solid ${t.border}` }}
                        >
                          <Bell size={14} style={{ color: t.color }} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <p className="text-sm font-semibold" style={{ color: "#dae2fd" }}>
                              {alert.title}
                            </p>
                            <span
                              className="shrink-0 font-mono-label rounded-md px-2 py-0.5 uppercase"
                              style={{ background: t.bg, color: t.color, border: `1px solid ${t.border}`, fontSize: "0.6rem" }}
                            >
                              {alert.alert_type}
                            </span>
                          </div>
                          {alert.message && (
                            <p className="text-xs mb-2" style={{ color: "#64748b" }}>{alert.message}</p>
                          )}
                          {alert.trigger_date && (
                            <p className="flex items-center gap-1 text-xs" style={{ color: "#f59e0b" }}>
                              <Clock size={10} />
                              {new Date(alert.trigger_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Link
                            href={`/contracts/${alert.contract_id}`}
                            className="flex h-7 w-7 items-center justify-center rounded-lg transition-all hover:bg-[rgba(99,102,241,0.10)]"
                            style={{ border: "1px solid rgba(99,102,241,0.14)" }}
                          >
                            <ExternalLink size={11} style={{ color: "#818cf8" }} />
                          </Link>
                          <button
                            onClick={() => markRead(alert.id)}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all hover:bg-[rgba(16,185,129,0.10)]"
                            style={{ border: "1px solid rgba(16,185,129,0.18)", color: "#34d399" }}
                          >
                            Mark read
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </GlassCard>
              </div>
            )}

            {/* Read */}
            {read.length > 0 && (
              <div>
                <p className="font-mono-label mb-3" style={{ color: "#3a4560", fontSize: "0.62rem" }}>
                  Read — {read.length}
                </p>
                <GlassCard style={{ opacity: 0.6 }}>
                  {read.map((alert, i) => (
                    <Link
                      key={alert.id}
                      href={`/contracts/${alert.contract_id}`}
                      className="flex items-center gap-4 px-6 py-3 transition-all hover:opacity-80"
                      style={{ borderBottom: i < read.length - 1 ? "1px solid rgba(99,102,241,0.07)" : "none" }}
                    >
                      <CheckCircle2 size={14} style={{ color: "#3a4560" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate" style={{ color: "#64748b" }}>{alert.title}</p>
                      </div>
                    </Link>
                  ))}
                </GlassCard>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
