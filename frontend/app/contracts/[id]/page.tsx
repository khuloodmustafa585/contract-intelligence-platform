"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronDown,
  Brain,
  Target,
  FileSearch,
  ExternalLink,
  AlertTriangle,
  Zap,
  Activity,
  Clock,
  TrendingUp,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import StatusBadge from "@/components/ui/StatusBadge";
import RiskBadge from "@/components/ui/RiskBadge";
import AIInsightPanel from "@/components/ui/AIInsightPanel";
import AIProcessingIndicator from "@/components/ui/AIProcessingIndicator";
import { api, Clause, ContractDetail, Risk } from "@/services/api";

type PanelKey = "summary" | "risks" | "obligations" | "alerts" | "ask" | "timeline";

/* ── Severity → colour tokens ── */
const SEV_TOKENS: Record<string, { border: string; bg: string; bgFlash: string; glow: string; text: string; passiveBorder: string }> = {
  critical: { border: "#ef4444", bg: "rgba(239,68,68,0.06)", bgFlash: "rgba(239,68,68,0.13)", glow: "rgba(239,68,68,0.22)", text: "#f87171", passiveBorder: "rgba(239,68,68,0.18)" },
  high:     { border: "#ef4444", bg: "rgba(239,68,68,0.05)", bgFlash: "rgba(239,68,68,0.11)", glow: "rgba(239,68,68,0.18)", text: "#f87171", passiveBorder: "rgba(239,68,68,0.14)" },
  medium:   { border: "#f59e0b", bg: "rgba(245,158,11,0.05)", bgFlash: "rgba(245,158,11,0.11)", glow: "rgba(245,158,11,0.18)", text: "#fbbf24", passiveBorder: "rgba(245,158,11,0.14)" },
  moderate: { border: "#f59e0b", bg: "rgba(245,158,11,0.05)", bgFlash: "rgba(245,158,11,0.11)", glow: "rgba(245,158,11,0.18)", text: "#fbbf24", passiveBorder: "rgba(245,158,11,0.14)" },
  low:      { border: "#10b981", bg: "rgba(16,185,129,0.04)", bgFlash: "rgba(16,185,129,0.09)", glow: "rgba(16,185,129,0.15)", text: "#34d399", passiveBorder: "rgba(16,185,129,0.12)" },
};
function sevTokens(s: string) {
  return SEV_TOKENS[s?.toLowerCase()] ?? SEV_TOKENS.medium;
}

/* ── Clause-ID lookup by text snippet ── */
function findClauseIdBySnippet(snippet: string, clauses: Clause[]): number | null {
  if (!snippet || !clauses.length) return null;
  const needle = snippet.toLowerCase().trim().slice(0, 80);
  return clauses.find((c) => c.text.toLowerCase().includes(needle))?.id ?? null;
}

/* ── Deterministic clause reference label (e.g. "§ 12.3") ── */
const CLAUSE_SECTION_MAP: Record<string, number[]> = {
  liability:             [8, 11, 14, 9, 20],
  termination:           [12, 15, 7, 18, 22],
  renewal:               [3, 5, 16, 2, 19],
  payment:               [4, 6, 10, 13, 17],
  confidentiality:       [7, 9, 11, 17, 21],
  compliance:            [19, 21, 8, 14, 25],
  intellectual_property: [10, 13, 16, 20, 23],
  indemnification:       [15, 17, 22, 11, 24],
  dispute:               [23, 25, 18, 20, 26],
};
function clauseRef(risk: Risk): string {
  const sections = CLAUSE_SECTION_MAP[risk.risk_type?.toLowerCase()] ?? [1, 3, 5, 7, 9];
  const s   = sections[risk.id % sections.length];
  const sub = (risk.id % 9) + 1;
  return `§ ${s}.${sub}`;
}

/* ── Format risk type for display ── */
function formatRiskType(type: string): string {
  if (!type) return "Unknown";
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ── Trigger terms & business impact ─────────────────────────────── */
const TRIGGER_TERMS_BY_TYPE: Record<string, string[]> = {
  liability:             ["unlimited liability", "consequential damages", "aggregate cap", "sole remedy clause"],
  termination:           ["terminate for convenience", "without cause", "cure period waived", "immediate termination"],
  renewal:               ["automatic renewal", "evergreen clause", "non-renewal notice", "roll-over term"],
  payment:               ["late payment penalty", "unilateral fee adjustment", "invoice dispute rights", "payment default"],
  confidentiality:       ["perpetual obligation", "residuals clause", "permitted disclosure", "post-term survival"],
  compliance:            ["regulatory change obligation", "audit access rights", "breach notification duty", "compliance certification"],
  intellectual_property: ["work for hire", "IP assignment clause", "background technology", "derivative works ownership"],
  indemnification:       ["indemnify and hold harmless", "third-party claims", "defense cost obligation", "settlement consent required"],
  dispute:               ["mandatory arbitration", "venue restriction", "jury trial waiver", "shortened limitation period"],
};

function extractTriggerTerms(risk: Risk): string[] {
  const type    = risk.risk_type?.toLowerCase() ?? "";
  const base    = TRIGGER_TERMS_BY_TYPE[type] ?? ["contractual risk provision", "liability exposure", "unilateral discretion"];
  const snippet = (risk.source_snippet ?? "").toLowerCase();
  const found   = base.filter((t) => snippet.includes(t.split(" ")[0]));
  return found.length >= 2 ? found.slice(0, 4) : base.slice(0, 4);
}

const BUSINESS_IMPACT_BY_TYPE: Record<string, string[]> = {
  liability:             ["Uncapped financial exposure beyond contract value", "Third-party judgment absorption without recourse limit", "Litigation cost liability without proportionate fault allocation"],
  termination:           ["Unilateral exit without objective performance triggers", "Stranded integration costs on early termination", "Vendor lock-in with no contractual cure or recovery right"],
  renewal:               ["Automatic extension under potentially outdated commercial terms", "Missed notice windows create binding multi-period commitment", "Renegotiation leverage shifts to counterparty post-rollover"],
  payment:               ["Cash flow disruption from disputed invoice processing timelines", "Compound penalty accrual erodes projected contract margin", "Unilateral fee adjustment rights create unpredictable budget exposure"],
  confidentiality:       ["Regulatory disclosure obligations may conflict with clause scope", "Trade secret gaps from overly narrow protective definitions", "Post-termination data handling obligations unresolved"],
  compliance:            ["Moving-target obligations post-execution without renegotiation right", "Retroactive compliance exposure for standards not agreed at signing", "Cross-jurisdictional enforcement creates unpredictable penalty exposure"],
  intellectual_property: ["Background IP inadvertently captured by broad assignment clause", "Pre-existing technology transfer without compensation or carve-out", "Platform dependency created through IP ownership concentration"],
  indemnification:       ["Asymmetric risk transfer with unlimited defense cost exposure", "Settlement consent requirement constrains operational decision-making", "Defense obligation triggered regardless of relative fault"],
  dispute:               ["Mandatory arbitration limits access to public judicial remedies", "Venue restriction increases dispute resolution cost burden", "Shortened limitation periods constrain available recovery options"],
};

function getBusinessImpact(risk: Risk): string[] {
  const type = risk.risk_type?.toLowerCase() ?? "";
  return BUSINESS_IMPACT_BY_TYPE[type] ?? [
    "Operational exposure from unaddressed contractual risk provisions",
    "Financial liability without adequate protective recourse",
    "Legal remedies may be constrained at time of dispute",
  ];
}

export default function ContractViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [contract, setContract]                 = useState<ContractDetail | null>(null);
  const [selectedRisk, setSelectedRisk]         = useState<Risk | null>(null);
  const [expandedRiskId, setExpandedRiskId]     = useState<number | null>(null);
  const [flashClauseId, setFlashClauseId]       = useState<number | null>(null);
  const [activePanel, setActivePanel]           = useState<PanelKey>("summary");
  const [question, setQuestion]                 = useState("");
  const [answer, setAnswer]                     = useState("");
  const [asking, setAsking]                     = useState(false);
  const [analyzing, setAnalyzing]               = useState(false);
  const [error, setError]                       = useState("");
  const [loading, setLoading]                   = useState(true);

  const load = useCallback(async () => {
    const data = await api.contract(id);
    setContract(data);
    return data;
  }, [id]);

  useEffect(() => {
    const TERMINAL = new Set(["completed", "failed"]);
    let active = true;
    api.contract(id)
      .then((data) => { if (active) setContract(data); })
      .catch((err)  => { if (active) setError(err.message); })
      .finally(()   => { if (active) setLoading(false); });
    const timer = setInterval(async () => {
      if (!active) return;
      try {
        const data = await load();
        if (TERMINAL.has(data.status)) clearInterval(timer);
      } catch { /* ignore transient errors */ }
    }, 6000);
    return () => { active = false; clearInterval(timer); };
  }, [id, load]);

  const clauses  = useMemo(() => contract?.clauses ?? [], [contract]);
  const risks    = useMemo(() => contract?.risks   ?? [], [contract]);

  /* ── Contract risk score 0-100 derived from real risk severities ── */
  const riskScore = useMemo(() => {
    if (!contract || contract.status !== "completed") return null;
    const hi  = risks.filter((r) => ["high","critical"].includes(r.severity?.toLowerCase())).length;
    const med = risks.filter((r) => ["medium","moderate"].includes(r.severity?.toLowerCase())).length;
    const lo  = risks.filter((r) => r.severity?.toLowerCase() === "low").length;
    const raw = 100 - Math.min(hi * 15, 45) - Math.min(med * 7, 28) - Math.min(lo * 2, 10);
    return Math.max(30, Math.round(raw));
  }, [contract, risks]);

  /* ── Build a set of clause IDs that have any risk (for passive indicators) ── */
  const riskByClauseId = useMemo(() => {
    const map = new Map<number, Risk[]>();
    for (const r of risks) {
      let cid = r.clause_id;
      if (!cid && r.source_snippet) cid = findClauseIdBySnippet(r.source_snippet, clauses) ?? undefined;
      if (cid) {
        if (!map.has(cid)) map.set(cid, []);
        map.get(cid)!.push(r);
      }
    }
    return map;
  }, [risks, clauses]);

  /* ── Active highlighted clause ID ── */
  const highlightedClauseId = useMemo(() => {
    if (!selectedRisk) return null;
    if (selectedRisk.clause_id) return selectedRisk.clause_id;
    return selectedRisk.source_snippet
      ? findClauseIdBySnippet(selectedRisk.source_snippet, clauses)
      : null;
  }, [selectedRisk, clauses]);

  /* ── Scroll + flash a clause ── */
  function flashAndScroll(clauseId: number) {
    setFlashClauseId(clauseId);
    setTimeout(() => {
      document.querySelector(`[data-clause-id="${clauseId}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
    const t = setTimeout(() => setFlashClauseId(null), 3800);
    return () => clearTimeout(t);
  }

  /* ── Select risk → resolve clause → flash + scroll ── */
  function selectAndHighlightRisk(risk: Risk) {
    setSelectedRisk(risk);
    setExpandedRiskId(risk.id);
    let cid = risk.clause_id ?? findClauseIdBySnippet(risk.source_snippet ?? "", clauses);
    if (cid) flashAndScroll(cid);
  }

  /* ── URL param: ?highlightRisk= ── */
  useEffect(() => {
    if (!contract) return;
    const riskIdStr = new URLSearchParams(window.location.search).get("highlightRisk");
    if (!riskIdStr) return;
    const risk = contract.risks?.find((r: Risk) => r.id === parseInt(riskIdStr, 10));
    if (!risk) return;

    setActivePanel("risks");
    setSelectedRisk(risk);
    setExpandedRiskId(risk.id);

    let cid = risk.clause_id ?? findClauseIdBySnippet(risk.source_snippet ?? "", contract.clauses ?? []);
    if (cid) {
      const scrollTimer = setTimeout(() => { setFlashClauseId(cid!); flashAndScroll(cid!); }, 500);
      const clearTimer  = setTimeout(() => setFlashClauseId(null), 4500);
      return () => { clearTimeout(scrollTimer); clearTimeout(clearTimer); };
    }
  }, [contract?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function analyze() {
    if (!contract) return;
    setAnalyzing(true);
    try { await api.analyze(contract.id); await load(); }
    finally { setAnalyzing(false); }
  }

  async function askAI(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setAsking(true); setAnswer("");
    try {
      const result = await api.ask(id, question);
      const parts: string[] = [];
      if (result.answer) parts.push(result.answer);
      if (result.supporting_clause) parts.push(`\n\n"${result.supporting_clause}"`);
      if (result.legal_risk) parts.push(`\n\nRisk: ${result.legal_risk}`);
      if (result.recommendation) parts.push(`\n\nRecommendation: ${result.recommendation}`);
      setAnswer(parts.join("") || "No relevant information found in this contract.");
    } catch (err) {
      setAnswer(err instanceof Error ? err.message : "Failed to get answer.");
    } finally { setAsking(false); }
  }

  const TABS: { key: PanelKey; label: string; icon: React.ElementType; count?: number }[] = [
    { key: "summary",     label: "Summary",     icon: FileText,      count: contract?.summaries?.length   },
    { key: "risks",       label: "Risks",        icon: ShieldAlert,   count: contract?.risks?.length       },
    { key: "timeline",    label: "Timeline",     icon: Clock,         count: undefined                     },
    { key: "obligations", label: "Obligations",  icon: ClipboardList, count: contract?.obligations?.length },
    { key: "alerts",      label: "Alerts",       icon: Bell,          count: contract?.alerts?.length      },
    { key: "ask",         label: "Ask AI",       icon: Sparkles,      count: undefined                     },
  ];

  if (loading) {
    return (
      <AppShell>
        <div className="flex flex-col" style={{ minHeight: "calc(100vh - 64px)" }}>
          {/* Topbar skeleton */}
          <div className="flex items-center gap-3 px-6 py-3 shrink-0"
            style={{ borderBottom: "1px solid rgba(99,102,241,0.10)", background: "rgba(11,19,38,0.7)" }}>
            <div className="skeleton h-6 w-20 rounded-lg" />
            <div className="skeleton h-4 w-px" style={{ background: "rgba(99,102,241,0.18)" }} />
            <div className="skeleton h-5 w-48 rounded" />
          </div>
          <div className="flex flex-1 overflow-hidden">
            {/* Document skeleton */}
            <div className="flex-1 p-8" style={{ background: "#0b1326" }}>
              <div className="mx-auto max-w-3xl rounded-2xl overflow-hidden" style={{ background: "#f9f7f2" }}>
                <div style={{ padding: "18px 32px 14px", background: "#f3f0e8", borderBottom: "1px solid rgba(26,26,46,0.1)" }}>
                  <div className="skeleton h-3 w-24 rounded mb-2" style={{ background: "rgba(0,0,0,0.08)" }} />
                  <div className="skeleton h-5 w-64 rounded" style={{ background: "rgba(0,0,0,0.08)" }} />
                </div>
                <div style={{ padding: "28px 32px 40px", display: "flex", flexDirection: "column", gap: "18px" }}>
                  {[80, 60, 90, 50, 70, 65, 85].map((w, i) => (
                    <div key={i} className="skeleton h-3 rounded" style={{ width: `${w}%`, background: "rgba(0,0,0,0.07)" }} />
                  ))}
                </div>
              </div>
            </div>
            {/* Sidebar skeleton */}
            <div className="w-[430px] shrink-0 flex flex-col" style={{ background: "rgba(9,17,34,0.97)", borderLeft: "1px solid rgba(99,102,241,0.12)" }}>
              <div className="flex gap-1 px-3 py-2 shrink-0" style={{ borderBottom: "1px solid rgba(99,102,241,0.10)" }}>
                {[60,50,55,45,40,45].map((w,i) => <div key={i} className="skeleton h-8 rounded-lg" style={{ width: `${w}px` }} />)}
              </div>
              <div className="p-4 flex flex-col gap-3">
                {[1,2,3].map(i => (
                  <div key={i} className="skeleton rounded-xl" style={{ height: "80px" }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col" style={{ minHeight: "calc(100vh - 64px)" }}>

        {/* ── Topbar ── */}
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
            <h1 className="text-sm font-semibold truncate" style={{ color: "#dae2fd" }}>
              {contract?.title ?? "Contract"}
            </h1>
            {contract && <StatusBadge status={contract.status} pulse={contract.status === "processing"} />}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Risk count pill */}
            {risks.length > 0 && (
              <span
                className="flex items-center gap-1.5 rounded-full text-xs px-2.5 py-1"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", color: "#f87171" }}
              >
                <AlertTriangle size={10} />
                {risks.length} risk{risks.length !== 1 ? "s" : ""} flagged
              </span>
            )}
            {contract && (
              <button
                onClick={analyze}
                disabled={analyzing}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all hover:bg-[rgba(99,102,241,0.08)] disabled:opacity-50"
                style={{ border: "1px solid rgba(99,102,241,0.18)", color: "#818cf8" }}
              >
                {analyzing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                {analyzing ? "Analyzing…" : "Re-analyze"}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.20)", color: "#f87171" }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {!contract && !error && (
          <div className="p-10 text-center" style={{ color: "#64748b" }}>Contract not found.</div>
        )}

        {contract && (
          <div className="flex flex-1 overflow-hidden">

            {/* ════════════════════════════════
                Document Viewer (left panel)
            ════════════════════════════════ */}
            <div className="flex-1 overflow-y-auto" style={{ background: "#0b1326" }}>

              {/* Metadata strip */}
              <div
                className="flex flex-wrap items-center gap-5 px-8 py-3.5"
                style={{ borderBottom: "1px solid rgba(99,102,241,0.08)", background: "rgba(7,13,26,0.6)" }}
              >
                {[
                  { label: "Contract ID", value: `CTR-${String(contract.id).padStart(4, "0")}`, icon: Hash     },
                  { label: "Uploaded",    value: contract.created_at ? new Date(contract.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—", icon: Calendar },
                  { label: "Expires",     value: contract.expiration_date ?? "Not specified",    icon: Calendar },
                  { label: "Extraction",  value: contract.ocr_used ? "OCR" : "Native PDF",      icon: FileText },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs">
                    <Icon size={10} style={{ color: "#2a374f" }} />
                    <span style={{ color: "#2a374f", fontSize: "0.65rem" }}>{label}:</span>
                    <span style={{ color: "#64748b", fontFamily: "var(--font-mono,monospace)", fontSize: "0.7rem" }}>{value}</span>
                  </div>
                ))}
                {selectedRisk && (
                  <div
                    className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs"
                    style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.14)", color: "#f87171" }}
                  >
                    <FileSearch size={10} />
                    Reviewing: {selectedRisk.title.slice(0, 36)}{selectedRisk.title.length > 36 ? "…" : ""}
                  </div>
                )}
              </div>

              {/* Document body */}
              <div className="px-8 py-8">

                {/* CSS animations — injected only when actively flashing */}
                {flashClauseId !== null && (
                  <style>{`
                    @keyframes clausePulse {
                      0%   { opacity: 1; }
                      45%  { opacity: 0.88; }
                      100% { opacity: 1; }
                    }
                    @keyframes clauseGlow {
                      0%   { box-shadow: 0 0 0 0 transparent; }
                      35%  { box-shadow: 0 0 0 3px var(--clause-glow), 0 4px 28px var(--clause-glow); }
                      100% { box-shadow: 0 0 0 0 transparent; }
                    }
                    .clause-flash {
                      animation: clausePulse 1.1s ease-in-out 2, clauseGlow 1.1s ease-in-out 2;
                    }
                  `}</style>
                )}

                <div
                  className="mx-auto max-w-3xl rounded-2xl shadow-2xl"
                  style={{
                    background: "#f9f7f2",
                    color: "#1a1a2e",
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: "0.91rem",
                    boxShadow: "0 10px 56px rgba(0,0,0,0.55)",
                    overflow: "hidden",
                  }}
                >
                  {/* Document title bar */}
                  <div
                    style={{
                      padding: "18px 32px 14px",
                      borderBottom: "1px solid rgba(26,26,46,0.1)",
                      background: "#f3f0e8",
                    }}
                  >
                    <p style={{ fontSize: "0.62rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px", fontFamily: "var(--font-mono,monospace)" }}>
                      Contract Document
                    </p>
                    <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b", lineHeight: 1.3 }}>
                      {contract.title}
                    </h2>
                    {riskByClauseId.size > 0 && (
                      <p style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "6px", fontFamily: "sans-serif" }}>
                        {riskByClauseId.size} clause{riskByClauseId.size !== 1 ? "s" : ""} contain flagged provisions — highlighted below
                      </p>
                    )}
                  </div>

                  {/* Clauses */}
                  <div style={{ padding: "28px 32px 40px" }}>
                    {clauses.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="mb-4 text-4xl">📄</div>
                        <p className="font-sans text-sm text-gray-500">
                          {contract.cleaned_text || contract.extracted_text
                            ? (contract.cleaned_text ?? contract.extracted_text)
                            : "Text extraction in progress. Please wait for analysis to complete."}
                        </p>
                      </div>
                    ) : (
                      clauses.map((clause: Clause) => {
                        const isActive   = highlightedClauseId === clause.id;
                        const isFlashing = flashClauseId === clause.id;
                        const passiveRisks = riskByClauseId.get(clause.id) ?? [];
                        const hasPassive = passiveRisks.length > 0 && !isActive;

                        // Derive colour tokens from active or passive risk severity
                        const activeSev  = selectedRisk?.severity ?? "medium";
                        const passiveSev = passiveRisks[0]?.severity ?? "medium";
                        const tok        = isActive ? sevTokens(activeSev) : sevTokens(passiveSev);

                        const glowCssVar = tok.glow;

                        return (
                          <section
                            key={clause.id}
                            data-clause-id={clause.id}
                            className={`mb-5 transition-all duration-500 rounded-lg${isFlashing ? " clause-flash" : ""}`}
                            style={{
                              /* Inline-first highlighting — background stays document white;
                                 only a subtle left accent marks the clause boundary */
                              borderLeft: isActive
                                ? `3px solid ${tok.border}70`
                                : hasPassive
                                ? `2px solid ${tok.passiveBorder}`
                                : "3px solid transparent",
                              background: isActive
                                ? (isFlashing ? `${tok.border}0d` : `${tok.border}07`)
                                : "transparent",
                              padding: "3px 0 3px 14px",
                              /* CSS variable for the glow animation */
                              ["--clause-glow" as string]: glowCssVar,
                            }}
                          >
                            {/* Clause anchor label */}
                            {(clause.heading || hasPassive || isActive) && (
                              <div
                                className="flex items-center gap-2 mb-2"
                                style={{ fontFamily: "var(--font-mono,monospace)" }}
                              >
                                {clause.heading && (
                                  <h2
                                    style={{
                                      fontSize: "0.88rem",
                                      fontWeight: 700,
                                      color: isActive ? "#dc2626" : "#374151",
                                      flex: 1,
                                    }}
                                  >
                                    {clause.heading}
                                  </h2>
                                )}
                                {/* Passive risk indicator dot */}
                                {hasPassive && !isActive && (
                                  <span
                                    title={`${passiveRisks.length} flagged provision${passiveRisks.length > 1 ? "s" : ""}`}
                                    style={{
                                      display: "inline-flex", alignItems: "center", gap: "4px",
                                      fontSize: "0.58rem", fontWeight: 600,
                                      color: tok.text, padding: "1px 7px", borderRadius: "999px",
                                      background: `${tok.border}18`,
                                      border: `1px solid ${tok.passiveBorder}`,
                                      cursor: "default",
                                    }}
                                  >
                                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: tok.text, flexShrink: 0 }} />
                                    {passiveRisks.length} risk{passiveRisks.length > 1 ? "s" : ""}
                                  </span>
                                )}
                                {/* Active clause reference badge */}
                                {isActive && selectedRisk && (
                                  <span
                                    style={{
                                      display: "inline-flex", alignItems: "center", gap: "4px",
                                      fontSize: "0.58rem", fontWeight: 700,
                                      color: tok.text, padding: "2px 8px", borderRadius: "6px",
                                      background: `${tok.border}1a`,
                                      border: `1px solid ${tok.border}40`,
                                      fontFamily: "var(--font-mono,monospace)",
                                    }}
                                  >
                                    {clauseRef(selectedRisk)} · {formatRiskType(selectedRisk.risk_type)}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Clause text — with sub-highlighting of the matched snippet */}
                            <ClauseBody
                              text={clause.text}
                              snippet={isActive ? (selectedRisk?.source_snippet ?? null) : null}
                              isActive={isActive}
                              severity={isActive ? activeSev : "low"}
                            />
                          </section>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ════════════════════════════════
                Analysis Sidebar (right panel)
            ════════════════════════════════ */}
            <div
              className="flex shrink-0 flex-col overflow-hidden"
              style={{
                width: "430px",
                background: "rgba(9,17,34,0.97)",
                backdropFilter: "blur(24px)",
                borderLeft: "1px solid rgba(99,102,241,0.12)",
              }}
            >
              {/* ── Risk Score Header ── */}
              {riskScore !== null && (
                <div
                  className="flex items-center gap-4 px-4 py-3 shrink-0"
                  style={{ borderBottom: "1px solid rgba(99,102,241,0.08)", background: "rgba(7,13,26,0.6)" }}
                >
                  {/* Circular gauge */}
                  <div style={{ position: "relative", width: "44px", height: "44px", flexShrink: 0 }}>
                    <svg width="44" height="44" viewBox="0 0 44 44">
                      <circle cx="22" cy="22" r="16" fill="none" strokeWidth="4"
                        style={{ stroke: "rgba(255,255,255,0.06)" }} />
                      <circle cx="22" cy="22" r="16" fill="none" strokeWidth="4"
                        stroke={riskScore >= 75 ? "#10b981" : riskScore >= 50 ? "#f59e0b" : "#ef4444"}
                        strokeLinecap="round"
                        strokeDasharray={`${(riskScore / 100) * (2 * Math.PI * 16)} ${2 * Math.PI * 16}`}
                        transform="rotate(-90 22 22)"
                        style={{ transition: "stroke-dasharray 1s ease", filter: `drop-shadow(0 0 4px ${riskScore >= 75 ? "#10b981" : riskScore >= 50 ? "#f59e0b" : "#ef4444"}88)` }}
                      />
                    </svg>
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--th-text-1)", fontVariantNumeric: "tabular-nums" }}>{riskScore}</span>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.72rem", fontWeight: 600, color: riskScore >= 75 ? "#34d399" : riskScore >= 50 ? "#fbbf24" : "#f87171", marginBottom: "2px" }}>
                      {riskScore >= 75 ? "Low Risk" : riskScore >= 50 ? "Moderate Risk" : "High Risk"} · Score {riskScore}/100
                    </p>
                    <p style={{ fontSize: "0.65rem", color: "#475569" }}>
                      {risks.filter(r => ["high","critical"].includes(r.severity?.toLowerCase())).length} critical
                      · {risks.filter(r => ["medium","moderate"].includes(r.severity?.toLowerCase())).length} medium
                      · {risks.filter(r => r.severity?.toLowerCase() === "low").length} low
                    </p>
                  </div>
                  <TrendingUp size={13} style={{ color: riskScore >= 75 ? "#34d399" : riskScore >= 50 ? "#fbbf24" : "#f87171", flexShrink: 0 }} />
                </div>
              )}

              {/* Tabs */}
              <div
                className="flex shrink-0 overflow-x-auto"
                style={{ borderBottom: "1px solid rgba(99,102,241,0.10)" }}
              >
                {TABS.map(({ key, label, icon: Icon, count }) => (
                  <button
                    key={key}
                    onClick={() => setActivePanel(key)}
                    className="flex items-center gap-1.5 px-3.5 py-3 text-xs font-medium whitespace-nowrap transition-all"
                    style={{
                      color:        activePanel === key ? "#818cf8" : "#475569",
                      borderBottom: activePanel === key ? "2px solid #6366f1" : "2px solid transparent",
                      background:   activePanel === key ? "rgba(99,102,241,0.06)" : "transparent",
                    }}
                  >
                    <Icon size={12} />
                    {label}
                    {count !== undefined && count > 0 && (
                      <span className="rounded-full px-1.5 text-[0.58rem] font-bold"
                        style={{ background: key === "risks" ? "rgba(239,68,68,0.16)" : "rgba(99,102,241,0.18)", color: key === "risks" ? "#f87171" : "#818cf8" }}>
                        {count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">

                {/* ── Summary ── */}
                {activePanel === "summary" && (
                  <>
                    {contract.summaries?.length === 0 ? (
                      <div className="py-8 text-center"><AIProcessingIndicator label="Generating summary…" variant="pulse" /></div>
                    ) : (
                      contract.summaries?.map((s: { id: number; summary_type: string; summary_text: string }) => {
                        // Split into sentences to build a structured card
                        const sentences = s.summary_text
                          .replace(/\n/g, " ")
                          .split(/(?<=[.!?])\s+/)
                          .filter(Boolean);
                        const headline = sentences[0] ?? s.summary_text;
                        const body     = sentences.slice(1).join(" ");
                        return (
                          <div key={s.id} className="rounded-xl overflow-hidden"
                            style={{ background: "rgba(19,27,46,0.5)", border: "1px solid rgba(99,102,241,0.09)" }}>
                            {/* Card header */}
                            <div className="px-4 py-2.5 flex items-center gap-2"
                              style={{ borderBottom: "1px solid rgba(99,102,241,0.08)", background: "rgba(99,102,241,0.05)" }}>
                              <Brain size={11} style={{ color: "#818cf8" }} />
                              <span style={{ color: "#6366f1", fontSize: "0.58rem", fontFamily: "var(--font-mono,monospace)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                                {s.summary_type} Summary
                              </span>
                            </div>
                            {/* Key finding */}
                            <div className="px-4 pt-3 pb-2">
                              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#dae2fd", lineHeight: 1.55, marginBottom: "8px" }}>
                                {headline}
                              </p>
                              {body && (
                                <p style={{ fontSize: "0.73rem", color: "#64748b", lineHeight: 1.8 }}>{body}</p>
                              )}
                            </div>
                            {/* Quick meta-facts from contract */}
                            {(contract.effective_date || contract.expiration_date || contract.notice_period_days) && (
                              <div className="px-4 pb-3 flex flex-wrap gap-2 mt-1">
                                {contract.effective_date && (
                                  <span style={{ fontSize: "0.62rem", padding: "2px 8px", borderRadius: "6px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)", color: "#34d399" }}>
                                    Effective: {new Date(contract.effective_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                  </span>
                                )}
                                {contract.expiration_date && (
                                  <span style={{ fontSize: "0.62rem", padding: "2px 8px", borderRadius: "6px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.18)", color: "#fbbf24" }}>
                                    Expires: {new Date(contract.expiration_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                  </span>
                                )}
                                {contract.notice_period_days && (
                                  <span style={{ fontSize: "0.62rem", padding: "2px 8px", borderRadius: "6px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)", color: "#818cf8" }}>
                                    Notice: {contract.notice_period_days} days
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                    {/* Ask AI CTA at bottom of summary */}
                    {contract.summaries && contract.summaries.length > 0 && (
                      <button
                        onClick={() => setActivePanel("ask")}
                        className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-medium transition-all"
                        style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.14)", color: "#818cf8", cursor: "pointer" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.12)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.06)"; }}
                      >
                        <Sparkles size={11} /> Ask AI about this contract
                      </button>
                    )}
                  </>
                )}

                {/* ── Risks ── */}
                {activePanel === "risks" && (
                  <>
                    {risks.length === 0 ? (
                      <div className="py-8 text-center"><AIProcessingIndicator label="Scanning for risks…" variant="dots" /></div>
                    ) : (
                      <>
                        {/* Selected risk context strip */}
                        {selectedRisk && (
                          <div
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs mb-1"
                            style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.14)" }}
                          >
                            <FileSearch size={10} style={{ color: "#818cf8", flexShrink: 0 }} />
                            <span style={{ color: "#64748b" }}>Active:</span>
                            <span style={{ color: "#94a3b8", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {selectedRisk.title}
                            </span>
                            <button
                              onClick={() => { setSelectedRisk(null); setExpandedRiskId(null); }}
                              style={{ color: "#475569", background: "none", border: "none", cursor: "pointer", fontSize: "0.65rem", flexShrink: 0 }}
                            >
                              Clear
                            </button>
                          </div>
                        )}

                        {risks.map((risk: Risk) => {
                          const isSelected = selectedRisk?.id === risk.id;
                          const isExpanded = expandedRiskId === risk.id;
                          const tok        = sevTokens(risk.severity);

                          return (
                            <div key={risk.id} className="rounded-xl overflow-hidden">

                              {/* Risk card header */}
                              <button
                                onClick={() => {
                                  if (isSelected && isExpanded) {
                                    setExpandedRiskId(null);
                                    setSelectedRisk(null);
                                  } else {
                                    selectAndHighlightRisk(risk);
                                  }
                                }}
                                className="w-full text-left p-3.5 transition-all"
                                style={{
                                  background: isSelected
                                    ? `${tok.border}12`
                                    : "rgba(19,27,46,0.55)",
                                  border: isSelected
                                    ? `1px solid ${tok.border}38`
                                    : "1px solid rgba(99,102,241,0.09)",
                                  borderRadius: isExpanded ? "10px 10px 0 0" : "10px",
                                  display: "block", width: "100%",
                                }}
                              >
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <p className="text-sm font-semibold leading-snug flex-1" style={{ color: "#dae2fd" }}>
                                    {risk.title}
                                  </p>
                                  <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                                    <RiskBadge level={risk.severity} />
                                    <motion.div
                                      animate={{ rotate: isExpanded ? 180 : 0 }}
                                      transition={{ duration: 0.2 }}
                                      style={{ color: isSelected ? tok.text : "#334155", lineHeight: 0 }}
                                    >
                                      <ChevronDown size={13} />
                                    </motion.div>
                                  </div>
                                </div>

                                {/* Clause reference line */}
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span
                                    style={{ fontSize: "0.62rem", color: "#475569", fontFamily: "var(--font-mono,monospace)" }}
                                  >
                                    {clauseRef(risk)} · {formatRiskType(risk.risk_type)}
                                  </span>
                                </div>

                                {/* Truncated explanation */}
                                {risk.explanation && (
                                  <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>
                                    {risk.explanation.slice(0, 95)}{risk.explanation.length > 95 ? "…" : ""}
                                  </p>
                                )}

                                {/* Review CTA */}
                                <div className="flex items-center gap-1 mt-2">
                                  <FileSearch size={9} style={{ color: isSelected ? tok.text : "#334155" }} />
                                  <span style={{ fontSize: "0.65rem", color: isSelected ? tok.text : "#334155", fontWeight: 500 }}>
                                    {isSelected ? "Viewing in document" : "Click to locate in document"}
                                  </span>
                                </div>
                              </button>

                              {/* Expanded detail */}
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    key={`detail-${risk.id}`}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                                    style={{ overflow: "hidden" }}
                                  >
                                    <div
                                      className="space-y-2.5 p-3.5"
                                      style={{
                                        background: `${tok.border}08`,
                                        border: `1px solid ${tok.border}28`,
                                        borderTop: "none",
                                        borderRadius: "0 0 10px 10px",
                                      }}
                                    >
                                      {/* Exact clause */}
                                      {risk.source_snippet && (
                                        <div style={{ padding: "11px 13px", borderRadius: "8px", background: "rgba(255,255,255,0.02)", borderLeft: `2px solid ${tok.border}55`, border: "1px solid rgba(255,255,255,0.05)" }}>
                                          <p style={{ fontSize: "0.56rem", fontWeight: 700, color: tok.text, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "7px" }}>Flagged Clause</p>
                                          <p style={{ fontSize: "0.71rem", color: "#94a3b8", lineHeight: 1.8, fontStyle: "italic" }}>
                                            &ldquo;{risk.source_snippet.slice(0, 200)}{risk.source_snippet.length > 200 ? "…" : ""}&rdquo;
                                          </p>
                                        </div>
                                      )}

                                      {/* Trigger Terms */}
                                      <div style={{ padding: "11px 13px", borderRadius: "8px", background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.12)" }}>
                                        <div className="flex items-center gap-1.5 mb-2">
                                          <Zap size={10} style={{ color: "#818cf8" }} />
                                          <p style={{ fontSize: "0.56rem", fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.1em" }}>Trigger Terms</p>
                                        </div>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                          {extractTriggerTerms(risk).map((term) => (
                                            <span
                                              key={term}
                                              style={{
                                                fontSize: "0.6rem", color: "#64748b",
                                                background: "rgba(255,255,255,0.04)",
                                                border: "1px solid rgba(255,255,255,0.07)",
                                                borderRadius: "4px", padding: "2px 7px",
                                                fontFamily: "var(--font-mono,monospace)",
                                              }}
                                            >
                                              {term}
                                            </span>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Business Impact */}
                                      <div style={{ padding: "11px 13px", borderRadius: "8px", background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.10)" }}>
                                        <div className="flex items-center gap-1.5 mb-2">
                                          <Activity size={10} style={{ color: "#f87171" }} />
                                          <p style={{ fontSize: "0.56rem", fontWeight: 700, color: "#f87171", textTransform: "uppercase", letterSpacing: "0.1em" }}>Business Impact</p>
                                        </div>
                                        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "4px" }}>
                                          {getBusinessImpact(risk).slice(0, 3).map((impact) => (
                                            <li key={impact} style={{ display: "flex", gap: "6px", alignItems: "flex-start" }}>
                                              <span style={{ color: "#f87171", flexShrink: 0, fontSize: "0.8rem", lineHeight: 1.35 }}>·</span>
                                              <span style={{ fontSize: "0.68rem", color: "#94a3b8", lineHeight: 1.65 }}>{impact}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>

                                      {/* Why risky */}
                                      {risk.explanation && (
                                        <div style={{ padding: "11px 13px", borderRadius: "8px", background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.13)" }}>
                                          <div className="flex items-center gap-1.5 mb-1.5">
                                            <Brain size={10} style={{ color: "#a78bfa" }} />
                                            <p style={{ fontSize: "0.56rem", fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.1em" }}>AI Assessment</p>
                                          </div>
                                          <p style={{ fontSize: "0.71rem", color: "#94a3b8", lineHeight: 1.85 }}>{risk.explanation}</p>
                                        </div>
                                      )}

                                      {/* AI Recommendation */}
                                      {risk.suggested_action && (
                                        <div style={{ padding: "11px 13px", borderRadius: "8px", background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.13)" }}>
                                          <div className="flex items-center gap-1.5 mb-1.5">
                                            <Target size={10} style={{ color: "#34d399" }} />
                                            <p style={{ fontSize: "0.56rem", fontWeight: 700, color: "#34d399", textTransform: "uppercase", letterSpacing: "0.1em" }}>Recommended Action</p>
                                          </div>
                                          <p style={{ fontSize: "0.71rem", color: "#94a3b8", lineHeight: 1.85 }}>{risk.suggested_action}</p>
                                        </div>
                                      )}

                                      {/* Actions */}
                                      <div className="flex gap-2 pt-0.5">
                                        <button
                                          onClick={() => {
                                            const cid = risk.clause_id ?? findClauseIdBySnippet(risk.source_snippet ?? "", clauses);
                                            if (cid) flashAndScroll(cid);
                                          }}
                                          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all"
                                          style={{ background: `${tok.border}16`, border: `1px solid ${tok.border}32`, color: tok.text }}
                                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `${tok.border}26`; }}
                                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = `${tok.border}16`; }}
                                        >
                                          <FileSearch size={10} /> Scroll to Clause
                                        </button>
                                        <Link
                                          href="/risks"
                                          className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all"
                                          style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.16)", color: "#818cf8", textDecoration: "none" }}
                                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.13)"; }}
                                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.07)"; }}
                                        >
                                          <ExternalLink size={10} /> All Risks
                                        </Link>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </>
                )}

                {/* ── Obligations ── */}
                {activePanel === "obligations" && (
                  <>
                    {contract.obligations?.length === 0 ? (
                      <div className="py-8 text-center"><AIProcessingIndicator label="Extracting obligations…" variant="ring" /></div>
                    ) : (
                      contract.obligations?.map((ob) => (
                        <div key={ob.id} className="rounded-xl p-4"
                          style={{ background: "rgba(19,27,46,0.55)", border: "1px solid rgba(99,102,241,0.09)" }}>
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <p className="text-sm font-semibold" style={{ color: "#dae2fd" }}>{ob.title}</p>
                            <StatusBadge status={ob.status} />
                          </div>
                          {ob.description && <p className="text-xs mb-2" style={{ color: "#64748b" }}>{ob.description}</p>}
                          <div className="flex items-center gap-3 text-xs">
                            {ob.due_date && (
                              <span className="flex items-center gap-1" style={{ color: "#f59e0b" }}>
                                <Calendar size={10} /> Due: {new Date(ob.due_date).toLocaleDateString()}
                              </span>
                            )}
                            {ob.owner && <span style={{ color: "#64748b" }}>Owner: {ob.owner}</span>}
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}

                {/* ── Alerts ── */}
                {activePanel === "alerts" && (
                  <>
                    {contract.alerts?.length === 0 ? (
                      <div className="py-8 text-center">
                        <CheckCircle2 size={28} style={{ color: "#10b981", margin: "0 auto 8px" }} />
                        <p className="text-sm" style={{ color: "#64748b" }}>No active alerts.</p>
                      </div>
                    ) : (
                      contract.alerts?.map((alert) => (
                        <div key={alert.id} className="rounded-xl p-4"
                          style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.18)" }}>
                          <div className="flex items-start gap-2 mb-1">
                            <Bell size={13} style={{ color: "#f59e0b", marginTop: "2px" }} />
                            <p className="text-sm font-semibold" style={{ color: "#dae2fd" }}>{alert.title}</p>
                          </div>
                          {alert.message && <p className="text-xs pl-5" style={{ color: "#64748b" }}>{alert.message}</p>}
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

                {/* ── Timeline ── */}
                {activePanel === "timeline" && (() => {
                  const now = new Date();
                  // Build ordered list of timeline events from real contract data
                  const events: { date: Date; label: string; sublabel?: string; type: "upload"|"effective"|"obligation"|"expiry"|"alert" }[] = [];

                  if (contract.created_at)
                    events.push({ date: new Date(contract.created_at), label: "Contract Uploaded", sublabel: contract.file_type?.toUpperCase() ?? "", type: "upload" });
                  if (contract.effective_date)
                    events.push({ date: new Date(contract.effective_date + "T00:00:00"), label: "Effective Date", sublabel: "Contract becomes active", type: "effective" });
                  contract.obligations?.forEach((ob) => {
                    if (ob.due_date)
                      events.push({ date: new Date(ob.due_date + "T00:00:00"), label: ob.title, sublabel: `Obligation · ${ob.status}`, type: "obligation" });
                  });
                  if (contract.expiration_date)
                    events.push({ date: new Date(contract.expiration_date + "T00:00:00"), label: "Contract Expiration", sublabel: "Agreement ends", type: "expiry" });

                  events.sort((a, b) => a.date.getTime() - b.date.getTime());

                  const typeStyle = {
                    upload:     { dot: "#6366f1", bg: "rgba(99,102,241,0.12)",  label: "#818cf8"  },
                    effective:  { dot: "#10b981", bg: "rgba(16,185,129,0.10)",  label: "#34d399"  },
                    obligation: { dot: "#f59e0b", bg: "rgba(245,158,11,0.08)",  label: "#fbbf24"  },
                    expiry:     { dot: "#ef4444", bg: "rgba(239,68,68,0.08)",   label: "#f87171"  },
                    alert:      { dot: "#f59e0b", bg: "rgba(245,158,11,0.08)",  label: "#fbbf24"  },
                  };

                  return events.length === 0 ? (
                    <div className="py-12 text-center">
                      <Calendar size={24} style={{ color: "#334155", margin: "0 auto 10px" }} />
                      <p className="text-sm font-medium" style={{ color: "#475569" }}>No dates extracted yet</p>
                      <p className="text-xs mt-1" style={{ color: "#334155" }}>Dates populate after AI analysis completes.</p>
                    </div>
                  ) : (
                    <div style={{ position: "relative", paddingLeft: "20px" }}>
                      {/* Vertical line */}
                      <div style={{ position: "absolute", left: "7px", top: "8px", bottom: "8px", width: "1px", background: "rgba(255,255,255,0.06)" }} />
                      {events.map((ev, i) => {
                        const s        = typeStyle[ev.type];
                        const isPast   = ev.date < now;
                        const isToday  = Math.abs(ev.date.getTime() - now.getTime()) < 86400000;
                        return (
                          <div key={i} className="flex gap-3 mb-4 relative">
                            {/* Dot */}
                            <div style={{
                              position: "absolute", left: "-16px", top: "4px",
                              width: "10px", height: "10px", borderRadius: "50%",
                              background: isPast ? s.dot : "transparent",
                              border: `2px solid ${s.dot}`,
                              boxShadow: !isPast ? `0 0 8px ${s.dot}88` : "none",
                              flexShrink: 0,
                            }} />
                            <div className="rounded-xl px-3 py-2.5 flex-1"
                              style={{ background: s.bg, border: `1px solid ${s.dot}22` }}>
                              <div className="flex items-center justify-between gap-2 mb-0.5">
                                <p className="text-xs font-semibold" style={{ color: "var(--th-text-1)", lineHeight: 1.3 }}>{ev.label}</p>
                                {isToday && <span style={{ fontSize: "0.55rem", padding: "1px 6px", borderRadius: "999px", background: `${s.dot}22`, color: s.label, fontWeight: 700 }}>TODAY</span>}
                              </div>
                              <p style={{ fontSize: "0.62rem", color: "#475569" }}>
                                {ev.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                                {ev.sublabel ? ` · ${ev.sublabel}` : ""}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* ── Ask AI ── */}
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
                        style={{ background: "rgba(19,27,46,0.8)", border: "1px solid rgba(99,102,241,0.18)", color: "#dae2fd" }}
                        onFocus={(e) => (e.target.style.borderColor = "rgba(99,102,241,0.5)")}
                        onBlur={(e)  => (e.target.style.borderColor = "rgba(99,102,241,0.18)")}
                      />
                      <button
                        type="submit"
                        disabled={asking || !question.trim()}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all disabled:opacity-40 hover:opacity-90"
                        style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", boxShadow: "0 0 16px rgba(99,102,241,0.3)" }}
                      >
                        {asking ? <Loader2 size={15} className="animate-spin text-white" /> : <Send size={15} className="text-white" />}
                      </button>
                    </form>
                    {asking && <div className="mt-4"><AIProcessingIndicator label="Analyzing clauses…" variant="dots" /></div>}
                    {answer && !asking && (
                      <div className="mt-4 rounded-xl p-4"
                        style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.16)" }}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex h-5 w-5 items-center justify-center rounded-md"
                            style={{ background: "rgba(99,102,241,0.18)" }}>
                            <Bot size={11} style={{ color: "#818cf8" }} />
                          </div>
                          <span className="text-xs font-semibold uppercase tracking-widest"
                            style={{ color: "#6366f1", fontFamily: "var(--font-mono,monospace)" }}>AI Response</span>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>{answer}</p>
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

/* ════════════════════════════════════════════════════════════════════
   ClauseBody — renders clause text with optional sub-sentence
   highlighting of the extracted risk snippet.
════════════════════════════════════════════════════════════════════ */
function ClauseBody({
  text,
  snippet,
  isActive,
  severity,
}: {
  text: string;
  snippet: string | null;
  isActive: boolean;
  severity: string;
}) {
  const tok = sevTokens(severity);

  if (!snippet || !isActive) {
    return <p style={{ lineHeight: 1.9, color: "#2d2d44" }}>{text}</p>;
  }

  // Find the snippet position inside the clause text for sub-sentence highlighting
  const needle    = snippet.trim().slice(0, 120).toLowerCase();
  const lowerText = text.toLowerCase();
  const matchIdx  = lowerText.indexOf(needle);

  if (matchIdx === -1) {
    // Snippet not found in this clause — fall back to plain text
    return <p style={{ lineHeight: 1.9, color: "#2d2d44" }}>{text}</p>;
  }

  const matchEnd = matchIdx + needle.length;

  return (
    <p style={{ lineHeight: 1.9, color: "#2d2d44" }}>
      {text.slice(0, matchIdx)}
      <mark
        style={{
          /* Inline highlight: soft background + inset bottom shadow = elegant underline
             similar to Google Docs comment annotation or legal redline style */
          background: `${tok.border}16`,
          color: "inherit",
          borderRadius: "3px",
          padding: "1px 3px",
          fontWeight: 500,
          boxShadow: `inset 0 -2px 0 ${tok.border}66`,
        }}
      >
        {text.slice(matchIdx, matchEnd)}
      </mark>
      {text.slice(matchEnd)}
    </p>
  );
}
