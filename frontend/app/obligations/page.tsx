"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, CheckSquare, ChevronRight, Clock } from "lucide-react";
import { api, Obligation } from "@/services/api";
import AppShell from "@/components/layout/AppShell";

type StatusFilter = "all" | "pending" | "overdue" | "completed";

function dueDateLabel(due_date: string | null | undefined): { label: string; cls: string } {
  if (!due_date) return { label: "No due date", cls: "text-slate-600" };
  const d = new Date(due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, cls: "text-red-400" };
  if (diff === 0) return { label: "Due today", cls: "text-amber-400 font-semibold" };
  if (diff <= 7) return { label: `Due in ${diff}d`, cls: "text-amber-400" };
  if (diff <= 30) return { label: `Due in ${diff}d`, cls: "text-yellow-500/80" };
  return { label: d.toLocaleDateString(), cls: "text-slate-400" };
}

export default function ObligationsPage() {
  const [items, setItems] = useState<Obligation[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    api.obligations()
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? items : items.filter((i) => {
    if (filter === "overdue") {
      return i.status === "overdue" || (i.due_date && new Date(i.due_date) < new Date());
    }
    return i.status === filter;
  });

  const counts = {
    all: items.length,
    pending: items.filter((i) => i.status === "pending").length,
    overdue: items.filter((i) => i.status === "overdue" || (i.due_date && new Date(i.due_date) < new Date())).length,
    completed: items.filter((i) => i.status === "completed").length,
  };

  const FILTERS: { key: StatusFilter; label: string; accent: string }[] = [
    { key: "all",       label: "All",       accent: "" },
    { key: "pending",   label: "Pending",   accent: "text-amber-400" },
    { key: "overdue",   label: "Overdue",   accent: "text-red-400" },
    { key: "completed", label: "Completed", accent: "text-emerald-400" },
  ];

  return (
    <AppShell>
      <div className="page-header flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <CheckSquare size={15} className="text-amber-400" />
            <span className="text-xs font-medium uppercase tracking-widest text-amber-400/70">
              Obligation Tracker
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">Obligations</h1>
          <p className="mt-1 text-sm text-slate-400">
            Action items extracted from analyzed agreements.
          </p>
        </div>

        <div className="flex rounded-lg border border-[rgba(99,131,200,0.15)] overflow-hidden">
          {FILTERS.map(({ key, label, accent }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                filter === key
                  ? "bg-[rgba(59,130,246,0.2)] text-blue-300"
                  : "text-slate-500 hover:bg-[rgba(99,131,200,0.06)] hover:text-slate-300"
              }`}
            >
              {label}
              <span className={`ml-1.5 rounded-full bg-[rgba(99,131,200,0.1)] px-1.5 py-0.5 text-[10px] ${accent}`}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-500/20 bg-[rgba(239,68,68,0.08)] px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <CheckSquare size={36} className="mb-3 text-slate-700" />
          <p className="text-sm text-slate-500">
            {filter !== "all" ? `No ${filter} obligations.` : "No obligations extracted yet."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[rgba(99,131,200,0.1)] bg-[#0d1528]">
          <div className="divide-y divide-[rgba(99,131,200,0.07)]">
            {filtered.map((item) => {
              const { label: dueLabel, cls: dueCls } = dueDateLabel(item.due_date);
              const isOverdue = item.due_date && new Date(item.due_date) < new Date();
              return (
                <Link
                  key={item.id}
                  href={`/contracts/${item.contract_id}`}
                  className="group flex flex-wrap items-start justify-between gap-4 px-5 py-4 transition hover:bg-[rgba(99,131,200,0.03)]"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className={`mt-0.5 flex-shrink-0 ${
                      item.status === "completed" ? "text-emerald-400" :
                      isOverdue ? "text-red-400" : "text-amber-400/60"
                    }`}>
                      <CheckSquare size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200 leading-snug">{item.title}</p>
                      {item.description && (
                        <p className="mt-1 text-xs text-slate-500 line-clamp-2">{item.description}</p>
                      )}
                      {item.owner && (
                        <p className="mt-1 text-xs text-slate-600">Owner: {item.owner}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs">
                      {isOverdue ? (
                        <Clock size={12} className="text-red-400" />
                      ) : (
                        <CalendarDays size={12} className="text-slate-600" />
                      )}
                      <span className={dueCls}>{dueLabel}</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-700 transition group-hover:text-blue-400" />
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="border-t border-[rgba(99,131,200,0.07)] px-5 py-3 text-xs text-slate-600">
            {filtered.length} obligation{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </AppShell>
  );
}
