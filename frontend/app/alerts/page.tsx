"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CalendarDays,
  CheckCheck,
  ChevronRight,
  Clock,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";
import { api, Alert } from "@/services/api";
import AppShell from "@/components/layout/AppShell";

const ALERT_ICONS: Record<string, React.ElementType> = {
  expiring_soon:     CalendarDays,
  renewal_upcoming:  Clock,
  due_soon:          Clock,
  overdue:           TriangleAlert,
  high_risk:         ShieldAlert,
};

const ALERT_COLORS: Record<string, string> = {
  expiring_soon:    "text-amber-400 border-amber-500/20 bg-[rgba(245,158,11,0.06)]",
  renewal_upcoming: "text-indigo-400 border-indigo-500/20 bg-[rgba(99,102,241,0.06)]",
  due_soon:         "text-amber-400 border-amber-500/20 bg-[rgba(245,158,11,0.06)]",
  overdue:          "text-red-400 border-red-500/20 bg-[rgba(239,68,68,0.06)]",
  high_risk:        "text-red-400 border-red-500/20 bg-[rgba(239,68,68,0.06)]",
};

type ReadFilter = "all" | "unread" | "read";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReadFilter>("all");
  const [marking, setMarking] = useState<number | null>(null);

  async function load() {
    const data = await api.alerts();
    setAlerts(data);
  }

  useEffect(() => {
    load()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function markRead(id: number) {
    setMarking(id);
    try {
      await api.markAlertRead(id);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "read" } : a))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark read");
    } finally {
      setMarking(null);
    }
  }

  async function markAllRead() {
    const unread = alerts.filter((a) => a.status === "unread");
    for (const a of unread) {
      await api.markAlertRead(a.id).catch(() => {});
    }
    await load();
  }

  const filtered = filter === "all" ? alerts : alerts.filter((a) => a.status === filter);
  const unreadCount = alerts.filter((a) => a.status === "unread").length;

  return (
    <AppShell>
      <div className="page-header flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Bell size={15} className="text-amber-400" />
            <span className="text-xs font-medium uppercase tracking-widest text-amber-400/70">
              Notifications
            </span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm shadow-red-500/40">
                {unreadCount}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white">Alerts</h1>
          <p className="mt-1 text-sm text-slate-400">
            Deadline, renewal, overdue, and high-risk notifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="btn-ghost flex items-center gap-2 text-xs"
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
          <div className="flex rounded-lg border border-[rgba(99,131,200,0.15)] overflow-hidden">
            {(["all", "unread", "read"] as ReadFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium capitalize transition ${
                  filter === f
                    ? "bg-[rgba(59,130,246,0.2)] text-blue-300"
                    : "text-slate-500 hover:bg-[rgba(99,131,200,0.06)] hover:text-slate-300"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-500/20 bg-[rgba(239,68,68,0.08)] px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Bell size={36} className="mb-3 text-slate-700" />
          <p className="text-sm text-slate-500">
            {filter !== "all" ? `No ${filter} alerts.` : "No alerts yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => {
            const Icon = ALERT_ICONS[alert.alert_type] ?? Bell;
            const colorCls = ALERT_COLORS[alert.alert_type] ?? "text-slate-400 border-[rgba(99,131,200,0.1)] bg-[rgba(99,131,200,0.03)]";
            const isUnread = alert.status === "unread";
            return (
              <div
                key={alert.id}
                className={`
                  flex items-start justify-between gap-4 rounded-2xl border p-4 transition-all
                  ${isUnread ? colorCls : "border-[rgba(99,131,200,0.08)] bg-[rgba(99,131,200,0.02)] opacity-60"}
                `}
              >
                <Link
                  href={`/contracts/${alert.contract_id}`}
                  className="flex min-w-0 flex-1 items-start gap-3 group"
                >
                  <div className={`mt-0.5 flex-shrink-0 ${isUnread ? "" : "opacity-40"}`}>
                    <Icon size={16} className={isUnread ? colorCls.split(" ")[0] : "text-slate-600"} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors">
                        {alert.title}
                      </p>
                      {isUnread && (
                        <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400" />
                      )}
                    </div>
                    {alert.message && (
                      <p className="mt-1 text-xs text-slate-500">{alert.message}</p>
                    )}
                    {alert.trigger_date && (
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-600">
                        <CalendarDays size={10} /> {alert.trigger_date}
                      </div>
                    )}
                  </div>
                </Link>

                <div className="flex flex-shrink-0 items-center gap-2">
                  <span className="hidden text-[10px] uppercase tracking-wider text-slate-600 sm:block">
                    {alert.alert_type.replace(/_/g, " ")}
                  </span>
                  <Link
                    href={`/contracts/${alert.contract_id}`}
                    className="rounded-lg border border-[rgba(99,131,200,0.1)] p-1.5 text-slate-600 transition hover:border-blue-500/30 hover:text-blue-400"
                  >
                    <ChevronRight size={13} />
                  </Link>
                  {isUnread && (
                    <button
                      onClick={() => markRead(alert.id)}
                      disabled={marking === alert.id}
                      className="rounded-lg border border-[rgba(99,131,200,0.1)] px-2.5 py-1.5 text-xs text-slate-500 transition hover:border-emerald-500/30 hover:text-emerald-400 disabled:opacity-40"
                    >
                      {marking === alert.id ? "…" : "Read"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
