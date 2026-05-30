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
  { label: "Liability", color: "#f87171", bg: "rgba(248,113,113,0.16)" },
  { label: "Compliance", color: "#60a5fa", bg: "rgba(96,165,250,0.16)" },
  { label: "Payment", color: "#facc15", bg: "rgba(250,204,21,0.18)" },
  { label: "Termination", color: "#fb923c", bg: "rgba(251,146,60,0.18)" },
  { label: "Renewal", color: "#34d399", bg: "rgba(52,211,153,0.16)" },
  { label: "Confidentiality", color: "#a78bfa", bg: "rgba(167,139,250,0.17)" },
] as const;

type LegendCategory = typeof LEGEND[number]["label"];

type HighlightSegment =
  | { type: "text"; text: string; key: string }
  | { type: "clause"; text: string; key: string; clause: Clause; category: LegendCategory; risks: Risk[] };

function categoryFromStoredData(clause: Clause, risks: Risk[]): LegendCategory | null {
  const sources = [clause.category, ...risks.map((risk) => risk.risk_type)];
  for (const source of sources) {
    const value = source?.toLowerCase() ?? "";
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

function risksForClause(clause: Clause, risks: Risk[]): Risk[] {
  const direct = risks.filter((risk) => risk.clause_id === clause.id);
  if (direct.length > 0) return direct;

  const clauseText = clause.text.toLowerCase();
  return risks.filter((risk) => {
    const snippet = risk.source_snippet?.trim().toLowerCase();
    return !!snippet && clauseText.includes(snippet.slice(0, 80));
  });
}

function buildSegments(text: string, clauses: Clause[], risks: Risk[]): HighlightSegment[] {
  if (!text || clauses.length === 0) {
    return [{ type: "text", text, key: "all-text" }];
  }

  const segments: HighlightSegment[] = [];
  const lowerText = text.toLowerCase();
  let cursor = 0;

  for (const clause of [...clauses].sort((a, b) => a.order_index - b.order_index)) {
    const clauseText = clause.text?.trim();
    if (!clauseText) continue;

    const foundAt = lowerText.indexOf(clauseText.toLowerCase(), cursor);
    if (foundAt < cursor) continue;

    const linkedRisks = risksForClause(clause, risks);
    const category = categoryFromStoredData(clause, linkedRisks);
    if (!category) continue;

    if (foundAt > cursor) {
      segments.push({ type: "text", text: text.slice(cursor, foundAt), key: `text-${cursor}` });
    }

    const end = foundAt + clauseText.length;
    segments.push({
      type: "clause",
      text: text.slice(foundAt, end),
      key: `clause-${clause.id}`,
      clause,
      category,
      risks: linkedRisks,
    });
    cursor = end;
  }

  if (cursor < text.length) {
    segments.push({ type: "text", text: text.slice(cursor), key: `text-${cursor}` });
  }

  return segments.length > 0 ? segments : [{ type: "text", text, key: "all-text" }];
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
  segment,
  onClose,
}: {
  segment: Extract<HighlightSegment, { type: "clause" }> | null;
  onClose: () => void;
}) {
  const primaryRisk = segment?.risks[0] ?? null;
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
            {segment ? "Clause Details" : "Select a Clause"}
          </p>
          <p style={{ fontSize: "0.68rem", color: "var(--th-text-4)" }}>
            {segment ? "Stored clause and risk data" : "Click a highlighted clause in the contract text"}
          </p>
        </div>
        {segment && (
          <button
            onClick={onClose}
            aria-label="Close clause details"
            style={{ width: "30px", height: "30px", borderRadius: "9px", background: "transparent", border: "1px solid var(--th-divider)", color: "var(--th-text-3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      <div style={{ padding: "18px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
        {!segment ? (
          <p style={{ fontSize: "0.8rem", color: "var(--th-text-3)", lineHeight: 1.7 }}>
            Highlighted clauses use the categories already stored on the contract and linked risks.
          </p>
        ) : (
          <>
            <PanelRow icon={Tag} label="Clause Category">
              <span style={{ color: categoryStyle(segment.category).color, fontWeight: 700 }}>{segment.category}</span>
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
  const [detail, setDetail] = useState<ContractDetail | null>(null);
  const [selected, setSelected] = useState<Extract<HighlightSegment, { type: "clause" }> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.contract(contractId)
      .then((data) => {
        if (!active) return;
        setDetail(data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [contractId]);

  const contractText = detail?.cleaned_text || detail?.extracted_text || "";
  const segments = useMemo(
    () => buildSegments(contractText, detail?.clauses ?? [], detail?.risks ?? []),
    [contractText, detail?.clauses, detail?.risks],
  );
  const highlightedCount = segments.filter((segment) => segment.type === "clause").length;

  return (
    <AppShell>
      <div style={{ position: "fixed", top: 0, right: 0, width: "680px", height: "480px", background: "radial-gradient(ellipse at 80% -10%, rgba(99,102,241,0.075) 0%, transparent 62%)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "44px 52px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "18px", marginBottom: "24px" }}>
          <div>
            <Link href={detail ? `/contracts/${detail.id}` : "/contracts"} style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--th-text-3)", fontSize: "0.76rem", textDecoration: "none", marginBottom: "14px" }}>
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
        ) : !detail || !contractText ? (
          <div style={{ ...CARD, padding: "44px", textAlign: "center" }}>
            <FileSearch size={26} style={{ color: "var(--th-text-4)", margin: "0 auto 10px" }} />
            <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--th-text-1)" }}>No contract text available</p>
            <p style={{ marginTop: "6px", fontSize: "0.78rem", color: "var(--th-text-3)" }}>
              The review view uses stored extracted text from the existing upload pipeline.
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
              <div style={{ padding: "32px 38px", background: "rgba(248,250,252,0.97)", color: "#1f2937", fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "0.96rem", lineHeight: 1.95, whiteSpace: "pre-wrap" }}>
                {segments.map((segment) => {
                  if (segment.type === "text") return <span key={segment.key}>{segment.text}</span>;
                  const style = categoryStyle(segment.category);
                  const isSelected = selected?.clause.id === segment.clause.id;
                  return (
                    <button
                      key={segment.key}
                      type="button"
                      onClick={() => setSelected(segment)}
                      style={{
                        display: "inline",
                        border: `1px solid ${isSelected ? style.color : "transparent"}`,
                        background: style.bg,
                        color: "inherit",
                        borderRadius: "4px",
                        padding: "1px 3px",
                        cursor: "pointer",
                        boxShadow: isSelected ? `0 0 0 2px ${style.color}33, inset 0 -2px 0 ${style.color}` : `inset 0 -2px 0 ${style.color}`,
                        textAlign: "left",
                        font: "inherit",
                      }}
                      title={`${segment.category}${segment.risks.length ? ` - ${segment.risks.length} linked risk${segment.risks.length !== 1 ? "s" : ""}` : ""}`}
                    >
                      {segment.text}
                    </button>
                  );
                })}
              </div>
            </div>

            <ClausePanel segment={selected} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>
    </AppShell>
  );
}
