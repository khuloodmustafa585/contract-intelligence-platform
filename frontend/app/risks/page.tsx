"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronRight, Filter, ShieldAlert } from "lucide-react";
import { api, Risk } from "@/services/api";
import { RiskTypeBadge, SeverityBadge } from "@/components/common/StatusBadge";
import AppShell from "@/components/layout/AppShell";

const SEVERITIES = ["all", "high", "medium", "low"] as const;
type SeverityFilter = (typeof SEVERITIES)[number];

export default function RisksPage() {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState<SeverityFilter>("all");

  useEffect(() => {
    api.risks()
      .then(setRisks)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = severity === "all"
    ? risks
    : risks.filter((r) => r.severity === severity);

  const counts = {
    all: risks.length,
    high: risks.filter((r) => r.severity === "high").length,
    medium: risks.filter((r) => r.severity === "medium").length,
    low: risks.filter((r) => r.severity === "low").length,
  };

  const severityOrder = { high: 0, medium: 1, low: 2 };
  const sorted = [...filtered].sort(
    (a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9)
  );

  return (
    <AppShell>
      <div className="page-header flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <ShieldAlert size={15} className="text-red-400" />
            <span className="text-xs font-medium uppercase tracking-widest text-red-400/70">
              Risk Intelligence
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">Risk Insights</h1>
          <p className="mt-1 text-sm text-slate-400">
            AI and rule-based issues detected across your contracts.
          </p>
        </div>

        {/* Severity filter */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500" />
          <div className="flex rounded-lg border border-[rgba(99,131,200,0.15)] overflow-hidden">
            {SEVERITIES.map((s) => (
              <button
                key={s}
                onClick={() => setSeverity(s)}
                className={`px-3 py-1.5 text-xs font-medium capitalize transition ${
                  severity === s
                    ? "bg-[rgba(59,130,246,0.2)] text-blue-300"
                    : "text-slate-500 hover:bg-[rgba(99,131,200,0.06)] hover:text-slate-300"
                }`}
              >
                {s}
                <span className="ml-1.5 rounded-full bg-[rgba(99,131,200,0.1)] px-1.5 py-0.5 text-[10px]">
                  {counts[s]}
                </span>
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

      {/* Summary bar */}
      {!loading && risks.length > 0 && (
        <div className="mb-5 grid grid-cols-3 gap-3">
          {(["high", "medium", "low"] as const).map((s) => {
            const c = counts[s];
            return (
              <button
                key={s}
                onClick={() => setSeverity(s === severity ? "all" : s)}
                className={`
                  rounded-xl border p-4 text-left transition-all
                  ${s === "high" ? "border-red-500/20 bg-[rgba(239,68,68,0.05)]" :
                    s === "medium" ? "border-amber-500/20 bg-[rgba(245,158,11,0.05)]" :
                    "border-emerald-500/20 bg-[rgba(34,197,94,0.05)]"}
                  ${severity === s ? "ring-1 ring-inset ring-blue-500/30" : "hover:border-opacity-40"}
                `}
              >
                <p className="text-2xl font-bold text-white">{c}</p>
                <p className="mt-1 text-xs capitalize text-slate-400">{s} risk{c !== 1 ? "s" : ""}</p>
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(6)].map((_, i) => <div key={i} className="h-32 skeleton rounded-2xl" />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <AlertTriangle size={36} className="mb-3 text-slate-700" />
          <p className="text-sm text-slate-500">
            {severity !== "all" ? `No ${severity} risks found.` : "No risks identified yet."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sorted.map((risk) => (
            <Link
              key={risk.id}
              href={`/contracts/${risk.contract_id}`}
              className="group rounded-2xl border border-[rgba(99,131,200,0.1)] bg-[#0d1528] p-5 transition-all hover:border-[rgba(99,131,200,0.25)] hover:shadow-lg hover:shadow-black/20"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <SeverityBadge severity={risk.severity} />
                  <RiskTypeBadge type={risk.risk_type} />
                </div>
                <ChevronRight
                  size={15}
                  className="flex-shrink-0 text-slate-700 transition group-hover:text-blue-400"
                />
              </div>

              <h2 className="text-sm font-semibold text-slate-200 leading-snug">
                {risk.title}
              </h2>

              {risk.explanation && (
                <p className="mt-2 text-xs text-slate-500 line-clamp-3">{risk.explanation}</p>
              )}

              {risk.suggested_action && (
                <div className="mt-3 rounded-lg border border-blue-500/15 bg-[rgba(59,130,246,0.05)] px-3 py-2 text-xs text-blue-400/80 line-clamp-2">
                  {risk.suggested_action}
                </div>
              )}

              {risk.source_snippet && (
                <blockquote className="mt-3 border-l-2 border-[rgba(99,131,200,0.2)] pl-3 text-xs italic text-slate-600 line-clamp-2">
                  {risk.source_snippet}
                </blockquote>
              )}
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
