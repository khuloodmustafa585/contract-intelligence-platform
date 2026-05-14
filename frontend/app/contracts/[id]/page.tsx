"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bot,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  FileText,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { api, AskAISource, Clause, ContractDetail, Risk } from "@/services/api";
import { SeverityBadge, StatusBadge } from "@/components/common/StatusBadge";
import AppShell from "@/components/layout/AppShell";

const POLLING_STATUSES = new Set([
  "uploaded", "processing", "ocr_processing", "parsed", "indexing", "analysis_pending",
]);

export default function ContractViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<AskAISource[]>([]);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"summary" | "risks" | "obligations" | "alerts" | "ask">("summary");
  const clauseRefs = useRef<Record<number, HTMLElement | null>>({});

  const load = useCallback(async () => {
    const data = await api.contract(id);
    setContract(data);
    return data;
  }, [id]);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    load()
      .then((data) => {
        if (!active) return;
        if (POLLING_STATUSES.has(data.status)) {
          timer = setInterval(async () => {
            const updated = await load().catch(() => null);
            if (updated && !POLLING_STATUSES.has(updated.status) && timer) {
              clearInterval(timer);
              timer = null;
            }
          }, 4000);
        }
      })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });

    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, [id, load]);

  // Scroll to highlighted clause when risk is clicked
  useEffect(() => {
    if (selectedRisk?.clause_id) {
      const el = clauseRefs.current[selectedRisk.clause_id];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [selectedRisk]);

  const highlightedClauseId = selectedRisk?.clause_id;
  const clauses = useMemo(() => contract?.clauses || [], [contract]);

  async function ask() {
    if (!question.trim() || !contract) return;
    setAsking(true);
    setError("");
    try {
      const result = await api.ask(id, question);
      setAnswer(result.answer);
      setSources(result.sources || []);
      setActiveTab("ask");
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI request failed");
    } finally {
      setAsking(false);
    }
  }

  async function reanalyze() {
    if (!contract) return;
    try {
      await api.analyze(contract.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    }
  }

  const isProcessing = contract && POLLING_STATUSES.has(contract.status);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 size={18} className="animate-spin" /> Loading contract…
        </div>
      </AppShell>
    );
  }

  if (!contract) {
    return (
      <AppShell>
        <div className="text-slate-400">Contract not found.</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Error banner */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-[rgba(239,68,68,0.08)] px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Processing banner */}
      {isProcessing && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-blue-500/20 bg-[rgba(59,130,246,0.06)] px-4 py-3">
          <Loader2 size={15} className="animate-spin text-blue-400" />
          <span className="text-sm text-slate-300">
            Processing: <StatusBadge status={contract.status} />
            <span className="ml-2 text-slate-500">Auto-refreshing…</span>
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
            <Link href="/contracts" className="hover:text-blue-400 transition-colors">Contracts</Link>
            <ChevronRight size={12} />
            <span className="truncate max-w-[300px]">{contract.title}</span>
          </div>
          <h1 className="text-xl font-bold text-white leading-tight">{contract.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <StatusBadge status={contract.status} />
            {contract.file_type && <span className="uppercase">{contract.file_type}</span>}
            {contract.ocr_used && <span className="text-indigo-400">OCR</span>}
            {contract.is_indexed && <span className="text-emerald-400">Indexed</span>}
            {contract.expiration_date && (
              <span className="flex items-center gap-1">
                <CalendarDays size={11} /> Expires {contract.expiration_date}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={reanalyze}
          className="btn-ghost flex items-center gap-2 text-sm"
        >
          <RefreshCw size={14} /> Re-analyze
        </button>
      </div>

      {/* Two-panel layout */}
      <div className="grid min-h-[70vh] grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">

        {/* LEFT — contract text / clause viewer */}
        <div className="overflow-hidden rounded-2xl border border-[rgba(99,131,200,0.1)] bg-white">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 flex items-center gap-2">
            <FileText size={14} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Contract Text</span>
            {clauses.length > 0 && (
              <span className="ml-auto text-xs text-slate-400">{clauses.length} clauses</span>
            )}
          </div>
          <div className="overflow-y-auto p-8 max-h-[calc(100vh-280px)]">
            {clauses.length === 0 ? (
              <div className="font-serif leading-relaxed text-slate-800 whitespace-pre-wrap text-sm">
                {contract.cleaned_text || contract.extracted_text || (
                  <span className="italic text-slate-400">No text available yet. Processing may still be running.</span>
                )}
              </div>
            ) : (
              <div className="space-y-5 font-serif text-sm leading-7 text-slate-800">
                {clauses.map((clause: Clause) => {
                  const isHighlighted = highlightedClauseId === clause.id;
                  return (
                    <section
                      key={clause.id}
                      ref={(el) => { clauseRefs.current[clause.id] = el; }}
                      id={`clause-${clause.id}`}
                      className={`rounded-r-lg pl-4 transition-all duration-300 ${
                        isHighlighted
                          ? "clause-highlight"
                          : "border-l-2 border-transparent"
                      }`}
                    >
                      {clause.heading && (
                        <h2 className="mb-2 font-bold text-slate-900">{clause.heading}</h2>
                      )}
                      <p className="leading-relaxed">{clause.text}</p>
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — analysis panel */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-[rgba(99,131,200,0.1)] bg-[#0d1528]">
          {/* Tabs */}
          <div className="flex border-b border-[rgba(99,131,200,0.1)] overflow-x-auto">
            {(["summary", "risks", "obligations", "alerts", "ask"] as const).map((tab) => {
              const counts: Record<string, number> = {
                risks: contract.risks.length,
                obligations: contract.obligations.length,
                alerts: contract.alerts.filter(a => a.status === "unread").length,
              };
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    flex flex-shrink-0 items-center gap-1.5 px-4 py-3 text-xs font-medium capitalize transition-colors
                    ${activeTab === tab
                      ? "border-b-2 border-blue-500 text-blue-400 bg-[rgba(59,130,246,0.05)]"
                      : "text-slate-500 hover:text-slate-300"
                    }
                  `}
                >
                  {tab}
                  {counts[tab] > 0 && (
                    <span className="rounded-full bg-[rgba(99,131,200,0.15)] px-1.5 py-0.5 text-[10px] text-slate-400">
                      {counts[tab]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">

            {/* Summary */}
            {activeTab === "summary" && (
              <div>
                {contract.summaries.length === 0 ? (
                  <div className="rounded-xl border border-[rgba(99,131,200,0.1)] p-4 text-sm text-slate-500">
                    {isProcessing ? "Analysis in progress…" : "No summary yet. Click Re-analyze to generate one."}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {contract.summaries.map((s) => (
                      <div key={s.id} className="rounded-xl border border-[rgba(99,131,200,0.1)] bg-[rgba(99,131,200,0.03)] p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <Sparkles size={13} className="text-indigo-400" />
                          <span className="text-xs font-medium uppercase tracking-wider text-indigo-400/70">
                            {s.summary_type} Summary
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-300">{s.summary_text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Metadata */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    { label: "File type", value: contract.file_type?.toUpperCase() },
                    { label: "Parse method", value: contract.parse_method },
                    { label: "Effective date", value: contract.effective_date },
                    { label: "Expiration date", value: contract.expiration_date },
                  ].filter(item => item.value).map(({ label, value }) => (
                    <div key={label} className="rounded-lg border border-[rgba(99,131,200,0.08)] bg-[rgba(99,131,200,0.03)] p-3">
                      <p className="text-[10px] uppercase tracking-wider text-slate-600">{label}</p>
                      <p className="mt-1 text-xs font-medium text-slate-300">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risks */}
            {activeTab === "risks" && (
              <div>
                {contract.risks.length === 0 ? (
                  <p className="rounded-xl border border-[rgba(99,131,200,0.1)] p-4 text-sm text-slate-500">
                    No risks identified yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {contract.risks.map((risk) => (
                      <button
                        key={risk.id}
                        onClick={() => {
                          setSelectedRisk(selectedRisk?.id === risk.id ? null : risk);
                        }}
                        className={`
                          w-full rounded-xl border p-3 text-left transition-all
                          ${selectedRisk?.id === risk.id
                            ? "border-red-500/30 bg-[rgba(239,68,68,0.08)] shadow-sm shadow-red-500/10"
                            : "border-[rgba(99,131,200,0.1)] bg-[rgba(99,131,200,0.03)] hover:border-[rgba(99,131,200,0.2)]"
                          }
                        `}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium text-slate-200 leading-snug">
                            {risk.title}
                          </span>
                          <SeverityBadge severity={risk.severity} />
                        </div>
                        {risk.explanation && (
                          <p className="mt-2 text-xs text-slate-500 line-clamp-2">{risk.explanation}</p>
                        )}
                        {risk.suggested_action && selectedRisk?.id === risk.id && (
                          <div className="mt-3 rounded-lg border border-blue-500/20 bg-[rgba(59,130,246,0.06)] p-2.5 text-xs text-blue-300">
                            <span className="font-medium">Suggested: </span>{risk.suggested_action}
                          </div>
                        )}
                        {risk.clause_id && (
                          <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-600">
                            <FileText size={10} />
                            <span>Clause #{risk.clause_id}</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Obligations */}
            {activeTab === "obligations" && (
              <div>
                {contract.obligations.length === 0 ? (
                  <p className="rounded-xl border border-[rgba(99,131,200,0.1)] p-4 text-sm text-slate-500">
                    No obligations extracted yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {contract.obligations.map((ob) => {
                      const isOverdue = ob.due_date && new Date(ob.due_date) < new Date();
                      return (
                        <div key={ob.id} className="rounded-xl border border-[rgba(99,131,200,0.1)] bg-[rgba(99,131,200,0.03)] p-3">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-medium text-slate-200">{ob.title}</span>
                            <span className={`text-[10px] uppercase tracking-wide font-medium ${
                              ob.status === "completed" ? "text-emerald-400" :
                              isOverdue ? "text-red-400" : "text-amber-400"
                            }`}>{ob.status}</span>
                          </div>
                          {ob.due_date && (
                            <div className={`mt-2 flex items-center gap-1 text-xs ${isOverdue ? "text-red-400" : "text-slate-500"}`}>
                              <CalendarDays size={11} />
                              <span>Due {ob.due_date}</span>
                              {isOverdue && <span className="text-red-400 font-medium">— Overdue</span>}
                            </div>
                          )}
                          {ob.owner && (
                            <p className="mt-1 text-xs text-slate-600">Owner: {ob.owner}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Alerts */}
            {activeTab === "alerts" && (
              <div>
                {contract.alerts.length === 0 ? (
                  <p className="rounded-xl border border-[rgba(99,131,200,0.1)] p-4 text-sm text-slate-500">
                    No alerts generated yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {contract.alerts.map((al) => (
                      <div key={al.id} className={`
                        rounded-xl border p-3
                        ${al.status === "unread"
                          ? "border-amber-500/20 bg-[rgba(245,158,11,0.06)]"
                          : "border-[rgba(99,131,200,0.1)] bg-[rgba(99,131,200,0.03)] opacity-60"
                        }
                      `}>
                        <div className="flex items-center gap-2">
                          <TriangleAlert size={13} className={al.status === "unread" ? "text-amber-400" : "text-slate-600"} />
                          <span className="text-sm font-medium text-slate-200">{al.title}</span>
                        </div>
                        {al.message && <p className="mt-1 text-xs text-slate-500">{al.message}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Ask AI */}
            {activeTab === "ask" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    className="min-w-0 flex-1 rounded-xl border border-[rgba(99,131,200,0.15)] bg-[rgba(13,21,40,0.8)] px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition focus:border-blue-500/50"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !asking && ask()}
                    placeholder="Does this contract auto-renew?"
                    maxLength={1000}
                  />
                  <button
                    onClick={ask}
                    disabled={asking || !question.trim()}
                    className="flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 text-white shadow-lg shadow-blue-500/25 transition hover:opacity-90 disabled:opacity-40"
                  >
                    {asking ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                  </button>
                </div>

                {/* Quick questions */}
                <div className="flex flex-wrap gap-2">
                  {[
                    "Does this contract auto-renew?",
                    "What are the termination rights?",
                    "Who carries liability?",
                    "What are the payment terms?",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => setQuestion(q)}
                      className="rounded-lg border border-[rgba(99,131,200,0.12)] bg-[rgba(99,131,200,0.04)] px-2.5 py-1 text-xs text-slate-400 transition hover:border-blue-500/30 hover:text-slate-200"
                    >
                      {q}
                    </button>
                  ))}
                </div>

                {answer && (
                  <div className="rounded-xl border border-[rgba(59,130,246,0.2)] bg-[rgba(59,130,246,0.05)] p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Bot size={14} className="text-blue-400" />
                      <span className="text-xs font-medium uppercase tracking-wider text-blue-400/70">AI Answer</span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-300">{answer}</p>
                  </div>
                )}

                {sources.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-600">
                      Source Clauses
                    </p>
                    <div className="space-y-2">
                      {sources.map((src, i) => (
                        <div
                          key={i}
                          className="cursor-pointer rounded-lg border border-[rgba(99,131,200,0.1)] bg-[rgba(99,131,200,0.03)] p-3 transition hover:border-blue-500/30"
                          onClick={() => {
                            const clause = clauses.find(c => c.id === src.clause_id);
                            if (clause) {
                              setSelectedRisk(null);
                              const el = clauseRefs.current[src.clause_id];
                              if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                            }
                          }}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] text-slate-600">Clause #{src.clause_id}</span>
                            <span className="text-[10px] text-slate-600">
                              Relevance: {Math.round(src.score * 100)}%
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-3">{src.snippet}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
