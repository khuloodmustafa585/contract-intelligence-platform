"use client";

import { useEffect, useRef, useState } from "react";
import {
  Send,
  Sparkles,
  User,
  FileText,
  ChevronDown,
  Loader2,
  AlertCircle,
  Bot,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { api, Contract } from "@/services/api";

// ── Types ─────────────────────────────────────────────────────────────────

type AiAnswer = {
  answer: string;
  supporting_clause: string | null;
  legal_risk: string | null;
  recommendation: string | null;
  confidence: string;
  message_type: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  /** Plain text — used for greetings, errors, simple responses */
  content?: string;
  /** Structured Q&A response */
  ai?: AiAnswer;
  timestamp: Date;
};

// ── Intent classification (client-side) ───────────────────────────────────
// Greetings and casual messages are handled locally; no API call is made.

const _GREETINGS = new Set([
  "hi", "hello", "hey", "hiya", "howdy", "greetings", "sup", "yo",
  "good morning", "good afternoon", "good evening",
]);
const _CASUAL = new Set([
  "thanks", "thank you", "ok", "okay", "k", "sure", "cool", "great",
  "got it", "understood", "sounds good", "perfect", "awesome",
  "nice", "good", "alright", "fine", "noted", "cheers",
]);

function classifyInput(text: string): "greeting" | "casual" | "question" {
  const norm = text.trim().toLowerCase().replace(/[!.?,;:]+/g, "").trim();
  const words = norm.split(/\s+/);
  if (_GREETINGS.has(norm)) return "greeting";
  if (words.length <= 3 && _GREETINGS.has(words[0])) return "greeting";
  if (_CASUAL.has(norm)) return "casual";
  return "question";
}

// ── Sub-components ────────────────────────────────────────────────────────

/** Renders a single AI answer in a clean, minimal style */
function AiAnswerBubble({ ai }: { ai: AiAnswer }) {
  const isNotFound =
    ai.message_type === "not_found" ||
    ai.answer.toLowerCase().startsWith("this information was not found") ||
    ai.answer.toLowerCase().startsWith("no clause");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

      {/* Main answer */}
      <p
        style={{
          fontSize: "0.875rem",
          lineHeight: 1.75,
          color: isNotFound ? "#64748b" : "#dae2fd",
          margin: 0,
        }}
      >
        {ai.answer}
      </p>

      {/* Supporting clause — only when present */}
      {ai.supporting_clause && (
        <div
          style={{
            borderLeft: "2px solid rgba(99,102,241,0.35)",
            paddingLeft: "12px",
            marginTop: "2px",
          }}
        >
          <p
            style={{
              fontSize: "0.68rem",
              color: "#475569",
              marginBottom: "4px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            Contract text
          </p>
          <p
            style={{
              fontSize: "0.825rem",
              lineHeight: 1.65,
              color: "#7c8fa8",
              fontStyle: "italic",
              margin: 0,
            }}
          >
            &ldquo;{ai.supporting_clause}&rdquo;
          </p>
        </div>
      )}

      {/* Risk note — ONLY when the model actually produced one */}
      {ai.legal_risk && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            fontSize: "0.8rem",
            color: "#fca5a5",
            padding: "8px 12px",
            borderRadius: "8px",
            background: "rgba(239,68,68,0.05)",
            border: "1px solid rgba(239,68,68,0.12)",
            lineHeight: 1.55,
          }}
        >
          <span style={{ flexShrink: 0, marginTop: "1px" }}>⚠</span>
          <span>{ai.legal_risk}</span>
        </div>
      )}

      {/* Recommendation — ONLY when model produced one */}
      {ai.recommendation && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            fontSize: "0.8rem",
            color: "#86efac",
            padding: "8px 12px",
            borderRadius: "8px",
            background: "rgba(16,185,129,0.04)",
            border: "1px solid rgba(16,185,129,0.11)",
            lineHeight: 1.55,
          }}
        >
          <span style={{ flexShrink: 0, marginTop: "1px" }}>→</span>
          <span>{ai.recommendation}</span>
        </div>
      )}

      {/* Low-confidence footnote — subtle, not alarming */}
      {ai.confidence === "low" && ai.supporting_clause && (
        <p
          style={{
            fontSize: "0.7rem",
            color: "#334155",
            margin: 0,
            fontStyle: "italic",
          }}
        >
          Low retrieval confidence — cross-check against the full document.
        </p>
      )}
    </div>
  );
}

/** Minimal typing indicator — just three animated dots */
function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "4px 0" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "rgba(99,102,241,0.45)",
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`@keyframes pulse { 0%,80%,100%{opacity:.3;transform:scale(.9)} 40%{opacity:1;transform:scale(1)} }`}</style>
    </div>
  );
}

const SUGGESTED_QUESTIONS = [
  "What are the termination conditions?",
  "What are the payment terms?",
  "Are there any auto-renewal provisions?",
  "What are the confidentiality obligations?",
  "How long is the agreement?",
];

// ── Main page ─────────────────────────────────────────────────────────────

export default function AskAIPage() {
  const [contracts, setContracts]         = useState<Contract[]>([]);
  const [contractId, setContractId]       = useState("");
  const [messages, setMessages]           = useState<Message[]>([]);
  const [question, setQuestion]           = useState("");
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");
  const [loadingContracts, setLoadingContracts] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.contracts()
      .then((items) => {
        const indexed = items.filter((c) => c.embedding_status === "completed");
        setContracts(indexed);
        if (indexed[0]) setContractId(String(indexed[0].id));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingContracts(false));
  }, []);

  // Scroll when a new message is appended.
  // Uses messages.length (a stable primitive) instead of the full `messages`
  // array reference to keep the dependency array type-stable between renders.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll when the loading state changes so the typing indicator stays visible.
  useEffect(() => {
    if (loading) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [loading]);

  async function submit(e: React.FormEvent | null, override?: string) {
    e?.preventDefault();
    const q = (override ?? question).trim();
    if (!q || !contractId || loading) return;

    const userMsg: Message = {
      id:        Date.now().toString(),
      role:      "user",
      content:   q,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");

    // ── Handle greetings / casual messages locally — no API call ──────────
    const intent = classifyInput(q);
    if (intent === "greeting") {
      setMessages((prev) => [
        ...prev,
        {
          id:        (Date.now() + 1).toString(),
          role:      "assistant",
          content:   "Hello! Ask me anything about this contract and I'll find the answer.",
          timestamp: new Date(),
        },
      ]);
      return;
    }
    if (intent === "casual") {
      setMessages((prev) => [
        ...prev,
        {
          id:        (Date.now() + 1).toString(),
          role:      "assistant",
          content:   "What would you like to know about this contract?",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    // ── Real contract question → call the API ─────────────────────────────
    setLoading(true);
    setError("");
    try {
      const result = await api.ask(contractId, q);
      setMessages((prev) => [
        ...prev,
        {
          id:   (Date.now() + 1).toString(),
          role: "assistant",
          ai:   {
            answer:            result.answer,
            supporting_clause: result.supporting_clause,
            legal_risk:        result.legal_risk,
            recommendation:    result.recommendation,
            confidence:        result.confidence ?? "low",
            message_type:      result.message_type ?? "answer",
          },
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id:        (Date.now() + 1).toString(),
          role:      "assistant",
          content:   err instanceof Error ? err.message : "Request failed. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  const selectedContract = contracts.find((c) => String(c.id) === contractId);

  return (
    <AppShell>
      <div
        style={{
          height:     "calc(100vh - 56px)",
          display:    "flex",
          padding:    "20px 24px 24px 20px",
          gap:        "16px",
          boxSizing:  "border-box",
        }}
      >

        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        <aside
          style={{
            width:          "276px",
            flexShrink:     0,
            display:        "flex",
            flexDirection:  "column",
            overflowY:      "auto",
            background:     "rgba(11,19,38,0.92)",
            border:         "1px solid rgba(99,102,241,0.10)",
            borderRadius:   "14px",
          }}
        >
          {/* Contract selector */}
          <div
            style={{
              padding:      "20px 20px 18px",
              borderBottom: "1px solid rgba(99,102,241,0.07)",
            }}
          >
            <p
              style={{
                color:        "#6366f1",
                fontSize:     "0.6rem",
                fontFamily:   "var(--font-mono, monospace)",
                fontWeight:   600,
                letterSpacing:"0.12em",
                textTransform:"uppercase",
                marginBottom: "12px",
              }}
            >
              Contract
            </p>

            {loadingContracts ? (
              <p style={{ fontSize: "0.78rem", color: "#475569" }}>Loading…</p>
            ) : contracts.length === 0 ? (
              <p style={{ fontSize: "0.78rem", color: "#475569", lineHeight: 1.5 }}>
                No indexed contracts yet. Upload and analyze a contract first.
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
                    width:       "100%",
                    appearance:  "none",
                    borderRadius:"10px",
                    padding:     "9px 32px 9px 12px",
                    fontSize:    "0.82rem",
                    outline:     "none",
                    background:  "rgba(19,27,46,0.8)",
                    border:      "1px solid rgba(99,102,241,0.16)",
                    color:       "#dae2fd",
                    cursor:      "pointer",
                  }}
                >
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id} style={{ background: "#131b2e" }}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={12}
                  style={{
                    position:       "absolute",
                    right:          "10px",
                    top:            "50%",
                    transform:      "translateY(-50%)",
                    color:          "#475569",
                    pointerEvents:  "none",
                  }}
                />
              </div>
            )}

            {selectedContract && (
              <div
                style={{
                  display:    "flex",
                  alignItems: "center",
                  gap:        "6px",
                  marginTop:  "8px",
                  fontSize:   "0.72rem",
                  color:      "#475569",
                }}
              >
                <FileText size={10} style={{ color: "#6366f1", flexShrink: 0 }} />
                {selectedContract.status}
              </div>
            )}
          </div>

          {/* Suggested questions */}
          <div style={{ padding: "18px 20px", flex: 1 }}>
            <p
              style={{
                color:        "#6366f1",
                fontSize:     "0.6rem",
                fontFamily:   "var(--font-mono, monospace)",
                fontWeight:   600,
                letterSpacing:"0.12em",
                textTransform:"uppercase",
                marginBottom: "10px",
              }}
            >
              Suggestions
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => submit(null, q)}
                  disabled={!contractId || loading}
                  style={{
                    width:        "100%",
                    textAlign:    "left",
                    padding:      "9px 12px",
                    borderRadius: "10px",
                    border:       "1px solid rgba(99,102,241,0.10)",
                    color:        "#64748b",
                    background:   "transparent",
                    fontSize:     "0.78rem",
                    lineHeight:   1.5,
                    cursor:       !contractId || loading ? "not-allowed" : "pointer",
                    opacity:      !contractId || loading ? 0.4 : 1,
                    transition:   "all 0.12s",
                  }}
                  onMouseEnter={(e) => {
                    if (!(!contractId || loading)) {
                      (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.06)";
                      (e.currentTarget as HTMLElement).style.color = "#94a3b8";
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.18)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "#64748b";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.10)";
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Chat panel ────────────────────────────────────────────────── */}
        <div
          style={{
            flex:           1,
            display:        "flex",
            flexDirection:  "column",
            overflow:       "hidden",
            background:     "rgba(11,19,38,0.6)",
            border:         "1px solid rgba(99,102,241,0.08)",
            borderRadius:   "14px",
          }}
        >
          {/* Header */}
          <div
            style={{
              display:        "flex",
              alignItems:     "center",
              gap:            "12px",
              padding:        "16px 24px",
              borderBottom:   "1px solid rgba(99,102,241,0.08)",
              background:     "rgba(11,19,38,0.8)",
              flexShrink:     0,
              borderRadius:   "14px 14px 0 0",
            }}
          >
            <div
              style={{
                display:        "flex",
                width:          "36px",
                height:         "36px",
                alignItems:     "center",
                justifyContent: "center",
                borderRadius:   "10px",
                background:     "linear-gradient(135deg,#6366f1,#4f46e5)",
                flexShrink:     0,
              }}
            >
              <Sparkles size={15} style={{ color: "#fff" }} />
            </div>
            <div>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#dae2fd", lineHeight: 1.3 }}>
                Contract AI
              </p>
              <p style={{ fontSize: "0.72rem", color: "#475569", marginTop: "1px" }}>
                {selectedContract ? selectedContract.title : "Select a contract to begin"}
              </p>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div
              style={{
                margin:     "12px 20px 0",
                display:    "flex",
                alignItems: "center",
                gap:        "8px",
                padding:    "10px 14px",
                borderRadius:"10px",
                fontSize:   "0.82rem",
                background: "rgba(239,68,68,0.07)",
                border:     "1px solid rgba(239,68,68,0.18)",
                color:      "#f87171",
                flexShrink: 0,
              }}
            >
              <AlertCircle size={13} style={{ flexShrink: 0 }} /> {error}
            </div>
          )}

          {/* Messages */}
          <div
            style={{
              flex:           1,
              overflowY:      "auto",
              padding:        "28px 28px 20px",
              display:        "flex",
              flexDirection:  "column",
              gap:            "20px",
            }}
          >
            {/* Empty state */}
            {messages.length === 0 && (
              <div
                style={{
                  display:        "flex",
                  flexDirection:  "column",
                  alignItems:     "center",
                  justifyContent: "center",
                  height:         "100%",
                  textAlign:      "center",
                  padding:        "0 40px",
                  gap:            "12px",
                }}
              >
                <div
                  style={{
                    width:          "56px",
                    height:         "56px",
                    borderRadius:   "16px",
                    background:     "rgba(99,102,241,0.07)",
                    border:         "1px solid rgba(99,102,241,0.13)",
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                  }}
                >
                  <Bot size={24} style={{ color: "#6366f1", opacity: 0.6 }} />
                </div>
                <p style={{ fontSize: "0.92rem", fontWeight: 600, color: "#94a3b8" }}>
                  Contract AI
                </p>
                <p style={{ fontSize: "0.82rem", color: "#334155", lineHeight: 1.65, maxWidth: "340px" }}>
                  Ask a question about the selected contract. Answers are grounded in the exact contract text.
                </p>
              </div>
            )}

            {/* Message list */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display:        "flex",
                  gap:            "10px",
                  flexDirection:  msg.role === "user" ? "row-reverse" : "row",
                  alignItems:     "flex-start",
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width:          "30px",
                    height:         "30px",
                    flexShrink:     0,
                    borderRadius:   "8px",
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    marginTop:      "2px",
                    background:     msg.role === "user"
                      ? "rgba(99,102,241,0.14)"
                      : "rgba(99,102,241,0.08)",
                    border: msg.role === "user"
                      ? "1px solid rgba(99,102,241,0.22)"
                      : "1px solid rgba(99,102,241,0.12)",
                  }}
                >
                  {msg.role === "user" ? (
                    <User size={13} style={{ color: "#818cf8" }} />
                  ) : (
                    <Sparkles size={13} style={{ color: "#6366f1" }} />
                  )}
                </div>

                {/* Bubble content */}
                <div
                  style={{
                    maxWidth:   "78%",
                    display:    "flex",
                    flexDirection: "column",
                    gap:        "4px",
                    alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  {msg.role === "user" ? (
                    <div
                      style={{
                        padding:      "10px 14px",
                        borderRadius: "12px 12px 3px 12px",
                        background:   "rgba(99,102,241,0.12)",
                        border:       "1px solid rgba(99,102,241,0.20)",
                        fontSize:     "0.875rem",
                        color:        "#dae2fd",
                        lineHeight:   1.65,
                      }}
                    >
                      {msg.content}
                    </div>
                  ) : msg.ai ? (
                    /* Structured Q&A response */
                    <div
                      style={{
                        padding:      "14px 16px",
                        borderRadius: "3px 12px 12px 12px",
                        background:   "rgba(15,23,42,0.7)",
                        border:       "1px solid rgba(99,102,241,0.09)",
                        width:        "100%",
                      }}
                    >
                      <AiAnswerBubble ai={msg.ai} />
                    </div>
                  ) : (
                    /* Plain text (greeting, error, casual response) */
                    <div
                      style={{
                        padding:      "10px 14px",
                        borderRadius: "3px 12px 12px 12px",
                        background:   "rgba(15,23,42,0.7)",
                        border:       "1px solid rgba(99,102,241,0.09)",
                        fontSize:     "0.875rem",
                        color:        "#94a3b8",
                        lineHeight:   1.65,
                      }}
                    >
                      {msg.content}
                    </div>
                  )}

                  <span
                    style={{
                      fontSize: "0.65rem",
                      color:    "#1e293b",
                      padding:  "0 2px",
                    }}
                  >
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <div
                  style={{
                    width:          "30px",
                    height:         "30px",
                    flexShrink:     0,
                    borderRadius:   "8px",
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    marginTop:      "2px",
                    background:     "rgba(99,102,241,0.08)",
                    border:         "1px solid rgba(99,102,241,0.12)",
                  }}
                >
                  <Sparkles size={13} style={{ color: "#6366f1" }} />
                </div>
                <div
                  style={{
                    padding:      "14px 16px",
                    borderRadius: "3px 12px 12px 12px",
                    background:   "rgba(15,23,42,0.7)",
                    border:       "1px solid rgba(99,102,241,0.09)",
                  }}
                >
                  <TypingIndicator />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            style={{
              flexShrink:   0,
              padding:      "14px 20px 18px",
              borderTop:    "1px solid rgba(99,102,241,0.08)",
              background:   "rgba(11,19,38,0.8)",
              borderRadius: "0 0 14px 14px",
            }}
          >
            <form
              onSubmit={submit}
              style={{ display: "flex", gap: "10px", alignItems: "center" }}
            >
              <div
                style={{
                  flex:         1,
                  display:      "flex",
                  alignItems:   "center",
                  borderRadius: "12px",
                  overflow:     "hidden",
                  background:   "rgba(15,23,42,0.8)",
                  border:       "1px solid rgba(99,102,241,0.16)",
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={
                    contractId
                      ? "Ask anything about this contract…"
                      : "Select a contract to begin"
                  }
                  disabled={!contractId || loading}
                  maxLength={1000}
                  style={{
                    flex:       1,
                    background: "transparent",
                    padding:    "12px 14px",
                    fontSize:   "0.875rem",
                    outline:    "none",
                    color:      "#dae2fd",
                    opacity:    !contractId || loading ? 0.45 : 1,
                  }}
                />
                {question.length > 0 && (
                  <span
                    style={{
                      marginRight: "12px",
                      fontSize:    "0.68rem",
                      color:       "#1e293b",
                      fontFamily:  "var(--font-mono, monospace)",
                      whiteSpace:  "nowrap",
                    }}
                  >
                    {question.length}/1000
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={!question.trim() || !contractId || loading}
                style={{
                  display:        "flex",
                  width:          "44px",
                  height:         "44px",
                  flexShrink:     0,
                  alignItems:     "center",
                  justifyContent: "center",
                  borderRadius:   "12px",
                  border:         "none",
                  cursor:         !question.trim() || !contractId || loading ? "not-allowed" : "pointer",
                  opacity:        !question.trim() || !contractId || loading ? 0.35 : 1,
                  background:     "linear-gradient(135deg,#6366f1,#4f46e5)",
                  transition:     "opacity 0.15s, transform 0.12s",
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
                  <Loader2 size={16} className="animate-spin" style={{ color: "#fff" }} />
                ) : (
                  <Send size={15} style={{ color: "#fff" }} />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
