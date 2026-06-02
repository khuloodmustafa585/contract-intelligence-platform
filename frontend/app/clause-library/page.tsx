"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Search,
  X,
  ChevronDown,
  FileText,
  AlertTriangle,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  Shield,
  ArrowRight,
  ChevronRight,
  Layers,
  ScanText,
  Play,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { api, Contract, ContractDetail, Clause, Risk } from "@/services/api";

/* ─── Types ──────────────────────────────────────────────────────── */
type Severity = "high" | "moderate" | "low" | "none";

type EnrichedClause = Clause & {
  linkedRisks:     Risk[];
  highestSeverity: Severity;
  displayCategory: string; // always set — derived from clause.category or heading/text
};

/* ─── Shared style constants ─────────────────────────────────────── */
const CARD: React.CSSProperties = {
  background:           "var(--th-card-bg)",
  border:               "1px solid var(--th-card-border)",
  boxShadow:            "var(--th-card-shadow)",
  borderRadius:         "20px",
  backdropFilter:       "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  overflow:             "hidden",
};

/* ─── Risk helpers ───────────────────────────────────────────────── */
function normalizeSeverity(s: string): "high" | "moderate" | "low" {
  const l = s.toLowerCase();
  if (l.includes("high") || l.includes("critical") || l.includes("severe")) return "high";
  if (l.includes("medium") || l.includes("moderate"))                        return "moderate";
  return "low";
}

function computeHighestSeverity(risks: Risk[]): Severity {
  if (risks.length === 0) return "none";
  const sevs = risks.map((r) => normalizeSeverity(r.severity));
  if (sevs.includes("high"))     return "high";
  if (sevs.includes("moderate")) return "moderate";
  return "low";
}

/* ─── Category inference ─────────────────────────────────────────── */
// Used as a fallback when the backend clause.category is null (existing data).
// The backend now populates category for new analyses via the same patterns.
function deriveCategory(heading: string | null | undefined, text: string): string {
  const src = ((heading ?? "") + " " + text.slice(0, 200)).toLowerCase();
  if (/terminat|expir|cancell/.test(src))                               return "Termination";
  if (/confidential|non[- ]?disclosure|proprietary/.test(src))         return "Confidentiality";
  if (/\bindemnif|\bliabilit/.test(src))                               return "Liability";
  if (/\bpayment|\binvoice|\bfee\b|compensat|pric/.test(src))          return "Payment";
  if (/governing law|jurisdiction|arbitrat|dispute resol/.test(src))   return "Governing Law";
  if (/intellectual property|\bpatent\b|\bcopyright\b|trademark/.test(src)) return "IP";
  if (/force majeure/.test(src))                                        return "Force Majeure";
  if (/\bassign\b|\bsubcontract/.test(src))                            return "Assignment";
  if (/\bdefini/.test(src))                                             return "Definitions";
  if (/represent|warrant|covenant/.test(src))                           return "Warranties";
  if (/\bnotice\b|\bnotif/.test(src))                                   return "Notices";
  if (/limitation of liability|limitation on damages/.test(src))       return "Limitation";
  return "General";
}

const SEV: Record<Severity, { color: string; bg: string; border: string; label: string }> = {
  high:     { color: "#f87171", bg: "rgba(239,68,68,0.1)",    border: "rgba(239,68,68,0.22)",    label: "High Risk" },
  moderate: { color: "#fbbf24", bg: "rgba(245,158,11,0.1)",   border: "rgba(245,158,11,0.22)",   label: "Moderate"  },
  low:      { color: "#34d399", bg: "rgba(16,185,129,0.1)",   border: "rgba(16,185,129,0.22)",   label: "Low Risk"  },
  none:     { color: "var(--th-text-4)", bg: "var(--th-tag-bg)", border: "var(--th-tag-border)", label: "No Risks"  },
};

/* ─── Fade-up animation ──────────────────────────────────────────── */
function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Contract Picker ────────────────────────────────────────────── */
// The outer trigger is a <div role="combobox">, NOT a <button>.
// This eliminates the <button>-inside-<button> HTML violation that caused
// React hydration errors. The clear (X) button inside is now valid HTML.
function ContractPicker({
  contracts,
  contractsLoading,
  selected,
  onSelect,
  onClear,
  contractLoading,
  clauseCount,
  riskCount,
  highRiskCount,
}: {
  contracts:        Contract[];
  contractsLoading: boolean;
  selected:         Contract | null;
  onSelect:         (c: Contract) => void;
  onClear:          () => void;
  contractLoading:  boolean;
  clauseCount:      number;
  riskCount:        number;
  highRiskCount:    number;
}) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState("");
  const ref                 = useRef<HTMLDivElement>(null);
  const inputRef            = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleOutside);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return contracts;
    const q = search.toLowerCase();
    return contracts.filter((c) => c.title.toLowerCase().includes(q));
  }, [contracts, search]);

  const canOpen      = !contractsLoading && contracts.length > 0;
  const handleToggle = () => canOpen && setOpen((o) => !o);

  return (
    <div style={{ ...CARD, padding: "28px 32px" }}>

      {/* Header row: label + contract count badge */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width:          "26px",
              height:         "26px",
              borderRadius:   "8px",
              background:     "rgba(59,130,246,0.1)",
              border:         "1px solid rgba(59,130,246,0.18)",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
            }}
          >
            <FileText size={12} style={{ color: "#60a5fa" }} />
          </div>
          <div>
            <p
              style={{
                fontSize:      "0.82rem",
                fontWeight:    700,
                color:         "var(--th-text-1)",
                letterSpacing: "-0.01em",
                margin:        0,
              }}
            >
              Select Contract
            </p>
            <p style={{ fontSize: "0.65rem", color: "var(--th-text-4)", margin: 0 }}>
              {contractsLoading
                ? "Loading…"
                : contracts.length === 0
                ? "No contracts uploaded yet"
                : `${contracts.length} contract${contracts.length !== 1 ? "s" : ""} available`}
            </p>
          </div>
        </div>
        {selected && (
          <span
            style={{
              fontSize:     "0.62rem",
              fontWeight:   600,
              padding:      "3px 10px",
              borderRadius: "999px",
              background:   "rgba(59,130,246,0.08)",
              border:       "1px solid rgba(59,130,246,0.16)",
              color:        "#60a5fa",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Active
          </span>
        )}
      </div>

      <div ref={ref} style={{ position: "relative" }}>
        {/* Trigger — <div role="combobox"> so nested <button> is valid HTML */}
        <div
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          tabIndex={canOpen ? 0 : -1}
          onClick={handleToggle}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && canOpen) {
              e.preventDefault();
              handleToggle();
            }
            if (e.key === "Escape") setOpen(false);
          }}
          style={{
            display:       "flex",
            alignItems:    "center",
            gap:           "16px",
            width:         "100%",
            padding:       "18px 22px",
            borderRadius:  "16px",
            background:    selected
              ? "linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(59,130,246,0.02) 100%)"
              : "var(--th-input-bg)",
            border:        open
              ? "1px solid rgba(59,130,246,0.5)"
              : selected
              ? "1px solid rgba(59,130,246,0.22)"
              : "1px solid var(--th-input-border)",
            boxShadow:     open
              ? "0 0 0 3px rgba(59,130,246,0.08), 0 4px 16px rgba(59,130,246,0.06)"
              : selected
              ? "0 2px 12px rgba(59,130,246,0.05)"
              : "none",
            cursor:        canOpen ? "pointer" : "not-allowed",
            transition:    "all 0.18s",
            outline:       "none",
            userSelect:    "none",
          }}
        >
          {/* Contract icon */}
          <div
            style={{
              width:           "46px",
              height:          "46px",
              borderRadius:    "13px",
              background:      selected ? "rgba(59,130,246,0.12)" : "var(--th-subtle-bg)",
              border:          selected ? "1px solid rgba(59,130,246,0.22)" : "1px solid var(--th-tag-border)",
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
              flexShrink:      0,
              boxShadow:       selected ? "0 2px 8px rgba(59,130,246,0.12)" : "none",
            }}
          >
            <FileText size={19} style={{ color: selected ? "#60a5fa" : "var(--th-text-4)" }} />
          </div>

          {/* Label / selected title */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {selected ? (
              <>
                <p
                  style={{
                    fontSize:      "1.0rem",
                    fontWeight:    600,
                    color:         "var(--th-text-1)",
                    overflow:      "hidden",
                    textOverflow:  "ellipsis",
                    whiteSpace:    "nowrap",
                    margin:        0,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {selected.title}
                </p>
                <p style={{ fontSize: "0.72rem", color: "var(--th-text-4)", marginTop: "3px" }}>
                  {contractLoading
                    ? "Loading clauses…"
                    : clauseCount > 0
                    ? `${clauseCount} clause${clauseCount !== 1 ? "s" : ""} · ${riskCount} risk${riskCount !== 1 ? "s" : ""} identified`
                    : "Click to switch contract"}
                </p>
              </>
            ) : (
              <div>
                <p style={{ fontSize: "0.92rem", fontWeight: 500, color: canOpen ? "var(--th-text-3)" : "var(--th-text-4)", margin: 0 }}>
                  {contractsLoading
                    ? "Loading contracts…"
                    : contracts.length === 0
                    ? "No contracts yet — upload one first"
                    : "Choose a contract to explore its clauses…"}
                </p>
                {contracts.length > 0 && !contractsLoading && (
                  <p style={{ fontSize: "0.68rem", color: "var(--th-text-5)", marginTop: "3px" }}>
                    Click to browse {contracts.length} contract{contracts.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right controls: clear + chevron */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            {selected && !contractLoading && (
              <button
                onClick={(e) => { e.stopPropagation(); onClear(); setOpen(false); }}
                aria-label="Clear selection"
                style={{
                  width:          "30px",
                  height:         "30px",
                  borderRadius:   "9px",
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  background:     "transparent",
                  border:         "1px solid transparent",
                  cursor:         "pointer",
                  color:          "var(--th-text-4)",
                  transition:     "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background   = "rgba(239,68,68,0.08)";
                  el.style.color        = "#f87171";
                  el.style.borderColor  = "rgba(239,68,68,0.18)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background   = "transparent";
                  el.style.color        = "var(--th-text-4)";
                  el.style.borderColor  = "transparent";
                }}
              >
                <X size={13} />
              </button>
            )}
            <div
              style={{
                width:          "30px",
                height:         "30px",
                borderRadius:   "9px",
                background:     open ? "rgba(59,130,246,0.08)" : "var(--th-subtle-bg)",
                border:         open ? "1px solid rgba(59,130,246,0.2)" : "1px solid var(--th-tag-border)",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                transition:     "all 0.18s",
              }}
            >
              <ChevronDown
                size={14}
                style={{
                  color:      open ? "#60a5fa" : "var(--th-text-3)",
                  transform:  open ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              />
            </div>
          </div>
        </div>

        {/* Dropdown */}
        <AnimatePresence>
          {open && (
            <motion.div
              role="listbox"
              initial={{ opacity: 0, y: -10, scale: 0.985 }}
              animate={{ opacity: 1, y: 0,   scale: 1     }}
              exit={{    opacity: 0, y: -10, scale: 0.985 }}
              transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position:     "absolute",
                top:          "calc(100% + 12px)",
                left:         0,
                right:        0,
                background:   "var(--th-dropdown-bg)",
                border:       "1px solid var(--th-dropdown-border)",
                borderRadius: "18px",
                boxShadow:    "var(--th-dropdown-shadow)",
                zIndex:       200,
                overflow:     "hidden",
              }}
            >
              {/* Search */}
              <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--th-divider)" }}>
                <div
                  style={{
                    display:      "flex",
                    alignItems:   "center",
                    gap:          "10px",
                    padding:      "10px 14px",
                    borderRadius: "12px",
                    background:   "var(--th-subtle-bg)",
                    border:       "1px solid var(--th-input-border)",
                  }}
                >
                  <Search size={13} style={{ color: "var(--th-text-4)", flexShrink: 0 }} />
                  <input
                    ref={inputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search contracts…"
                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "0.85rem", color: "var(--th-text-1)" }}
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--th-text-4)", display: "flex" }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              <div style={{ overflowY: "auto", maxHeight: "420px" }}>
                {filtered.length === 0 ? (
                  <div style={{ padding: "32px 24px", textAlign: "center", color: "var(--th-text-4)", fontSize: "0.84rem" }}>
                    No contracts match &ldquo;{search}&rdquo;
                  </div>
                ) : (
                  filtered.map((c) => {
                    const isSelected = selected?.id === c.id;
                    return (
                      <button
                        key={c.id}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => { onSelect(c); setOpen(false); setSearch(""); }}
                        style={{
                          display:      "flex",
                          alignItems:   "center",
                          gap:          "16px",
                          width:        "100%",
                          padding:      "16px 20px",
                          background:   isSelected ? "rgba(59,130,246,0.07)" : "transparent",
                          border:       "none",
                          borderBottom: "1px solid var(--th-row-divider)",
                          cursor:       "pointer",
                          textAlign:    "left",
                          transition:   "background 0.1s",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) (e.currentTarget as HTMLElement).style.background = "var(--th-hover-bg)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent";
                        }}
                      >
                        <div
                          style={{
                            width:          "40px",
                            height:         "40px",
                            borderRadius:   "11px",
                            background:     isSelected ? "rgba(59,130,246,0.1)"           : "var(--th-subtle-bg)",
                            border:         isSelected ? "1px solid rgba(59,130,246,0.22)" : "1px solid var(--th-tag-border)",
                            display:        "flex",
                            alignItems:     "center",
                            justifyContent: "center",
                            flexShrink:     0,
                          }}
                        >
                          <FileText size={16} style={{ color: isSelected ? "#60a5fa" : "var(--th-text-3)" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              fontSize:     "0.88rem",
                              fontWeight:   500,
                              color:        isSelected ? "#93c5fd" : "var(--th-text-1)",
                              overflow:     "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace:   "nowrap",
                              margin:       0,
                            }}
                          >
                            {c.title}
                          </p>
                          <p style={{ fontSize: "0.7rem", color: "var(--th-text-4)", marginTop: "3px", textTransform: "capitalize" }}>
                            {c.status}
                            {c.created_at && (
                              <span style={{ marginLeft: "8px", opacity: 0.7 }}>
                                · {new Date(c.created_at).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                        </div>
                        {isSelected && (
                          <div
                            style={{
                              width:          "22px",
                              height:         "22px",
                              borderRadius:   "6px",
                              background:     "rgba(59,130,246,0.12)",
                              border:         "1px solid rgba(59,130,246,0.22)",
                              display:        "flex",
                              alignItems:     "center",
                              justifyContent: "center",
                              flexShrink:     0,
                            }}
                          >
                            <Check size={12} style={{ color: "#60a5fa" }} />
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats row — appears once a contract with clauses is loaded */}
      <AnimatePresence>
        {selected && !contractLoading && clauseCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{    opacity: 0, height: 0    }}
            transition={{ duration: 0.22 }}
          >
            <div
              style={{
                display:    "flex",
                alignItems: "center",
                gap:        "8px",
                marginTop:  "18px",
                paddingTop: "18px",
                borderTop:  "1px solid var(--th-divider)",
                flexWrap:   "wrap",
              }}
            >
              {[
                { label: `${clauseCount} clauses`,   color: "#3b82f6", bg: "rgba(59,130,246,0.08)",  border: "rgba(59,130,246,0.16)"  },
                { label: `${riskCount} risks`,        color: "#fbbf24", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.16)"  },
                ...(highRiskCount > 0
                  ? [{ label: `${highRiskCount} high risk`, color: "#f87171", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.16)"  }]
                  : [{ label: "No high risk",               color: "#34d399", bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.16)" }]),
              ].map(({ label, color, bg, border }) => (
                <span
                  key={label}
                  style={{
                    fontSize:     "0.68rem",
                    fontWeight:   500,
                    padding:      "5px 13px",
                    borderRadius: "999px",
                    background:   bg,
                    border:       `1px solid ${border}`,
                    color,
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Filter Bar ─────────────────────────────────────────────────── */
const RISK_FILTER_OPTIONS = [
  { value: "all",      label: "All",      dot: null,       activeBg: "rgba(59,130,246,0.1)",  activeBorder: "rgba(59,130,246,0.28)",  activeColor: "#60a5fa"          },
  { value: "high",     label: "High",     dot: "#f87171",  activeBg: "rgba(239,68,68,0.1)",   activeBorder: "rgba(239,68,68,0.28)",   activeColor: "#f87171"          },
  { value: "moderate", label: "Moderate", dot: "#fbbf24",  activeBg: "rgba(245,158,11,0.1)",  activeBorder: "rgba(245,158,11,0.28)",  activeColor: "#fbbf24"          },
  { value: "low",      label: "Low",      dot: "#34d399",  activeBg: "rgba(16,185,129,0.1)",  activeBorder: "rgba(16,185,129,0.28)",  activeColor: "#34d399"          },
  { value: "none",     label: "No Risk",  dot: null,       activeBg: "var(--th-subtle-bg)",   activeBorder: "var(--th-tag-border)",   activeColor: "var(--th-text-2)" },
] as const;

function FilterBar({
  search,
  onSearchChange,
  categories,
  categoryCounts,
  activeCategory,
  onCategoryChange,
  activeRisk,
  onRiskChange,
  totalCount,
}: {
  search:           string;
  onSearchChange:   (s: string) => void;
  categories:       string[];
  categoryCounts:   Record<string, number>;
  activeCategory:   string;
  onCategoryChange: (c: string) => void;
  activeRisk:       string;
  onRiskChange:     (r: string) => void;
  totalCount:       number;
}) {
  return (
    <div style={{ ...CARD, padding: "14px 18px" }}>

      {/* Row 1 — Search + Risk filter */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>

        {/* Search */}
        <div
          style={{
            display:      "flex",
            alignItems:   "center",
            gap:          "8px",
            padding:      "8px 13px",
            borderRadius: "10px",
            background:   "var(--th-input-bg)",
            border:       search ? "1px solid rgba(59,130,246,0.35)" : "1px solid var(--th-input-border)",
            flex:         1,
            minWidth:     0,
            transition:   "border-color 0.15s",
          }}
        >
          <Search size={12} style={{ color: "var(--th-text-4)", flexShrink: 0 }} />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search clauses…"
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "0.8rem", color: "var(--th-text-1)", minWidth: 0 }}
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--th-text-4)", display: "flex", flexShrink: 0 }}
            >
              <X size={11} />
            </button>
          )}
        </div>

        {/* Vertical divider */}
        <div style={{ width: "1px", height: "22px", background: "var(--th-divider)", flexShrink: 0 }} />

        {/* Risk filter label */}
        <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--th-text-4)", textTransform: "uppercase", letterSpacing: "0.1em", flexShrink: 0 }}>
          Risk
        </span>

        {/* Risk chips */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0, flexWrap: "nowrap" }}>
          {RISK_FILTER_OPTIONS.map(({ value, label, dot, activeBg, activeBorder, activeColor }) => {
            const isActive = activeRisk === value;
            return (
              <button
                key={value}
                onClick={() => onRiskChange(value)}
                style={{
                  display:      "flex",
                  alignItems:   "center",
                  gap:          "5px",
                  padding:      "5px 10px",
                  borderRadius: "999px",
                  fontSize:     "0.72rem",
                  fontWeight:   isActive ? 600 : 400,
                  background:   isActive ? activeBg     : "var(--th-tag-bg)",
                  border:       isActive ? `1px solid ${activeBorder}` : "1px solid var(--th-tag-border)",
                  color:        isActive ? activeColor  : "var(--th-text-3)",
                  cursor:       "pointer",
                  transition:   "all 0.15s",
                  whiteSpace:   "nowrap",
                }}
              >
                {dot && <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: dot, flexShrink: 0 }} />}
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 2 — Category chips (horizontally scrollable) */}
      {categories.length > 0 && (
        <div
          className="no-scrollbar"
          style={{
            display:       "flex",
            alignItems:    "center",
            gap:           "5px",
            marginTop:     "10px",
            paddingTop:    "10px",
            borderTop:     "1px solid var(--th-divider)",
            overflowX:     "auto",
          }}
        >
          {(["all"] as string[]).concat(categories).map((cat) => {
            const isActive = activeCategory === cat;
            const count    = cat === "all" ? totalCount : (categoryCounts[cat] ?? 0);
            return (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                style={{
                  display:      "flex",
                  alignItems:   "center",
                  gap:          "5px",
                  padding:      "5px 12px",
                  borderRadius: "999px",
                  fontSize:     "0.72rem",
                  fontWeight:   isActive ? 600 : 400,
                  background:   isActive ? "rgba(59,130,246,0.1)" : "var(--th-tag-bg)",
                  border:       isActive ? "1px solid rgba(59,130,246,0.28)" : "1px solid var(--th-tag-border)",
                  color:        isActive ? "#60a5fa" : "var(--th-text-3)",
                  cursor:       "pointer",
                  transition:   "all 0.15s",
                  whiteSpace:   "nowrap",
                  flexShrink:   0,
                }}
              >
                {cat === "all" ? "All Categories" : cat}
                <span
                  style={{
                    fontSize:     "0.6rem",
                    fontWeight:   isActive ? 600 : 400,
                    padding:      "1px 5px",
                    borderRadius: "999px",
                    background:   isActive ? "rgba(59,130,246,0.15)" : "var(--th-subtle-bg)",
                    color:        isActive ? "#60a5fa" : "var(--th-text-4)",
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Clause Card ─────────────────────────────────────────────────── */
function ClauseCard({ clause, onClick }: { clause: EnrichedClause; onClick: () => void }) {
  const sev = SEV[clause.highestSeverity];

  return (
    <button
      onClick={onClick}
      style={{
        width:               "100%",
        textAlign:           "left",
        padding:             "18px 20px",
        borderRadius:        "16px",
        background:          "var(--th-card-bg)",
        border:              "1px solid var(--th-card-border)",
        boxShadow:           "var(--th-card-shadow)",
        backdropFilter:      "blur(20px)",
        WebkitBackdropFilter:"blur(20px)",
        cursor:              "pointer",
        transition:          "border-color 0.15s, box-shadow 0.15s, transform 0.15s",
        display:             "flex",
        flexDirection:       "column",
        gap:                 "10px",
        position:            "relative",
        overflow:            "hidden",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "rgba(59,130,246,0.28)";
        el.style.boxShadow   = "0 8px 28px rgba(59,130,246,0.07), var(--th-card-shadow)";
        el.style.transform   = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "var(--th-card-border)";
        el.style.boxShadow   = "var(--th-card-shadow)";
        el.style.transform   = "translateY(0)";
      }}
    >
      {/* Risk accent strip */}
      {clause.highestSeverity !== "none" && (
        <div
          style={{
            position:     "absolute",
            top:          0,
            left:         0,
            width:        "3px",
            height:       "100%",
            background:   sev.color,
            opacity:      0.7,
          }}
        />
      )}

      {/* Top row: category tag + risk badge */}
      <div
        style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          gap:            "8px",
          paddingLeft:    clause.highestSeverity !== "none" ? "8px" : 0,
        }}
      >
        <span
          style={{
            fontSize:        "0.62rem",
            fontWeight:      600,
            color:           "var(--th-text-4)",
            textTransform:   "uppercase",
            letterSpacing:   "0.1em",
            background:      "var(--th-tag-bg)",
            border:          "1px solid var(--th-tag-border)",
            borderRadius:    "5px",
            padding:         "2px 7px",
          }}
        >
          {clause.displayCategory}
        </span>

        {clause.highestSeverity !== "none" && (
          <span
            style={{
              display:      "flex",
              alignItems:   "center",
              gap:          "4px",
              fontSize:     "0.62rem",
              fontWeight:   600,
              padding:      "2px 8px",
              borderRadius: "5px",
              background:   sev.bg,
              border:       `1px solid ${sev.border}`,
              color:        sev.color,
              flexShrink:   0,
            }}
          >
            <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: sev.color, flexShrink: 0 }} />
            {sev.label}
          </span>
        )}
      </div>

      {/* Heading */}
      <h3
        style={{
          fontSize:    "0.9rem",
          fontWeight:  600,
          color:       "var(--th-text-1)",
          lineHeight:  1.35,
          margin:      0,
          paddingLeft: clause.highestSeverity !== "none" ? "8px" : 0,
        }}
      >
        {clause.heading ?? `Clause ${clause.order_index + 1}`}
      </h3>

      {/* Text preview (3 lines) */}
      <p
        style={{
          fontSize:         "0.77rem",
          color:            "var(--th-text-3)",
          lineHeight:       1.65,
          display:          "-webkit-box",
          WebkitLineClamp:  3,
          WebkitBoxOrient:  "vertical",
          overflow:         "hidden",
          margin:           0,
          paddingLeft:      clause.highestSeverity !== "none" ? "8px" : 0,
        }}
      >
        {clause.text}
      </p>

      {/* Footer */}
      <div
        style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          paddingTop:     "10px",
          borderTop:      "1px solid var(--th-divider)",
          paddingLeft:    clause.highestSeverity !== "none" ? "8px" : 0,
        }}
      >
        {clause.linkedRisks.length > 0 ? (
          <span
            style={{
              display:    "flex",
              alignItems: "center",
              gap:        "5px",
              fontSize:   "0.68rem",
              fontWeight: 500,
              color:
                clause.highestSeverity === "high"     ? "#f87171"
                : clause.highestSeverity === "moderate" ? "#fbbf24"
                : "var(--th-text-4)",
            }}
          >
            <AlertCircle size={11} />
            {clause.linkedRisks.length} risk{clause.linkedRisks.length !== 1 ? "s" : ""}
          </span>
        ) : (
          <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.68rem", color: "var(--th-text-5)" }}>
            <Check size={11} style={{ color: "#34d399" }} />
            Clean
          </span>
        )}
        <ArrowRight size={13} style={{ color: "var(--th-text-5)", flexShrink: 0 }} />
      </div>
    </button>
  );
}

/* ─── Clause Drawer ──────────────────────────────────────────────── */
function ClauseDrawer({
  clause,
  contractTitle,
  onClose,
}: {
  clause:        EnrichedClause | null;
  contractTitle: string;
  onClose:       () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleCopy = useCallback(() => {
    if (clause) {
      navigator.clipboard.writeText(clause.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  }, [clause]);

  const sev = clause ? SEV[clause.highestSeverity] : null;

  return (
    <AnimatePresence>
      {clause && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{    opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            style={{
              position:            "fixed",
              inset:               0,
              background:          "rgba(0,0,0,0.38)",
              backdropFilter:      "blur(3px)",
              WebkitBackdropFilter:"blur(3px)",
              zIndex:              300,
            }}
          />

          {/* Slide-over panel */}
          <motion.div
            key="drawer"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0,      opacity: 1 }}
            exit={{    x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 340, mass: 0.85 }}
            style={{
              position:      "fixed",
              top:           0,
              right:         0,
              bottom:        0,
              width:         "min(540px, 92vw)",
              background:    "var(--th-surface)",
              borderLeft:    "1px solid var(--th-surface-border)",
              boxShadow:     "-20px 0 60px rgba(0,0,0,0.22)",
              zIndex:        310,
              display:       "flex",
              flexDirection: "column",
              overflow:      "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding:      "18px 22px",
                borderBottom: "1px solid var(--th-divider)",
                flexShrink:   0,
                background:   "var(--th-surface)",
              }}
            >
              {/* Breadcrumb */}
              <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "10px" }}>
                <span style={{ fontSize: "0.65rem", color: "var(--th-text-4)" }}>{contractTitle}</span>
                <ChevronRight size={10} style={{ color: "var(--th-text-5)" }} />
                <span style={{ fontSize: "0.65rem", color: "var(--th-text-3)" }}>Clause Detail</span>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Category + severity */}
                  <div style={{ display: "flex", alignItems: "center", gap: "7px", flexWrap: "wrap", marginBottom: "8px" }}>
                    <span
                      style={{
                        fontSize:      "0.62rem",
                        fontWeight:    600,
                        color:         "var(--th-text-3)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        background:    "var(--th-tag-bg)",
                        border:        "1px solid var(--th-tag-border)",
                        borderRadius:  "5px",
                        padding:       "2px 8px",
                      }}
                    >
                      {clause.displayCategory}
                    </span>
                    {sev && clause.highestSeverity !== "none" && (
                      <span
                        style={{
                          display:      "flex",
                          alignItems:   "center",
                          gap:          "4px",
                          fontSize:     "0.62rem",
                          fontWeight:   600,
                          padding:      "2px 8px",
                          borderRadius: "5px",
                          background:   sev.bg,
                          border:       `1px solid ${sev.border}`,
                          color:        sev.color,
                        }}
                      >
                        <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: sev.color }} />
                        {sev.label}
                      </span>
                    )}
                  </div>
                  <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--th-text-1)", lineHeight: 1.3, margin: 0 }}>
                    {clause.heading ?? `Clause ${clause.order_index + 1}`}
                  </h2>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                  <button
                    onClick={handleCopy}
                    title={copied ? "Copied!" : "Copy clause text"}
                    style={{
                      width:          "32px",
                      height:         "32px",
                      borderRadius:   "9px",
                      background:     copied ? "rgba(16,185,129,0.1)" : "var(--th-subtle-bg)",
                      border:         copied ? "1px solid rgba(16,185,129,0.24)" : "1px solid var(--th-tag-border)",
                      display:        "flex",
                      alignItems:     "center",
                      justifyContent: "center",
                      cursor:         "pointer",
                      color:          copied ? "#34d399" : "var(--th-text-3)",
                      transition:     "all 0.15s",
                    }}
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                  <button
                    onClick={onClose}
                    style={{
                      width:          "32px",
                      height:         "32px",
                      borderRadius:   "9px",
                      background:     "var(--th-subtle-bg)",
                      border:         "1px solid var(--th-tag-border)",
                      display:        "flex",
                      alignItems:     "center",
                      justifyContent: "center",
                      cursor:         "pointer",
                      color:          "var(--th-text-3)",
                      transition:     "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background  = "rgba(239,68,68,0.07)";
                      el.style.color       = "#f87171";
                      el.style.borderColor = "rgba(239,68,68,0.18)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background  = "var(--th-subtle-bg)";
                      el.style.color       = "var(--th-text-3)";
                      el.style.borderColor = "var(--th-tag-border)";
                    }}
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable body */}
            <div
              style={{
                flex:          1,
                overflowY:     "auto",
                padding:       "22px",
                display:       "flex",
                flexDirection: "column",
                gap:           "20px",
              }}
            >
              {/* Full clause text */}
              <div>
                <p style={{ fontSize: "0.62rem", fontWeight: 600, color: "var(--th-text-4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>
                  Clause Text
                </p>
                <div style={{ padding: "16px 18px", borderRadius: "12px", background: "var(--th-subtle-bg)", border: "1px solid var(--th-tag-border)" }}>
                  <p style={{ fontSize: "0.83rem", color: "var(--th-text-2)", lineHeight: 1.8, margin: 0 }}>
                    {clause.text}
                  </p>
                </div>
              </div>

              {/* Metadata chips */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[
                  { label: "Order", value: `#${clause.order_index + 1}` },
                  ...(clause.page_number != null ? [{ label: "Page", value: String(clause.page_number) }] : []),
                  { label: "Risks", value: String(clause.linkedRisks.length) },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    style={{
                      padding:       "8px 14px",
                      borderRadius:  "10px",
                      background:    "var(--th-inner-hover)",
                      border:        "1px solid var(--th-tag-border)",
                      textAlign:     "center",
                      minWidth:      "64px",
                    }}
                  >
                    <p style={{ fontSize: "0.58rem", fontWeight: 600, color: "var(--th-text-4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "3px" }}>{label}</p>
                    <p style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--th-text-1)", margin: 0, fontVariantNumeric: "tabular-nums" }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Linked risks */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <Shield size={12} style={{ color: "var(--th-text-3)" }} />
                  <p style={{ fontSize: "0.62rem", fontWeight: 600, color: "var(--th-text-3)", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0, flex: 1 }}>
                    Identified Risks
                  </p>
                  {clause.linkedRisks.length > 0 && (
                    <span style={{ fontSize: "0.62rem", padding: "1px 8px", borderRadius: "999px", background: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.16)" }}>
                      {clause.linkedRisks.length}
                    </span>
                  )}
                </div>

                {clause.linkedRisks.length === 0 ? (
                  <div style={{ padding: "22px", borderRadius: "12px", background: "var(--th-subtle-bg)", border: "1px solid var(--th-tag-border)", textAlign: "center" }}>
                    <div
style={{
                        width:          "34px",
                        height:         "34px",
                        borderRadius:   "10px",
                        background:     "rgba(16,185,129,0.1)",
                        border:         "1px solid rgba(16,185,129,0.2)",
                        display:        "flex",
                        alignItems:     "center",
                        justifyContent: "center",
                        margin:         "0 auto 10px",
                      }}
                    >
                      <Check size={15} style={{ color: "#34d399" }} />
                    </div>
                    <p style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--th-text-1)", marginBottom: "4px" }}>No risks flagged</p>
                    <p style={{ fontSize: "0.72rem", color: "var(--th-text-3)", margin: 0 }}>
                      AI analysis found no risk issues in this clause.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {clause.linkedRisks.map((risk) => {
                      const rs = SEV[normalizeSeverity(risk.severity)];
                      return (
                        <motion.div
                          key={risk.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25 }}
                          style={{
                            padding:             "14px 16px",
                            borderRadius:        "12px",
                            background:          "var(--th-card-bg)",
                            border:              "1px solid var(--th-card-border)",
                            backdropFilter:      "blur(12px)",
                            WebkitBackdropFilter:"blur(12px)",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: risk.explanation ? "10px" : 0 }}>
                            <div
                              style={{
                                width:          "26px",
                                height:         "26px",
                                borderRadius:   "8px",
                                background:     rs.bg,
                                border:         `1px solid ${rs.border}`,
                                display:        "flex",
                                alignItems:     "center",
                                justifyContent: "center",
                                flexShrink:     0,
                                marginTop:      "1px",
                              }}
                            >
                              <AlertTriangle size={12} style={{ color: rs.color }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "7px", flexWrap: "wrap", marginBottom: "4px" }}>
                                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--th-text-1)" }}>{risk.title}</span>
                                <span
                                  style={{
                                    fontSize:      "0.6rem",
                                    padding:       "1px 7px",
                                    borderRadius:  "999px",
                                    background:    rs.bg,
                                    border:        `1px solid ${rs.border}`,
                                    color:         rs.color,
                                    fontWeight:    600,
                                    textTransform: "capitalize",
                                  }}
                                >
                                  {risk.severity}
                                </span>
                              </div>
                              {risk.explanation && (
                                <p style={{ fontSize: "0.75rem", color: "var(--th-text-3)", lineHeight: 1.6, margin: 0 }}>
                                  {risk.explanation}
                                </p>
                              )}
                            </div>
                          </div>

                          {risk.suggested_action && (
                            <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid var(--th-divider)" }}>
                              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                                <div
                                  style={{
                                    width:          "20px",
                                    height:         "20px",
                                    borderRadius:   "6px",
                                    background:     "rgba(59,130,246,0.1)",
                                    border:         "1px solid rgba(59,130,246,0.18)",
                                    display:        "flex",
                                    alignItems:     "center",
                                    justifyContent: "center",
                                    flexShrink:     0,
                                    marginTop:      "2px",
                                  }}
                                >
                                  <Sparkles size={10} style={{ color: "#60a5fa" }} />
                                </div>
                                <p style={{ fontSize: "0.75rem", color: "var(--th-text-2)", lineHeight: 1.6, margin: 0 }}>
                                  <span style={{ fontWeight: 600, color: "#60a5fa" }}>Recommendation: </span>
                                  {risk.suggested_action}
                                </p>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Landing / empty states ─────────────────────────────────────── */
function LandingState() {
  const FEATURES = [
    { icon: ScanText, title: "Clause-by-Clause Analysis", desc: "Browse every clause extracted from your contract with AI-powered categorization.", color: "#3b82f6", bg: "rgba(59,130,246,0.1)",  border: "rgba(59,130,246,0.18)" },
    { icon: Shield,   title: "Risk Identification",        desc: "See which clauses carry legal risk and understand what actions to take.",          color: "#f87171", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.18)"  },
    { icon: Sparkles, title: "AI Recommendations",         desc: "Get specific, actionable AI suggestions for each identified risk.",                 color: "#a78bfa", bg: "rgba(139,92,246,0.1)", border: "rgba(139,92,246,0.18)" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        style={{
          ...CARD,
          padding:       "52px 40px",
          textAlign:     "center",
          display:       "flex",
          flexDirection: "column",
          alignItems:    "center",
        }}
      >
        <div
          style={{
            width:          "52px",
            height:         "52px",
            borderRadius:   "16px",
            background:     "rgba(59,130,246,0.1)",
            border:         "1px solid rgba(59,130,246,0.2)",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            marginBottom:   "18px",
            boxShadow:      "0 0 24px rgba(59,130,246,0.12)",
          }}
        >
          <BookOpen size={22} style={{ color: "#60a5fa" }} />
        </div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--th-text-1)", marginBottom: "8px" }}>
          Explore Contract Clauses
        </h2>
        <p style={{ fontSize: "0.83rem", color: "var(--th-text-3)", maxWidth: "460px", lineHeight: 1.65, marginBottom: "36px" }}>
          Select a contract above to view and analyze its extracted clauses.
          Filter by category, identify risks, and read AI recommendations.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", width: "100%", maxWidth: "680px" }}>
          {FEATURES.map(({ icon: Icon, title, desc, color, bg, border }) => (
            <div
              key={title}
              style={{
                padding:      "18px 16px",
                borderRadius: "14px",
                background:   "var(--th-subtle-bg)",
                border:       "1px solid var(--th-tag-border)",
                textAlign:    "left",
              }}
            >
              <div
                style={{
                  width:          "32px",
                  height:         "32px",
                  borderRadius:   "9px",
                  background:     bg,
                  border:         `1px solid ${border}`,
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  marginBottom:   "12px",
                }}
              >
                <Icon size={14} style={{ color }} />
              </div>
              <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--th-text-1)", marginBottom: "5px" }}>{title}</p>
              <p style={{ fontSize: "0.71rem", color: "var(--th-text-4)", lineHeight: 1.6, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Shows when the selected contract has no clauses — smart about why.
function NoClausesState({
  contract,
  onAnalyze,
  analyzing,
}: {
  contract:  Contract;
  onAnalyze: () => void;
  analyzing: boolean;
}) {
  // "completed" or "analyzed" = analysis ran; clauses weren't created or were lost.
  // Any other status = hasn't been fully processed yet.
  const alreadyAnalyzed = ["completed", "analyzed"].includes(contract.status);

  return (
    <div
      style={{
        ...CARD,
        padding:       "56px 40px",
        textAlign:     "center",
        display:       "flex",
        flexDirection: "column",
        alignItems:    "center",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width:          "48px",
          height:         "48px",
          borderRadius:   "14px",
          background:     analyzing ? "rgba(59,130,246,0.08)" : "var(--th-subtle-bg)",
          border:         analyzing ? "1px solid rgba(59,130,246,0.2)" : "1px solid var(--th-tag-border)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          marginBottom:   "18px",
          boxShadow:      analyzing ? "0 0 20px rgba(59,130,246,0.08)" : "none",
        }}
      >
        <Layers size={20} style={{ color: analyzing ? "#60a5fa" : "var(--th-text-3)" }} />
      </div>

      <p style={{ fontSize: "1.0rem", fontWeight: 600, color: "var(--th-text-1)", marginBottom: "8px" }}>
        {analyzing ? "Extracting clauses…" : "No clauses found"}
      </p>

      {analyzing ? (
        <p style={{ fontSize: "0.8rem", color: "var(--th-text-3)", maxWidth: "400px", lineHeight: 1.7, margin: 0 }}>
          AI is extracting and categorizing clauses from{" "}
          <strong style={{ color: "var(--th-text-2)" }}>{contract.title}</strong>.
          This takes 30–90 seconds. The page will update when ready.
        </p>
      ) : (
        <>
          <p style={{ fontSize: "0.8rem", color: "var(--th-text-3)", maxWidth: "440px", lineHeight: 1.7, marginBottom: "24px" }}>
            {alreadyAnalyzed
              ? <>
                  <strong style={{ color: "var(--th-text-2)" }}>{contract.title}</strong> has been analyzed
                  but clauses need to be re-extracted. Run analysis to rebuild the clause library from the stored contract text.
                </>
              : <>
                  <strong style={{ color: "var(--th-text-2)" }}>{contract.title}</strong> hasn&apos;t been
                  fully processed yet. Run AI analysis to extract clauses, identify risks, and populate the clause library.
                </>
            }
          </p>
          <button
            onClick={onAnalyze}
            style={{
              display:      "flex",
              alignItems:   "center",
              gap:          "8px",
              padding:      "11px 24px",
              borderRadius: "12px",
              fontSize:     "0.84rem",
              fontWeight:   600,
              background:   "rgba(59,130,246,0.12)",
              border:       "1px solid rgba(59,130,246,0.28)",
              color:        "#60a5fa",
              cursor:       "pointer",
              transition:   "all 0.15s",
              boxShadow:    "0 2px 12px rgba(59,130,246,0.08)",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "rgba(59,130,246,0.18)";
              el.style.borderColor = "rgba(59,130,246,0.4)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "rgba(59,130,246,0.12)";
              el.style.borderColor = "rgba(59,130,246,0.28)";
            }}
          >
            <Play size={13} />
            {alreadyAnalyzed ? "Re-extract Clauses" : "Run AI Analysis"}
          </button>
          <p style={{ fontSize: "0.68rem", color: "var(--th-text-5)", marginTop: "12px" }}>
            Extracts clauses · identifies risks · generates insights
          </p>
        </>
      )}
    </div>
  );
}

function FilteredEmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div style={{ ...CARD, padding: "40px 32px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div
        style={{
          width:          "38px",
          height:         "38px",
          borderRadius:   "11px",
          background:     "var(--th-subtle-bg)",
          border:         "1px solid var(--th-tag-border)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          marginBottom:   "12px",
        }}
      >
        <Search size={16} style={{ color: "var(--th-text-3)" }} />
      </div>
      <p style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--th-text-1)", marginBottom: "5px" }}>No clauses match</p>
      <p style={{ fontSize: "0.75rem", color: "var(--th-text-3)", marginBottom: "16px" }}>Try adjusting your search or filters.</p>
      <button
        onClick={onClear}
        style={{
          padding:      "7px 16px",
          borderRadius: "9px",
          fontSize:     "0.78rem",
          fontWeight:   500,
          background:   "rgba(59,130,246,0.1)",
          border:       "1px solid rgba(59,130,246,0.22)",
          color:        "#60a5fa",
          cursor:       "pointer",
          transition:   "opacity 0.15s",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.75")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
      >
        Clear filters
      </button>
    </div>
  );
}

/* ─── Skeleton grid ──────────────────────────────────────────────── */
function ClauseSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          style={{
            borderRadius:  "16px",
            padding:       "18px 20px",
            background:    "var(--th-card-bg)",
            border:        "1px solid var(--th-card-border)",
            boxShadow:     "var(--th-card-shadow)",
            display:       "flex",
            flexDirection: "column",
            gap:           "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div className="skeleton h-4 w-20 rounded" />
            <div className="skeleton h-4 w-16 rounded" />
          </div>
          <div className="skeleton h-4 w-4/5 rounded" />
          <div className="skeleton h-3 w-full rounded" />
          <div className="skeleton h-3 w-4/5 rounded" />
          <div className="skeleton h-3 w-3/5 rounded" />
          <div style={{ paddingTop: "10px", borderTop: "1px solid var(--th-divider)" }}>
            <div className="skeleton h-3 w-24 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function ClauseLibraryPage() {
  /* Contract list */
  const [contracts, setContracts]               = useState<Contract[]>([]);
  const [contractsLoading, setContractsLoading] = useState(true);

  /* Selected contract + its full detail */
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [contractDetail, setContractDetail]     = useState<ContractDetail | null>(null);
  const [contractLoading, setContractLoading]   = useState(false);
  const [contractError, setContractError]       = useState("");

  /* Analysis */
  const [analyzing, setAnalyzing] = useState(false);

  /* Filters */
  const [search, setSearch]                 = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [riskFilter, setRiskFilter]         = useState("all");

  /* Drawer */
  const [drawerClause, setDrawerClause] = useState<EnrichedClause | null>(null);

  /* Load contracts list on mount */
  useEffect(() => {
    api
      .contracts()
      .then((list) => setContracts(list))
      .catch(() => undefined)
      .finally(() => setContractsLoading(false));
  }, []);

  /* Load a contract's full detail (clauses + risks) */
  const loadContract = useCallback(async (c: Contract) => {
    setSelectedContract(c);
    setContractDetail(null);
    setContractError("");
    setSearch("");
    setCategoryFilter("all");
    setRiskFilter("all");
    setDrawerClause(null);
    setAnalyzing(false);
    setContractLoading(true);
    try {
      const detail = await api.contract(c.id);
      setContractDetail(detail);
    } catch (err: unknown) {
      setContractError(err instanceof Error ? err.message : "Failed to load contract");
    } finally {
      setContractLoading(false);
    }
  }, []);

  const clearContract = useCallback(() => {
    setSelectedContract(null);
    setContractDetail(null);
    setContractError("");
    setSearch("");
    setCategoryFilter("all");
    setRiskFilter("all");
    setDrawerClause(null);
    setAnalyzing(false);
  }, []);

  /* Trigger analysis and auto-reload after 12 s (analysis is a background task) */
  const handleAnalyze = useCallback(async () => {
    if (!selectedContract || analyzing) return;
    const snapshot = selectedContract;
    setAnalyzing(true);
    try {
      await api.analyze(snapshot.id);
      setTimeout(() => loadContract(snapshot), 12000);
    } catch {
      setAnalyzing(false);
    }
  }, [selectedContract, analyzing, loadContract]);

  /* Enrich clauses: link risks + compute displayCategory */
  const enrichedClauses = useMemo<EnrichedClause[]>(() => {
    if (!contractDetail) return [];
    return contractDetail.clauses.map((clause) => {
      const linked = contractDetail.risks.filter((r) => r.clause_id === clause.id);
      return {
        ...clause,
        linkedRisks:     linked,
        highestSeverity: computeHighestSeverity(linked),
        // Use backend-set category when available, otherwise infer from heading/text.
        // The backend now populates category for new analyses; this covers existing data.
        displayCategory: clause.category ?? deriveCategory(clause.heading, clause.text),
      };
    });
  }, [contractDetail]);

  /* Unique sorted categories from this contract's clauses */
  const categories = useMemo(
    () => [...new Set(enrichedClauses.map((c) => c.displayCategory))].sort(),
    [enrichedClauses],
  );

  /* Per-category clause counts (for chip badges) */
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of enrichedClauses) {
      counts[c.displayCategory] = (counts[c.displayCategory] ?? 0) + 1;
    }
    return counts;
  }, [enrichedClauses]);

  /* Apply search + category + risk filters */
  const filteredClauses = useMemo(() => {
    let result = enrichedClauses;

    if (categoryFilter !== "all") {
      result = result.filter((c) => c.displayCategory === categoryFilter);
    }
    if (riskFilter !== "all") {
      result = result.filter((c) => c.highestSeverity === riskFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.heading?.toLowerCase().includes(q) ||
          c.text.toLowerCase().includes(q)      ||
          c.displayCategory.toLowerCase().includes(q),
      );
    }

    return result;
  }, [enrichedClauses, categoryFilter, riskFilter, search]);

  /* Aggregate stats passed to ContractPicker */
  const totalRisks    = contractDetail?.risks.length ?? 0;
  const highRiskCount = enrichedClauses.filter((c) => c.highestSeverity === "high").length;

  const clearFilters = useCallback(() => {
    setSearch("");
    setCategoryFilter("all");
    setRiskFilter("all");
  }, []);

  const hasActiveFilters = search.trim() !== "" || categoryFilter !== "all" || riskFilter !== "all";

  return (
    <AppShell>
      {/* Ambient glow */}
      <div
        style={{
          position:     "fixed",
          top:          0,
          right:        0,
          width:        "600px",
          height:       "500px",
          background:   "radial-gradient(ellipse at 80% -10%, rgba(59,130,246,0.05) 0%, transparent 60%)",
          pointerEvents:"none",
          zIndex:       0,
        }}
      />

      <div
        style={{
          maxWidth:      "1280px",
          margin:        "0 auto",
          padding:       "44px 48px",
          position:      "relative",
          zIndex:        1,
          display:       "flex",
          flexDirection: "column",
          gap:           "18px",
        }}
      >
        {/* Page header */}
        <FadeUp>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "16px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <div
                  style={{
                    width:          "32px",
                    height:         "32px",
                    borderRadius:   "9px",
                    background:     "rgba(59,130,246,0.1)",
                    border:         "1px solid rgba(59,130,246,0.18)",
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                  }}
                >
                  <BookOpen size={14} style={{ color: "#60a5fa" }} />
                </div>
                <h1 style={{ fontSize: "1.65rem", fontWeight: 700, color: "var(--th-text-1)", letterSpacing: "-0.02em", margin: 0 }}>
                  Clause Library
                </h1>
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--th-text-3)", paddingLeft: "42px" }}>
                Select a contract to explore, filter, and analyze its extracted clauses
              </p>
            </div>
            {selectedContract && (
              <Link
                href={`/contract-review/${selectedContract.id}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "9px 15px",
                  borderRadius: "10px",
                  background: "rgba(59,130,246,0.10)",
                  border: "1px solid rgba(59,130,246,0.24)",
                  color: "#60a5fa",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  flexShrink: 0,
                }}
              >
                <ScanText size={13} />
                Review Contract
              </Link>
            )}
          </div>
        </FadeUp>

        {/* Contract selector */}
        <FadeUp delay={0.05}>
          <ContractPicker
            contracts={contracts}
            contractsLoading={contractsLoading}
            selected={selectedContract}
            onSelect={loadContract}
            onClear={clearContract}
            contractLoading={contractLoading}
            clauseCount={enrichedClauses.length}
            riskCount={totalRisks}
            highRiskCount={highRiskCount}
          />
        </FadeUp>

        {/* Error banner */}
        {contractError && (
          <div
            style={{
              display:      "flex",
              alignItems:   "center",
              gap:          "10px",
              padding:      "12px 18px",
              borderRadius: "12px",
              background:   "rgba(239,68,68,0.07)",
              border:       "1px solid rgba(239,68,68,0.16)",
              color:        "#f87171",
              fontSize:     "0.82rem",
            }}
          >
            <AlertCircle size={13} style={{ flexShrink: 0 }} />
            {contractError}
          </div>
        )}

        {/* Landing state (no contract selected) */}
        {!selectedContract && !contractsLoading && (
          <FadeUp delay={0.1}>
            <LandingState />
          </FadeUp>
        )}

        {/* Loading skeleton */}
        {contractLoading && (
          <FadeUp delay={0.08}>
            <ClauseSkeleton />
          </FadeUp>
        )}

        {/* Contract content */}
        {selectedContract && !contractLoading && contractDetail && (
          <>
            {/* Filter bar — only shown when clauses exist */}
            {enrichedClauses.length > 0 && (
              <FadeUp delay={0.06}>
                <FilterBar
                  search={search}
                  onSearchChange={setSearch}
                  categories={categories}
                  categoryCounts={categoryCounts}
                  activeCategory={categoryFilter}
                  onCategoryChange={setCategoryFilter}
                  activeRisk={riskFilter}
                  onRiskChange={setRiskFilter}
                  totalCount={enrichedClauses.length}
                />
              </FadeUp>
            )}

            {/* Clause grid or empty state */}
            <FadeUp delay={0.1}>
              {enrichedClauses.length === 0 ? (
                <NoClausesState
                  contract={selectedContract}
                  onAnalyze={handleAnalyze}
                  analyzing={analyzing}
                />
              ) : filteredClauses.length === 0 ? (
                <FilteredEmptyState onClear={clearFilters} />
              ) : (
                <div
                  style={{
                    display:             "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                    gap:                 "14px",
                  }}
                >
                  {filteredClauses.map((clause) => (
                    <ClauseCard
                      key={clause.id}
                      clause={clause}
                      onClick={() => setDrawerClause(clause)}
                    />
                  ))}
                </div>
              )}
            </FadeUp>

            {/* Results count footer */}
            {enrichedClauses.length > 0 && filteredClauses.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", paddingTop: "4px" }}>
                <div style={{ height: "1px", flex: 1, background: "var(--th-divider)" }} />
                <p style={{ fontSize: "0.71rem", color: "var(--th-text-5)", whiteSpace: "nowrap" }}>
                  {hasActiveFilters
                    ? `${filteredClauses.length} of ${enrichedClauses.length} clauses`
                    : `${enrichedClauses.length} clause${enrichedClauses.length !== 1 ? "s" : ""} in this contract`}
                </p>
                <div style={{ height: "1px", flex: 1, background: "var(--th-divider)" }} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Clause detail drawer — fixed overlay, independent of page scroll */}
      <ClauseDrawer
        clause={drawerClause}
        contractTitle={selectedContract?.title ?? ""}
        onClose={() => setDrawerClause(null)}
      />
    </AppShell>
  );
}