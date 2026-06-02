"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Brain,
  FileSearch,
  Hash,
  Lightbulb,
  ListChecks,
  ShieldAlert,
  Tag,
  Target,
  X,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import RiskBadge from "@/components/ui/RiskBadge";
import LoadingState from "@/components/ui/LoadingState";
import { api, Clause, ContractDetail, Risk } from "@/services/api";

const CARD: React.CSSProperties = {
  background: "var(--th-card-bg)",
  border: "1px solid var(--th-card-border)",
  boxShadow: "var(--th-card-shadow)",
  borderRadius: "20px",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  overflow: "hidden",
};

const LEGEND = [
  { label: "Confidentiality", color: "#f87171", bg: "rgba(248,113,113,0.16)" },
  { label: "Intellectual Property", color: "#60a5fa", bg: "rgba(96,165,250,0.16)" },
  { label: "Payment", color: "#facc15", bg: "rgba(250,204,21,0.18)" },
  { label: "Data Protection", color: "#fb923c", bg: "rgba(251,146,60,0.18)" },
  { label: "Termination", color: "#41d334", bg: "rgba(52,211,153,0.16)" },
  { label: "Liability", color: "#a78bfa", bg: "rgba(167,139,250,0.17)" },
  { label: "Term and Duration", color: "#d257a1", bg: "rgba(248, 113, 232, 0.16)" },
  { label: "Idemnity", color: "#2c0202", bg: "rgba(104, 99, 99, 0.16)" },
  { label: "Governing Law", color: "#c3b7b7", bg: "rgba(134, 129, 129, 0.16)" },
] as const;

type LegendCategory = typeof LEGEND[number]["label"];

// Explicit overrides for backend category/risk_type values that don't substring-match
// any LEGEND label (e.g. backend emits "IP" but LEGEND uses "Intellectual Property").
const CATEGORY_OVERRIDES: Record<string, LegendCategory> = {
  ip:                      "Intellectual Property",
  "intellectual property": "Intellectual Property",
  limitation:              "Liability",
  "limitation of liability": "Liability",
  indemnification:         "Idemnity",
  indemnity:               "Idemnity",
  compliance:              "Data Protection",
  "data protection":       "Data Protection",
  renewal:                 "Term and Duration",
  "term and duration":     "Term and Duration",
  "force majeure":         "Governing Law",
};

function categoryFromStoredData(clause: Clause, risks: Risk[]): LegendCategory | null {
  const sources = [clause.category, ...risks.map((r) => r.risk_type)];
  for (const source of sources) {
    if (!source) continue;
    const value = source.toLowerCase().trim();
    // Check explicit overrides first (handles "IP" → "Intellectual Property" etc.)
    if (CATEGORY_OVERRIDES[value]) return CATEGORY_OVERRIDES[value];
    // Fallback: substring match against LEGEND labels
    const match = LEGEND.find((item) => value.includes(item.label.toLowerCase()));
    if (match) return match.label;
  }
  return null;
}

function categoryStyle(category: LegendCategory) {
  return LEGEND.find((item) => item.label === category) ?? LEGEND[0];
}

function parseJsonList(value?: string | null): string[] {
  if (!value?.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

// Direct clause_id match only — backend guarantees every risk has a clause_id.
function risksForClause(clause: Clause, risks: Risk[]): Risk[] {
  return risks.filter((r) => r.clause_id === clause.id);
}

function PanelRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ padding: "14px 16px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--th-divider)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "7px" }}>
        <Icon size={12} style={{ color: "#818cf8" }} />
        <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--th-text-4)" }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: "0.78rem", color: "var(--th-text-2)", lineHeight: 1.75 }}>{children}</div>
    </div>
  );
}

function ClausePanel({
  clause,
  risks,
  category,
  allRisks,
  onClose,
  onRiskClick,
}: {
  clause: Clause | null;
  risks: Risk[];
  category: LegendCategory | null;
  allRisks: Risk[];
  onClose: () => void;
  onRiskClick: (risk: Risk) => void;
}) {
  const primaryRisk = risks[0] ?? null;
  const triggerTerms = primaryRisk ? parseJsonList(primaryRisk.trigger_terms) : [];

  return (
    <aside
      style={{
        ...CARD,
        position: "sticky",
        top: "80px",
        maxHeight: "calc(100vh - 104px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--th-divider)", display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FileSearch size={14} style={{ color: "#818cf8" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--th-text-1)" }}>
            {clause ? "Clause Details" : "Contract Risks"}
          </p>
          <p style={{ fontSize: "0.68rem", color: "var(--th-text-4)" }}>
            {clause ? "Stored clause and risk data" : "Click a risk to jump to its clause"}
          </p>
        </div>
        {clause && (
          <button
            onClick={onClose}
            aria-label="Close clause details"
            style={{ width: "30px", height: "30px", borderRadius: "9px", background: "transparent", border: "1px solid var(--th-divider)", color: "var(--th-text-3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      <div style={{ padding: "18px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
        {!clause ? (
          allRisks.length === 0 ? (
            <p style={{ fontSize: "0.8rem", color: "var(--th-text-3)", lineHeight: 1.7 }}>
              No risks were identified for this contract.
            </p>
          ) : (
            allRisks.map((risk) => (
              <button
                key={risk.id}
                type="button"
                onClick={() => onRiskClick(risk)}
                disabled={risk.clause_id === null}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--th-divider)",
                  cursor: risk.clause_id !== null ? "pointer" : "default",
                  opacity: risk.clause_id !== null ? 1 : 0.45,
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <div style={{ paddingTop: "1px", flexShrink: 0 }}>
                  <RiskBadge level={risk.severity} />
                </div>
                <span style={{ fontSize: "0.78rem", color: "var(--th-text-2)", lineHeight: 1.5 }}>
                  {risk.title}
                </span>
              </button>
            ))
          )
        ) : (
          <>
            <PanelRow icon={Tag} label="Clause Category">
              <span style={{ color: category ? categoryStyle(category).color : "var(--th-text-2)", fontWeight: 700 }}>
                {category ?? clause.category ?? "General"}
              </span>
            </PanelRow>

            <PanelRow icon={ShieldAlert} label="Risk Level">
              {primaryRisk ? <RiskBadge level={primaryRisk.severity} /> : "No linked risk stored for this clause."}
            </PanelRow>

            <PanelRow icon={Brain} label="Risk Explanation">
              {primaryRisk?.explanation || "No stored explanation is available for this clause."}
            </PanelRow>

            <PanelRow icon={Lightbulb} label="Why It Matters">
              {primaryRisk?.why_this_matters || "No stored why-it-matters detail is available for this risk."}
            </PanelRow>

            <PanelRow icon={Target} label="Recommended Action">
              {primaryRisk?.suggested_action || "No stored recommended action is available for this risk."}
            </PanelRow>

            <PanelRow icon={ListChecks} label="Detected Terms">
              {triggerTerms.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {triggerTerms.map((term) => (
                    <span key={term} style={{ padding: "3px 8px", borderRadius: "999px", background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.18)", color: "#a5b4fc", fontSize: "0.7rem" }}>
                      {term}
                    </span>
                  ))}
                </div>
              ) : (
                "No stored trigger terms are available for this risk."
              )}
            </PanelRow>

            <PanelRow icon={Hash} label="Confidence Score">
              Not stored on the linked risk record.
            </PanelRow>
          </>
        )}
      </div>
    </aside>
  );
}

export default function ContractReviewPage({ params }: { params: Promise<{ contractId: string }> }) {
  const { contractId } = use(params);
  const [detail, setDetail]           = useState<ContractDetail | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [flashClauseId, setFlashClauseId] = useState<number | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");

  useEffect(() => {
    let active = true;
    api.contract(contractId)
      .then((data) => {
        if (!active) return;
        console.log("[ContractReview] clauses received:", data.clauses?.length ?? 0);
        console.log("[ContractReview] clauses:", data.clauses);
        console.log("[ContractReview] risks received:", data.risks?.length ?? 0);
        setDetail(data);
      })
      .catch((err)  => { if (active) setError(err.message); })
      .finally(()   => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [contractId]);

  // Resolves which clause to highlight — direct clause_id only, no fuzzy matching.
  const highlightedClauseId = useMemo(() => {
    if (!selectedRisk) return null;
    if (selectedRisk.clause_id) return selectedRisk.clause_id;
    return null;
  }, [selectedRisk]);

  // Scroll to clause block and trigger the flash animation.
  function flashAndScroll(clauseId: number) {
    setFlashClauseId(clauseId);
    setTimeout(() => {
      document
        .querySelector(`[data-clause-id="${clauseId}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
    const t = setTimeout(() => setFlashClauseId(null), 3800);
    return () => clearTimeout(t);
  }

  // Select a risk, then resolve its clause and flash + scroll to it.
  function selectAndHighlightRisk(risk: Risk) {
    setSelectedRisk(risk);
    if (risk.clause_id) flashAndScroll(risk.clause_id);
  }

  const sortedClauses = useMemo(
    () => [...(detail?.clauses ?? [])].sort((a, b) => a.order_index - b.order_index),
    [detail?.clauses],
  );

  const allRisks = detail?.risks ?? [];

  // The clause whose details are shown in the right panel.
  const selectedClause = useMemo(
    () => (highlightedClauseId !== null
      ? (detail?.clauses.find((c) => c.id === highlightedClauseId) ?? null)
      : null),
    [highlightedClauseId, detail?.clauses],
  );

  // All risks linked to the selected clause, with the clicked risk first.
  const selectedRisks = useMemo(() => {
    if (!selectedClause) return [];
    const linked = risksForClause(selectedClause, allRisks);
    if (!selectedRisk) return linked;
    return [
      ...linked.filter((r) => r.id === selectedRisk.id),
      ...linked.filter((r) => r.id !== selectedRisk.id),
    ];
  }, [selectedClause, allRisks, selectedRisk]);

  const selectedCategory = selectedClause
    ? categoryFromStoredData(selectedClause, selectedRisks)
    : null;

  const highlightedCount = useMemo(
    () => sortedClauses.filter((c) => {
      const linked = risksForClause(c, allRisks);
      return categoryFromStoredData(c, linked) !== null;
    }).length,
    [sortedClauses, allRisks],
  );

  return (
    <AppShell>
      <div style={{ position: "fixed", top: 0, right: 0, width: "680px", height: "480px", background: "radial-gradient(ellipse at 80% -10%, rgba(99,102,241,0.075) 0%, transparent 62%)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "44px 52px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "18px", marginBottom: "24px" }}>
          <div>
            <Link href="/contracts" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--th-text-3)", fontSize: "0.76rem", textDecoration: "none", marginBottom: "14px" }}>
              <ArrowLeft size={13} />
              Back to contract
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <div style={{ height: "4px", width: "24px", borderRadius: "999px", background: "linear-gradient(90deg, #6366f1, #22d3ee)" }} />
              <span style={{ color: "#818cf8", fontSize: "0.65rem", fontFamily: "var(--font-mono, monospace)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Contract Review
              </span>
            </div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--th-text-1)", letterSpacing: "-0.02em" }}>
              {detail?.title ?? "Review Contract"}
            </h1>
            <p style={{ marginTop: "6px", fontSize: "0.82rem", color: "var(--th-text-3)", lineHeight: 1.6 }}>
              Original contract text with stored clause and risk highlighting.
            </p>
          </div>
        </div>

        <div style={{ ...CARD, padding: "18px 20px", marginBottom: "20px" }}>
          <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--th-text-1)", marginBottom: "12px" }}>
            Clause Legend
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 14px" }}>
            {LEGEND.map((item) => (
              <div key={item.label} style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "0.76rem", color: "var(--th-text-2)" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: item.color, boxShadow: `0 0 10px ${item.color}66` }} />
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", padding: "14px 18px", borderRadius: "14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.20)", color: "#f87171", fontSize: "0.82rem" }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {loading ? (
          <LoadingState rows={6} type="detail" />
        ) : !detail || sortedClauses.length === 0 ? (
          <div style={{ ...CARD, padding: "44px", textAlign: "center" }}>
            <FileSearch size={26} style={{ color: "var(--th-text-4)", margin: "0 auto 10px" }} />
            <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--th-text-1)" }}>No contract text available</p>
            <p style={{ marginTop: "6px", fontSize: "0.78rem", color: "var(--th-text-3)" }}>
              The review view uses stored clause data from the existing upload pipeline.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 380px", gap: "20px", alignItems: "start" }}>
            <div style={CARD}>
              <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--th-divider)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                <div>
                  <p style={{ fontSize: "0.86rem", fontWeight: 700, color: "var(--th-text-1)" }}>Contract Text</p>
                  <p style={{ fontSize: "0.68rem", color: "var(--th-text-4)" }}>
                    {highlightedCount} highlighted clause{highlightedCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* CSS animation — injected only while a clause is flashing */}
              {flashClauseId !== null && (
                <style>{`
                  @keyframes clausePulse {
                    0%   { opacity: 1; }
                    45%  { opacity: 0.88; }
                    100% { opacity: 1; }
                  }
                  @keyframes clauseGlow {
                    0%   { box-shadow: 0 2px 0 transparent; }
                    35%  { box-shadow: 0 0 0 3px var(--clause-glow), 0 4px 24px var(--clause-glow); }
                    100% { box-shadow: 0 2px 0 transparent; }
                  }
                  .clause-flash {
                    animation: clausePulse 1.1s ease-in-out 2, clauseGlow 1.1s ease-in-out 2;
                  }
                `}</style>
              )}

              <div style={{ padding: "32px 38px", background: "rgba(248,250,252,0.97)", color: "#1f2937", fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "0.96rem", lineHeight: 1.95 }}>
                {sortedClauses.map((clause) => {
                  const linkedRisks = risksForClause(clause, allRisks);
                  const cat         = categoryFromStoredData(clause, linkedRisks);
                  const isActive    = highlightedClauseId === clause.id;
                  const isFlashing  = flashClauseId === clause.id;
                  const cStyle      = cat ? categoryStyle(cat) : null;

                  // Shared structural style — every clause block uses these regardless of category.
                  const baseBlockStyle: React.CSSProperties = {
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    marginBottom: "12px",
                    font: "inherit",
                    color: "inherit",
                  };

                  const headingEl = clause.heading ? (
                    <div style={{ fontWeight: 700, marginBottom: "5px", fontSize: "0.93rem", letterSpacing: "0.01em", textTransform: "uppercase", color: cStyle ? cStyle.color : "#475569" }}>
                      {clause.heading}
                    </div>
                  ) : null;

                  const bodyEl = (
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.85 }}>{clause.text}</div>
                  );

                  // Uncategorized clause — neutral block, visually bounded but not colored.
                  if (!cStyle) {
                    return (
                      <div
                        key={clause.id}
                        data-clause-id={clause.id}
                        style={{
                          ...baseBlockStyle,
                          background: "rgba(255,255,255,0.72)",
                          border: "1px solid rgba(0,0,0,0.07)",
                        }}
                      >
                        {headingEl}
                        {bodyEl}
                      </div>
                    );
                  }

                  const isClickable = linkedRisks.length > 0;

                  // Categorized clause — colored block, clickable when risks are linked.
                  const clauseStyle: React.CSSProperties = {
                    ...baseBlockStyle,
                    background: cStyle.bg,
                    border: `1px solid ${isActive ? cStyle.color : `${cStyle.color}40`}`,
                    cursor: isClickable ? "pointer" : "default",
                    boxShadow: isActive
                      ? `0 0 0 3px ${cStyle.color}33, 0 2px 8px ${cStyle.color}22`
                      : "none",
                    ["--clause-glow" as string]: cStyle.color + "55",
                  };

                  if (!isClickable) {
                    return (
                      <div
                        key={clause.id}
                        data-clause-id={clause.id}
                        className={isFlashing ? "clause-flash" : ""}
                        style={clauseStyle}
                      >
                        {headingEl}
                        {bodyEl}
                      </div>
                    );
                  }

                  return (
                    <button
                      key={clause.id}
                      data-clause-id={clause.id}
                      type="button"
                      onClick={() => selectAndHighlightRisk(linkedRisks[0])}
                      className={isFlashing ? "clause-flash" : ""}
                      style={clauseStyle}
                      title={`${cat} – ${linkedRisks.length} risk${linkedRisks.length !== 1 ? "s" : ""}`}
                    >
                      {headingEl}
                      {bodyEl}
                    </button>
                  );
                })}
              </div>
            </div>

            <ClausePanel
              clause={selectedClause}
              risks={selectedRisks}
              category={selectedCategory}
              allRisks={allRisks}
              onClose={() => { setSelectedRisk(null); setFlashClauseId(null); }}
              onRiskClick={selectAndHighlightRisk}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}
