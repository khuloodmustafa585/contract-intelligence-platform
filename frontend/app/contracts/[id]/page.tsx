"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  RefreshCw,
  Send,
  Sparkles,
  ShieldAlert,
  ClipboardList,
  Bell,
  FileText,
  ChevronLeft,
  AlertCircle,
  Bot,
  CheckCircle2,
  Calendar,
  Hash,
  Loader2,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import RiskBadge from "@/components/ui/RiskBadge";
import AIInsightPanel from "@/components/ui/AIInsightPanel";
import AIProcessingIndicator from "@/components/ui/AIProcessingIndicator";
import { api, Clause, ContractDetail, Risk } from "@/services/api";

type PanelKey = "summary" | "risks" | "obligations" | "alerts" | "ask";

export default function ContractViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [contract, setContract]     = useState<ContractDetail | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [activePanel, setActivePanel]   = useState<PanelKey>("summary");
  const [question, setQuestion]     = useState("");
  const [answer, setAnswer]         = useState("");
  const [asking, setAsking]         = useState(false);
  const [analyzing, setAnalyzing]   = useState(false);
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(true);

  const load = useCallback(async () => {
    const data = await api.contract(id);
    setContract(data);
  }, [id]);

  useEffect(() => {
    let active = true;
    api.contract(id)
      .then((data) => { if (active) setContract(data); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    const timer = setInterval(() => load().catch(() => undefined), 6000);
    return () => { active = false; clearInterval(timer); };
  }, [id, load]);

  const highlightedClauseId = selectedRisk?.clause_id;
  const clauses = useMemo(() => contract?.clauses ?? [], [contract]);

  async function analyze() {
    if (!contract) return;
    setAnalyzing(true);
    try {
      await api.analyze(contract.id);
      await load();
    } finally {
      setAnalyzing(false);
    }
  }

  async function askAI(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setAsking(true);
    setAnswer("");
    try {
      const result = await api.ask(id, question);
      setAnswer(result.answer);
    } catch (err) {
      setAnswer(err instanceof Error ? err.message : "Failed to get answer.");
    } finally {
      setAsking(false);
    }
  }

  const TABS: { key: PanelKey; label: string; icon: React.ElementType; count?: number }[] = [
    { key: "summary",     label: "Summary",     icon: FileText,     count: contract?.summaries.length },
    { key: "risks",       label: "Risks",       icon: ShieldAlert,  count: contract?.risks.length },
    { key: "obligations", label: "Obligations", icon: ClipboardList,count: contract?.obligations.length },
    { key: "alerts",      label: "Alerts",      icon: Bell,         count: contract?.alerts.length },
    { key: "ask",         label: "Ask AI",      icon: Sparkles,     count: undefined },
  ];

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] gap-3">
          <div
            className="h-5 w-5 rounded-full border-2 animate-spin"
            style={{ borderColor: "rgba(99,102,241,0.2)", borderTopColor: "#6366f1" }}
          />
          <span className="text-sm" style={{ color: "#64748b" }}>Loading contract...</span>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div
        className="flex flex-col"
        style={{ minHeight: "calc(100vh - 64px)" }}
      >
        {/* Topbar */}
        <div
          className="flex items-center justify-between gap-4 px-6 py-3 shrink-0"
          style={{ borderBottom: "1px solid rgba(99,102,241,0.10)", background: "rgba(11,19,38,0.7)" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/contracts"
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs transition-all hover:bg-[rgba(99,102,241,0.08)]"
              style={{ color: "#64748b", border: "1px solid rgba(99,102,241,0.12)" }}
            >
              <ChevronLeft size={12} /> Contracts
            </Link>
            <div className="h-4 w-px" style={{ background: "rgba(99,102,241,0.18)" }} />
            <h1
              className="text-sm font-semibold truncate"
              style={{ color: "#dae2fd" }}
            >
              {contract?.title ?? "Contract"}
            </h1>
            {contract && <StatusBadge status={contract.status} pulse={contract.status === "processing"} />}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {contract && (
              <button
                onClick={analyze}
                disabled={analyzing}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all hover:bg-[rgba(99,102,241,0.08)] disabled:opacity-50"
                style={{ border: "1px solid rgba(99,102,241,0.18)", color: "#818cf8" }}
              >
                {analyzing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                {analyzing ? "Analyzing..." : "Re-analyze"}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div
            className="mx-6 mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.20)", color: "#f87171" }}
          >
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {!contract && !error && (
          <div className="p-10 text-center" style={{ color: "#64748b" }}>Contract not found.</div>
        )}

        {contract && (
          <div className="flex flex-1 overflow-hidden">

            {/* ── Document Viewer ── */}
            <div
              className="flex-1 overflow-y-auto"
              style={{ background: "#0b1326" }}
            >
              {/* Metadata strip */}
              <div
                className="flex flex-wrap items-center gap-4 px-8 py-4"
                style={{ borderBottom: "1px solid rgba(99,102,241,0.08)" }}
              >
                {[
                  { label: "ID",       value: `#${contract.id}`,                      icon: Hash },
                  { label: "Uploaded", value: contract.created_at ? new Date(contract.created_at).toLocaleDateString() : "—", icon: Calendar },
                  { label: "Expires",  value: contract.expiration_date ?? "—",        icon: Calendar },
                  { label: "OCR",      value: contract.ocr_used ? "Used" : "Native",  icon: FileText },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs">
                    <Icon size={11} style={{ color: "#3a4560" }} />
                    <span style={{ color: "#3a4560" }}>{label}:</span>
                    <span style={{ color: "#94a3b8", fontFamily: "var(--font-mono,monospace)" }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Document body — parchment style */}
              <div className="px-8 py-8">
                <div
                  className="mx-auto max-w-3xl rounded-2xl p-8 leading-8 shadow-2xl"
                  style={{
                    background: "#f8f6f0",
                    color: "#1a1a2e",
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: "0.92rem",
                    boxShadow: "0 8px 48px rgba(0,0,0,0.5)",
                  }}
                >
                  {clauses.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="mb-4 text-4xl">📄</div>
                      <p className="font-sans text-sm text-gray-500">
                        {contract.cleaned_text || contract.extracted_text
                          ? contract.cleaned_text ?? contract.extracted_text
                          : "Text extraction in progress. Please wait for analysis to complete."}
                      </p>
                    </div>
                  ) : (
                    clauses.map((clause: Clause) => {
                      const highlighted = highlightedClauseId === clause.id;
                      return (
                        <section
                          key={clause.id}
                          className="mb-6 rounded-md pl-4 transition-all duration-300"
                          style={{
                            borderLeft: highlighted
                              ? "3px solid #ef4444"
                              : "3px solid transparent",
                            background: highlighted ? "rgba(239,68,68,0.05)" : "transparent",
                            padding: highlighted ? "12px 16px" : "0 0 0 16px",
                          }}
                        >
                          {clause.heading && (
                            <h2
                              className="mb-2 font-bold font-sans"
                              style={{
                                fontSize: "0.95rem",
                                color: highlighted ? "#dc2626" : "#1a1a2e",
                              }}
                            >
                              {clause.heading}
                            </h2>
                          )}
                          <p style={{ lineHeight: 1.85 }}>{clause.text}</p>
                        </section>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* ── Analysis Sidebar ── */}
            <div
              className="flex w-[420px] shrink-0 flex-col overflow-hidden"
              style={{
                background: "rgba(11,19,38,0.95)",
                backdropFilter: "blur(20px)",
                borderLeft: "1px solid rgba(99,102,241,0.12)",
              }}
            >
              {/* Tabs */}
              <div
                className="flex shrink-0 overflow-x-auto"
                style={{ borderBottom: "1px solid rgba(99,102,241,0.10)" }}
              >
                {TABS.map(({ key, label, icon: Icon, count }) => (
                  <button
                    key={key}
                    onClick={() => setActivePanel(key)}
                    className="flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap transition-all"
                    style={{
                      color: activePanel === key ? "#818cf8" : "#64748b",
                      borderBottom: activePanel === key ? "2px solid #6366f1" : "2px solid transparent",
                      background: activePanel === key ? "rgba(99,102,241,0.06)" : "transparent",
                    }}
                  >
                    <Icon size={13} />
                    {label}
                    {count !== undefined && count > 0 && (
                      <span
                        className="rounded-full px-1.5 text-[0.6rem] font-bold"
                        style={{ background: "rgba(99,102,241,0.18)", color: "#818cf8" }}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">

                {/* Summary */}
                {activePanel === "summary" && (
                  <>
                    {contract.summaries.length === 0 ? (
                      <div className="py-8 text-center">
                        <AIProcessingIndicator label="Generating summary..." variant="pulse" />
                      </div>
                    ) : (
                      contract.summaries.map((s) => (
                        <div key={s.id}>
                          <p
                            className="mb-2 font-mono-label uppercase"
                            style={{ color: "#6366f1", fontSize: "0.62rem" }}
                          >
                            {s.summary_type}
                          </p>
                          <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
                            {s.summary_text}
                          </p>
                        </div>
                      ))
                    )}
                  </>
                )}

                {/* Risks */}
                {activePanel === "risks" && (
                  <>
                    {contract.risks.length === 0 ? (
                      <div className="py-8 text-center">
                        <AIProcessingIndicator label="Scanning for risks..." variant="dots" />
                      </div>
                    ) : (
                      contract.risks.map((risk) => (
                        <button
                          key={risk.id}
                          onClick={() => setSelectedRisk(selectedRisk?.id === risk.id ? null : risk)}
                          className="group w-full text-left rounded-xl p-4 transition-all"
                          style={{
                            background: selectedRisk?.id === risk.id
                              ? "rgba(239,68,68,0.08)"
                              : "rgba(19,27,46,0.6)",
                            border: selectedRisk?.id === risk.id
                              ? "1px solid rgba(239,68,68,0.25)"
                              : "1px solid rgba(99,102,241,0.10)",
                          }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p
                              className="text-sm font-semibold leading-snug flex-1"
                              style={{ color: "#dae2fd" }}
                            >
                              {risk.title}
                            </p>
                            <RiskBadge level={risk.severity} />
                          </div>
                          {risk.explanation && (
                            <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>
                              {risk.explanation}
                            </p>
                          )}
                          {risk.suggested_action && (
                            <div className="mt-3">
                              <AIInsightPanel title="Suggested Action" compact>
                                {risk.suggested_action}
                              </AIInsightPanel>
                            </div>
                          )}
                        </button>
                      ))
                    )}
                  </>
                )}

                {/* Obligations */}
                {activePanel === "obligations" && (
                  <>
                    {contract.obligations.length === 0 ? (
                      <div className="py-8 text-center">
                        <AIProcessingIndicator label="Extracting obligations..." variant="ring" />
                      </div>
                    ) : (
                      contract.obligations.map((ob) => (
                        <div
                          key={ob.id}
                          className="rounded-xl p-4"
                          style={{
                            background: "rgba(19,27,46,0.6)",
                            border: "1px solid rgba(99,102,241,0.10)",
                          }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <p className="text-sm font-semibold" style={{ color: "#dae2fd" }}>
                              {ob.title}
                            </p>
                            <StatusBadge status={ob.status} />
                          </div>
                          {ob.description && (
                            <p className="text-xs mb-2" style={{ color: "#64748b" }}>
                              {ob.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-xs">
                            {ob.due_date && (
                              <span className="flex items-center gap-1" style={{ color: "#f59e0b" }}>
                                <Calendar size={10} />
                                Due: {new Date(ob.due_date).toLocaleDateString()}
                              </span>
                            )}
                            {ob.owner && (
                              <span style={{ color: "#64748b" }}>Owner: {ob.owner}</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}

                {/* Alerts */}
                {activePanel === "alerts" && (
                  <>
                    {contract.alerts.length === 0 ? (
                      <div className="py-8 text-center">
                        <CheckCircle2 size={28} style={{ color: "#10b981", margin: "0 auto 8px" }} />
                        <p className="text-sm" style={{ color: "#64748b" }}>No active alerts.</p>
                      </div>
                    ) : (
                      contract.alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className="rounded-xl p-4"
                          style={{
                            background: "rgba(245,158,11,0.06)",
                            border: "1px solid rgba(245,158,11,0.18)",
                          }}
                        >
                          <div className="flex items-start gap-2 mb-1">
                            <Bell size={13} style={{ color: "#f59e0b", marginTop: "2px" }} />
                            <p className="text-sm font-semibold" style={{ color: "#dae2fd" }}>
                              {alert.title}
                            </p>
                          </div>
                          {alert.message && (
                            <p className="text-xs pl-5" style={{ color: "#64748b" }}>
                              {alert.message}
                            </p>
                          )}
                          {alert.trigger_date && (
                            <p className="mt-1.5 pl-5 text-xs" style={{ color: "#f59e0b" }}>
                              Trigger: {new Date(alert.trigger_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </>
                )}

                {/* Ask AI */}
                {activePanel === "ask" && (
                  <div className="flex flex-col h-full">
                    <AIInsightPanel title="AI Contract Assistant" compact>
                      Ask grounded questions about this specific contract. Answers are sourced from indexed clauses.
                    </AIInsightPanel>

                    <form onSubmit={askAI} className="mt-4 flex gap-2">
                      <input
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="What are the termination conditions?"
                        maxLength={1000}
                        className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
                        style={{
                          background: "rgba(19,27,46,0.8)",
                          border: "1px solid rgba(99,102,241,0.18)",
                          color: "#dae2fd",
                        }}
                        onFocus={(e) => (e.target.style.borderColor = "rgba(99,102,241,0.5)")}
                        onBlur={(e) => (e.target.style.borderColor = "rgba(99,102,241,0.18)")}
                      />
                      <button
                        type="submit"
                        disabled={asking || !question.trim()}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all disabled:opacity-40 hover:opacity-90"
                        style={{
                          background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                          boxShadow: "0 0 16px rgba(99,102,241,0.3)",
                        }}
                      >
                        {asking ? (
                          <Loader2 size={15} className="animate-spin text-white" />
                        ) : (
                          <Send size={15} className="text-white" />
                        )}
                      </button>
                    </form>

                    {asking && (
                      <div className="mt-4">
                        <AIProcessingIndicator label="Analyzing clauses..." variant="dots" />
                      </div>
                    )}

                    {answer && !asking && (
                      <div
                        className="mt-4 rounded-xl p-4"
                        style={{
                          background: "rgba(99,102,241,0.06)",
                          border: "1px solid rgba(99,102,241,0.16)",
                        }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div
                            className="flex h-5 w-5 items-center justify-center rounded-md"
                            style={{ background: "rgba(99,102,241,0.18)" }}
                          >
                            <Bot size={11} style={{ color: "#818cf8" }} />
                          </div>
                          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#6366f1", fontFamily: "var(--font-mono,monospace)" }}>
                            AI Response
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
                          {answer}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
