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
      {/* ── Outer layout: full viewport minus topnav, with breathing room ── */}
      <div
        style={{
          height: "calc(100vh - 56px)",
          display: "flex",
          padding: "20px 24px 24px 20px",
          gap: "16px",
          boxSizing: "border-box",
        }}
      >

        {/* ── Sidebar panel ─────────────────────────────────────────────── */}
        <aside
          style={{
            width: "296px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            background: "rgba(11,19,38,0.92)",
            border: "1px solid rgba(99,102,241,0.12)",
            borderRadius: "16px",
          }}
        >
          {/* Contract selector */}
          <div
            style={{
              padding: "22px 24px 20px",
              borderBottom: "1px solid rgba(99,102,241,0.08)",
            }}
          >
            <p
              style={{
                color: "#6366f1",
                fontSize: "0.6rem",
                fontFamily: "var(--font-mono, monospace)",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: "14px",
              }}
            >
              Contract Context
            </p>

            {loadingContracts ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "0.78rem",
                  color: "#64748b",
                }}
              >
                <Loader2 size={12} className="animate-spin" /> Loading contracts…
              </div>
            ) : contracts.length === 0 ? (
              <p style={{ fontSize: "0.78rem", color: "#64748b", lineHeight: 1.5 }}>
                No indexed contracts. Upload a contract first.
              </p>
            ) : (
              <div style={{ position: "relative" }}>
                <select
                  value={contractId}
                  onChange={(e) => {
                    setContractId(e.target.value);
                    setMessages([]);
                  }}
                  style={{
                    width: "100%",
                    appearance: "none",
                    borderRadius: "12px",
                    padding: "10px 36px 10px 14px",
                    fontSize: "0.82rem",
                    outline: "none",
                    background: "rgba(19,27,46,0.8)",
                    border: "1px solid rgba(99,102,241,0.18)",
                    color: "#dae2fd",
                    cursor: "pointer",
                    transition: "border-color 0.15s",
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
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#64748b",
                    pointerEvents: "none",
                  }}
                />
              </div>
            )}

            {selectedContract && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  marginTop: "10px",
                  fontSize: "0.73rem",
                  color: "#64748b",
                }}
              >
                <FileText size={11} style={{ color: "#6366f1", flexShrink: 0 }} />
                {selectedContract.status} · {selectedContract.embedding_status}
              </div>
            )}
          </div>

          {/* Suggested questions */}
          <div
            style={{
              padding: "20px 24px",
              flex: 1,
            }}
          >
            <p
              style={{
                color: "#6366f1",
                fontSize: "0.6rem",
                fontFamily: "var(--font-mono, monospace)",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: "14px",
              }}
            >
              Suggested Questions
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => submit(null, q)}
                  disabled={!contractId || loading}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "11px 14px",
                    borderRadius: "12px",
                    border: "1px solid rgba(99,102,241,0.12)",
                    color: "#94a3b8",
                    background: "rgba(19,27,46,0.4)",
                    fontSize: "0.78rem",
                    lineHeight: 1.55,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    opacity: !contractId || loading ? 0.4 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!(!contractId || loading)) {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = "rgba(99,102,241,0.08)";
                      el.style.borderColor = "rgba(99,102,241,0.22)";
                      el.style.color = "#c7d2fe";
                    }
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = "rgba(19,27,46,0.4)";
                    el.style.borderColor = "rgba(99,102,241,0.12)";
                    el.style.color = "#94a3b8";
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* AI insight note */}
          <div
            style={{
              padding: "16px 24px 22px",
              borderTop: "1px solid rgba(99,102,241,0.08)",
            }}
          >
            <AIInsightPanel title="Grounded Analysis" compact>
              Responses quote exact contract language retrieved via vector search — no hallucination.
            </AIInsightPanel>
          </div>
        </aside>

        {/* ── Chat panel ────────────────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "rgba(11,19,38,0.7)",
            border: "1px solid rgba(99,102,241,0.10)",
            borderRadius: "16px",
          }}
        >
          {/* Chat header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "18px 28px",
              borderBottom: "1px solid rgba(99,102,241,0.10)",
              background: "rgba(11,19,38,0.85)",
              flexShrink: 0,
              borderRadius: "16px 16px 0 0",
            }}
          >
            <div
              style={{
                display: "flex",
                width: "38px",
                height: "38px",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                boxShadow: "0 0 16px rgba(99,102,241,0.35)",
                flexShrink: 0,
              }}
            >
              <Sparkles size={16} style={{ color: "#ffffff" }} />
            </div>
            <div>
              <p
                style={{
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  color: "#dae2fd",
                  lineHeight: 1.3,
                }}
              >
                Contract Intelligence AI
              </p>
              <p style={{ fontSize: "0.73rem", color: "#64748b", marginTop: "2px" }}>
                {selectedContract
                  ? `Analyzing: ${selectedContract.title}`
                  : "Select a contract to begin"}
              </p>
            </div>
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: "7px",
              }}
            >
              <div
                className="animate-pulse"
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#10b981",
                  boxShadow: "0 0 6px rgba(16,185,129,0.5)",
                }}
              />
              <span style={{ fontSize: "0.73rem", color: "#64748b" }}>Online</span>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div
              style={{
                margin: "16px 28px 0",
                display: "flex",
                alignItems: "center",
                gap: "9px",
                padding: "12px 16px",
                borderRadius: "12px",
                fontSize: "0.82rem",
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.20)",
                color: "#f87171",
                flexShrink: 0,
              }}
            >
              <AlertCircle size={14} style={{ flexShrink: 0 }} /> {error}
            </div>
          )}

          {/* Messages area */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "32px 32px 24px",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            {/* Empty state */}
            {messages.length === 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  textAlign: "center",
                  padding: "0 24px",
                }}
              >
                <div
                  style={{
                    marginBottom: "20px",
                    display: "flex",
                    width: "68px",
                    height: "68px",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "20px",
                    background: "rgba(99,102,241,0.08)",
                    border: "1px solid rgba(99,102,241,0.16)",
                    boxShadow: "0 0 40px rgba(99,102,241,0.1)",
                  }}
                >
                  <Bot size={28} style={{ color: "#6366f1", opacity: 0.7 }} />
                </div>
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "#dae2fd",
                    marginBottom: "8px",
                  }}
                >
                  Contract Intelligence AI
                </h3>
                <p
                  style={{
                    fontSize: "0.82rem",
                    color: "#64748b",
                    maxWidth: "380px",
                    lineHeight: 1.6,
                  }}
                >
                  Ask natural language questions about your contracts. Every answer is grounded
                  in exact clause text — with legal interpretation and risk guidance.
                </p>

                {/* Feature cards */}
                <div
                  style={{
                    marginTop: "36px",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "14px",
                    width: "100%",
                    maxWidth: "480px",
                  }}
                >
                  {[
                    { icon: BookOpen,  label: "Clause Analysis",      desc: "Exact quotes + legal interpretation" },
                    { icon: Lightbulb, label: "Risk Identification",  desc: "Concrete risk and business impact"   },
                  ].map(({ icon: Icon, label, desc }) => (
                    <div
                      key={label}
                      style={{
                        borderRadius: "14px",
                        padding: "18px 18px 16px",
                        textAlign: "left",
                        background: "rgba(19,27,46,0.7)",
                        border: "1px solid rgba(99,102,241,0.12)",
                      }}
                    >
                      <div
                        style={{
                          marginBottom: "10px",
                          display: "flex",
                          width: "32px",
                          height: "32px",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "10px",
                          background: "rgba(99,102,241,0.12)",
                        }}
                      >
                        <Icon size={15} style={{ color: "#818cf8" }} />
                      </div>
                      <p
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          color: "#dae2fd",
                          marginBottom: "5px",
                        }}
                      >
                        {label}
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "#64748b", lineHeight: 1.5 }}>
                        {desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Message bubbles */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 animate-fade-up ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
                <div
                  style={{
                    display: "flex",
                    width: "32px",
                    height: "32px",
                    flexShrink: 0,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "10px",
                    marginTop: "2px",
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
                <div
                  className={`max-w-[82%] flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  {msg.role === "assistant" && msg.structured ? (
                    <StructuredResponse data={msg.structured} />
                  ) : (
                    <div
                      style={{
                        borderRadius: "16px",
                        padding: "12px 16px",
                        fontSize: "0.85rem",
                        lineHeight: 1.65,
                        background: msg.role === "user"
                          ? "rgba(99,102,241,0.14)"
                          : "rgba(19,27,46,0.8)",
                        border: msg.role === "user"
                          ? "1px solid rgba(99,102,241,0.22)"
                          : "1px solid rgba(99,102,241,0.10)",
                        color: "#dae2fd",
                        borderBottomRightRadius: msg.role === "user" ? "4px" : undefined,
                        borderBottomLeftRadius:  msg.role === "assistant" ? "4px" : undefined,
                      }}
                    >
                      {msg.content}
                    </div>
                  )}
                  <span
                    style={{
                      fontSize: "0.65rem",
                      color: "#3a4560",
                      padding: "0 4px",
                    }}
                  >
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}

            {/* Loading skeleton */}
            {loading && (
              <div className="flex gap-3 animate-fade-in">
                <div
                  style={{
                    display: "flex",
                    width: "32px",
                    height: "32px",
                    flexShrink: 0,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "10px",
                    marginTop: "2px",
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

          {/* Input area */}
          <div
            style={{
              flexShrink: 0,
              padding: "16px 28px 22px",
              borderTop: "1px solid rgba(99,102,241,0.10)",
              background: "rgba(11,19,38,0.85)",
              borderRadius: "0 0 16px 16px",
            }}
          >
            <form
              onSubmit={submit}
              style={{ display: "flex", gap: "12px", alignItems: "center" }}
            >
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  borderRadius: "14px",
                  overflow: "hidden",
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
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submit(null);
                    }
                  }}
                  placeholder={
                    contractId
                      ? "Ask anything about this contract…"
                      : "Select a contract first"
                  }
                  disabled={!contractId || loading}
                  maxLength={1000}
                  style={{
                    flex: 1,
                    background: "transparent",
                    padding: "13px 16px",
                    fontSize: "0.85rem",
                    outline: "none",
                    color: "#dae2fd",
                    opacity: !contractId || loading ? 0.5 : 1,
                  }}
                />
                <span
                  style={{
                    marginRight: "14px",
                    fontSize: "0.7rem",
                    color: "#3a4560",
                    fontFamily: "var(--font-mono, monospace)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {question.length}/1000
                </span>
              </div>

              <button
                type="submit"
                disabled={!question.trim() || !contractId || loading}
                style={{
                  display: "flex",
                  width: "48px",
                  height: "48px",
                  flexShrink: 0,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "14px",
                  border: "none",
                  cursor: !question.trim() || !contractId || loading ? "not-allowed" : "pointer",
                  opacity: !question.trim() || !contractId || loading ? 0.4 : 1,
                  background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                  boxShadow: "0 0 20px rgba(99,102,241,0.3)",
                  transition: "opacity 0.15s, transform 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!(!question.trim() || !contractId || loading))
                    (e.currentTarget as HTMLElement).style.transform = "scale(1.04)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                }}
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" style={{ color: "#ffffff" }} />
                ) : (
                  <Send size={18} style={{ color: "#ffffff" }} />
                )}
              </button>
            </form>

            <p
              style={{
                marginTop: "10px",
                textAlign: "center",
                fontSize: "0.7rem",
                color: "#3a4560",
              }}
            >
              Answers quote exact contract language — grounded in indexed clauses, never hallucinated
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
