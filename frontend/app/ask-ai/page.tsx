"use client";

import { useEffect, useRef, useState } from "react";
import {
  Send,
  Sparkles,
  Bot,
  User,
  FileText,
  ChevronDown,
  Loader2,
  AlertCircle,
  BookOpen,
  Lightbulb,
  Quote,
  ShieldAlert,
  CheckCircle,
  FileSearch,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import GlassCard from "@/components/ui/GlassCard";
import AIInsightPanel from "@/components/ui/AIInsightPanel";
import { api, Contract } from "@/services/api";

type StructuredAnswer = {
  clause_summary: string;
  quoted_clause: string | null;
  legal_risk: string | null;
  recommendation: string | null;
  confidence: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content?: string;
  structured?: StructuredAnswer;
  sources?: unknown[];
  timestamp: Date;
};

const SUGGESTED_QUESTIONS = [
  "What are the termination conditions?",
  "Summarize the liability and indemnification clauses.",
  "Are there any auto-renewal provisions?",
  "What are the payment terms and penalties for late payment?",
  "Identify all confidentiality obligations for both parties.",
];

const _CONFIDENCE_CFG = {
  high:     { label: "High Confidence",     dot: "#34d399", color: "#34d399", bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.22)" },
  moderate: { label: "Moderate Confidence", dot: "#fbbf24", color: "#fbbf24", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.22)" },
  low:      { label: "Low Confidence",      dot: "#f87171", color: "#f87171", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.20)"  },
} as const;

function ConfidenceBadge({ level }: { level: string }) {
  const cfg = _CONFIDENCE_CFG[level as keyof typeof _CONFIDENCE_CFG]
    ?? { label: level, dot: "#64748b", color: "#64748b", bg: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.20)" };
  return (
    <div className="flex items-center gap-1.5 mb-3">
      <div
        className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5"
        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.dot }} />
        <span style={{ color: cfg.color, fontSize: "0.6rem", fontFamily: "var(--font-mono, monospace)", fontWeight: 600, letterSpacing: "0.05em" }}>
          {cfg.label.toUpperCase()}
        </span>
      </div>
    </div>
  );
}

function StructuredResponse({ data }: { data: StructuredAnswer }) {
  const sections = [
    {
      key: "quoted_clause",
      label: "Quoted Clause",
      value: data.quoted_clause,
      icon: Quote,
      accentColor: "#6366f1",
      bg: "rgba(99,102,241,0.06)",
      border: "rgba(99,102,241,0.18)",
      textColor: "#c7d2fe",
      italic: true,
    },
    {
      key: "clause_summary",
      label: "AI Interpretation",
      value: data.clause_summary,
      icon: FileSearch,
      accentColor: "#22d3ee",
      bg: "rgba(34,211,238,0.04)",
      border: "rgba(34,211,238,0.14)",
      textColor: "#dae2fd",
      italic: false,
    },
    {
      key: "legal_risk",
      label: "Risk Impact",
      value: data.legal_risk,
      icon: ShieldAlert,
      accentColor: "#f87171",
      bg: "rgba(239,68,68,0.05)",
      border: "rgba(239,68,68,0.16)",
      textColor: "#fca5a5",
      italic: false,
    },
    {
      key: "recommendation",
      label: "Recommended Action",
      value: data.recommendation,
      icon: CheckCircle,
      accentColor: "#34d399",
      bg: "rgba(16,185,129,0.05)",
      border: "rgba(16,185,129,0.15)",
      textColor: "#6ee7b7",
      italic: false,
    },
  ] as const;

  return (
    <div className="space-y-2.5">
      <ConfidenceBadge level={data.confidence} />
      {sections.map(({ key, label, value, icon: Icon, accentColor, bg, border, textColor, italic }) => {
        if (!value) return null;
        return (
          <div
            key={key}
            className="rounded-xl p-3.5"
            style={{ background: bg, border: `1px solid ${border}` }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Icon size={11} style={{ color: accentColor }} />
              <p
                className="uppercase tracking-widest"
                style={{ color: accentColor, fontSize: "0.58rem", fontFamily: "var(--font-mono, monospace)", fontWeight: 600 }}
              >
                {label}
              </p>
            </div>
            {key === "quoted_clause" ? (
              <blockquote
                className="text-sm leading-relaxed pl-3"
                style={{
                  color: textColor,
                  borderLeft: `2px solid ${accentColor}`,
                  fontStyle: "italic",
                  opacity: 0.9,
                }}
              >
                &ldquo;{value}&rdquo;
              </blockquote>
            ) : (
              <p className="text-sm leading-relaxed" style={{ color: textColor, fontStyle: italic ? "italic" : "normal" }}>
                {value}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ResponseSkeleton() {
  const shimmerCards = [
    { accentColor: "rgba(99,102,241,0.18)",   bg: "rgba(99,102,241,0.06)",  border: "rgba(99,102,241,0.14)",  labelW: "w-24", lines: ["w-4/5", "w-3/5"] },
    { accentColor: "rgba(34,211,238,0.18)",   bg: "rgba(34,211,238,0.04)",  border: "rgba(34,211,238,0.12)",  labelW: "w-28", lines: ["w-full", "w-4/5", "w-1/2"] },
    { accentColor: "rgba(239,68,68,0.20)",    bg: "rgba(239,68,68,0.05)",   border: "rgba(239,68,68,0.12)",   labelW: "w-20", lines: ["w-3/4", "w-2/3"] },
    { accentColor: "rgba(16,185,129,0.18)",   bg: "rgba(16,185,129,0.05)",  border: "rgba(16,185,129,0.12)",  labelW: "w-32", lines: ["w-4/5", "w-3/5"] },
  ];
  return (
    <div className="space-y-2.5 w-full max-w-[82%]">
      {shimmerCards.map((card, i) => (
        <div
          key={i}
          className="rounded-xl p-3.5 animate-pulse"
          style={{ background: card.bg, border: `1px solid ${card.border}` }}
        >
          <div className={`h-1.5 rounded-full mb-2.5 ${card.labelW}`} style={{ background: card.accentColor }} />
          <div className="space-y-1.5">
            {card.lines.map((w, j) => (
              <div key={j} className={`h-2 rounded-full ${w}`} style={{ background: card.accentColor, opacity: 0.5 }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AskAIPage() {
  const [contracts, setContracts]   = useState<Contract[]>([]);
  const [contractId, setContractId] = useState("");
  const [messages, setMessages]     = useState<Message[]>([]);
  const [question, setQuestion]     = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [loadingContracts, setLoadingContracts] = useState(true);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.contracts()
      .then((items) => {
        setContracts(items);
        if (items[0]) setContractId(String(items[0].id));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingContracts(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function submit(e: React.FormEvent | null, override?: string) {
    e?.preventDefault();
    const q = override ?? question;
    if (!q.trim() || !contractId || loading) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: q,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setLoading(true);
    setError("");
    try {
      const result = await api.ask(contractId, q);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        structured: {
          clause_summary: result.clause_summary,
          quoted_clause: result.quoted_clause,
          legal_risk: result.legal_risk,
          recommendation: result.recommendation,
          confidence: result.confidence ?? "low",
        },
        sources: result.sources,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: err instanceof Error ? err.message : "AI request failed. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  const selectedContract = contracts.find((c) => String(c.id) === contractId);

  return (
    <AppShell>
      <div className="flex" style={{ height: "calc(100vh - 64px)" }}>

        {/* ── Sidebar ── */}
        <aside
          className="flex w-72 shrink-0 flex-col overflow-y-auto"
          style={{
            background: "rgba(11,19,38,0.9)",
            borderRight: "1px solid rgba(99,102,241,0.10)",
          }}
        >
          {/* Contract Selector */}
          <div className="px-5 py-5" style={{ borderBottom: "1px solid rgba(99,102,241,0.08)" }}>
            <p className="font-mono-label mb-3" style={{ color: "#6366f1", fontSize: "0.62rem" }}>
              Contract Context
            </p>

            {loadingContracts ? (
              <div className="flex items-center gap-2 text-xs" style={{ color: "#64748b" }}>
                <Loader2 size={12} className="animate-spin" /> Loading contracts...
              </div>
            ) : contracts.length === 0 ? (
              <div className="text-xs" style={{ color: "#64748b" }}>
                No indexed contracts. Upload a contract first.
              </div>
            ) : (
              <div className="relative">
                <select
                  value={contractId}
                  onChange={(e) => {
                    setContractId(e.target.value);
                    setMessages([]);
                  }}
                  className="w-full appearance-none rounded-xl px-3 py-2.5 pr-8 text-sm outline-none transition-all"
                  style={{
                    background: "rgba(19,27,46,0.8)",
                    border: "1px solid rgba(99,102,241,0.18)",
                    color: "#dae2fd",
                  }}
                >
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id} style={{ background: "#131b2e" }}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={13}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "#64748b" }}
                />
              </div>
            )}

            {selectedContract && (
              <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: "#64748b" }}>
                <FileText size={11} style={{ color: "#6366f1" }} />
                {selectedContract.status} · {selectedContract.embedding_status}
              </div>
            )}
          </div>

          {/* Suggested Questions */}
          <div className="px-5 py-5 flex-1">
            <p className="font-mono-label mb-3" style={{ color: "#6366f1", fontSize: "0.62rem" }}>
              Suggested Questions
            </p>
            <div className="space-y-1.5">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => submit(null, q)}
                  disabled={!contractId || loading}
                  className="group w-full text-left rounded-xl px-3 py-2.5 text-xs transition-all hover:bg-[rgba(99,102,241,0.08)] disabled:opacity-40"
                  style={{
                    border: "1px solid rgba(99,102,241,0.10)",
                    color: "#94a3b8",
                    background: "rgba(19,27,46,0.4)",
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* AI note */}
          <div className="px-5 py-4" style={{ borderTop: "1px solid rgba(99,102,241,0.08)" }}>
            <AIInsightPanel title="Grounded Analysis" compact>
              Responses quote exact contract language retrieved via vector search — no hallucination.
            </AIInsightPanel>
          </div>
        </aside>

        {/* ── Chat Area ── */}
        <div className="flex flex-1 flex-col overflow-hidden">

          {/* Chat Header */}
          <div
            className="flex items-center gap-3 px-6 py-4 shrink-0"
            style={{ borderBottom: "1px solid rgba(99,102,241,0.10)", background: "rgba(11,19,38,0.8)" }}
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                boxShadow: "0 0 16px rgba(99,102,241,0.35)",
              }}
            >
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#dae2fd" }}>
                Contract Intelligence AI
              </p>
              <p className="text-xs" style={{ color: "#64748b" }}>
                {selectedContract ? `Analyzing: ${selectedContract.title}` : "Select a contract to begin"}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <div
                className="h-2 w-2 rounded-full animate-pulse"
                style={{ background: "#10b981", boxShadow: "0 0 6px rgba(16,185,129,0.5)" }}
              />
              <span className="text-xs" style={{ color: "#64748b" }}>Online</span>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              className="mx-6 mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.20)", color: "#f87171" }}
            >
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div
                  className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
                  style={{
                    background: "rgba(99,102,241,0.08)",
                    border: "1px solid rgba(99,102,241,0.16)",
                    boxShadow: "0 0 40px rgba(99,102,241,0.1)",
                  }}
                >
                  <Bot size={28} style={{ color: "#6366f1", opacity: 0.7 }} />
                </div>
                <h3 className="text-base font-semibold mb-2" style={{ color: "#dae2fd" }}>
                  Contract Intelligence AI
                </h3>
                <p className="text-sm max-w-sm" style={{ color: "#64748b" }}>
                  Ask natural language questions about your contracts. Every answer is grounded in exact clause text — with legal interpretation and risk guidance.
                </p>

                <div className="mt-8 grid grid-cols-2 gap-3 max-w-lg w-full">
                  {[
                    { icon: BookOpen, label: "Clause Analysis",      desc: "Exact quotes + legal interpretation" },
                    { icon: Lightbulb, label: "Risk Identification", desc: "Concrete risk and business impact" },
                  ].map(({ icon: Icon, label, desc }) => (
                    <div
                      key={label}
                      className="rounded-xl p-4 text-left"
                      style={{
                        background: "rgba(19,27,46,0.7)",
                        border: "1px solid rgba(99,102,241,0.12)",
                      }}
                    >
                      <div
                        className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg"
                        style={{ background: "rgba(99,102,241,0.12)" }}
                      >
                        <Icon size={14} style={{ color: "#818cf8" }} />
                      </div>
                      <p className="text-xs font-semibold mb-1" style={{ color: "#dae2fd" }}>{label}</p>
                      <p className="text-xs" style={{ color: "#64748b" }}>{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 animate-fade-up ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl mt-0.5"
                  style={{
                    background: msg.role === "user"
                      ? "rgba(99,102,241,0.18)"
                      : "rgba(34,211,238,0.12)",
                    border: msg.role === "user"
                      ? "1px solid rgba(99,102,241,0.25)"
                      : "1px solid rgba(34,211,238,0.20)",
                  }}
                >
                  {msg.role === "user" ? (
                    <User size={15} style={{ color: "#818cf8" }} />
                  ) : (
                    <Sparkles size={15} style={{ color: "#22d3ee" }} />
                  )}
                </div>

                {/* Bubble */}
                <div className={`max-w-[82%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  {msg.role === "assistant" && msg.structured ? (
                    <StructuredResponse data={msg.structured} />
                  ) : (
                    <div
                      className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
                      style={{
                        background: msg.role === "user"
                          ? "rgba(99,102,241,0.14)"
                          : "rgba(19,27,46,0.8)",
                        border: msg.role === "user"
                          ? "1px solid rgba(99,102,241,0.22)"
                          : "1px solid rgba(99,102,241,0.10)",
                        color: "#dae2fd",
                        borderBottomRightRadius: msg.role === "user" ? "4px" : undefined,
                        borderBottomLeftRadius: msg.role === "assistant" ? "4px" : undefined,
                      }}
                    >
                      {msg.content}
                    </div>
                  )}
                  <span className="text-[0.65rem] px-1" style={{ color: "#3a4560" }}>
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}

            {/* Skeleton loading — mirrors the 4-card structured response layout */}
            {loading && (
              <div className="flex gap-3 animate-fade-in">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl mt-0.5"
                  style={{
                    background: "rgba(34,211,238,0.12)",
                    border: "1px solid rgba(34,211,238,0.20)",
                  }}
                >
                  <Sparkles size={15} className="animate-pulse" style={{ color: "#22d3ee" }} />
                </div>
                <ResponseSkeleton />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input Area */}
          <div
            className="shrink-0 px-6 py-4"
            style={{ borderTop: "1px solid rgba(99,102,241,0.10)", background: "rgba(11,19,38,0.8)" }}
          >
            <form onSubmit={submit} className="flex gap-3">
              <div
                className="relative flex-1 flex items-center rounded-xl overflow-hidden"
                style={{
                  background: "rgba(19,27,46,0.8)",
                  border: "1px solid rgba(99,102,241,0.18)",
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(null); }
                  }}
                  placeholder={contractId ? "Ask anything about this contract..." : "Select a contract first"}
                  disabled={!contractId || loading}
                  maxLength={1000}
                  className="flex-1 bg-transparent px-4 py-3 text-sm outline-none disabled:opacity-50 placeholder:text-[#3a4560]"
                  style={{ color: "#dae2fd" }}
                />
                <span
                  className="mr-3 text-xs px-1"
                  style={{ color: "#3a4560", fontFamily: "var(--font-mono,monospace)", whiteSpace: "nowrap" }}
                >
                  {question.length}/1000
                </span>
              </div>

              <button
                type="submit"
                disabled={!question.trim() || !contractId || loading}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all disabled:opacity-40 hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                  boxShadow: "0 0 20px rgba(99,102,241,0.3)",
                }}
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin text-white" />
                ) : (
                  <Send size={18} className="text-white" />
                )}
              </button>
            </form>

            <p className="mt-2 text-center text-xs" style={{ color: "#3a4560" }}>
              Answers quote exact contract language — grounded in indexed clauses, never hallucinated
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
