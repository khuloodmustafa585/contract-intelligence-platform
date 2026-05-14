"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api, Obligation } from "@/services/api";

function isOverdue(dueDate?: string | null) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

export default function ObligationsPage() {
  const [items, setItems]     = useState<Obligation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    api.obligations()
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const overdue  = items.filter((i) => isOverdue(i.due_date));
  const upcoming = items.filter((i) => !isOverdue(i.due_date) && i.due_date);
  const noDue    = items.filter((i) => !i.due_date);

  return (
    <AppShell>
      <div className="px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1 w-6 rounded-full" style={{ background: "linear-gradient(90deg, #f59e0b, #22d3ee)" }} />
            <span className="font-mono-label" style={{ color: "#f59e0b", fontSize: "0.65rem" }}>Contract Obligations</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#dae2fd" }}>Obligations</h1>
          <p className="mt-1 text-sm" style={{ color: "#64748b" }}>
            AI-extracted action items, deadlines, and performance obligations from your contracts.
          </p>
        </div>

        {!loading && items.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Overdue",  value: overdue.length,  color: "#f87171", bg: "rgba(239,68,68,0.10)",  icon: AlertCircle },
              { label: "Upcoming", value: upcoming.length, color: "#fbbf24", bg: "rgba(245,158,11,0.10)", icon: Clock        },
              { label: "No Deadline", value: noDue.length, color: "#818cf8", bg: "rgba(99,102,241,0.10)", icon: CheckCircle2 },
            ].map(({ label, value, color, bg, icon: Icon }) => (
              <div
                key={label}
                className="rounded-2xl p-5 animate-fade-up"
                style={{ background: bg, border: `1px solid ${color}25` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={14} style={{ color }} />
                  <p className="font-mono-label" style={{ color, fontSize: "0.62rem" }}>{label}</p>
                </div>
                <p className="text-3xl font-bold tabular-nums" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.20)", color: "#f87171" }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {loading ? (
          <LoadingState rows={5} type="list" />
        ) : items.length === 0 ? (
          <GlassCard>
            <EmptyState
              icon={ClipboardList}
              title="No obligations extracted"
              description="Analyze contracts to extract obligations and action items."
              action={{ label: "Upload Contract", href: "/upload" }}
            />
          </GlassCard>
        ) : (
          <GlassCard>
            <div>
              {items.map((item, i) => {
                const overdue = isOverdue(item.due_date);
                return (
                  <Link
                    key={item.id}
                    href={`/contracts/${item.contract_id}`}
                    className="group flex flex-wrap items-start justify-between gap-4 px-6 py-4 transition-all hover:bg-[rgba(99,102,241,0.04)] animate-fade-up"
                    style={{
                      animationDelay: `${i * 30}ms`,
                      borderBottom: i < items.length - 1 ? "1px solid rgba(99,102,241,0.07)" : "none",
                    }}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                        style={{
                          background: overdue ? "rgba(239,68,68,0.10)" : "rgba(99,102,241,0.10)",
                          border: `1px solid ${overdue ? "rgba(239,68,68,0.20)" : "rgba(99,102,241,0.16)"}`,
                        }}
                      >
                        <ClipboardList size={12} style={{ color: overdue ? "#f87171" : "#818cf8" }} />
                      </div>
                      <div className="min-w-0">
                        <h2
                          className="text-sm font-semibold mb-1 transition-colors group-hover:text-[#818cf8]"
                          style={{ color: "#dae2fd" }}
                        >
                          {item.title}
                        </h2>
                        {item.description && (
                          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "#64748b" }}>
                            {item.description}
                          </p>
                        )}
                        {item.owner && (
                          <div className="mt-1.5 flex items-center gap-1 text-xs" style={{ color: "#3a4560" }}>
                            <User size={10} /> {item.owner}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <StatusBadge status={item.status} />
                      {item.due_date && (
                        <div
                          className="flex items-center gap-1 text-xs font-medium"
                          style={{ color: overdue ? "#f87171" : "#fbbf24" }}
                        >
                          <Calendar size={11} />
                          {new Date(item.due_date).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                          })}
                          {overdue && <span className="ml-1">· Overdue</span>}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </GlassCard>
        )}
      </div>
    </AppShell>
  );
}
