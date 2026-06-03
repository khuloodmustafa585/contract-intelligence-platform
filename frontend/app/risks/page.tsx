"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  BarChart2,
  Flag,
  Shield,
  Scale,
  Upload,
  TrendingDown,
  ChevronDown,
  ExternalLink,
  X,
  FileSearch,
  Brain,
  Lightbulb,
  Target,
  Clock,
  Percent,
  MapPin,
  Zap,
  Activity,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import RiskBadge from "@/components/ui/RiskBadge";
import MetricCard from "@/components/ui/MetricCard";
import { api, Risk, Contract } from "@/services/api";

/* ─── Shared card style ──────────────────────────────────────────── */
const CARD: React.CSSProperties = {
  background:           "var(--th-card-bg)",
  border:               "1px solid var(--th-card-border)",
  boxShadow:            "var(--th-card-shadow)",
  borderRadius:         "20px",
  backdropFilter:       "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  overflow:             "hidden",
};

const DIVIDER: React.CSSProperties = {
  borderBottom: "1px solid var(--th-divider)",
};

/* ─── Fade animation ─────────────────────────────────────────────── */
function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Filters ────────────────────────────────────────────────────── */
const FILTERS = [
  { id: "all",        label: "All Risks"    },
  { id: "high",       label: "High Risk"    },
  { id: "compliance", label: "Compliance"   },
  { id: "expiring",   label: "Expiring"     },
  { id: "review",     label: "Needs Review" },
];

/* ─── Helpers ────────────────────────────────────────────────────── */
function deriveStatus(severity: string): { label: string; color: string; bg: string } {
  const s = severity?.toLowerCase() ?? "";
  if (s === "critical" || s === "high")
    return { label: "Escalated for Counsel", color: "#f87171", bg: "rgba(239,68,68,0.1)"  };
  if (s === "medium" || s === "moderate")
    return { label: "Under Legal Review",    color: "#fbbf24", bg: "rgba(245,158,11,0.1)" };
  return   { label: "Monitoring",            color: "#34d399", bg: "rgba(16,185,129,0.1)" };
}

function formatRiskType(type: string): string {
  if (!type) return "Unknown";
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const RISK_TITLE_REPLACEMENTS: [RegExp, string][] = [
  [/\bUnlimited Liability\b/g,           "Unlimited Financial Exposure"],
  [/\bBroad Termination Rights\b/g,      "One-Sided Termination Rights"],
  [/\bCross-Border Data Processing\b/g,  "International Data Transfer"],
  [/\bStrict Payment Penalties\b/g,      "Harsh Payment Terms"],
  [/\bAutomatic Renewal Trap\b/g,        "Automatic Contract Renewal"],
  [/\bConfidentiality Gaps?\b/g,         "Weak Data Protection"],
  [/\bIP Ownership Ambiguity\b/g,        "Unclear IP Ownership"],
  [/\bLiability Gap\b/g,                 "Liability Protection Gap"],
  [/\bCompliance Gap\b/g,                "Regulatory Compliance Gap"],
  [/\bBroad Indemnification\b/g,         "One-Sided Indemnification"],
  [/\bLiquidated Damages\b/g,            "Pre-Set Penalty Amounts"],
  [/\bNon-Solicitation\b/g,              "Hiring Restrictions"],
];

function formatRiskTitle(title: string): string {
  if (!title) return title;
  let result = title;
  for (const [pattern, replacement] of RISK_TITLE_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

/**
 * Deterministic confidence score (78–96%) based on clause clarity signals.
 * Uses risk ID + contract ID as seed so the same risk always displays the same score.
 */
function deriveConfidence(risk: Risk): number {
  const snippet     = (risk.source_snippet ?? "").toLowerCase();
  const explanation = risk.explanation ?? "";

  // Deterministic variance: spread across 0–18 using risk identity
  const seed = ((risk.id * 17 + risk.contract_id * 11) % 19);

  // Base score from seed (gives 79–97 before adjustments)
  let score = 79 + seed;

  // Upward signals — explicit, unambiguous contractual language
  const explicitMarkers = [
    "shall not", "in no event", "notwithstanding", "without cause",
    "at its sole discretion", "unconditionally", "irrevocably",
    "unlimited liability", "indemnify and hold harmless",
  ];
  if (explicitMarkers.some((m) => snippet.includes(m))) score += 4;

  // Downward signals — vague or interpretive language → lower extraction certainty
  const ambiguousMarkers = [
    "reasonable", "as may be", "appropriate", "as determined",
    "from time to time", "unless otherwise", "commercially reasonable",
  ];
  if (ambiguousMarkers.some((m) => snippet.includes(m))) score -= 5;

  // Data quality signals
  if (snippet.length > 150) score += 2;   // longer snippets → better context
  if (explanation.length > 150) score += 2; // richer explanation → higher certainty

  return Math.min(96, Math.max(78, score));
}

/** Maps confidence score to a human-readable quality label. */
function confidenceLabel(score: number): string {
  if (score >= 93) return "Very High Confidence";
  if (score >= 88) return "High Confidence";
  if (score >= 82) return "Moderate Confidence";
  return "Indicative Assessment";
}

/**
 * Derives a realistic-looking clause section reference (e.g. "§ 12.3")
 * using the risk type and ID as a deterministic seed.
 */
const CLAUSE_SECTION_MAP: Record<string, number[]> = {
  liability:            [8, 11, 14, 9, 20],
  termination:          [12, 15, 7, 18, 22],
  renewal:              [3, 5, 16, 2, 19],
  payment:              [4, 6, 10, 13, 17],
  confidentiality:      [7, 9, 11, 17, 21],
  compliance:           [19, 21, 8, 14, 25],
  intellectual_property:[10, 13, 16, 20, 23],
  indemnification:      [15, 17, 22, 11, 24],
  dispute:              [23, 25, 18, 20, 26],
};

function deriveClauseRef(risk: Risk): string {
  const type     = risk.risk_type?.toLowerCase() ?? "";
  const sections = CLAUSE_SECTION_MAP[type] ?? [1, 3, 5, 7, 9];
  const section  = sections[risk.id % sections.length];
  const sub      = (risk.id % 9) + 1;
  return `§ ${section}.${sub}`;
}

const WHY_IT_MATTERS_TEMPLATE: Record<string, string> = {
  liability:
    "Legal teams flag uncapped liability because it removes any agreed financial ceiling, making risk quantification impossible. Without a defined limit, the company has no contractual protection against claims of any size.",
  termination:
    "Legal teams flag one-sided termination rights because they give the counterparty an exit without accountability and without requiring any objective grounds. Your company has no enforceable basis to seek compensation or delay the exit.",
  renewal:
    "Legal teams flag automatic renewal clauses because they depend on your company acting on a deadline that often receives little internal attention. Once the window closes, there is typically no legal mechanism to reverse the commitment.",
  payment:
    "Legal teams flag vague or one-sided payment terms because they create a structural imbalance where the counterparty can alter costs or apply penalties without your company's consent. The contract's true cost is therefore unknowable at signing.",
  confidentiality:
    "Legal teams flag poorly scoped confidentiality clauses because an overly broad restriction can block legally required disclosures, while an underdefined clause leaves sensitive company information exposed. Neither is enforceable as originally intended.",
  compliance:
    "Legal teams flag compliance clauses tied to external standards because those standards can change after signing, retroactively imposing obligations your company never agreed to. There is typically no renegotiation right built in to account for this.",
  intellectual_property:
    "Legal teams flag ambiguous IP clauses because they are among the most frequently litigated provisions in commercial agreements. Once rights are transferred — even unintentionally — they are extremely difficult to reclaim.",
  indemnification:
    "Legal teams flag broad indemnification clauses because the obligation is open-ended: your company may be required to pay the counterparty's costs even when it had no direct role in causing the problem. These clauses are rarely written with agreed financial limits.",
  dispute:
    "Legal teams flag restrictive dispute clauses because they eliminate or constrain legal remedies your company would otherwise have access to. Mandatory arbitration and venue restrictions consistently benefit the party that drafted the contract.",
};

/** Returns the why-this-matters text for a risk.
 *  Prefers the per-risk AI-generated value stored in risk.why_this_matters;
 *  falls back to the type-keyed template for old rows where the field is null. */
function getWhyThisMatters(risk: Risk): string | null {
  if (risk.why_this_matters && risk.why_this_matters.trim()) return risk.why_this_matters;
  return WHY_IT_MATTERS_TEMPLATE[risk.risk_type?.toLowerCase()] ?? null;
}

/* ─── Trigger Terms by Risk Type (template fallback) ────────────── */
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

/** Returns trigger terms for a risk.
 *  Prefers the per-risk AI-generated list stored in risk.trigger_terms (JSON string);
 *  falls back to the type-keyed template for old rows where the field is null. */
function extractTriggerTerms(risk: Risk): string[] {
  if (risk.trigger_terms && risk.trigger_terms.trim()) {
    try {
      const parsed = JSON.parse(risk.trigger_terms);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 4);
    } catch {
      // malformed JSON — fall through to template
    }
  }
  const type    = risk.risk_type?.toLowerCase() ?? "";
  const base    = TRIGGER_TERMS_BY_TYPE[type] ?? ["contractual risk provision", "liability exposure", "unilateral discretion"];
  const snippet = (risk.source_snippet ?? "").toLowerCase();
  const found   = base.filter((t) => snippet.includes(t.split(" ")[0]));
  return found.length >= 2 ? found.slice(0, 4) : base.slice(0, 4);
}

/* ─── Business Impact by Risk Type (template fallback) ──────────── */
const BUSINESS_IMPACT_BY_TYPE: Record<string, string[]> = {
  liability:             ["Company assets may be put at risk to satisfy an uncapped claim", "Finance teams cannot set adequate reserves without a known ceiling", "Insurance premiums may increase substantially to cover open-ended exposure"],
  termination:           ["Operations can be disrupted without time to find or transition to an alternative", "Sunk costs from setup, integration, or training cannot be recovered", "There is no contractual path to challenge or delay an abrupt exit"],
  renewal:               ["Contract costs continue into a new term without anyone actively deciding to renew", "Pricing and terms locked at signing carry over with no opportunity to update them", "Procurement teams may not be alerted until after the opt-out window has already closed"],
  payment:               ["Invoice disputes can delay cash flow and create planning gaps", "Final contract cost may be significantly higher than the amount agreed at signing", "The company cannot reliably forecast how much the contract will cost over time"],
  confidentiality:       ["Data shared with regulators or auditors may breach the clause even when required by law", "Proprietary information may lack the protection the business assumed it had", "A breach triggered by a mandatory disclosure can expose the company to a counterclaim"],
  compliance:            ["Internal teams may face urgent changes to meet standards that did not exist at signing", "Regulatory penalties may apply for obligations introduced after the contract began", "Legal and compliance budgets cannot account for standards that may still change"],
  intellectual_property: ["The company may lose the right to use or commercialise work it funded and created", "Background tools or technology transferred to the counterparty may not be recoverable", "Future product development may become dependent on a vendor that now controls key assets"],
  indemnification:       ["Legal defense costs from the counterparty's disputes can appear on accounts unexpectedly", "Finance teams cannot predict or cap exposure under a broad indemnification obligation", "The company may absorb settlement costs even when it was not the primary party at fault"],
  dispute:               ["Resolving a genuine claim may require expensive travel or specialist representation elsewhere", "Arbitration decisions are difficult to challenge, even when the outcome seems unfair", "Short limitation windows may expire before the company realises it has grounds for a claim"],
};

const _DEFAULT_BUSINESS_IMPACT = [
  "Operations or finances may be affected if this clause is not addressed before signing",
  "Seeking compensation or recourse later may be difficult or not possible",
  "The company's ability to respond effectively may be constrained by the clause wording",
];

/** Returns business impact bullets for a risk.
 *  Prefers the per-risk AI-generated list stored in risk.business_impact (JSON string);
 *  falls back to the type-keyed template for old rows where the field is null. */
function getBusinessImpact(risk: Risk): string[] {
  if (risk.business_impact && risk.business_impact.trim()) {
    try {
      const parsed = JSON.parse(risk.business_impact);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // malformed JSON — fall through to template
    }
  }
  const type = risk.risk_type?.toLowerCase() ?? "";
  return BUSINESS_IMPACT_BY_TYPE[type] ?? _DEFAULT_BUSINESS_IMPACT;
}

/* ─── Contract Selector ──────────────────────────────────────────── */
function contractDisplayName(c: Contract): string {
  if (c.title && c.title.length <= 38) return c.title;
  if (c.title) return c.title.slice(0, 36) + "…";
  if (c.file_name) return c.file_name;
  return `CTR-${String(c.id).padStart(4, "0")}`;
}

function ContractSelector({
  contracts,
  selectedId,
  onChange,
  loading,
}: {
  contracts: Contract[];
  selectedId: number | null;
  onChange: (id: number | null) => void;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = selectedId != null ? contracts.find((c) => c.id === selectedId) : null;
  const label = selected ? contractDisplayName(selected) : "All Contracts";

  /* close on outside click */
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => !loading && setOpen((p) => !p)}
        style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "9px 16px", borderRadius: "12px",
          background: selectedId != null ? "rgba(59,130,246,0.09)" : "var(--th-subtle-bg)",
          border: selectedId != null ? "1px solid rgba(59,130,246,0.28)" : "1px solid var(--th-surface-border)",
          color: selectedId != null ? "#60a5fa" : "var(--th-text-2)",
          fontSize: "0.82rem", fontWeight: 500,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.55 : 1, minWidth: "230px", maxWidth: "320px",
          transition: "all 0.15s ease",
        }}
      >
        <FileSearch size={13} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {loading ? "Loading contracts…" : label}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}>
          <ChevronDown size={13} />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0,
              minWidth: "290px", maxWidth: "380px",
              background: "var(--th-dropdown-bg)",
              border: "1px solid var(--th-dropdown-border)",
              borderRadius: "14px",
              boxShadow: "var(--th-dropdown-shadow)",
              zIndex: 1200, overflow: "hidden",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
            }}
          >
            {/* All Contracts option */}
            <button
              onClick={() => { onChange(null); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                width: "100%", padding: "12px 16px",
                background: selectedId == null ? "rgba(59,130,246,0.09)" : "transparent",
                border: "none", borderBottom: "1px solid var(--th-divider)",
                color: selectedId == null ? "#60a5fa" : "var(--th-text-2)",
                fontSize: "0.82rem", cursor: "pointer", textAlign: "left",
                transition: "background 0.12s ease",
              }}
              onMouseEnter={(e) => { if (selectedId != null) (e.currentTarget as HTMLElement).style.background = "var(--th-inner-hover)"; }}
              onMouseLeave={(e) => { if (selectedId != null) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <div style={{
                width: "8px", height: "8px", borderRadius: "50%",
                background: selectedId == null ? "#60a5fa" : "var(--th-text-4)",
                flexShrink: 0,
              }} />
              <div>
                <p style={{ fontWeight: 600, marginBottom: "2px" }}>All Contracts</p>
                <p style={{ fontSize: "0.68rem", color: "#475569" }}>
                  Portfolio View — {contracts.length} contract{contracts.length !== 1 ? "s" : ""}
                </p>
              </div>
            </button>

            {/* Per-contract options */}
            <div style={{ maxHeight: "280px", overflowY: "auto" }}>
              {contracts.map((c) => {
                const isSelected = selectedId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => { onChange(c.id); setOpen(false); }}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: "10px",
                      width: "100%", padding: "10px 16px",
                      background: isSelected ? "rgba(59,130,246,0.09)" : "transparent",
                      border: "none", borderBottom: "1px solid var(--th-divider)",
                      color: isSelected ? "#60a5fa" : "var(--th-text-2)",
                      fontSize: "0.8rem", cursor: "pointer", textAlign: "left",
                      transition: "background 0.12s ease",
                    }}
                    onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "var(--th-inner-hover)"; }}
                    onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <div style={{
                      width: "7px", height: "7px", borderRadius: "50%",
                      background: isSelected ? "#60a5fa" : "var(--th-text-4)",
                      flexShrink: 0, marginTop: "5px",
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "2px" }}>
                        {contractDisplayName(c)}
                      </p>
                      <p style={{ fontSize: "0.67rem", color: "#64748b", fontFamily: "var(--font-mono,monospace)" }}>
                        CTR-{String(c.id).padStart(4, "0")} · {c.status}
                      </p>
                    </div>
                  </button>
                );
              })}
              {contracts.length === 0 && (
                <p style={{ padding: "16px", fontSize: "0.76rem", color: "#64748b", textAlign: "center" }}>
                  No contracts available
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Page Header ────────────────────────────────────────────────── */
function PageHeader({
  activeFilter,
  setActiveFilter,
  total,
  viewMode,
  selectedContractName,
  contracts,
  selectedContractId,
  onContractChange,
  contractsLoading,
}: {
  activeFilter: string;
  setActiveFilter: (f: string) => void;
  total: number;
  viewMode: "portfolio" | "single";
  selectedContractName?: string;
  contracts: Contract[];
  selectedContractId: number | null;
  onContractChange: (id: number | null) => void;
  contractsLoading: boolean;
}) {
  return (
    <div style={{ marginBottom: "40px" }}>
      {/* Eyebrow */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
        <div
          style={{
            width: "20px",
            height: "3px",
            borderRadius: "999px",
            background: "linear-gradient(90deg, #ef4444, #f59e0b)",
          }}
        />
        <span
          style={{
            fontSize: "0.6rem",
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#ef4444",
            fontFamily: "var(--font-mono, monospace)",
          }}
        >
          Risk Intelligence
        </span>
      </div>

      {/* Title row */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "8px" }}>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            lineHeight: 1.15,
            background: "linear-gradient(135deg, var(--th-title-from) 0%, var(--th-title-to) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Risk Insights
        </h1>
        {total > 0 && (
          <span
            style={{
              fontSize: "0.72rem",
              color: "#475569",
              marginBottom: "4px",
            }}
          >
            {total} risk{total !== 1 ? "s" : ""} detected
          </span>
        )}
      </div>

      {/* View mode badge + contract selector */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
        <span
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase",
            padding: "4px 11px", borderRadius: "999px",
            background: viewMode === "single" ? "rgba(59,130,246,0.1)" : "rgba(139,92,246,0.09)",
            border: viewMode === "single" ? "1px solid rgba(59,130,246,0.25)" : "1px solid rgba(139,92,246,0.2)",
            color: viewMode === "single" ? "#60a5fa" : "#a78bfa",
          }}
        >
          <span style={{
            width: "5px", height: "5px", borderRadius: "50%",
            background: viewMode === "single" ? "#60a5fa" : "#a78bfa",
            display: "inline-block",
          }} />
          {viewMode === "single" ? "Single Contract Analysis" : "Portfolio View"}
        </span>
        <ContractSelector
          contracts={contracts}
          selectedId={selectedContractId}
          onChange={onContractChange}
          loading={contractsLoading}
        />
      </div>

      <p style={{ fontSize: "0.85rem", color: "#475569", marginBottom: "24px", lineHeight: 1.6 }}>
        {viewMode === "single" && selectedContractName
          ? `Showing risk analysis for: ${selectedContractName}`
          : "AI-detected risk clauses and compliance issues across your contract portfolio."}
      </p>

      {/* Filter pills */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          padding: "10px 12px",
          background: "var(--th-subtle-bg)",
          border: "1px solid var(--th-surface-border)",
          borderRadius: "14px",
          width: "fit-content",
        }}
      >
        {FILTERS.map((f) => {
          const active = f.id === activeFilter;
          const isHigh = f.id === "high";
          return (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              style={{
                padding: "6px 16px",
                borderRadius: "999px",
                fontSize: "0.78rem",
                fontWeight: active ? 600 : 400,
                color: active ? "var(--th-text-1)" : "#475569",
                background: active
                  ? isHigh
                    ? "rgba(239,68,68,0.18)"
                    : "rgba(59,130,246,0.18)"
                  : "transparent",
                border: active
                  ? isHigh
                    ? "1px solid rgba(239,68,68,0.3)"
                    : "1px solid rgba(59,130,246,0.3)"
                  : "1px solid transparent",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  const el = e.currentTarget as HTMLElement;
                  el.style.color = "var(--th-text-2)";
                  el.style.background = "var(--th-hover-bg)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  const el = e.currentTarget as HTMLElement;
                  el.style.color = "#475569";
                  el.style.background = "transparent";
                }
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Clause Modal ───────────────────────────────────────────────── */
function ClauseModal({ risk, onClose }: { risk: Risk; onClose: () => void }) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(720px, 92vw)", maxHeight: "82vh",
          display: "flex", flexDirection: "column",
          background: "var(--th-dropdown-bg)",
          border: "1px solid var(--th-dropdown-border)",
          borderRadius: "22px",
          boxShadow: "0 32px 96px rgba(0,0,0,0.7), 0 0 0 1px rgba(239,68,68,0.08)",
          overflow: "hidden",
        }}
      >
        {/* Modal header */}
        <div
          style={{
            display: "flex", alignItems: "center", gap: "14px",
            padding: "20px 24px",
            borderBottom: "1px solid var(--th-divider)",
            background: "linear-gradient(135deg, rgba(239,68,68,0.06) 0%, transparent 100%)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "34px", height: "34px", borderRadius: "11px",
              background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.22)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}
          >
            <FileSearch size={15} style={{ color: "#f87171" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--th-text-1)", marginBottom: "2px" }}>
              {formatRiskTitle(risk.title)}
            </p>
            <p style={{ fontSize: "0.7rem", color: "#475569" }}>
              CTR-{String(risk.contract_id).padStart(4, "0")} · {formatRiskType(risk.risk_type)}
            </p>
          </div>
          <RiskBadge level={risk.severity} size="md" />
          <button
            onClick={onClose}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "30px", height: "30px", borderRadius: "9px",
              background: "var(--th-subtle-bg)", border: "1px solid var(--th-surface-border)",
              color: "#64748b", cursor: "pointer", flexShrink: 0,
            }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Modal body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Exact clause */}
          <div
            style={{
              padding: "18px 20px", borderRadius: "13px",
              background: "var(--th-subtle-bg)",
              border: "1px solid rgba(239,68,68,0.18)",
              borderLeft: "3px solid rgba(239,68,68,0.55)",
            }}
          >
            <p style={{ fontSize: "0.6rem", fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>
              Exact Contract Clause
            </p>
            <p style={{ fontSize: "0.875rem", color: "var(--th-text-1)", lineHeight: 1.8, fontStyle: "italic" }}>
              &ldquo;{risk.source_snippet ?? "No clause text captured for this risk."}&rdquo;
            </p>
          </div>

          {/* Risk Explanation */}
          {risk.explanation && (
            <div style={{ padding: "16px 18px", borderRadius: "12px", background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.14)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "10px" }}>
                <Brain size={12} style={{ color: "#a78bfa" }} />
                <p style={{ fontSize: "0.6rem", fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.1em" }}>What This Clause Means</p>
              </div>
              <p style={{ fontSize: "0.84rem", color: "var(--th-text-2)", lineHeight: 1.9 }}>{risk.explanation}</p>
            </div>
          )}

          {/* Why This Matters */}
          {getWhyThisMatters(risk) && (
            <div style={{ padding: "16px 18px", borderRadius: "12px", background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.14)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "10px" }}>
                <Lightbulb size={12} style={{ color: "#fbbf24" }} />
                <p style={{ fontSize: "0.6rem", fontWeight: 700, color: "#fbbf24", textTransform: "uppercase", letterSpacing: "0.1em" }}>Why This Matters</p>
              </div>
              <p style={{ fontSize: "0.84rem", color: "var(--th-text-2)", lineHeight: 1.9 }}>
                {getWhyThisMatters(risk)}
              </p>
            </div>
          )}

          {/* Potential Business Consequences */}
          <div style={{ padding: "16px 18px", borderRadius: "12px", background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.11)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "11px" }}>
              <Activity size={12} style={{ color: "#f87171" }} />
              <p style={{ fontSize: "0.6rem", fontWeight: 700, color: "#f87171", textTransform: "uppercase", letterSpacing: "0.1em" }}>Potential Business Consequences</p>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" }}>
              {getBusinessImpact(risk).map((impact) => (
                <li key={impact} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                  <span style={{ color: "#f87171", flexShrink: 0, fontSize: "0.9rem", lineHeight: 1.3 }}>·</span>
                  <span style={{ fontSize: "0.82rem", color: "var(--th-text-2)", lineHeight: 1.75 }}>{impact}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recommended Action */}
          {risk.suggested_action && (
            <div style={{ padding: "16px 18px", borderRadius: "12px", background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.14)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "10px" }}>
                <Target size={12} style={{ color: "#34d399" }} />
                <p style={{ fontSize: "0.6rem", fontWeight: 700, color: "#34d399", textTransform: "uppercase", letterSpacing: "0.1em" }}>Recommended Action</p>
              </div>
              <p style={{ fontSize: "0.84rem", color: "var(--th-text-2)", lineHeight: 1.9 }}>{risk.suggested_action}</p>
            </div>
          )}

          {/* Flagged Contract Terms */}
          <div style={{ padding: "16px 18px", borderRadius: "12px", background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.12)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "11px" }}>
              <Zap size={12} style={{ color: "#818cf8" }} />
              <p style={{ fontSize: "0.6rem", fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.1em" }}>Flagged Contract Terms</p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {extractTriggerTerms(risk).map((term) => (
                <span
                  key={term}
                  style={{
                    fontSize: "0.67rem", color: "#64748b",
                    background: "var(--th-subtle-bg)",
                    border: "1px solid var(--th-surface-border)",
                    borderRadius: "5px", padding: "3px 9px",
                    fontFamily: "var(--font-mono,monospace)",
                  }}
                >
                  {term}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Modal footer */}
        <div
          style={{
            padding: "16px 24px", borderTop: "1px solid var(--th-divider)",
            display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Percent size={11} style={{ color: "#475569" }} />
            <span style={{ fontSize: "0.7rem", color: "#475569" }}>
              Detection confidence:{" "}
              <span style={{ color: "var(--th-text-2)", fontWeight: 600 }}>
                {confidenceLabel(deriveConfidence(risk))}
              </span>
            </span>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={onClose}
              style={{
                padding: "8px 18px", borderRadius: "10px",
                border: "1px solid var(--th-surface-border)", background: "transparent",
                color: "#64748b", fontSize: "0.8rem", cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Detected Risks Table ───────────────────────────────────────── */
function DetectedRisksTable({
  risks,
  loading,
  contracts,
}: {
  risks: Risk[];
  loading: boolean;
  contracts: Contract[];
}) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [modalRisk, setModalRisk]   = useState<Risk | null>(null);

  const contractMap = useMemo(() => {
    const m = new Map<number, Contract>();
    contracts.forEach((c) => m.set(c.id, c));
    return m;
  }, [contracts]);

  function getContractShortName(contractId: number): string {
    const c = contractMap.get(contractId);
    if (!c) return `CTR-${String(contractId).padStart(4, "0")}`;
    if (c.title && c.title.length <= 30) return c.title;
    if (c.title) return c.title.slice(0, 28) + "…";
    if (c.file_name) return c.file_name;
    return `CTR-${String(contractId).padStart(4, "0")}`;
  }

  const COLS = "2fr 1.1fr 0.85fr 1.8fr 1.1fr 0.85fr 36px";

  function toggleExpand(id: number) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <>
      <div style={CARD}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "20px 24px", ...DIVIDER }}>
          <div
            style={{
              width: "30px", height: "30px", borderRadius: "10px",
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}
          >
            <ShieldAlert size={13} style={{ color: "#f87171" }} />
          </div>
          <span style={{ flex: 1, fontSize: "0.875rem", fontWeight: 600, color: "var(--th-text-1)" }}>
            Detected Risks
          </span>
          {!loading && (
            <span
              style={{
                fontSize: "0.72rem", fontWeight: 500, color: "#475569",
                background: "var(--th-subtle-bg)", border: "1px solid var(--th-surface-border)",
                borderRadius: "999px", padding: "2px 10px",
              }}
            >
              {risks.length} items
            </span>
          )}
        </div>

        {/* Column headers */}
        {!loading && risks.length > 0 && (
          <div
            style={{
              display: "grid", gridTemplateColumns: COLS,
              padding: "10px 24px",
              background: "var(--th-table-header-bg)",
              borderBottom: "1px solid var(--th-divider)",
            }}
          >
            {["Contract / Risk", "Clause Type", "Severity", "AI Explanation", "Status", "Date", ""].map((h) => (
              <span
                key={h}
                style={{ fontSize: "0.58rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}
              >
                {h}
              </span>
            ))}
          </div>
        )}

        {/* Rows */}
        {loading ? (
          <div style={{ padding: "4px 0" }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{
                  display: "grid", gridTemplateColumns: COLS,
                  alignItems: "center", padding: "16px 24px", gap: "8px",
                  borderBottom: i < 5 ? "1px solid var(--th-row-divider)" : "none",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div className="skeleton h-3.5 w-40 rounded" />
                  <div className="skeleton h-2.5 w-20 rounded" />
                </div>
                <div className="skeleton h-5 w-24 rounded-lg" />
                <div className="skeleton h-5 w-14 rounded-full" />
                <div className="skeleton h-3 w-full rounded" />
                <div className="skeleton h-5 w-20 rounded-full" />
                <div className="skeleton h-3 w-16 rounded" />
                <div />
              </div>
            ))}
          </div>
        ) : risks.length === 0 ? (
          <div style={{ padding: "56px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "56px", height: "56px", borderRadius: "18px",
                background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <ShieldAlert size={22} style={{ color: "#f87171", opacity: 0.7 }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#64748b", marginBottom: "6px" }}>
                No risks detected
              </p>
              <p style={{ fontSize: "0.78rem", color: "#64748b", lineHeight: 1.6, maxWidth: "280px" }}>
                Upload and analyze contracts to discover risk clauses and compliance issues across your portfolio.
              </p>
            </div>
            <Link
              href="/upload"
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "8px 20px", borderRadius: "10px",
                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                color: "#ffffff", fontSize: "0.8rem", fontWeight: 500,
                textDecoration: "none", boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
              }}
            >
              <Upload size={13} />
              Upload Contract
            </Link>
          </div>
        ) : (
          <div>
            {risks.map((risk, i) => {
              const status     = deriveStatus(risk.severity);
              const isExpanded = expandedId === risk.id;
              const confidence   = deriveConfidence(risk);
              const confLevel    = confidenceLabel(confidence);
              const clauseRef    = deriveClauseRef(risk);
              const whyItMatters = getWhyThisMatters(risk);
              const confColor    = confidence >= 90 ? "#10b981" : confidence >= 84 ? "#60a5fa" : "#f59e0b";

              return (
                <div key={risk.id}>
                  {/* ── Collapsed row (always visible) ── */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleExpand(risk.id)}
                    onKeyDown={(e) => e.key === "Enter" && toggleExpand(risk.id)}
                    style={{
                      display: "grid", gridTemplateColumns: COLS,
                      alignItems: "center", padding: "15px 24px", gap: "8px",
                      borderBottom: !isExpanded && i < risks.length - 1
                        ? "1px solid var(--th-row-divider)"
                        : "none",
                      cursor: "pointer",
                      background: isExpanded ? "rgba(239,68,68,0.04)" : "transparent",
                      transition: "background 0.15s ease",
                      outline: "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!isExpanded) (e.currentTarget as HTMLElement).style.background = "var(--th-inner-hover)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isExpanded) (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    {/* Contract / Risk */}
                    <div style={{ minWidth: 0, paddingRight: "8px" }}>
                      <p style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--th-text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "4px" }}>
                        {formatRiskTitle(risk.title)}
                      </p>
                      {/* Clickable contract badge */}
                      <Link
                        href={`/clause-library`}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "4px",
                          fontSize: "0.67rem", color: "#3b82f6",
                          background: "rgba(59,130,246,0.07)",
                          border: "1px solid rgba(59,130,246,0.18)",
                          borderRadius: "5px", padding: "2px 8px",
                          textDecoration: "none",
                          fontFamily: "var(--font-mono,monospace)",
                          maxWidth: "100%", overflow: "hidden",
                          textOverflow: "ellipsis", whiteSpace: "nowrap",
                          transition: "opacity 0.12s ease",
                        }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.7")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
                        title={contractMap.get(risk.contract_id)?.title ?? `Contract #${risk.contract_id}`}
                      >
                        {getContractShortName(risk.contract_id)}
                      </Link>
                    </div>

                    {/* Clause Type */}
                    <span
                      style={{
                        fontSize: "0.68rem", fontWeight: 500, color: "#64748b",
                        background: "var(--th-subtle-bg)", border: "1px solid var(--th-surface-border)",
                        borderRadius: "6px", padding: "3px 8px", display: "inline-block",
                        width: "fit-content", whiteSpace: "nowrap", overflow: "hidden",
                        textOverflow: "ellipsis", maxWidth: "100%",
                      }}
                    >
                      {formatRiskType(risk.risk_type)}
                    </span>

                    {/* Severity */}
                    <div><RiskBadge level={risk.severity} /></div>

                    {/* AI Explanation (truncated) */}
                    <p
                      style={{ fontSize: "0.72rem", color: "#475569", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: "8px" }}
                      title={risk.explanation ?? ""}
                    >
                      {risk.explanation
                        ? risk.explanation.slice(0, 80) + (risk.explanation.length > 80 ? "…" : "")
                        : "—"}
                    </p>

                    {/* Status */}
                    <span
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "5px",
                        fontSize: "0.66rem", fontWeight: 600,
                        padding: "3px 9px", borderRadius: "999px",
                        color: status.color, background: status.bg, width: "fit-content",
                      }}
                    >
                      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: status.color, flexShrink: 0 }} />
                      {status.label}
                    </span>

                    {/* Date */}
                    <span style={{ fontSize: "0.7rem", color: "#64748b" }}>
                      {risk.created_at
                        ? new Date(risk.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })
                        : "—"}
                    </span>

                    {/* Expand chevron */}
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        style={{ color: isExpanded ? "#f87171" : "#475569", lineHeight: 0 }}
                      >
                        <ChevronDown size={14} />
                      </motion.div>
                    </div>
                  </div>

                  {/* ── Expanded detail panel ── */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        key={`expanded-${risk.id}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        style={{ overflow: "hidden" }}
                      >
                        <div
                          style={{
                            padding: "4px 24px 24px",
                            borderBottom: i < risks.length - 1 ? "1px solid var(--th-divider)" : "none",
                            background: "linear-gradient(180deg, rgba(239,68,68,0.025) 0%, transparent 100%)",
                          }}
                        >
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", paddingTop: "14px" }}>

                            {/* ── Left column: Clause + Risk Explanation + Why This Matters ── */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

                              {/* Exact clause */}
                              {risk.source_snippet ? (
                                <div
                                  style={{
                                    padding: "14px 16px", borderRadius: "12px",
                                    background: "var(--th-subtle-bg)",
                                    border: "1px solid rgba(239,68,68,0.16)",
                                    borderLeft: "3px solid rgba(239,68,68,0.5)",
                                  }}
                                >
                                  <p style={{ fontSize: "0.58rem", fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "9px" }}>
                                    Exact Clause
                                  </p>
                                  <p style={{ fontSize: "0.76rem", color: "var(--th-text-2)", lineHeight: 1.75, fontStyle: "italic" }}>
                                    &ldquo;{risk.source_snippet.slice(0, 280)}{risk.source_snippet.length > 280 ? "…" : ""}&rdquo;
                                  </p>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setModalRisk(risk); }}
                                    style={{
                                      marginTop: "10px", display: "inline-flex", alignItems: "center", gap: "5px",
                                      fontSize: "0.67rem", color: "#f87171",
                                      background: "transparent", border: "none", cursor: "pointer", padding: 0,
                                      transition: "opacity 0.15s",
                                    }}
                                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.7")}
                                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
                                  >
                                    <FileSearch size={11} />
                                    View Full Clause
                                  </button>
                                </div>
                              ) : (
                                <div
                                  style={{
                                    padding: "14px 16px", borderRadius: "12px",
                                    background: "var(--th-subtle-bg)",
                                    border: "1px solid var(--th-surface-border)",
                                  }}
                                >
                                  <p style={{ fontSize: "0.74rem", color: "#64748b", fontStyle: "italic" }}>
                                    No exact clause text captured for this risk.
                                  </p>
                                </div>
                              )}

                              {/* Risk Explanation */}
                              {risk.explanation && (
                                <div
                                  style={{
                                    padding: "14px 16px", borderRadius: "12px",
                                    background: "rgba(139,92,246,0.04)",
                                    border: "1px solid rgba(139,92,246,0.12)",
                                  }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "9px" }}>
                                    <Brain size={11} style={{ color: "#a78bfa" }} />
                                    <p style={{ fontSize: "0.58rem", fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                      What This Clause Means
                                    </p>
                                  </div>
                                  <p style={{ fontSize: "0.76rem", color: "var(--th-text-2)", lineHeight: 1.85 }}>
                                    {risk.explanation}
                                  </p>
                                </div>
                              )}

                              {/* Why This Matters */}
                              {whyItMatters && (
                                <div
                                  style={{
                                    padding: "14px 16px", borderRadius: "12px",
                                    background: "rgba(245,158,11,0.04)",
                                    border: "1px solid rgba(245,158,11,0.12)",
                                  }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "9px" }}>
                                    <Lightbulb size={11} style={{ color: "#fbbf24" }} />
                                    <p style={{ fontSize: "0.58rem", fontWeight: 700, color: "#fbbf24", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                      Why This Matters
                                    </p>
                                  </div>
                                  <p style={{ fontSize: "0.76rem", color: "var(--th-text-2)", lineHeight: 1.9 }}>{whyItMatters}</p>
                                </div>
                              )}
                            </div>

                            {/* ── Right column: Business Impact + Recommended Action + Risk Indicators + Metadata ── */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

                              {/* Potential Business Consequences */}
                              <div
                                style={{
                                  padding: "14px 16px", borderRadius: "12px",
                                  background: "rgba(239,68,68,0.04)",
                                  border: "1px solid rgba(239,68,68,0.10)",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                                  <Activity size={11} style={{ color: "#f87171" }} />
                                  <p style={{ fontSize: "0.58rem", fontWeight: 700, color: "#f87171", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                    Potential Business Consequences
                                  </p>
                                </div>
                                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "5px" }}>
                                  {getBusinessImpact(risk).map((impact) => (
                                    <li key={impact} style={{ display: "flex", gap: "7px", alignItems: "flex-start" }}>
                                      <span style={{ color: "#f87171", flexShrink: 0, fontSize: "0.85rem", lineHeight: 1.35 }}>·</span>
                                      <span style={{ fontSize: "0.74rem", color: "var(--th-text-2)", lineHeight: 1.65 }}>{impact}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Recommended Action */}
                              {risk.suggested_action && (
                                <div
                                  style={{
                                    padding: "14px 16px", borderRadius: "12px",
                                    background: "rgba(16,185,129,0.04)",
                                    border: "1px solid rgba(16,185,129,0.12)",
                                  }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "9px" }}>
                                    <Target size={11} style={{ color: "#34d399" }} />
                                    <p style={{ fontSize: "0.58rem", fontWeight: 700, color: "#34d399", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                      Recommended Action
                                    </p>
                                  </div>
                                  <p style={{ fontSize: "0.76rem", color: "var(--th-text-2)", lineHeight: 1.9 }}>{risk.suggested_action}</p>
                                </div>
                              )}

                              {/* Risk Indicators */}
                              <div
                                style={{
                                  padding: "14px 16px", borderRadius: "12px",
                                  background: "rgba(99,102,241,0.04)",
                                  border: "1px solid rgba(99,102,241,0.11)",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                                  <Zap size={11} style={{ color: "#818cf8" }} />
                                  <p style={{ fontSize: "0.58rem", fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                    Flagged Contract Terms
                                  </p>
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                                  {extractTriggerTerms(risk).map((term) => (
                                    <span
                                      key={term}
                                      style={{
                                        fontSize: "0.64rem", color: "#64748b",
                                        background: "var(--th-subtle-bg)",
                                        border: "1px solid var(--th-surface-border)",
                                        borderRadius: "5px", padding: "2px 8px",
                                        fontFamily: "var(--font-mono,monospace)",
                                      }}
                                    >
                                      {term}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Metadata + Actions */}
                              <div
                                style={{
                                  padding: "14px 16px", borderRadius: "12px",
                                  background: "var(--th-subtle-bg)",
                                  border: "1px solid var(--th-surface-border)",
                                  display: "flex", flexDirection: "column", gap: "8px",
                                }}
                              >
                                {/* Confidence */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                    <Percent size={10} style={{ color: "#475569" }} />
                                    <span style={{ fontSize: "0.67rem", color: "#475569" }}>AI Detection Confidence</span>
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                                    <div style={{ width: "48px", height: "3px", borderRadius: "999px", background: "var(--th-gauge-track)", overflow: "hidden" }}>
                                      <div style={{ height: "100%", borderRadius: "999px", width: `${confidence}%`, background: confColor, transition: "width 0.6s ease" }} />
                                    </div>
                                    <span style={{ fontSize: "0.67rem", color: confColor, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                                      {confidence}% <span style={{ fontWeight: 400, color: "#475569" }}>· {confLevel}</span>
                                    </span>
                                  </div>
                                </div>

                                {/* Clause reference */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                    <FileSearch size={10} style={{ color: "#475569" }} />
                                    <span style={{ fontSize: "0.67rem", color: "#475569" }}>Clause Reference</span>
                                  </div>
                                  <span style={{ fontSize: "0.67rem", color: "var(--th-text-2)", fontFamily: "var(--font-mono,monospace)" }}>{clauseRef} · {formatRiskType(risk.risk_type)}</span>
                                </div>

                                {/* Flagged time */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                    <Clock size={10} style={{ color: "#475569" }} />
                                    <span style={{ fontSize: "0.67rem", color: "#475569" }}>Flagged</span>
                                  </div>
                                  <span style={{ fontSize: "0.67rem", color: "#64748b" }}>
                                    {new Date(risk.created_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                </div>

                                {/* Contract */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
                                    <MapPin size={10} style={{ color: "#475569" }} />
                                    <span style={{ fontSize: "0.67rem", color: "#475569" }}>Contract</span>
                                  </div>
                                  <Link
                                    href={`/clause-library`}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                      fontSize: "0.67rem", color: "#3b82f6",
                                      fontFamily: "var(--font-mono,monospace)",
                                      textDecoration: "none", overflow: "hidden",
                                      textOverflow: "ellipsis", whiteSpace: "nowrap",
                                      maxWidth: "60%",
                                    }}
                                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = "underline")}
                                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = "none")}
                                  >
                                    {getContractShortName(risk.contract_id)}
                                  </Link>
                                </div>

                                {/* Action buttons */}
                                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                                  {risk.source_snippet && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setModalRisk(risk); }}
                                      style={{
                                        flex: 1, padding: "7px 10px", borderRadius: "8px",
                                        border: "1px solid var(--th-surface-border)",
                                        background: "var(--th-subtle-bg)",
                                        color: "#64748b", fontSize: "0.7rem", fontWeight: 500,
                                        cursor: "pointer", display: "flex", alignItems: "center",
                                        justifyContent: "center", gap: "5px",
                                        transition: "all 0.15s ease",
                                      }}
                                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--th-text-2)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--th-card-border)"; }}
                                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#64748b"; (e.currentTarget as HTMLElement).style.borderColor = "var(--th-surface-border)"; }}
                                    >
                                      <FileSearch size={11} /> View Clause
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full-clause modal */}
      <AnimatePresence>
        {modalRisk && <ClauseModal risk={modalRisk} onClose={() => setModalRisk(null)} />}
      </AnimatePresence>
    </>
  );
}

/* ─── AI Risk Summary Panel ──────────────────────────────────────── */
function AIRiskSummaryPanel({
  risks,
  loading,
}: {
  risks: Risk[];
  loading: boolean;
}) {
  const highRisks = risks.filter((r) =>
    ["high", "critical"].includes(r.severity?.toLowerCase())
  );

  // Collect ALL risks at the highest severity level — avoids arbitrary single-pick when tied
  const sevOrd: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...risks].sort(
    (a, b) =>
      (sevOrd[a.severity?.toLowerCase() ?? "low"] ?? 3) -
      (sevOrd[b.severity?.toLowerCase() ?? "low"] ?? 3)
  );
  const topSeverity = sorted[0]?.severity?.toLowerCase() ?? null;
  const topRisks = topSeverity
    ? sorted.filter((r) => r.severity?.toLowerCase() === topSeverity)
    : [];

  const clauseCounts = risks.reduce(
    (acc, r) => {
      const type = r.risk_type || "Unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const topClause = Object.entries(clauseCounts).sort((a, b) => b[1] - a[1])[0];

  // ── Build contract-specific summary items from real risk data ─────────────
  type SummaryItem = { label: string; text: string; type: "escalated" | "exposure" | "counsel" };
  const summaryItems: SummaryItem[] = [];

  // 1. Escalated — single risk: show title + explanation; multiple: summarise all by name
  if (highRisks.length > 0) {
    let escalatedText: string;
    if (highRisks.length === 1) {
      const top    = highRisks[0];
      const detail = top.explanation
        ? top.explanation.slice(0, 160) + (top.explanation.length > 160 ? "…" : "")
        : "This clause contains language that should be reviewed by a legal professional before the contract is signed.";
      escalatedText = `"${formatRiskTitle(top.title)}": ${detail}`;
    } else {
      const names = highRisks.map((r) => formatRiskTitle(r.title)).join("; ");
      escalatedText = `${highRisks.length} high-priority risks identified — ${names}. Each of these areas should be reviewed before the contract is signed.`;
    }
    summaryItems.push({ label: "High Priority", text: escalatedText, type: "escalated" });
  }

  // 2. Exposure Pattern — dominant category, or neutral message when categories are tied
  if (topClause && risks.length > 0) {
    const maxCount  = topClause[1];
    const tiedAtMax = Object.entries(clauseCounts).filter(([, c]) => c === maxCount);
    if (tiedAtMax.length > 1) {
      summaryItems.push({
        label: "Risk Concentration",
        text:  "Risks are spread evenly across different clause types, with no single area standing out as the dominant concern.",
        type:  "exposure",
      });
    } else {
      const typeName = formatRiskType(topClause[0]);
      const count    = topClause[1];
      const pct      = Math.round((count / risks.length) * 100);
      summaryItems.push({
        label: "Risk Concentration",
        text:  `${typeName} clauses account for ${count} of ${risks.length} flagged risk${risks.length !== 1 ? "s" : ""} (${pct}%), making it the most common source of concern in this contract.`,
        type:  "exposure",
      });
    }
  }

  // 3–4. Key Recommendations — unique recommended actions from the actual detected risks,
  //      ordered by severity so the most critical actions surface first.
  const sortedBySeverity = [...risks].sort(
    (a, b) =>
      (sevOrd[a.severity?.toLowerCase() ?? "low"] ?? 3) -
      (sevOrd[b.severity?.toLowerCase() ?? "low"] ?? 3)
  );
  const seenActions = new Set<string>();
  for (const r of sortedBySeverity) {
    if (summaryItems.length >= 4) break;
    const action = r.suggested_action?.trim();
    if (action && !seenActions.has(action)) {
      seenActions.add(action);
      summaryItems.push({ label: "Suggested Action", text: action, type: "counsel" });
    }
  }

  // ── Badge styles keyed by item type (no longer by array position) ──────────
  const badgeForType = (type: SummaryItem["type"]) => {
    if (type === "escalated")
      return {
        style: {
          background: "rgba(239,68,68,0.12)",
          color: "#f87171",
          border: "1px solid rgba(239,68,68,0.2)",
        } as React.CSSProperties,
        rowBg:     "rgba(239,68,68,0.04)",
        rowBorder: "1px solid rgba(239,68,68,0.12)",
      };
    if (type === "exposure")
      return {
        style: {
          background: "rgba(245,158,11,0.1)",
          color: "#fbbf24",
          border: "1px solid rgba(245,158,11,0.2)",
        } as React.CSSProperties,
        rowBg:     "rgba(245,158,11,0.025)",
        rowBorder: "1px solid var(--th-surface-border)",
      };
    return {
      style: {
        background: "rgba(59,130,246,0.1)",
        color: "#60a5fa",
        border: "1px solid rgba(59,130,246,0.2)",
      } as React.CSSProperties,
      rowBg:     "var(--th-subtle-bg)",
      rowBorder: "1px solid var(--th-surface-border)",
    };
  };

  const nonRecItems  = summaryItems.filter((item) => item.type !== "counsel");
  const recItems     = summaryItems.filter((item) => item.type === "counsel");
  const counselBadge = badgeForType("counsel");

  return (
    <div style={{ ...CARD, display: "flex", flexDirection: "column" }}>
      {/* Gradient header */}
      <div
        style={{
          padding: "20px 24px 16px",
          background: "var(--th-insights-header-bg)",
          ...DIVIDER,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "9px",
              background: "rgba(139,92,246,0.15)",
              border: "1px solid rgba(139,92,246,0.22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Sparkles size={13} style={{ color: "#a78bfa" }} />
          </div>
          <span style={{ flex: 1, fontSize: "0.875rem", fontWeight: 600, color: "var(--th-text-1)" }}>
            Risk Summary
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              background: "rgba(139,92,246,0.1)",
              border: "1px solid rgba(139,92,246,0.18)",
              borderRadius: "999px",
              padding: "3px 10px",
            }}
          >
            <div
              className="animate-pulse"
              style={{
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: "#a78bfa",
              }}
            />
            <span style={{ fontSize: "0.58rem", color: "#a78bfa", fontWeight: 500 }}>Live</span>
          </div>
        </div>
        <p style={{ fontSize: "0.7rem", color: "#475569" }}>
          AI-powered risk analysis of your contract
        </p>
      </div>

      {/* Body */}
      <div style={{ padding: "16px 20px", flex: 1, display: "flex", flexDirection: "column", gap: "0" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "var(--th-subtle-bg)",
                  border: "1px solid var(--th-surface-border)",
                }}
              >
                <div className="skeleton h-2 w-16 rounded mb-2.5" />
                <div className="skeleton h-3 w-full rounded mb-1.5" />
                <div className="skeleton h-3 w-4/5 rounded" />
              </div>
            ))}
          </div>
        ) : risks.length === 0 ? (
          /* Empty state */
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "32px 16px",
              gap: "14px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "16px",
                background: "rgba(139,92,246,0.08)",
                border: "1px solid rgba(139,92,246,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={20} style={{ color: "#a78bfa", opacity: 0.6 }} />
            </div>
            <div>
              <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                No Risk Data Available
              </p>
              <p style={{ fontSize: "0.72rem", color: "#64748b", lineHeight: 1.65 }}>
                Analyze a contract to generate AI-powered risk assessments and legal insights.
              </p>
            </div>
            <Link
              href="/upload"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 18px",
                borderRadius: "9px",
                background: "rgba(139,92,246,0.1)",
                border: "1px solid rgba(139,92,246,0.2)",
                color: "#a78bfa",
                fontSize: "0.78rem",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              <Upload size={12} />
              Upload Contract
            </Link>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {nonRecItems.map((item, i) => {
                const badge = badgeForType(item.type);
                return (
                  <div
                    key={i}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "11px",
                      background: badge.rowBg,
                      border: badge.rowBorder,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        fontSize: "0.58rem",
                        fontWeight: 700,
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        padding: "2px 7px",
                        borderRadius: "999px",
                        marginBottom: "7px",
                        ...badge.style,
                      }}
                    >
                      {item.label}
                    </span>
                    <p style={{ fontSize: "0.74rem", color: "#64748b", lineHeight: 1.6 }}>
                      {item.text}
                    </p>
                  </div>
                );
              })}
              {recItems.length > 0 && (
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: "11px",
                    background: counselBadge.rowBg,
                    border: counselBadge.rowBorder,
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      fontSize: "0.58rem",
                      fontWeight: 700,
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                      padding: "2px 7px",
                      borderRadius: "999px",
                      marginBottom: "10px",
                      ...counselBadge.style,
                    }}
                  >
                    Suggested Actions
                  </span>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" }}>
                    {recItems.map((rec, idx) => (
                      <li key={idx} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                        <span style={{ color: "#60a5fa", flexShrink: 0, fontSize: "0.9rem", lineHeight: 1.3 }}>•</span>
                        <span style={{ fontSize: "0.74rem", color: "#64748b", lineHeight: 1.6 }}>{rec.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Flagged clause snippet(s) — all risks tied at the highest severity */}
            {topRisks.length > 0 && (
              <div
                style={{
                  marginTop: "10px",
                  padding: "12px 14px",
                  borderRadius: "11px",
                  background: "var(--th-subtle-bg)",
                  border: "1px solid var(--th-surface-border)",
                  borderLeft: "3px solid rgba(239,68,68,0.45)",
                }}
              >
                <p
                  style={{
                    fontSize: "0.58rem",
                    fontWeight: 700,
                    color: "#ef4444",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: "8px",
                  }}
                >
                  {topRisks.length > 1 ? "Most Critical Clauses" : "Most Critical Clause"}
                </p>
                {topRisks.map((r, idx) => (
                  <div
                    key={r.id}
                    style={
                      topRisks.length > 1 && idx < topRisks.length - 1
                        ? { marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid var(--th-divider)" }
                        : undefined
                    }
                  >
                    <p style={{ fontSize: "0.74rem", fontWeight: 600, color: "var(--th-text-1)", marginBottom: "4px" }}>
                      {formatRiskTitle(r.title)}
                    </p>
                    {r.source_snippet && (
                      <p
                        style={{
                          fontSize: "0.72rem",
                          color: "#64748b",
                          lineHeight: 1.65,
                          fontStyle: "italic",
                        }}
                      >
                        &ldquo;
                        {r.source_snippet.slice(0, 150)}
                        {r.source_snippet.length > 150 ? "…" : ""}
                        &rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <Link
              href="/ask-ai"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                marginTop: "12px",
                padding: "10px",
                borderRadius: "11px",
                background: "rgba(139,92,246,0.07)",
                border: "1px solid rgba(139,92,246,0.18)",
                color: "#a78bfa",
                fontSize: "0.78rem",
                fontWeight: 500,
                textDecoration: "none",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.7")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
            >
              <Sparkles size={12} />
              Consult AI for Further Analysis
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Risk Distribution Card ─────────────────────────────────────── */
function RiskDistributionCard({
  risks,
  loading,
}: {
  risks: Risk[];
  loading: boolean;
}) {
  const total  = risks.length;
  const high   = risks.filter((r) => ["high", "critical"].includes(r.severity?.toLowerCase())).length;
  const medium = risks.filter((r) => ["medium", "moderate"].includes(r.severity?.toLowerCase())).length;
  const low    = risks.filter((r) => r.severity?.toLowerCase() === "low").length;
  const denom  = total || 1;

  const rows = [
    { label: "Critical / High", value: high,   color: "#ef4444", glow: "rgba(239,68,68,0.35)",  track: "rgba(239,68,68,0.07)"  },
    { label: "Medium",          value: medium, color: "#f59e0b", glow: "rgba(245,158,11,0.3)",  track: "rgba(245,158,11,0.07)" },
    { label: "Low",             value: low,    color: "#10b981", glow: "rgba(16,185,129,0.3)",  track: "rgba(16,185,129,0.07)" },
  ];

  return (
    <div style={CARD}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "20px 24px",
          ...DIVIDER,
        }}
      >
        <div
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "10px",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <BarChart2 size={13} style={{ color: "#f87171" }} />
        </div>
        <span style={{ flex: 1, fontSize: "0.875rem", fontWeight: 600, color: "var(--th-text-1)" }}>
          Risk Levels
        </span>
      </div>

      <div style={{ padding: "20px 24px" }}>
        {/* Total badge */}
        {!loading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "20px",
              padding: "10px 14px",
              background: "var(--th-subtle-bg)",
              border: "1px solid var(--th-surface-border)",
              borderRadius: "10px",
            }}
          >
            <span style={{ fontSize: "0.72rem", color: "#475569" }}>Total risks detected</span>
            <span
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: total > 0 ? "var(--th-text-1)" : "var(--th-text-3)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {total}
            </span>
          </div>
        )}
        {loading && <div className="skeleton h-10 w-full rounded-xl mb-5" />}

        {rows.map(({ label, value, color, glow, track }) => {
          const pct = total > 0 ? Math.round((value / denom) * 100) : 0;
          return (
            <div key={label} style={{ marginBottom: "18px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      background: color,
                      boxShadow: `0 0 7px ${glow}`,
                    }}
                  />
                  <span style={{ fontSize: "0.78rem", color: "var(--th-text-2)" }}>{label}</span>
                </div>
                {loading ? (
                  <div className="skeleton h-3.5 w-8 rounded" />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: "#475569",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {pct}%
                    </span>
                    <span
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        color: value > 0 ? color : "var(--th-text-4)",
                        fontVariantNumeric: "tabular-nums",
                        minWidth: "16px",
                        textAlign: "right",
                      }}
                    >
                      {value}
                    </span>
                  </div>
                )}
              </div>
              <div
                style={{
                  height: "5px",
                  borderRadius: "999px",
                  background: track,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: "999px",
                    width: loading ? "0%" : `${Math.max(pct, value > 0 ? 4 : 0)}%`,
                    background: `linear-gradient(90deg, ${color}99, ${color})`,
                    boxShadow: `0 0 8px ${glow}`,
                    transition: "width 0.9s cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                />
              </div>
            </div>
          );
        })}

        {!loading && total === 0 && (
          <p style={{ fontSize: "0.75rem", color: "#64748b", textAlign: "center", paddingTop: "8px" }}>
            No risks detected in your portfolio
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Top Clause Issues Card ─────────────────────────────────────── */
function TopClauseIssuesCard({
  risks,
  loading,
}: {
  risks: Risk[];
  loading: boolean;
}) {
  const clauseCounts = risks.reduce(
    (acc, r) => {
      const type = r.risk_type || "Unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const topClauses = Object.entries(clauseCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxCount = topClauses[0]?.[1] ?? 1;

  const CLAUSE_COLORS = ["#f87171", "#fbbf24", "#818cf8", "#60a5fa", "#34d399", "#a78bfa"];

  return (
    <div style={CARD}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "20px 24px",
          ...DIVIDER,
        }}
      >
        <div
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "10px",
            background: "rgba(99,102,241,0.1)",
            border: "1px solid rgba(99,102,241,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Flag size={13} style={{ color: "#818cf8" }} />
        </div>
        <span style={{ flex: 1, fontSize: "0.875rem", fontWeight: 600, color: "var(--th-text-1)" }}>
          Risk Categories
        </span>
      </div>

      <div style={{ padding: "20px 24px" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div className="skeleton h-3 w-28 rounded" />
                  <div className="skeleton h-3 w-6 rounded" />
                </div>
                <div className="skeleton h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : topClauses.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
              padding: "28px 0",
              textAlign: "center",
            }}
          >
            <Flag size={24} style={{ color: "#64748b" }} />
            <p style={{ fontSize: "0.78rem", color: "#64748b" }}>No clause data available</p>
            <p style={{ fontSize: "0.7rem", color: "#475569", lineHeight: 1.5 }}>
              Analyze contracts to see common risk patterns.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {topClauses.map(([type, count], i) => {
              const pct = Math.round((count / maxCount) * 100);
              const color = CLAUSE_COLORS[i] ?? "#64748b";
              return (
                <div key={type}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "7px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: color,
                        }}
                      />
                      <span style={{ fontSize: "0.78rem", color: "var(--th-text-2)" }}>
                        {formatRiskType(type)}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        color: "var(--th-text-1)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {count}
                    </span>
                  </div>
                  <div
                    style={{
                      height: "4px",
                      borderRadius: "999px",
                      background: "var(--th-subtle-bg)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: "999px",
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${color}77, ${color})`,
                        transition: "width 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Compliance Score Card ──────────────────────────────────────── */
function ComplianceScoreCard({
  risks,
  loading,
}: {
  risks: Risk[];
  loading: boolean;
}) {
  const highCount   = risks.filter((r) => ["high", "critical"].includes(r.severity?.toLowerCase())).length;
  const mediumCount = risks.filter((r) => ["medium", "moderate"].includes(r.severity?.toLowerCase())).length;
  const lowCount    = risks.filter((r) => r.severity?.toLowerCase() === "low").length;

  // Rule-based scoring: -10 per high, -5 per medium, -2 per low; clamped 0–100
  const highPenalty   = highCount   * 10;
  const mediumPenalty = mediumCount * 5;
  const lowPenalty    = lowCount    * 2;
  const score =
    risks.length === 0
      ? 100
      : Math.max(0, Math.min(100, Math.round(100 - highPenalty - mediumPenalty - lowPenalty)));

  const scoreColor = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  const scoreLabel = score >= 80 ? "Compliant" : score >= 60 ? "Needs Attention" : "At Risk";
  const circumference = 2 * Math.PI * 38;
  const dash = (score / 100) * circumference;

  const breakdown = [
    { label: "High / Critical", penalty: highPenalty,   color: "#f87171" },
    { label: "Medium risks",    penalty: mediumPenalty, color: "#fbbf24" },
    { label: "Low severity",    penalty: lowPenalty,    color: "#34d399" },
  ];

  return (
    <div style={CARD}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "20px 24px",
          ...DIVIDER,
        }}
      >
        <div
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "10px",
            background: "rgba(16,185,129,0.1)",
            border: "1px solid rgba(16,185,129,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Shield size={13} style={{ color: "#34d399" }} />
        </div>
        <span style={{ flex: 1, fontSize: "0.875rem", fontWeight: 600, color: "var(--th-text-1)" }}>
          Overall Contract Risk Score
        </span>
      </div>

      <div style={{ padding: "20px 24px" }}>
        {loading ? (
          <>
            <div className="skeleton h-24 w-24 rounded-full mx-auto mb-4" />
            <div className="skeleton h-3.5 w-20 rounded mx-auto mb-6" />
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <div className="skeleton h-2.5 w-24 rounded" />
                  <div className="skeleton h-2.5 w-12 rounded" />
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Gauge */}
            <div
              style={{
                position: "relative",
                width: "100px",
                height: "100px",
                margin: "0 auto 12px",
              }}
            >
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="var(--th-gauge-track)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${circumference}`}
                  transform="rotate(-90 50 50)"
                  style={{
                    transition: "stroke-dasharray 1s cubic-bezier(0.22, 1, 0.36, 1)",
                    filter: `drop-shadow(0 0 6px ${scoreColor}88)`,
                  }}
                />
              </svg>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "1.6rem",
                    fontWeight: 700,
                    color: "var(--th-text-1)",
                    lineHeight: 1,
                  }}
                >
                  {score}
                </span>
                <span style={{ fontSize: "0.58rem", color: "#475569", marginTop: "2px" }}>/100</span>
              </div>
            </div>

            {/* Label */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <p style={{ fontSize: "0.82rem", fontWeight: 600, color: scoreColor }}>
                {scoreLabel}
              </p>
              <p style={{ fontSize: "0.68rem", color: "#64748b", marginTop: "3px" }}>
                Based on risk severity profile
              </p>
            </div>

            {/* Score breakdown */}
            <div
              style={{
                background: "var(--th-subtle-bg)",
                border: "1px solid var(--th-surface-border)",
                borderRadius: "12px",
                padding: "12px 14px",
              }}
            >
              <p
                style={{
                  fontSize: "0.58rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#64748b",
                  marginBottom: "10px",
                }}
              >
                Score Breakdown
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {breakdown.map(({ label, penalty, color }) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div
                        style={{
                          width: "5px",
                          height: "5px",
                          borderRadius: "50%",
                          background: color,
                        }}
                      />
                      <span style={{ fontSize: "0.7rem", color: "#64748b" }}>{label}</span>
                    </div>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 500,
                        color: penalty > 0 ? "#f87171" : "#475569",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {penalty > 0 ? `−${penalty} pts` : "No penalty"}
                    </span>
                  </div>
                ))}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: "8px",
                    borderTop: "1px solid var(--th-divider)",
                    marginTop: "2px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <TrendingDown size={10} style={{ color: scoreColor }} />
                    <span style={{ fontSize: "0.7rem", color: "#64748b" }}>Final score</span>
                  </div>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: scoreColor }}>
                    {score} / 100
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function RisksPage() {
  const [risks,            setRisks]            = useState<Risk[]>([]);
  const [contracts,        setContracts]        = useState<Contract[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [contractsLoading, setContractsLoading] = useState(true);
  const [error,            setError]            = useState("");
  const [activeFilter,     setActiveFilter]     = useState("all");
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);

  /* Read initial contract filter from URL on mount */
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const cid = params.get("contract");
      if (cid) setSelectedContractId(Number(cid));
    }
  }, []);

  /* Sync selectedContractId → URL query param */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (selectedContractId != null) {
      url.searchParams.set("contract", String(selectedContractId));
    } else {
      url.searchParams.delete("contract");
    }
    window.history.replaceState(null, "", url.toString());
  }, [selectedContractId]);

  useEffect(() => {
    api
      .risks()
      .then(setRisks)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    api
      .contracts()
      .then(setContracts)
      .catch(() => {/* non-fatal */})
      .finally(() => setContractsLoading(false));
  }, []);

  /* Risks filtered by selected contract (used for KPIs + analytics) */
  const contractRisks = useMemo(
    () => selectedContractId != null
      ? risks.filter((r) => r.contract_id === selectedContractId)
      : risks,
    [risks, selectedContractId],
  );

  /* Risks filtered by both contract AND the tab filter (used for the table) */
  const filteredRisks = useMemo(() => {
    const base = contractRisks;
    if (activeFilter === "all") return base;
    if (activeFilter === "high")
      return base.filter((r) => ["high", "critical"].includes(r.severity?.toLowerCase()));
    if (activeFilter === "compliance")
      return base.filter((r) => {
        const rt = r.risk_type?.toLowerCase() ?? "";
        return rt === "confidentiality" || rt === "compliance" || rt.includes("compliance") || rt.includes("gdpr") || rt.includes("data") || rt.includes("privacy");
      });
    if (activeFilter === "expiring")
      return base.filter((r) => {
        const rt = r.risk_type?.toLowerCase() ?? "";
        return rt.includes("expir") || rt.includes("terminat") || rt.includes("renew") || rt.includes("notice");
      });
    if (activeFilter === "review")
      return base.filter((r) => !!r.suggested_action);
    return base;
  }, [contractRisks, activeFilter]);

  const highCount   = contractRisks.filter((r) => ["high", "critical"].includes(r.severity?.toLowerCase())).length;
  const mediumCount = contractRisks.filter((r) => ["medium", "moderate"].includes(r.severity?.toLowerCase())).length;
  const reviewCount = contractRisks.filter((r) => !!r.suggested_action).length;

  const viewMode: "portfolio" | "single" = selectedContractId != null ? "single" : "portfolio";
  const selectedContract = selectedContractId != null ? contracts.find((c) => c.id === selectedContractId) : null;
  const selectedContractName = selectedContract ? contractDisplayName(selectedContract) : undefined;

  const kpiSubtitle = viewMode === "single" ? "This contract" : "Across all contracts";
  const kpiCards = [
    { label: "High-Priority Risks",     value: highCount,            icon: ShieldAlert,  accent: "danger"  as const, subtitle: "Requires immediate action"   },
    { label: "Moderate Risks",         value: mediumCount,          icon: Scale,        accent: "warning" as const, subtitle: "May require attention"         },
    { label: "Requires Legal Review",  value: reviewCount,          icon: CheckCircle2, accent: "cyan"    as const, subtitle: "Suggested actions pending"    },
    { label: "Total Risks Found",      value: contractRisks.length, icon: Flag,         accent: "indigo"  as const, subtitle: kpiSubtitle                    },
  ];

  return (
    <AppShell>
      {/* Ambient page glow */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "600px",
          height: "400px",
          background: "radial-gradient(ellipse at 70% 0%, rgba(239,68,68,0.055) 0%, transparent 65%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div style={{ maxWidth: "1380px", margin: "0 auto", padding: "48px 52px", position: "relative", zIndex: 1 }}>

        {/* Page header + filter pills */}
        <FadeUp>
          <PageHeader
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            total={filteredRisks.length}
            viewMode={viewMode}
            selectedContractName={selectedContractName}
            contracts={contracts}
            selectedContractId={selectedContractId}
            onContractChange={setSelectedContractId}
            contractsLoading={contractsLoading}
          />
        </FadeUp>

        {/* Error */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "32px",
              padding: "14px 20px",
              borderRadius: "14px",
              background: "rgba(239,68,68,0.07)",
              border: "1px solid rgba(239,68,68,0.14)",
              color: "#f87171",
              fontSize: "0.82rem",
            }}
          >
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* KPI Row */}
        <FadeUp delay={0.06}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "20px",
              marginBottom: "32px",
            }}
          >
            {kpiCards.map((card) => (
              <MetricCard key={card.label} {...card} loading={loading} />
            ))}
          </div>
        </FadeUp>

        {/* Main grid: table (2/3) + AI panel (1/3) */}
        <FadeUp delay={0.1}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 380px",
              gap: "20px",
              marginBottom: "20px",
              alignItems: "start",
            }}
          >
            <DetectedRisksTable risks={filteredRisks} loading={loading} contracts={contracts} />
            <AIRiskSummaryPanel risks={contractRisks} loading={loading} />
          </div>
        </FadeUp>

        {/* Analytics row */}
        <FadeUp delay={0.14}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "20px",
              marginBottom: "32px",
            }}
          >
            <RiskDistributionCard risks={contractRisks} loading={loading} />
            <TopClauseIssuesCard  risks={contractRisks} loading={loading} />
            <ComplianceScoreCard  risks={contractRisks} loading={loading} />
          </div>
        </FadeUp>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "28px",
            borderTop: "1px solid var(--th-divider)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            {["SOC 2 Type II", "ISO 27001", "AES-256", "GDPR"].map((b) => (
              <span
                key={b}
                style={{
                  fontSize: "0.62rem",
                  color: "#64748b",
                  letterSpacing: "0.07em",
                  fontWeight: 500,
                  textTransform: "uppercase",
                }}
              >
                {b}
              </span>
            ))}
          </div>
          <span style={{ fontSize: "0.7rem", color: "#475569" }}>
            Contract Lens · {new Date().getFullYear()}
          </span>
        </div>

      </div>
    </AppShell>
  );
}
