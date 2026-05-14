"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert, AlertCircle, FileText } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import GlassCard from "@/components/ui/GlassCard";
import RiskBadge from "@/components/ui/RiskBadge";
import AIInsightPanel from "@/components/ui/AIInsightPanel";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api, Risk } from "@/services/api";

export default function RisksPage() {
  const [risks, setRisks]   = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    api.risks()
      .then(setRisks)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const highCount   = risks.filter((r) => r.severity?.toLowerCase() === "high" || r.severity?.toLowerCase() === "critical").length;
  const mediumCount = risks.filter((r) => r.severity?.toLowerCase() === "medium" || r.severity?.toLowerCase() === "moderate").length;
  const lowCount    = risks.filter((r) => r.severity?.toLowerCase() === "low").length;

  return (
    <AppShell>
      <div className="px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1 w-6 rounded-full" style={{ background: "linear-gradient(90deg, #ef4444, #f59e0b)" }} />
            <span className="font-mono-label" style={{ color: "#ef4444", fontSize: "0.65rem" }}>Risk Intelligence</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#dae2fd" }}>Risk Insights</h1>
          <p className="mt-1 text-sm" style={{ color: "#64748b" }}>
            AI-detected risk clauses and compliance issues across your contract portfolio.
          </p>
        </div>

        {/* Stats */}
        {!loading && risks.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Critical / High", value: highCount,   color: "#f87171", bg: "rgba(239,68,68,0.10)"  },
              { label: "Medium",          value: mediumCount, color: "#fbbf24", bg: "rgba(245,158,11,0.10)" },
              { label: "Low",             value: lowCount,    color: "#34d399", bg: "rgba(16,185,129,0.10)" },
            ].map(({ label, value, color, bg }) => (
              <div
                key={label}
                className="rounded-2xl p-5 animate-fade-up"
                style={{ background: bg, border: `1px solid ${color}25` }}
              >
                <p className="font-mono-label mb-1" style={{ color, fontSize: "0.62rem" }}>{label}</p>
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
          <LoadingState rows={4} type="cards" />
        ) : risks.length === 0 ? (
          <GlassCard>
            <EmptyState
              icon={ShieldAlert}
              title="No risks detected"
              description="Upload and analyze contracts to discover risk clauses."
              action={{ label: "Upload Contract", href: "/upload" }}
            />
          </GlassCard>
        ) : (
          <>
            {risks.length > 0 && (
              <div className="mb-5">
                <AIInsightPanel title="Risk Summary">
                  {highCount > 0
                    ? `${highCount} high-severity risk${highCount > 1 ? "s" : ""} detected requiring immediate attention. Review and remediate before contract execution.`
                    : "No critical risks detected. Continue monitoring for clause changes during negotiations."}
                </AIInsightPanel>
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              {risks.map((risk, i) => (
                <Link
                  key={risk.id}
                  href={`/contracts/${risk.contract_id}`}
                  className="group block rounded-2xl p-5 transition-all duration-200 animate-fade-up hover:scale-[1.01]"
                  style={{
                    animationDelay: `${i * 40}ms`,
                    background: "rgba(19,27,46,0.7)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(99,102,241,0.12)",
                  }}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-2">
                      <ShieldAlert size={15} style={{ color: "#f87171", marginTop: "2px" }} />
                      <h2 className="text-sm font-semibold leading-snug transition-colors group-hover:text-[#818cf8]" style={{ color: "#dae2fd" }}>
                        {risk.title}
                      </h2>
                    </div>
                    <RiskBadge level={risk.severity} />
                  </div>
                  {risk.explanation && (
                    <p className="text-xs leading-relaxed mb-3" style={{ color: "#64748b" }}>
                      {risk.explanation}
                    </p>
                  )}
                  {risk.source_snippet && (
                    <blockquote
                      className="rounded-lg px-3 py-2 text-xs italic border-l-2"
                      style={{
                        background: "rgba(99,102,241,0.05)",
                        borderLeftColor: "rgba(99,102,241,0.3)",
                        color: "#94a3b8",
                      }}
                    >
                      "{risk.source_snippet.slice(0, 120)}..."
                    </blockquote>
                  )}
                  <div className="mt-3 flex items-center gap-1.5 text-xs" style={{ color: "#3a4560" }}>
                    <FileText size={10} />
                    Contract #{risk.contract_id}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
