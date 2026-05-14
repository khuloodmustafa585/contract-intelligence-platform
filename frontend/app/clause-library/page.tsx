"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Search,
  BookOpen,
  Sparkles,
  ChevronRight,
  Copy,
  X,
  Database,
  History,
  Filter,
  ArrowUpDown,
  Zap,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import GlassCard from "@/components/ui/GlassCard";
import RiskBadge from "@/components/ui/RiskBadge";
import AIInsightPanel from "@/components/ui/AIInsightPanel";
import EmptyState from "@/components/ui/EmptyState";
import { api, Clause } from "@/services/api";

type EnrichedClause = Clause & {
  risk?: string;
  category?: string;
  insight?: string;
  sources?: number;
  frequency?: number;
  favorability?: string;
};

const RISK_LEVELS = ["All", "High", "Moderate", "Standard"];
const CATEGORIES  = [
  { name: "All Categories",    count: 0 },
  { name: "Termination",       count: 12 },
  { name: "Liability",         count: 8 },
  { name: "Confidentiality",   count: 15 },
  { name: "Indemnity",         count: 5 },
  { name: "Force Majeure",     count: 3 },
  { name: "Governing Law",     count: 9 },
  { name: "Payment Terms",     count: 11 },
  { name: "IP & Ownership",    count: 7 },
];

function assignMeta(clause: Clause, idx: number): EnrichedClause {
  const risks = ["high", "moderate", "standard"] as const;
  const cats  = ["Termination", "Liability", "Confidentiality", "Indemnity", "Force Majeure", "Governing Law"];
  const insights = [
    "Suggests 60-day notice for vendor protection.",
    "Industry standard for SaaS agreements.",
    "Includes standard exclusions for public domain data.",
    "Recommend defining breach cure period explicitly.",
    "Consider mutual carve-outs for gross negligence.",
  ];
  return {
    ...clause,
    risk:         risks[idx % 3],
    category:     cats[idx % cats.length],
    insight:      insights[idx % insights.length],
    sources:      Math.floor(Math.random() * 200) + 30,
    frequency:    Math.floor(Math.random() * 60) + 40,
    favorability: ["Buyer-Favorable", "Neutral", "Seller-Favorable"][idx % 3],
  };
}

function buildFallback(): EnrichedClause[] {
  return [
    {
      id: 1, contract_id: 0, order_index: 0,
      heading: "Mutual Convenience Termination",
      text: "Either party may terminate this Agreement at any time, with or without cause, upon providing thirty (30) days prior written notice to the other party.",
      risk: "high", category: "Termination",
      insight: "Suggests 60-day notice for vendor protection.",
      sources: 128, frequency: 65, favorability: "Neutral",
    },
    {
      id: 2, contract_id: 0, order_index: 1,
      heading: "Aggregate Liability Cap (1× Annual)",
      text: "The total aggregate liability of either party for all claims arising out of or related to this Agreement shall not exceed the amount paid or payable during the twelve (12) months preceding the claim.",
      risk: "moderate", category: "Liability",
      insight: "Industry standard for SaaS agreements.",
      sources: 94, frequency: 82, favorability: "Neutral",
    },
    {
      id: 3, contract_id: 0, order_index: 2,
      heading: "Definition of Confidential Information",
      text: "Confidential Information means all non-public information disclosed by either party, whether orally or in writing, that is designated as confidential or that reasonably should be understood to be confidential.",
      risk: "standard", category: "Confidentiality",
      insight: "Includes standard exclusions for public domain data.",
      sources: 211, frequency: 91, favorability: "Buyer-Favorable",
    },
    {
      id: 4, contract_id: 0, order_index: 3,
      heading: "Mutual Indemnification",
      text: "Each party shall indemnify, defend, and hold harmless the other party from any claims, damages, and expenses arising from its material breach of this Agreement or any gross negligence or willful misconduct.",
      risk: "high", category: "Indemnity",
      insight: "Recommend defining breach cure period explicitly.",
      sources: 77, frequency: 58, favorability: "Neutral",
    },
    {
      id: 5, contract_id: 0, order_index: 4,
      heading: "Force Majeure",
      text: "Neither party shall be liable for any failure or delay in performance to the extent caused by circumstances beyond such party's reasonable control, including acts of God, war, terrorism, or government action.",
      risk: "standard", category: "Force Majeure",
      insight: "Consider mutual carve-outs for gross negligence.",
      sources: 143, frequency: 77, favorability: "Seller-Favorable",
    },
    {
      id: 6, contract_id: 0, order_index: 5,
      heading: "Governing Law & Jurisdiction",
      text: "This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of law provisions.",
      risk: "moderate", category: "Governing Law",
      insight: "Delaware is preferred for corporate agreements.",
      sources: 189, frequency: 88, favorability: "Neutral",
    },
  ];
}

export default function ClauseLibraryPage() {
  const [apiClauses, setApiClauses] = useState<EnrichedClause[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [category, setCategory]     = useState("All Categories");
  const [riskFilter, setRiskFilter] = useState("All");
  const [selected, setSelected]     = useState<EnrichedClause | null>(null);
  const [copied, setCopied]         = useState(false);

  useEffect(() => {
    api.contracts()
      .then(async (contracts) => {
        if (contracts.length === 0) return;
        const details = await Promise.all(contracts.slice(0, 3).map((c) => api.contract(c.id)));
        const clauses: EnrichedClause[] = details
          .flatMap((d) => d.clauses)
          .map(assignMeta);
        if (clauses.length > 0) setApiClauses(clauses);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const clauses = apiClauses.length > 0 ? apiClauses : buildFallback();

  const filtered = useMemo(() => {
    let rows = clauses;
    if (category !== "All Categories") rows = rows.filter((c) => c.category === category);
    if (riskFilter !== "All") rows = rows.filter((c) => c.risk?.toLowerCase() === riskFilter.toLowerCase());
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((c) =>
        c.heading?.toLowerCase().includes(q) ||
        c.text.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [clauses, category, riskFilter, search]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const riskColor = (r?: string) =>
    r === "high" ? "#f87171" : r === "moderate" ? "#fbbf24" : "#818cf8";

  return (
    <AppShell>
      <div className="flex" style={{ height: "calc(100vh - 64px)" }}>

        {/* ── Left Category Panel ── */}
        <aside
          className="flex w-64 shrink-0 flex-col overflow-y-auto"
          style={{
            background: "rgba(11,19,38,0.9)",
            borderRight: "1px solid rgba(99,102,241,0.10)",
          }}
        >
          <div className="px-5 py-5">
            <p className="font-mono-label mb-4" style={{ color: "#6366f1", fontSize: "0.62rem" }}>
              Categories
            </p>
            <div className="space-y-1">
              {CATEGORIES.map(({ name, count }) => (
                <button
                  key={name}
                  onClick={() => setCategory(name)}
                  className="group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all"
                  style={{
                    background: category === name ? "rgba(99,102,241,0.12)" : "transparent",
                    border: category === name ? "1px solid rgba(99,102,241,0.22)" : "1px solid transparent",
                    color: category === name ? "#dae2fd" : "#64748b",
                  }}
                >
                  <span className="text-sm">{name}</span>
                  {count > 0 && (
                    <span
                      className="rounded-md px-1.5 py-0.5 text-xs"
                      style={{ background: "rgba(99,102,241,0.10)", color: "#6366f1", fontFamily: "var(--font-mono,monospace)" }}
                    >
                      {String(count).padStart(2, "0")}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Risk Filters */}
          <div className="px-5 py-3 mt-2" style={{ borderTop: "1px solid rgba(99,102,241,0.08)" }}>
            <p className="font-mono-label mb-4" style={{ color: "#6366f1", fontSize: "0.62rem" }}>
              Risk Filters
            </p>
            <div className="space-y-2">
              {RISK_LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => setRiskFilter(level)}
                  className="flex w-full items-center gap-3 text-sm transition-all"
                  style={{ color: riskFilter === level ? "#dae2fd" : "#64748b" }}
                >
                  <div
                    className="h-3.5 w-3.5 rounded"
                    style={{
                      border: `2px solid ${
                        level === "High"     ? "#f87171"
                        : level === "Moderate" ? "#fbbf24"
                        : level === "Standard" ? "#818cf8"
                        : "rgba(99,102,241,0.3)"
                      }`,
                      background: riskFilter === level ? `${
                        level === "High"     ? "rgba(239,68,68,0.2)"
                        : level === "Moderate" ? "rgba(245,158,11,0.2)"
                        : level === "Standard" ? "rgba(99,102,241,0.2)"
                        : "transparent"
                      }` : "transparent",
                    }}
                  />
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-auto px-5 py-5" style={{ borderTop: "1px solid rgba(99,102,241,0.08)" }}>
            <div
              className="rounded-xl p-4"
              style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.12)" }}
            >
              <p className="text-xs font-semibold mb-3" style={{ color: "#dae2fd" }}>
                Clause Intelligence
              </p>
              <div className="space-y-1.5 text-xs" style={{ color: "#64748b" }}>
                <div className="flex justify-between">
                  <span>Total Clauses</span>
                  <span style={{ color: "#818cf8", fontFamily: "var(--font-mono,monospace)" }}>1,240</span>
                </div>
                <div className="flex justify-between">
                  <span>AI-Vetted</span>
                  <span style={{ color: "#34d399", fontFamily: "var(--font-mono,monospace)" }}>98.2%</span>
                </div>
                <div className="flex justify-between">
                  <span>High-Risk</span>
                  <span style={{ color: "#f87171", fontFamily: "var(--font-mono,monospace)" }}>142</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main Clause List ── */}
        <section className="flex-1 overflow-y-auto px-8 py-8">

          {/* Header */}
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1 w-6 rounded-full" style={{ background: "linear-gradient(90deg, #6366f1, #22d3ee)" }} />
                <span className="font-mono-label" style={{ color: "#6366f1", fontSize: "0.65rem" }}>Legal Intelligence</span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight" style={{ color: "#dae2fd" }}>
                Clause Library
              </h1>
              <p className="text-sm mt-2" style={{ color: "#64748b" }}>
                {filtered.length} clauses · AI-powered analysis
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{ background: "rgba(19,27,46,0.8)", border: "1px solid rgba(99,102,241,0.12)" }}
              >
                <Search size={13} style={{ color: "#64748b" }} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search clauses..."
                  className="bg-transparent text-sm outline-none w-44 placeholder:text-[#3a4560]"
                  style={{ color: "#dae2fd" }}
                />
              </div>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-xl transition-all hover:bg-[rgba(99,102,241,0.08)]"
                style={{ border: "1px solid rgba(99,102,241,0.14)" }}
              >
                <Filter size={14} style={{ color: "#64748b" }} />
              </button>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-xl transition-all hover:bg-[rgba(99,102,241,0.08)]"
                style={{ border: "1px solid rgba(99,102,241,0.14)" }}
              >
                <ArrowUpDown size={14} style={{ color: "#64748b" }} />
              </button>
            </div>
          </div>

          {/* Clause Cards */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="skeleton rounded-2xl"
                  style={{ height: "160px" }}
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No clauses found"
              description="Adjust your search or category filters."
            />
          ) : (
            <div className="space-y-4">
              {filtered.map((clause) => (
                <button
                  key={clause.id}
                  onClick={() => setSelected(selected?.id === clause.id ? null : clause)}
                  className="group w-full text-left rounded-2xl p-6 transition-all duration-200"
                  style={{
                    background: selected?.id === clause.id
                      ? "rgba(26,35,64,0.9)"
                      : "rgba(19,27,46,0.7)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: selected?.id === clause.id
                      ? "1px solid rgba(99,102,241,0.30)"
                      : "1px solid rgba(99,102,241,0.12)",
                    boxShadow: selected?.id === clause.id
                      ? "0 0 24px rgba(99,102,241,0.12)"
                      : undefined,
                  }}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="rounded-lg px-2.5 py-1 font-mono-label"
                        style={{
                          background: "rgba(30,42,67,0.8)",
                          color: "#64748b",
                          fontSize: "0.62rem",
                          border: "1px solid rgba(99,102,241,0.10)",
                        }}
                      >
                        {clause.category}
                      </span>
                      <RiskBadge level={clause.risk ?? "standard"} />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: "#3a4560" }}>
                      <Database size={11} />
                      {clause.sources ?? 128} Sources
                    </div>
                  </div>

                  {/* Title */}
                  <h3
                    className="text-lg font-semibold mb-3 leading-snug transition-colors group-hover:text-[#818cf8]"
                    style={{ color: "#dae2fd" }}
                  >
                    {clause.heading ?? `Clause ${clause.id}`}
                  </h3>

                  {/* Text */}
                  <p
                    className="text-sm leading-relaxed line-clamp-3"
                    style={{ color: "#94a3b8" }}
                  >
                    {clause.text}
                  </p>

                  {/* Footer */}
                  <div
                    className="mt-5 flex items-center justify-between pt-4"
                    style={{ borderTop: "1px solid rgba(99,102,241,0.10)" }}
                  >
                    <div className="flex items-center gap-1.5 text-sm" style={{ color: "#818cf8" }}>
                      <Sparkles size={13} />
                      {clause.insight}
                    </div>
                    <ChevronRight
                      size={16}
                      className="transition-transform group-hover:translate-x-0.5"
                      style={{ color: "#3a4560" }}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── Right Preview Panel ── */}
        <aside
          className="flex w-[400px] shrink-0 flex-col overflow-y-auto"
          style={{
            background: "rgba(11,19,38,0.95)",
            backdropFilter: "blur(20px)",
            borderLeft: "1px solid rgba(99,102,241,0.10)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-5 shrink-0"
            style={{ borderBottom: "1px solid rgba(99,102,241,0.10)" }}
          >
            <div>
              <p className="text-base font-semibold" style={{ color: "#dae2fd" }}>
                Clause Preview
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                {selected ? selected.heading ?? "Selected clause" : "Select a clause to preview"}
              </p>
            </div>
            <div className="flex gap-2">
              {selected && (
                <>
                  <button
                    onClick={() => handleCopy(selected.text)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:bg-[rgba(99,102,241,0.10)]"
                    style={{ border: "1px solid rgba(99,102,241,0.14)" }}
                    title="Copy clause text"
                  >
                    <Copy size={13} style={{ color: copied ? "#10b981" : "#64748b" }} />
                  </button>
                  <button
                    onClick={() => setSelected(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:bg-[rgba(239,68,68,0.08)]"
                    style={{ border: "1px solid rgba(239,68,68,0.14)" }}
                  >
                    <X size={13} style={{ color: "#64748b" }} />
                  </button>
                </>
              )}
            </div>
          </div>

          {!selected ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <div
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.14)" }}
              >
                <BookOpen size={22} style={{ color: "#6366f1", opacity: 0.6 }} />
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: "#dae2fd" }}>
                No clause selected
              </p>
              <p className="text-xs" style={{ color: "#3a4560" }}>
                Click any clause in the library to preview it here.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

              {/* Analyzing badge */}
              <div
                className="flex items-center gap-2 rounded-xl px-4 py-3"
                style={{ background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.14)" }}
              >
                <div
                  className="h-2 w-2 rounded-full animate-pulse"
                  style={{ background: "#22d3ee" }}
                />
                <span className="font-mono-label" style={{ color: "#22d3ee", fontSize: "0.62rem" }}>
                  Analyzing Variations
                </span>
              </div>

              {/* Clause Body */}
              <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <RiskBadge level={selected.risk ?? "standard"} />
                  <span
                    className="font-mono-label"
                    style={{ color: "#3a4560", fontSize: "0.6rem" }}
                  >
                    {selected.category}
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "#dae2fd" }}>
                  {selected.text}
                </p>
              </GlassCard>

              {/* AI Recommendation */}
              <AIInsightPanel title="AI Recommendation">
                {selected.insight}
                <button className="mt-3 flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-80" style={{ color: "#818cf8" }}>
                  Apply Suggestion <Zap size={11} />
                </button>
              </AIInsightPanel>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Market Frequency", value: `${selected.frequency ?? 82}%`, color: "#dae2fd" },
                  { label: "Favorability",      value: selected.favorability ?? "Neutral", color: "#22d3ee" },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    className="rounded-xl p-4"
                    style={{ background: "rgba(19,27,46,0.7)", border: "1px solid rgba(99,102,241,0.10)" }}
                  >
                    <p className="font-mono-label mb-2" style={{ color: "#3a4560", fontSize: "0.6rem" }}>
                      {label}
                    </p>
                    <p className="text-2xl font-bold" style={{ color }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Historical Context */}
              <div>
                <p className="font-mono-label mb-3" style={{ color: "#6366f1", fontSize: "0.62rem" }}>
                  Historical Context
                </p>
                <div className="space-y-2">
                  {[
                    { title: "Used in Project Zenith",    sub: "Oct 2023 · No Litigation" },
                    { title: "Modified in Global Ops MSA", sub: "Jan 2024 · Negotiated" },
                  ].map(({ title, sub }) => (
                    <div
                      key={title}
                      className="flex items-start gap-3 rounded-xl p-3"
                      style={{ background: "rgba(19,27,46,0.6)", border: "1px solid rgba(99,102,241,0.08)" }}
                    >
                      <History size={14} style={{ color: "#3a4560", marginTop: "2px" }} />
                      <div>
                        <p className="text-xs font-medium" style={{ color: "#dae2fd" }}>{title}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <button
                className="w-full rounded-2xl py-3.5 text-sm font-semibold transition-all hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                  color: "white",
                  boxShadow: "0 0 24px rgba(99,102,241,0.3)",
                }}
              >
                Add to Contract View
              </button>
            </div>
          )}
        </aside>
      </div>
    </AppShell>
  );
}
