"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  FileText,
  Users,
  ShieldAlert,
  ClipboardList,
  BookOpen,
  CalendarDays,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Building2,
  UserCheck,
  Calendar,
  Upload,
  FileSearch,
  Activity,
  Layers,
  RefreshCw,
  TrendingUp,
  Scale,
  Sparkles,
  Info,
  Tag,
  Timer,
  Hash,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MetricCard from "@/components/ui/MetricCard";
import RiskBadge from "@/components/ui/RiskBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import { api, Contract, ContractDetail, Risk, Obligation, Clause } from "@/services/api";

/* ─── Shared card style (matches risks page) ─────────────────────── */
const CARD: React.CSSProperties = {
  background: "rgba(10, 20, 38, 0.65)",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
  borderRadius: "20px",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  overflow: "hidden",
};

const DIVIDER: React.CSSProperties = {
  borderBottom: "1px solid rgba(255,255,255,0.05)",
};

/* ─── Section header inside a card ──────────────────────────────────── */
function CardHeader({
  icon: Icon,
  title,
  iconColor,
  iconBg,
  count,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  title: string;
  iconColor: string;
  iconBg: string;
  count?: number | string;
}) {
  return (
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
          background: iconBg,
          border: `1px solid ${iconColor}25`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={13} style={{ color: iconColor }} />
      </div>
      <span style={{ flex: 1, fontSize: "0.875rem", fontWeight: 600, color: "#f1f5f9" }}>
        {title}
      </span>
      {count !== undefined && (
        <span
          style={{
            fontSize: "0.72rem",
            fontWeight: 500,
            color: "#475569",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "999px",
            padding: "2px 10px",
          }}
        >
          {count}
        </span>
      )}
    </div>
  );
}

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

/* ─── Helpers ────────────────────────────────────────────────────── */
function contractDisplayName(c: Contract): string {
  if (c.title && c.title.length <= 38) return c.title;
  if (c.title) return c.title.slice(0, 36) + "…";
  if (c.file_name) return c.file_name;
  return `CTR-${String(c.id).padStart(4, "0")}`;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Not detected";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "Not detected";
  }
}

function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function getContractDuration(
  effectiveDate: string | null | undefined,
  expirationDate: string | null | undefined
): string {
  if (!effectiveDate || !expirationDate) return "Not detected";
  try {
    const start = new Date(effectiveDate);
    const end = new Date(expirationDate);
    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return "Expired";
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days < 30) return `${days} day${days !== 1 ? "s" : ""}`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months !== 1 ? "s" : ""}`;
    const years = Math.floor(months / 12);
    const remMonths = months % 12;
    if (remMonths === 0) return `${years} year${years !== 1 ? "s" : ""}`;
    return `${years} yr${years !== 1 ? "s" : ""}, ${remMonths} mo`;
  } catch {
    return "Not detected";
  }
}

function getDaysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  try {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

function calculateRiskScore(risks: Risk[]): number {
  if (risks.length === 0) return 0;
  const weights: Record<string, number> = { critical: 100, high: 75, medium: 45, moderate: 45, low: 15 };
  const total = risks.reduce((sum, r) => sum + (weights[r.severity?.toLowerCase()] ?? 30), 0);
  return Math.min(100, Math.round(total / risks.length));
}

function riskScoreLabel(score: number): { label: string; color: string; bg: string; border: string } {
  if (score >= 70) return { label: "High Risk", color: "#f87171", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)" };
  if (score >= 40) return { label: "Moderate Risk", color: "#fbbf24", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)" };
  return { label: "Low Risk", color: "#34d399", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)" };
}

function isOverdue(dueDate: string | null | undefined): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function isUpcoming(dueDate: string | null | undefined): boolean {
  if (!dueDate) return false;
  const d = new Date(dueDate);
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return d > now && d <= in30;
}

function nearestFutureDeadline(obligations: Obligation[]): string | null {
  const future = obligations
    .filter((ob) => ob.due_date && !isOverdue(ob.due_date))
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());
  return future[0]?.due_date ?? null;
}

const CLIENT_KEYWORDS = ["client", "customer", "buyer", "purchaser", "lessee", "licensee"];
const PROVIDER_KEYWORDS = ["provider", "vendor", "supplier", "seller", "contractor", "lessor", "licensor", "service provider"];

/* ─── Party extraction from contract text ──────────────────────────
 * PartyInfo carries the actual company name (extracted from text) alongside
 * the role label found in the contract and a confidence level.
 * ────────────────────────────────────────────────────────────────── */
type PartyInfo = {
  name: string;
  roleLabel: string;
  confidence: "high" | "medium" | "low";
};

/* Sets used ONLY inside text-extraction logic (not for obligation counts). */
const _CLIENT_ROLES = [
  "client", "customer", "buyer", "purchaser", "subscriber",
  "licensee", "lessee", "end user",
];
const _PROVIDER_ROLES = [
  "provider", "vendor", "supplier", "seller", "contractor",
  "licensor", "lessor", "service provider", "developer", "consultant",
];

function _classifyRole(label: string): "client" | "provider" | null {
  const l = label.toLowerCase().trim();
  if (_CLIENT_ROLES.some((r) => l.includes(r))) return "client";
  if (_PROVIDER_ROLES.some((r) => l.includes(r))) return "provider";
  return null;
}

/**
 * Extract actual party names from contract text using four progressive patterns.
 *
 * Pattern 1 (high):   CompanyName ("Role") / CompanyName (the "Role")
 * Pattern 2 (high):   CompanyName, hereinafter referred to as "Role"
 * Pattern 3 (high):   CompanyName (hereinafter "Role") / (hereinafter the "Role")
 * Pattern 4 (medium): Role: CompanyName  — table / schedule format
 */
function _extractPartiesFromText(text: string): PartyInfo[] {
  if (!text || text.length < 20) return [];

  const results: PartyInfo[] = [];
  const seen = new Set<string>();

  function add(rawName: string, roleLabel: string, confidence: PartyInfo["confidence"]) {
    const name = rawName.trim().replace(/\s+/g, " ");
    if (name.length < 3 || name.length > 100) return;
    // Reject names that start with common non-entity words
    if (/^(?:this|the|a|an|each|any|all|such|either|both|said)\b/i.test(name)) return;
    // Reject raw role-only strings (offer nothing over the fallback)
    if (/^(?:client|provider|vendor|customer|buyer|seller|contractor|licensor|licensee)$/i.test(name)) return;
    const side = _classifyRole(roleLabel);
    if (!side) return;
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    results.push({ name, roleLabel: roleLabel.trim(), confidence });
  }

  // Pattern 1: Name ("Role") or Name (the "Role") — most common in commercial contracts
  const p1 = /([A-Z][A-Za-z0-9 &.,'·\-]*?)\s*\(\s*(?:the\s+)?["']([A-Za-z][A-Za-z ]{1,28})["']\s*\)/g;
  for (const m of text.matchAll(p1)) add(m[1], m[2], "high");

  // Pattern 2: Name, hereinafter referred to as "Role"
  const p2 = /([A-Z][A-Za-z0-9 &.,'·\-]+?)\s*,\s*hereinafter\s+(?:referred\s+to\s+as|called|known\s+as)\s+["']([A-Za-z][A-Za-z ]{1,28})["']/gi;
  for (const m of text.matchAll(p2)) add(m[1], m[2], "high");

  // Pattern 3: Name (hereinafter "Role") or (hereinafter the "Role")
  const p3 = /([A-Z][A-Za-z0-9 &.,'·\-]+?)\s*\(\s*hereinafter\s+(?:the\s+)?["']([A-Za-z][A-Za-z ]{1,28})["']\s*\)/gi;
  for (const m of text.matchAll(p3)) add(m[1], m[2], "high");

  // Pattern 4: Role: CompanyName  (party schedule / table format, start of line)
  const p4 = /^([A-Za-z ]{3,25})\s*:\s*([A-Z][A-Za-z0-9 &.,'·\-]+?)(?:[,\n]|$)/gm;
  for (const m of text.matchAll(p4)) {
    if (_classifyRole(m[1])) add(m[2], m[1].trim(), "medium");
  }

  return results;
}

/**
 * Primary party detection: parse actual company names from contract text.
 * Falls back to obligation owner labels when the text extraction yields nothing
 * (e.g., contract is not yet analyzed or text is unavailable).
 */
function extractPartiesFromContract(
  cleanedText: string | null | undefined,
  extractedText: string | null | undefined,
  obligations: Obligation[]
): { client: PartyInfo[]; provider: PartyInfo[]; other: PartyInfo[] } {
  const client: PartyInfo[] = [];
  const provider: PartyInfo[] = [];
  const other: PartyInfo[] = [];

  // ── Layer 1: contract text (most reliable — actual company names) ──
  const text = (cleanedText || extractedText || "").slice(0, 60_000);
  const fromText = _extractPartiesFromText(text);

  fromText.forEach((p) => {
    const side = _classifyRole(p.roleLabel);
    if (side === "client") client.push(p);
    else if (side === "provider") provider.push(p);
  });

  // ── Layer 2: obligation owners (fallback — used only when text extraction
  //            finds nothing, which happens when a contract hasn't been analyzed) ──
  if (client.length === 0 && provider.length === 0) {
    const seenObl = new Set<string>();
    obligations.forEach((ob) => {
      if (!ob.owner) return;
      const name = ob.owner.trim();
      if (!name || seenObl.has(name.toLowerCase())) return;
      seenObl.add(name.toLowerCase());
      const lp = name.toLowerCase();
      if (CLIENT_KEYWORDS.some((k) => lp.includes(k))) {
        client.push({ name, roleLabel: "Client", confidence: "low" });
      } else if (PROVIDER_KEYWORDS.some((k) => lp.includes(k))) {
        provider.push({ name, roleLabel: "Provider", confidence: "low" });
      } else if (name.length > 2) {
        other.push({ name, roleLabel: name, confidence: "low" });
      }
    });
  }

  return { client, provider, other };
}

function deriveClauseCategory(heading: string | null | undefined, text: string): string {
  const src = ((heading ?? "") + " " + text.slice(0, 200)).toLowerCase();
  if (/terminat|expir|cancell/.test(src))                                    return "Termination";
  if (/confidential|non[- ]?disclosure|proprietary/.test(src))               return "Confidentiality";
  if (/\bindemnif|\bliabilit/.test(src))                                     return "Liability";
  if (/\bpayment|\binvoice|\bfee\b|compensat|pric/.test(src))                return "Payment";
  if (/governing law|jurisdiction|arbitrat|dispute resol/.test(src))         return "Governing Law";
  if (/intellectual property|\bpatent\b|\bcopyright\b|trademark/.test(src))  return "IP";
  if (/force majeure/.test(src))                                              return "Force Majeure";
  if (/\bassign\b|\bsubcontract/.test(src))                                  return "Assignment";
  if (/\bdefini/.test(src))                                                   return "Definitions";
  if (/represent|warrant|covenant/.test(src))                                 return "Warranties";
  if (/\bnotice\b|\bnotif/.test(src))                                         return "Notices";
  if (/limitation of liability|limitation on damages/.test(src))             return "Limitation";
  return "General";
}

function getClauseCategories(clauses: Clause[]): Record<string, number> {
  const cats: Record<string, number> = {};
  clauses.forEach((c) => {
    const raw = c.category || deriveClauseCategory(c.heading, c.text);
    const normalized = raw.trim().length > 0 ? raw.trim() : "General";
    cats[normalized] = (cats[normalized] || 0) + 1;
  });
  return cats;
}

const CLAUSE_STYLE_MAP: Record<string, { color: string; bg: string }> = {
  liability:             { color: "#f87171", bg: "rgba(239,68,68,0.10)" },
  confidentiality:       { color: "#a78bfa", bg: "rgba(139,92,246,0.10)" },
  termination:           { color: "#fbbf24", bg: "rgba(245,158,11,0.10)" },
  payment:               { color: "#34d399", bg: "rgba(16,185,129,0.10)" },
  renewal:               { color: "#60a5fa", bg: "rgba(59,130,246,0.10)" },
  compliance:            { color: "#fb923c", bg: "rgba(249,115,22,0.10)" },
  data:                  { color: "#22d3ee", bg: "rgba(34,211,238,0.10)" },
  intellectual:          { color: "#e879f9", bg: "rgba(232,121,249,0.10)" },
  indemnification:       { color: "#f87171", bg: "rgba(239,68,68,0.08)" },
  dispute:               { color: "#94a3b8", bg: "rgba(148,163,184,0.10)" },
  general:               { color: "#818cf8", bg: "rgba(99,102,241,0.10)" },
};

function getClauseStyle(category: string): { color: string; bg: string } {
  const lc = category.toLowerCase();
  const match = Object.entries(CLAUSE_STYLE_MAP).find(([k]) => lc.includes(k));
  return match ? match[1] : { color: "#818cf8", bg: "rgba(99,102,241,0.08)" };
}

function inferContractType(title: string): string {
  if (!title) return "Not detected";
  const t = title.toLowerCase();
  if (t.includes("nda") || t.includes("non-disclosure") || t.includes("confidential")) return "Non-Disclosure Agreement";
  if (t.includes("service") && t.includes("agreement")) return "Service Agreement";
  if (t.includes("employment")) return "Employment Agreement";
  if (t.includes("lease") || t.includes("rental")) return "Lease Agreement";
  if (t.includes("purchase") || t.includes("sale")) return "Purchase Agreement";
  if (t.includes("license") || t.includes("licence")) return "License Agreement";
  if (t.includes("partnership")) return "Partnership Agreement";
  if (t.includes("consulting")) return "Consulting Agreement";
  if (t.includes("supply") || t.includes("vendor")) return "Vendor Agreement";
  if (t.includes("maintenance")) return "Maintenance Agreement";
  if (t.includes("distribution")) return "Distribution Agreement";
  return "Not detected";
}

/* ─── Contract Selector (required selection — no "All" option) ───── */
function ContractSelector({
  contracts,
  selectedId,
  onChange,
  loading,
}: {
  contracts: Contract[];
  selectedId: number | null;
  onChange: (id: number) => void;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = selectedId != null ? contracts.find((c) => c.id === selectedId) : null;
  const label = selected ? contractDisplayName(selected) : "Select a contract…";

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
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "9px 16px",
          borderRadius: "12px",
          background: selectedId != null ? "rgba(59,130,246,0.09)" : "rgba(255,255,255,0.04)",
          border: selectedId != null ? "1px solid rgba(59,130,246,0.28)" : "1px solid rgba(255,255,255,0.10)",
          color: selectedId != null ? "#60a5fa" : "#94a3b8",
          fontSize: "0.82rem",
          fontWeight: 500,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.55 : 1,
          minWidth: "260px",
          maxWidth: "360px",
          transition: "all 0.15s ease",
        }}
      >
        <FileSearch size={13} style={{ flexShrink: 0 }} />
        <span
          style={{
            flex: 1,
            textAlign: "left",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
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
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              minWidth: "300px",
              maxWidth: "400px",
              background: "rgba(8,16,32,0.98)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: "14px",
              boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
              zIndex: 1200,
              overflow: "hidden",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
            }}
          >
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {contracts.length === 0 ? (
                <p
                  style={{
                    padding: "20px 16px",
                    fontSize: "0.76rem",
                    color: "#334155",
                    textAlign: "center",
                  }}
                >
                  No contracts available
                </p>
              ) : (
                contracts.map((c) => {
                  const isSelected = selectedId === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        onChange(c.id);
                        setOpen(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        width: "100%",
                        padding: "11px 16px",
                        background: isSelected ? "rgba(59,130,246,0.09)" : "transparent",
                        border: "none",
                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                        color: isSelected ? "#60a5fa" : "#94a3b8",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.12s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected)
                          (e.currentTarget as HTMLElement).style.background =
                            "rgba(255,255,255,0.03)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected)
                          (e.currentTarget as HTMLElement).style.background = "transparent";
                      }}
                    >
                      <div
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          background: isSelected ? "#60a5fa" : "#334155",
                          flexShrink: 0,
                          marginTop: "5px",
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontWeight: 500,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            marginBottom: "2px",
                          }}
                        >
                          {contractDisplayName(c)}
                        </p>
                        <p
                          style={{
                            fontSize: "0.67rem",
                            color: "#334155",
                            fontFamily: "var(--font-mono,monospace)",
                          }}
                        >
                          CTR-{String(c.id).padStart(4, "0")} · {c.status}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Skeleton loader ────────────────────────────────────────────── */
function SkeletonCard({ height = 180 }: { height?: number }) {
  return (
    <div
      style={{
        ...CARD,
        height,
        background: "rgba(10,20,38,0.4)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "24px",
      }}
    >
      <div className="skeleton h-5 w-40 rounded-lg" />
      <div className="skeleton h-3 w-full rounded" />
      <div className="skeleton h-3 w-4/5 rounded" />
      <div className="skeleton h-3 w-3/5 rounded" />
    </div>
  );
}

/* ─── Info row (label + value) ───────────────────────────────────── */
function InfoRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: React.ReactNode;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "5px",
        padding: "16px 20px",
        borderRadius: "13px",
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <p
        style={{
          fontSize: "0.6rem",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#475569",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: "0.85rem",
          fontWeight: 500,
          color: valueColor ?? "#e2e8f0",
          lineHeight: 1.4,
        }}
      >
        {value}
      </p>
    </div>
  );
}

/* ─── Date card ──────────────────────────────────────────────────── */
function DateRow({
  icon: Icon,
  label,
  date,
  accent,
  tag,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  label: string;
  date: string | null | undefined;
  accent: string;
  tag?: string;
}) {
  const daysUntil = getDaysUntil(date);
  const expired = daysUntil !== null && daysUntil < 0;
  const urgent = daysUntil !== null && daysUntil >= 0 && daysUntil <= 30;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "14px 16px",
        borderRadius: "12px",
        background: urgent
          ? "rgba(245,158,11,0.05)"
          : expired
          ? "rgba(239,68,68,0.04)"
          : "rgba(255,255,255,0.025)",
        border: urgent
          ? "1px solid rgba(245,158,11,0.14)"
          : expired
          ? "1px solid rgba(239,68,68,0.14)"
          : "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "9px",
          background: `${accent}15`,
          border: `1px solid ${accent}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: "1px",
        }}
      >
        <Icon size={12} style={{ color: accent }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: "0.62rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#475569",
            marginBottom: "3px",
          }}
        >
          {label}
        </p>
        {date ? (
          <p
            style={{
              fontSize: "0.82rem",
              fontWeight: 500,
              color: expired ? "#f87171" : urgent ? "#fbbf24" : "#e2e8f0",
            }}
          >
            {formatDateShort(date)}
          </p>
        ) : (
          <p style={{ fontSize: "0.82rem", color: "#334155", fontStyle: "italic" }}>
            Not detected
          </p>
        )}
        {daysUntil !== null && date && (
          <p
            style={{
              fontSize: "0.67rem",
              color: expired ? "#f87171" : urgent ? "#fbbf24" : "#475569",
              marginTop: "2px",
            }}
          >
            {expired
              ? `${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? "s" : ""} ago`
              : daysUntil === 0
              ? "Today"
              : `In ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`}
          </p>
        )}
        {tag && (
          <span
            style={{
              display: "inline-block",
              marginTop: "4px",
              fontSize: "0.6rem",
              fontWeight: 600,
              color: accent,
              background: `${accent}12`,
              border: `1px solid ${accent}25`,
              borderRadius: "5px",
              padding: "1px 7px",
              letterSpacing: "0.06em",
            }}
          >
            {tag}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────── */
export default function ContractOverviewPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ContractDetail | null>(null);
  const [contractsLoading, setContractsLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  /* Load contracts list on mount */
  useEffect(() => {
    api
      .contracts()
      .then((cs) => {
        setContracts(cs);
        if (cs.length > 0) setSelectedId(cs[0].id);
      })
      .catch((e) => setError(e.message))
      .finally(() => setContractsLoading(false));
  }, []);

  /* Load contract detail when selection changes */
  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    setError("");
    api
      .contract(selectedId)
      .then(setDetail)
      .catch((e) => setError(e.message))
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  /* ── Derived values ── */
  const risks = detail?.risks ?? [];
  const obligations = detail?.obligations ?? [];
  const clauses = detail?.clauses ?? [];
  const cleanedText = detail?.cleaned_text ?? null;
  const extractedText = detail?.extracted_text ?? null;

  const riskScore = useMemo(() => calculateRiskScore(risks), [risks]);
  const riskScoreInfo = useMemo(() => riskScoreLabel(riskScore), [riskScore]);

  const highRisks = useMemo(
    () => risks.filter((r) => ["high", "critical"].includes(r.severity?.toLowerCase())),
    [risks]
  );

  const topRisks = useMemo(
    () =>
      [...risks]
        .sort((a, b) => {
          const ord: Record<string, number> = { critical: 0, high: 1, medium: 2, moderate: 2, low: 3 };
          return (ord[a.severity?.toLowerCase()] ?? 3) - (ord[b.severity?.toLowerCase()] ?? 3);
        })
        .slice(0, 5),
    [risks]
  );

  const overdueObs = useMemo(() => obligations.filter((ob) => isOverdue(ob.due_date)), [obligations]);
  const upcomingObs = useMemo(() => obligations.filter((ob) => isUpcoming(ob.due_date)), [obligations]);
  const parties = useMemo(
    () => extractPartiesFromContract(cleanedText, extractedText, obligations),
    [cleanedText, extractedText, obligations]
  );
  const clauseCategories = useMemo(() => getClauseCategories(clauses), [clauses]);
  const nearestDeadlineDate = useMemo(() => nearestFutureDeadline(obligations), [obligations]);

  const obsByOwner = useMemo(() => {
    const groups: Record<string, number> = {};
    obligations.forEach((ob) => {
      const key = ob.owner?.trim() || "Unassigned";
      groups[key] = (groups[key] || 0) + 1;
    });
    return groups;
  }, [obligations]);

  const hasRenewalRisk = useMemo(
    () => risks.some((r) => r.risk_type?.toLowerCase().includes("renewal")),
    [risks]
  );

  const contractType = useMemo(
    () => (detail ? inferContractType(detail.title) : "Not detected"),
    [detail]
  );

  const renewalRisk = useMemo(
    () => risks.find((r) => r.risk_type?.toLowerCase().includes("renewal")),
    [risks]
  );

  const sortedClauseCategories = useMemo(
    () =>
      Object.entries(clauseCategories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12),
    [clauseCategories]
  );

  /* ── Obligation party breakdown ── */
  const clientObsCount = useMemo(
    () =>
      obligations.filter((ob) => {
        const lp = (ob.owner ?? "").toLowerCase();
        return CLIENT_KEYWORDS.some((k) => lp.includes(k));
      }).length,
    [obligations]
  );
  const providerObsCount = useMemo(
    () =>
      obligations.filter((ob) => {
        const lp = (ob.owner ?? "").toLowerCase();
        return PROVIDER_KEYWORDS.some((k) => lp.includes(k));
      }).length,
    [obligations]
  );
  const sharedObsCount = useMemo(
    () =>
      obligations.filter((ob) => {
        const lp = (ob.owner ?? "").toLowerCase();
        return lp.includes("both") || lp.includes("mutual") || lp.includes("shared") || lp.includes("parties");
      }).length,
    [obligations]
  );
  const unassignedObsCount = useMemo(
    () => obligations.filter((ob) => !ob.owner || ob.owner.trim() === "").length,
    [obligations]
  );

  return (
    <AppShell>
      {/* Ambient glow */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "800px",
          height: "600px",
          background:
            "radial-gradient(ellipse at 70% -10%, rgba(59,130,246,0.07) 0%, transparent 60%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          maxWidth: "1380px",
          margin: "0 auto",
          padding: "48px 52px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* ── Page Header ── */}
        <div style={{ marginBottom: "40px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "3px",
                borderRadius: "999px",
                background: "linear-gradient(90deg, #3b82f6, #22d3ee)",
              }}
            />
            <span
              style={{
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#60a5fa",
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              Executive Summary
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                lineHeight: 1.15,
                background: "linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Contract Overview
            </h1>
          </div>

          <p style={{ fontSize: "0.85rem", color: "#475569", marginBottom: "24px", lineHeight: 1.6 }}>
            Centralized executive summary — every critical detail about the selected contract in one
            place.
          </p>

          {/* Contract selector row */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <ContractSelector
              contracts={contracts}
              selectedId={selectedId}
              onChange={setSelectedId}
              loading={contractsLoading}
            />
            {detail && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "4px 11px",
                  borderRadius: "999px",
                  background: "rgba(59,130,246,0.1)",
                  border: "1px solid rgba(59,130,246,0.25)",
                  color: "#60a5fa",
                }}
              >
                <span
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: "#60a5fa",
                    display: "inline-block",
                  }}
                />
                Contract Analysis
              </span>
            )}
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div
            style={{
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "14px 18px",
              borderRadius: "14px",
              fontSize: "0.82rem",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.20)",
              color: "#f87171",
            }}
          >
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* ── No contracts uploaded ── */}
        {!contractsLoading && contracts.length === 0 && (
          <FadeUp>
            <div
              style={{
                ...CARD,
                padding: "80px 40px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "20px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "20px",
                  background: "rgba(59,130,246,0.1)",
                  border: "1px solid rgba(59,130,246,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <LayoutGrid size={26} style={{ color: "#60a5fa", opacity: 0.7 }} />
              </div>
              <div>
                <p
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "#64748b",
                    marginBottom: "8px",
                  }}
                >
                  No Contracts Found
                </p>
                <p
                  style={{
                    fontSize: "0.82rem",
                    color: "#334155",
                    lineHeight: 1.65,
                    maxWidth: "340px",
                  }}
                >
                  Upload and analyze a contract to see its complete executive overview here.
                </p>
              </div>
              <Link
                href="/upload"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "9px 22px",
                  borderRadius: "11px",
                  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                  color: "#ffffff",
                  fontSize: "0.82rem",
                  fontWeight: 500,
                  textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
                }}
              >
                <Upload size={13} />
                Upload a Contract
              </Link>
            </div>
          </FadeUp>
        )}

        {/* ── Loading skeleton ── */}
        {detailLoading && selectedId && (
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            <SkeletonCard height={220} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "16px" }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <SkeletonCard key={i} height={140} />
              ))}
            </div>
            <SkeletonCard height={160} />
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <SkeletonCard height={260} />
                <SkeletonCard height={220} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <SkeletonCard height={240} />
                <SkeletonCard height={200} />
              </div>
            </div>
          </div>
        )}

        {/* ── Contract content ── */}
        {detail && !detailLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

            {/* ════════════════════════════════════════════════════════
                SECTION 1 — Contract Information
            ════════════════════════════════════════════════════════ */}
            <FadeUp delay={0}>
              <div style={CARD}>
                <CardHeader
                  icon={FileText}
                  title="Contract Information"
                  iconColor="#60a5fa"
                  iconBg="rgba(59,130,246,0.12)"
                />
                <div style={{ padding: "20px 24px" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                      gap: "12px",
                    }}
                  >
                    <InfoRow label="Contract Name" value={detail.title || "—"} />
                    <InfoRow label="Contract Type" value={contractType} valueColor={contractType !== "Not detected" ? "#a5b4fc" : undefined} />
                    <InfoRow
                      label="Current Status"
                      value={<StatusBadge status={detail.status} />}
                    />
                    <InfoRow
                      label="Effective Date"
                      value={formatDate(detail.effective_date)}
                      valueColor={detail.effective_date ? "#e2e8f0" : "#334155"}
                    />
                    <InfoRow
                      label="Expiration Date"
                      value={formatDate(detail.expiration_date)}
                      valueColor={detail.expiration_date ? "#e2e8f0" : "#334155"}
                    />
                    <InfoRow
                      label="Contract Duration"
                      value={getContractDuration(detail.effective_date, detail.expiration_date)}
                      valueColor={
                        detail.effective_date && detail.expiration_date ? "#a5f3fc" : undefined
                      }
                    />
                    <InfoRow
                      label="Notice Period"
                      value={
                        detail.notice_period_days
                          ? `${detail.notice_period_days} day${detail.notice_period_days !== 1 ? "s" : ""}`
                          : "Not detected"
                      }
                    />
                    <InfoRow
                      label="Auto Renewal"
                      value={
                        hasRenewalRisk ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              fontSize: "0.82rem",
                              color: "#fbbf24",
                            }}
                          >
                            <AlertCircle size={13} />
                            Detected — Review Required
                          </span>
                        ) : (
                          "Not detected"
                        )
                      }
                      valueColor={hasRenewalRisk ? "#fbbf24" : undefined}
                    />
                  </div>

                  {/* Parties inline summary */}
                  {(parties.client.length > 0 ||
                    parties.provider.length > 0 ||
                    parties.other.length > 0) && (
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "14px 18px",
                        borderRadius: "13px",
                        background: "rgba(99,102,241,0.05)",
                        border: "1px solid rgba(99,102,241,0.12)",
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <Users size={12} style={{ color: "#818cf8" }} />
                        <span
                          style={{
                            fontSize: "0.62rem",
                            fontWeight: 700,
                            color: "#818cf8",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                          }}
                        >
                          Parties Detected
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", flex: 1 }}>
                        {parties.client.map((p) => (
                          <span
                            key={p.name}
                            style={{
                              fontSize: "0.72rem",
                              color: "#60a5fa",
                              background: "rgba(59,130,246,0.08)",
                              border: "1px solid rgba(59,130,246,0.18)",
                              borderRadius: "6px",
                              padding: "3px 10px",
                              fontWeight: 500,
                              maxWidth: "300px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <span style={{ color: "#3b82f699", marginRight: "4px" }}>{p.roleLabel}:</span>
                            {p.name}
                          </span>
                        ))}
                        {parties.provider.map((p) => (
                          <span
                            key={p.name}
                            style={{
                              fontSize: "0.72rem",
                              color: "#34d399",
                              background: "rgba(16,185,129,0.08)",
                              border: "1px solid rgba(16,185,129,0.18)",
                              borderRadius: "6px",
                              padding: "3px 10px",
                              fontWeight: 500,
                              maxWidth: "300px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <span style={{ color: "#10b98199", marginRight: "4px" }}>{p.roleLabel}:</span>
                            {p.name}
                          </span>
                        ))}
                        {parties.other.map((p) => (
                          <span
                            key={p.name}
                            style={{
                              fontSize: "0.72rem",
                              color: "#94a3b8",
                              background: "rgba(148,163,184,0.08)",
                              border: "1px solid rgba(148,163,184,0.14)",
                              borderRadius: "6px",
                              padding: "3px 10px",
                              fontWeight: 500,
                            }}
                          >
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </FadeUp>

            {/* ════════════════════════════════════════════════════════
                SECTION 2 — Contract Health Summary (KPI cards)
            ════════════════════════════════════════════════════════ */}
            <FadeUp delay={0.05}>
              <div>
                <p
                  style={{
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "#475569",
                    marginBottom: "14px",
                  }}
                >
                  Contract Health Summary
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                    gap: "16px",
                  }}
                >
                  {/* Risk Score card (custom — not a numeric count) */}
                  <div
                    style={{
                      padding: "20px 22px",
                      background: "var(--th-card-bg)",
                      border: `1px solid ${riskScoreInfo.border}`,
                      borderRadius: "20px",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      boxShadow: "var(--th-card-shadow)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        bottom: "-24px",
                        right: "-24px",
                        width: "130px",
                        height: "130px",
                        borderRadius: "50%",
                        background: riskScoreInfo.bg,
                        filter: "blur(45px)",
                        pointerEvents: "none",
                      }}
                    />
                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "12px",
                        background: riskScoreInfo.bg,
                        border: `1px solid ${riskScoreInfo.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "14px",
                      }}
                    >
                      <Activity size={17} style={{ color: riskScoreInfo.color }} />
                    </div>
                    <p
                      style={{
                        fontSize: "0.65rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        color: "var(--th-text-2)",
                        marginBottom: "8px",
                      }}
                    >
                      Risk Score
                    </p>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
                      <span
                        style={{
                          fontSize: "2rem",
                          fontWeight: 700,
                          color: riskScoreInfo.color,
                          lineHeight: 1,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {riskScore}
                      </span>
                      <span
                        style={{
                          marginBottom: "3px",
                          fontSize: "0.65rem",
                          color: "var(--th-text-3)",
                        }}
                      >
                        / 100
                      </span>
                    </div>
                    <p
                      style={{
                        marginTop: "6px",
                        fontSize: "0.72rem",
                        color: riskScoreInfo.color,
                        fontWeight: 500,
                      }}
                    >
                      {riskScoreInfo.label}
                    </p>
                  </div>

                  <MetricCard
                    label="Total Risks"
                    value={risks.length}
                    icon={ShieldAlert}
                    accent="danger"
                    subtitle={`${highRisks.length} high priority`}
                  />
                  <MetricCard
                    label="High Priority"
                    value={highRisks.length}
                    icon={AlertCircle}
                    accent={highRisks.length > 0 ? "danger" : "success"}
                    subtitle={highRisks.length === 0 ? "No critical risks" : "Needs attention"}
                  />
                  <MetricCard
                    label="Total Obligations"
                    value={obligations.length}
                    icon={ClipboardList}
                    accent="indigo"
                    subtitle={`${overdueObs.length} overdue`}
                  />
                  <MetricCard
                    label="Overdue"
                    value={overdueObs.length}
                    icon={AlertCircle}
                    accent={overdueObs.length > 0 ? "danger" : "success"}
                    subtitle={overdueObs.length === 0 ? "All on track" : "Requires action"}
                  />
                  <MetricCard
                    label="Upcoming (30d)"
                    value={upcomingObs.length}
                    icon={Clock}
                    accent="warning"
                    subtitle="Due within 30 days"
                  />
                </div>
              </div>
            </FadeUp>

            {/* ════════════════════════════════════════════════════════
                SECTION 3 — Parties Overview
            ════════════════════════════════════════════════════════ */}
            <FadeUp delay={0.1}>
              <div style={CARD}>
                <CardHeader
                  icon={Users}
                  title="Parties Overview"
                  iconColor="#a78bfa"
                  iconBg="rgba(139,92,246,0.12)"
                />
                <div style={{ padding: "20px 24px" }}>
                  {parties.client.length === 0 &&
                  parties.provider.length === 0 &&
                  parties.other.length === 0 ? (
                    <div
                      style={{
                        padding: "32px",
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <Users size={28} style={{ color: "#334155" }} />
                      <div>
                        <p
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            color: "#475569",
                            marginBottom: "6px",
                          }}
                        >
                          No Parties Detected
                        </p>
                        <p
                          style={{
                            fontSize: "0.76rem",
                            color: "#334155",
                            lineHeight: 1.6,
                          }}
                        >
                          Party names are extracted directly from the contract text. Ensure
                          the contract has been analyzed to enable party detection.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "20px",
                      }}
                    >
                      {/* Client / Customer */}
                      <div
                        style={{
                          padding: "20px",
                          borderRadius: "14px",
                          background: "linear-gradient(135deg, rgba(59,130,246,0.07) 0%, rgba(59,130,246,0.03) 100%)",
                          border: "1px solid rgba(59,130,246,0.18)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "14px",
                          }}
                        >
                          <div
                            style={{
                              width: "30px",
                              height: "30px",
                              borderRadius: "10px",
                              background: "rgba(59,130,246,0.15)",
                              border: "1px solid rgba(59,130,246,0.25)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <UserCheck size={13} style={{ color: "#60a5fa" }} />
                          </div>
                          <div>
                            <p
                              style={{
                                fontSize: "0.78rem",
                                fontWeight: 600,
                                color: "#60a5fa",
                                marginBottom: "1px",
                              }}
                            >
                              Client / Customer
                            </p>
                            <p style={{ fontSize: "0.62rem", color: "#334155" }}>
                              Receiving party
                            </p>
                          </div>
                        </div>
                        {parties.client.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            {parties.client.map((p) => (
                              <div
                                key={p.name}
                                style={{
                                  padding: "10px 14px",
                                  borderRadius: "10px",
                                  background: "rgba(59,130,246,0.08)",
                                  border: "1px solid rgba(59,130,246,0.15)",
                                }}
                              >
                                <p style={{ fontSize: "0.84rem", fontWeight: 600, color: "#93c5fd", marginBottom: "3px", lineHeight: 1.3 }}>
                                  {p.name}
                                </p>
                                <p style={{ fontSize: "0.62rem", color: "#3b82f680", display: "flex", alignItems: "center", gap: "5px" }}>
                                  <span>{p.roleLabel}</span>
                                  {p.confidence === "low" && (
                                    <span style={{ color: "#334155", fontStyle: "italic" }}>· inferred from obligations</span>
                                  )}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ fontSize: "0.76rem", color: "#334155", fontStyle: "italic" }}>
                            Not detected
                          </p>
                        )}
                      </div>

                      {/* Provider / Vendor */}
                      <div
                        style={{
                          padding: "20px",
                          borderRadius: "14px",
                          background: "linear-gradient(135deg, rgba(16,185,129,0.07) 0%, rgba(16,185,129,0.03) 100%)",
                          border: "1px solid rgba(16,185,129,0.18)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "14px",
                          }}
                        >
                          <div
                            style={{
                              width: "30px",
                              height: "30px",
                              borderRadius: "10px",
                              background: "rgba(16,185,129,0.15)",
                              border: "1px solid rgba(16,185,129,0.25)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <Building2 size={13} style={{ color: "#34d399" }} />
                          </div>
                          <div>
                            <p
                              style={{
                                fontSize: "0.78rem",
                                fontWeight: 600,
                                color: "#34d399",
                                marginBottom: "1px",
                              }}
                            >
                              Provider / Vendor
                            </p>
                            <p style={{ fontSize: "0.62rem", color: "#334155" }}>
                              Delivering party
                            </p>
                          </div>
                        </div>
                        {parties.provider.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            {parties.provider.map((p) => (
                              <div
                                key={p.name}
                                style={{
                                  padding: "10px 14px",
                                  borderRadius: "10px",
                                  background: "rgba(16,185,129,0.08)",
                                  border: "1px solid rgba(16,185,129,0.15)",
                                }}
                              >
                                <p style={{ fontSize: "0.84rem", fontWeight: 600, color: "#6ee7b7", marginBottom: "3px", lineHeight: 1.3 }}>
                                  {p.name}
                                </p>
                                <p style={{ fontSize: "0.62rem", color: "#10b98180", display: "flex", alignItems: "center", gap: "5px" }}>
                                  <span>{p.roleLabel}</span>
                                  {p.confidence === "low" && (
                                    <span style={{ color: "#334155", fontStyle: "italic" }}>· inferred from obligations</span>
                                  )}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ fontSize: "0.76rem", color: "#334155", fontStyle: "italic" }}>
                            Not detected
                          </p>
                        )}
                      </div>

                      {/* Other parties if any */}
                      {parties.other.length > 0 && (
                        <div
                          style={{
                            gridColumn: "1 / -1",
                            padding: "16px 20px",
                            borderRadius: "12px",
                            background: "rgba(148,163,184,0.05)",
                            border: "1px solid rgba(148,163,184,0.12)",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "0.62rem",
                              fontWeight: 700,
                              color: "#64748b",
                              textTransform: "uppercase",
                              letterSpacing: "0.1em",
                              marginBottom: "10px",
                            }}
                          >
                            Additional Parties
                          </p>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                            {parties.other.map((p) => (
                              <span
                                key={p.name}
                                style={{
                                  fontSize: "0.76rem",
                                  color: "#94a3b8",
                                  background: "rgba(148,163,184,0.08)",
                                  border: "1px solid rgba(148,163,184,0.14)",
                                  borderRadius: "8px",
                                  padding: "5px 12px",
                                  fontWeight: 500,
                                }}
                              >
                                {p.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </FadeUp>

            {/* ════════════════════════════════════════════════════════
                TWO-COLUMN SECTION — Risk + Obligations | Dates + Clauses
            ════════════════════════════════════════════════════════ */}
            <FadeUp delay={0.15}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr",
                  gap: "24px",
                  alignItems: "start",
                }}
              >
                {/* LEFT COLUMN */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

                  {/* ── SECTION 4: Risk Snapshot ── */}
                  <div style={CARD}>
                    <CardHeader
                      icon={ShieldAlert}
                      title="Risk Snapshot"
                      iconColor="#f87171"
                      iconBg="rgba(239,68,68,0.12)"
                      count={`${risks.length} risk${risks.length !== 1 ? "s" : ""}`}
                    />

                    {risks.length === 0 ? (
                      <div
                        style={{
                          padding: "40px 24px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "12px",
                          textAlign: "center",
                        }}
                      >
                        <CheckCircle2 size={28} style={{ color: "#22c55e", opacity: 0.7 }} />
                        <div>
                          <p
                            style={{
                              fontSize: "0.85rem",
                              fontWeight: 600,
                              color: "#475569",
                              marginBottom: "5px",
                            }}
                          >
                            No Risks Detected
                          </p>
                          <p style={{ fontSize: "0.76rem", color: "#334155", lineHeight: 1.6 }}>
                            No risk clauses were identified in this contract.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {topRisks.map((risk, i) => {
                          const isLast = i === topRisks.length - 1;
                          return (
                            <div
                              key={risk.id}
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "12px",
                                padding: "14px 24px",
                                borderBottom: isLast
                                  ? "none"
                                  : "1px solid rgba(255,255,255,0.04)",
                                transition: "background 0.12s ease",
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.background =
                                  "rgba(239,68,68,0.03)";
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.background = "transparent";
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p
                                  style={{
                                    fontSize: "0.82rem",
                                    fontWeight: 500,
                                    color: "#e2e8f0",
                                    marginBottom: "5px",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {risk.title}
                                </p>
                                <p
                                  style={{
                                    fontSize: "0.7rem",
                                    color: "#475569",
                                    lineHeight: 1.5,
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical" as React.CSSProperties["WebkitBoxOrient"],
                                    overflow: "hidden",
                                  }}
                                >
                                  {risk.explanation || "—"}
                                </p>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "flex-end",
                                  gap: "5px",
                                  flexShrink: 0,
                                }}
                              >
                                <RiskBadge level={risk.severity} />
                                <span
                                  style={{
                                    fontSize: "0.62rem",
                                    color: "#334155",
                                    fontFamily: "var(--font-mono,monospace)",
                                  }}
                                >
                                  {risk.risk_type?.replace(/_/g, " ") || "—"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        {risks.length > 5 && (
                          <div
                            style={{
                              padding: "10px 24px",
                              borderTop: "1px solid rgba(255,255,255,0.04)",
                              textAlign: "center",
                            }}
                          >
                            <span style={{ fontSize: "0.72rem", color: "#334155" }}>
                              +{risks.length - 5} more risk
                              {risks.length - 5 !== 1 ? "s" : ""} not shown
                            </span>
                          </div>
                        )}
                        <div
                          style={{
                            padding: "14px 24px",
                            borderTop: "1px solid rgba(255,255,255,0.05)",
                          }}
                        >
                          <Link
                            href={selectedId ? `/risks?contract=${selectedId}` : "/risks"}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "8px 18px",
                              borderRadius: "10px",
                              background:
                                "linear-gradient(135deg, rgba(239,68,68,0.14), rgba(220,38,38,0.10))",
                              border: "1px solid rgba(239,68,68,0.26)",
                              color: "#f87171",
                              fontSize: "0.78rem",
                              fontWeight: 500,
                              textDecoration: "none",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.background =
                                "linear-gradient(135deg, rgba(239,68,68,0.22), rgba(220,38,38,0.16))";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.background =
                                "linear-gradient(135deg, rgba(239,68,68,0.14), rgba(220,38,38,0.10))";
                            }}
                          >
                            View Full Risk Analysis
                            <ArrowRight size={12} />
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── SECTION 5: Obligations Snapshot ── */}
                  <div style={CARD}>
                    <CardHeader
                      icon={ClipboardList}
                      title="Obligations Snapshot"
                      iconColor="#fbbf24"
                      iconBg="rgba(245,158,11,0.12)"
                      count={`${obligations.length} total`}
                    />

                    {obligations.length === 0 ? (
                      <div
                        style={{
                          padding: "40px 24px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "12px",
                          textAlign: "center",
                        }}
                      >
                        <ClipboardList
                          size={28}
                          style={{ color: "#475569", opacity: 0.6 }}
                        />
                        <p
                          style={{
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            color: "#475569",
                          }}
                        >
                          No obligations extracted yet
                        </p>
                      </div>
                    ) : (
                      <div style={{ padding: "20px 24px" }}>
                        {/* Stats grid */}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: "10px",
                            marginBottom: "16px",
                          }}
                        >
                          {[
                            {
                              label: "Client",
                              value: clientObsCount,
                              color: "#60a5fa",
                              bg: "rgba(59,130,246,0.08)",
                              border: "rgba(59,130,246,0.15)",
                            },
                            {
                              label: "Provider",
                              value: providerObsCount,
                              color: "#34d399",
                              bg: "rgba(16,185,129,0.08)",
                              border: "rgba(16,185,129,0.15)",
                            },
                            {
                              label: "Shared",
                              value: sharedObsCount,
                              color: "#a78bfa",
                              bg: "rgba(139,92,246,0.08)",
                              border: "rgba(139,92,246,0.15)",
                            },
                            {
                              label: "Overdue",
                              value: overdueObs.length,
                              color: "#f87171",
                              bg: "rgba(239,68,68,0.08)",
                              border: "rgba(239,68,68,0.15)",
                            },
                            {
                              label: "Upcoming",
                              value: upcomingObs.length,
                              color: "#fbbf24",
                              bg: "rgba(245,158,11,0.08)",
                              border: "rgba(245,158,11,0.15)",
                            },
                            {
                              label: "Unassigned",
                              value: unassignedObsCount,
                              color: "#94a3b8",
                              bg: "rgba(148,163,184,0.06)",
                              border: "rgba(148,163,184,0.12)",
                            },
                          ].map(({ label, value, color, bg, border }) => (
                            <div
                              key={label}
                              style={{
                                padding: "12px 14px",
                                borderRadius: "11px",
                                background: bg,
                                border: `1px solid ${border}`,
                                textAlign: "center",
                              }}
                            >
                              <p
                                style={{
                                  fontSize: "1.4rem",
                                  fontWeight: 700,
                                  color,
                                  lineHeight: 1,
                                  fontVariantNumeric: "tabular-nums",
                                  marginBottom: "4px",
                                }}
                              >
                                {value}
                              </p>
                              <p
                                style={{
                                  fontSize: "0.6rem",
                                  fontWeight: 600,
                                  color,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.09em",
                                  opacity: 0.8,
                                }}
                              >
                                {label}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Per-owner breakdown if non-standard parties detected */}
                        {Object.keys(obsByOwner).length > 0 &&
                          Object.keys(obsByOwner).some(
                            (k) =>
                              k !== "Unassigned" &&
                              !CLIENT_KEYWORDS.some((ck) => k.toLowerCase().includes(ck)) &&
                              !PROVIDER_KEYWORDS.some((pk) => k.toLowerCase().includes(pk))
                          ) && (
                            <div
                              style={{
                                marginBottom: "14px",
                                padding: "12px 14px",
                                borderRadius: "10px",
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(255,255,255,0.05)",
                              }}
                            >
                              <p
                                style={{
                                  fontSize: "0.6rem",
                                  fontWeight: 700,
                                  color: "#475569",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.1em",
                                  marginBottom: "8px",
                                }}
                              >
                                By Party
                              </p>
                              <div
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: "6px",
                                }}
                              >
                                {Object.entries(obsByOwner)
                                  .sort((a, b) => b[1] - a[1])
                                  .slice(0, 6)
                                  .map(([owner, count]) => (
                                    <span
                                      key={owner}
                                      style={{
                                        fontSize: "0.7rem",
                                        color: "#64748b",
                                        background: "rgba(255,255,255,0.04)",
                                        border: "1px solid rgba(255,255,255,0.07)",
                                        borderRadius: "6px",
                                        padding: "3px 9px",
                                      }}
                                    >
                                      {owner}{" "}
                                      <span style={{ color: "#94a3b8", fontWeight: 600 }}>
                                        {count}
                                      </span>
                                    </span>
                                  ))}
                              </div>
                            </div>
                          )}

                        <Link
                          href={selectedId ? `/obligations?contract=${selectedId}` : "/obligations"}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 18px",
                            borderRadius: "10px",
                            background:
                              "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.07))",
                            border: "1px solid rgba(245,158,11,0.24)",
                            color: "#fbbf24",
                            fontSize: "0.78rem",
                            fontWeight: 500,
                            textDecoration: "none",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background =
                              "linear-gradient(135deg, rgba(245,158,11,0.20), rgba(245,158,11,0.12))";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background =
                              "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.07))";
                          }}
                        >
                          View All Obligations
                          <ArrowRight size={12} />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

                  {/* ── SECTION 7: Important Dates ── */}
                  <div style={CARD}>
                    <CardHeader
                      icon={CalendarDays}
                      title="Important Dates"
                      iconColor="#22d3ee"
                      iconBg="rgba(34,211,238,0.12)"
                    />
                    <div
                      style={{
                        padding: "16px 20px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      <DateRow
                        icon={Calendar}
                        label="Effective Date"
                        date={detail.effective_date}
                        accent="#60a5fa"
                        tag="Contract Start"
                      />
                      <DateRow
                        icon={Timer}
                        label="Expiration Date"
                        date={detail.expiration_date}
                        accent="#f87171"
                        tag={
                          getDaysUntil(detail.expiration_date) !== null &&
                          getDaysUntil(detail.expiration_date)! < 0
                            ? "Expired"
                            : "Contract End"
                        }
                      />
                      <DateRow
                        icon={Clock}
                        label="Nearest Obligation Due"
                        date={nearestDeadlineDate}
                        accent="#fbbf24"
                        tag={nearestDeadlineDate ? "Upcoming Deadline" : undefined}
                      />

                      {/* Contract Duration */}
                      {detail.effective_date && detail.expiration_date && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "11px 14px",
                            borderRadius: "10px",
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.05)",
                          }}
                        >
                          <div
                            style={{
                              width: "24px",
                              height: "24px",
                              borderRadius: "8px",
                              background: "rgba(34,211,238,0.10)",
                              border: "1px solid rgba(34,211,238,0.20)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <Layers size={10} style={{ color: "#22d3ee" }} />
                          </div>
                          <div>
                            <p style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#475569", marginBottom: "2px" }}>
                              Contract Duration
                            </p>
                            <p style={{ fontSize: "0.8rem", fontWeight: 500, color: "#a5f3fc" }}>
                              {getContractDuration(detail.effective_date, detail.expiration_date)}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Notice Period */}
                      {detail.notice_period_days != null && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "11px 14px",
                            borderRadius: "10px",
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.05)",
                          }}
                        >
                          <div
                            style={{
                              width: "24px",
                              height: "24px",
                              borderRadius: "8px",
                              background: "rgba(99,102,241,0.10)",
                              border: "1px solid rgba(99,102,241,0.20)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <Hash size={10} style={{ color: "#818cf8" }} />
                          </div>
                          <div>
                            <p style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#475569", marginBottom: "2px" }}>
                              Notice Period
                            </p>
                            <p style={{ fontSize: "0.8rem", fontWeight: 500, color: "#e2e8f0" }}>
                              {detail.notice_period_days} day{detail.notice_period_days !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                      )}

                      {renewalRisk && (
                        <div
                          style={{
                            padding: "14px 16px",
                            borderRadius: "12px",
                            background: "rgba(245,158,11,0.06)",
                            border: "1px solid rgba(245,158,11,0.18)",
                            display: "flex",
                            gap: "10px",
                            alignItems: "flex-start",
                          }}
                        >
                          <RefreshCw
                            size={14}
                            style={{ color: "#fbbf24", flexShrink: 0, marginTop: "2px" }}
                          />
                          <div>
                            <p
                              style={{
                                fontSize: "0.62rem",
                                fontWeight: 700,
                                color: "#fbbf24",
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                                marginBottom: "3px",
                              }}
                            >
                              Auto Renewal Detected
                            </p>
                            <p
                              style={{
                                fontSize: "0.76rem",
                                color: "#94a3b8",
                                lineHeight: 1.55,
                              }}
                            >
                              {renewalRisk.explanation
                                ? renewalRisk.explanation.slice(0, 120) +
                                  (renewalRisk.explanation.length > 120 ? "…" : "")
                                : "This contract may renew automatically. Review the renewal clause before the opt-out window closes."}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── SECTION 6: Clause Coverage ── */}
                  <div style={CARD}>
                    <CardHeader
                      icon={BookOpen}
                      title="Clause Coverage"
                      iconColor="#818cf8"
                      iconBg="rgba(99,102,241,0.12)"
                      count={`${clauses.length} clause${clauses.length !== 1 ? "s" : ""}`}
                    />

                    {clauses.length === 0 ? (
                      <div
                        style={{
                          padding: "32px 20px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "10px",
                          textAlign: "center",
                        }}
                      >
                        <BookOpen size={24} style={{ color: "#334155" }} />
                        <p style={{ fontSize: "0.82rem", color: "#475569", fontWeight: 600 }}>
                          No clauses extracted
                        </p>
                        <p style={{ fontSize: "0.74rem", color: "#334155", lineHeight: 1.6 }}>
                          Analyze the contract to extract and categorize its clauses.
                        </p>
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: "16px 20px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "14px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "8px",
                          }}
                        >
                          {sortedClauseCategories.map(([cat, count]) => {
                            const style = getClauseStyle(cat);
                            return (
                              <div
                                key={cat}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  padding: "5px 12px 5px 8px",
                                  borderRadius: "8px",
                                  background: style.bg,
                                  border: `1px solid ${style.color}22`,
                                }}
                              >
                                <div
                                  style={{
                                    width: "6px",
                                    height: "6px",
                                    borderRadius: "50%",
                                    background: style.color,
                                    flexShrink: 0,
                                  }}
                                />
                                <span
                                  style={{
                                    fontSize: "0.72rem",
                                    fontWeight: 500,
                                    color: style.color,
                                    lineHeight: 1,
                                  }}
                                >
                                  {cat}
                                </span>
                                <span
                                  style={{
                                    fontSize: "0.62rem",
                                    color: style.color,
                                    opacity: 0.65,
                                    fontFamily: "var(--font-mono,monospace)",
                                    fontWeight: 600,
                                  }}
                                >
                                  {count}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Visual bar distribution */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            marginTop: "4px",
                          }}
                        >
                          {sortedClauseCategories.slice(0, 5).map(([cat, count]) => {
                            const style = getClauseStyle(cat);
                            const pct =
                              clauses.length > 0
                                ? Math.round((count / clauses.length) * 100)
                                : 0;
                            return (
                              <div key={`bar-${cat}`}>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: "4px",
                                  }}
                                >
                                  <span
                                    style={{ fontSize: "0.7rem", color: "#64748b" }}
                                  >
                                    {cat}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "0.68rem",
                                      color: style.color,
                                      fontFamily: "var(--font-mono,monospace)",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {count}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    height: "5px",
                                    borderRadius: "999px",
                                    overflow: "hidden",
                                    background: "rgba(255,255,255,0.05)",
                                  }}
                                >
                                  <div
                                    style={{
                                      height: "100%",
                                      borderRadius: "999px",
                                      width: `${pct}%`,
                                      background: style.color,
                                      boxShadow: `0 0 8px ${style.color}60`,
                                      transition: "width 0.6s ease",
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <Link
                          href="/clause-library"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 16px",
                            borderRadius: "10px",
                            background: "rgba(99,102,241,0.10)",
                            border: "1px solid rgba(99,102,241,0.22)",
                            color: "#818cf8",
                            fontSize: "0.78rem",
                            fontWeight: 500,
                            textDecoration: "none",
                            transition: "all 0.15s ease",
                            marginTop: "4px",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background =
                              "rgba(99,102,241,0.18)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background =
                              "rgba(99,102,241,0.10)";
                          }}
                        >
                          View Clause Library
                          <ArrowRight size={12} />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </FadeUp>

          </div>
        )}
      </div>
    </AppShell>
  );
}
