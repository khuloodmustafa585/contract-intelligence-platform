"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  FileText,
  Users,
  CalendarDays,
  ChevronDown,
  AlertCircle,
  Building2,
  UserCheck,
  Calendar,
  Upload,
  FileSearch,
  Layers,
  RefreshCw,
  Timer,
  Brain,
  Loader2,
  CheckCircle2,
  X,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import StatusBadge from "@/components/ui/StatusBadge";
import { api, Contract, ContractDetail, Risk, Obligation, Clause } from "@/services/api";

/* ─── Shared card style ──────────────────────────────────────────── */
const CARD: React.CSSProperties = {
  background: "var(--th-card-bg)",
  border: "1px solid var(--th-card-border)",
  boxShadow: "var(--th-card-shadow)",
  borderRadius: "20px",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  overflow: "hidden",
};

const DIVIDER: React.CSSProperties = {
  borderBottom: "1px solid var(--th-divider)",
};

/* ─── Section header inside a card ──────────────────────────────── */
function CardHeader({
  icon: Icon,
  title,
  iconColor,
  iconBg,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  title: string;
  iconColor: string;
  iconBg: string;
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
      <span style={{ flex: 1, fontSize: "0.875rem", fontWeight: 600, color: "var(--th-text-1)" }}>
        {title}
      </span>
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

/* ─── Inline markdown renderer ──────────────────────────────────── */
// Converts **bold** and *italic* markers to JSX without any external deps.
function renderInlineNodes(text: string): React.ReactNode {
  if (!text) return null;
  const parts: React.ReactNode[] = [];
  // Split alternately on **bold** → odd indices are bold text
  const boldSplit = text.split(/\*\*([^*]+)\*\*/);
  boldSplit.forEach((seg, i) => {
    if (i % 2 === 1) {
      parts.push(
        <strong key={`b${i}`} style={{ color: "var(--th-text-1)", fontWeight: 600 }}>
          {seg}
        </strong>,
      );
    } else {
      // Handle *italic* within non-bold segments
      const italicSplit = seg.split(/\*([^*\n]+)\*/);
      italicSplit.forEach((ip, j) => {
        if (j % 2 === 1) {
          parts.push(<em key={`i${i}-${j}`} style={{ color: "var(--th-text-2)", fontStyle: "italic" }}>{ip}</em>);
        } else if (ip) {
          parts.push(ip);
        }
      });
    }
  });
  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

/* ─── Block markdown parser ──────────────────────────────────────── */
type MdBlock =
  | { kind: "heading"; text: string }
  | { kind: "para";    text: string }
  | { kind: "list";    items: string[] };

function parseMdBlocks(raw: string): MdBlock[] {
  const result: MdBlock[] = [];
  const chunks = raw.split(/\n{2,}/);

  for (const chunk of chunks) {
    const lines = chunk.trim().split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    const isListLine = (l: string) => /^[-*•]\s+/.test(l);
    const stripList  = (l: string) => l.replace(/^[-*•]\s+/, "");
    const headingRe  = /^#{1,3}\s+(.+)/;

    // Heading on first line
    const hm = lines[0].match(headingRe);
    if (hm) {
      result.push({ kind: "heading", text: hm[1] });
      const rest = lines.slice(1);
      if (rest.length) {
        if (rest.every(isListLine)) {
          result.push({ kind: "list", items: rest.map(stripList) });
        } else {
          result.push({ kind: "para", text: rest.join(" ") });
        }
      }
      continue;
    }

    // Pure list
    if (lines.every(isListLine)) {
      result.push({ kind: "list", items: lines.map(stripList) });
      continue;
    }

    // Mixed paragraph + list items → split into sub-blocks
    if (lines.some(isListLine)) {
      let textBuf: string[] = [];
      let listBuf: string[] = [];
      const flush = () => {
        if (textBuf.length) { result.push({ kind: "para", text: textBuf.join(" ") }); textBuf = []; }
        if (listBuf.length) { result.push({ kind: "list", items: listBuf }); listBuf = []; }
      };
      for (const line of lines) {
        if (isListLine(line)) { if (textBuf.length) { result.push({ kind: "para", text: textBuf.join(" ") }); textBuf = []; } listBuf.push(stripList(line)); }
        else                  { if (listBuf.length) { result.push({ kind: "list", items: listBuf }); listBuf = []; } textBuf.push(line); }
      }
      flush();
      continue;
    }

    // Plain paragraph
    result.push({ kind: "para", text: lines.join(" ") });
  }

  return result;
}

/* ─── Summary markdown renderer ─────────────────────────────────── */
function SummaryMarkdown({ text }: { text: string }) {
  const blocks = parseMdBlocks(text);
  const hasSections = blocks.some((b) => b.kind === "heading");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {blocks.map((block, i) => {
        if (block.kind === "heading") {
          return (
            <div key={i} style={{ marginTop: i > 0 ? "6px" : 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "3px",
                  height: "15px",
                  borderRadius: "2px",
                  background: "linear-gradient(180deg, #6366f1, #818cf8)",
                  flexShrink: 0,
                }}
              />
              <p
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: "var(--th-text-1)",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                {renderInlineNodes(block.text)}
              </p>
            </div>
          );
        }

        if (block.kind === "list") {
          return (
            <ul key={i} style={{ display: "flex", flexDirection: "column", gap: "5px", listStyle: "none", margin: 0, padding: 0 }}>
              {block.items.map((item, j) => (
                <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <span
                    style={{
                      flexShrink: 0,
                      marginTop: "9px",
                      width: "4px",
                      height: "4px",
                      borderRadius: "50%",
                      background: "rgba(99,102,241,0.6)",
                    }}
                  />
                  <span style={{ fontSize: "0.875rem", color: "var(--th-text-2)", lineHeight: 1.75 }}>
                    {renderInlineNodes(item)}
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        // Paragraph
        const isLead = !hasSections && i === 0;
        return (
          <p
            key={i}
            style={{
              fontSize: isLead ? "0.925rem" : "0.875rem",
              color: "var(--th-text-2)",
              lineHeight: 1.85,
            }}
          >
            {renderInlineNodes(block.text)}
          </p>
        );
      })}
    </div>
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

function dateFromTextNearKeywords(text: string, keywords: string[]): string | null {
  if (!text) return null;
  const monthDate =
    "(?:January|February|March|April|May|June|July|August|September|October|November|December)\\s+\\d{1,2},?\\s+\\d{4}";
  const datePattern = `(${monthDate}|\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4}|\\d{4}-\\d{2}-\\d{2})`;

  for (const keyword of keywords) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const forward = new RegExp(`${escaped}[\\s\\S]{0,120}?${datePattern}`, "i");
    const backward = new RegExp(`${datePattern}[\\s\\S]{0,120}?${escaped}`, "i");
    const match = text.match(forward) ?? text.match(backward);
    const value = match?.find((part) => part && !part.toLowerCase().includes(keyword.toLowerCase()));
    if (!value) continue;
    const normalized = value.replace(/(\d{1,2})\/(\d{1,2})\/(\d{2})$/, "$1/$2/20$3");
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  }
  return null;
}

const CLIENT_KEYWORDS = ["client", "customer", "buyer", "purchaser", "lessee", "licensee"];
const PROVIDER_KEYWORDS = ["provider", "vendor", "supplier", "seller", "contractor", "lessor", "licensor", "service provider"];

/* ─── Party extraction ──────────────────────────────────────────── */
type PartyInfo = {
  name: string;
  roleLabel: string;
  confidence: "high" | "medium" | "low";
};

const _CLIENT_ROLES = [
  "client", "customer", "buyer", "purchaser", "subscriber",
  "licensee", "lessee", "end user",
];
const _PROVIDER_ROLES = [
  "provider", "vendor", "supplier", "seller", "contractor",
  "licensor", "lessor", "service provider", "developer", "consultant",
];

const ROLE_ONLY_PARTY = /^(?:client|provider|vendor|customer|buyer|seller|contractor|licensor|licensee|supplier|purchaser|subscriber|consultant|service provider|the company|company|party|parties)$/i;

function _classifyRole(label: string): "client" | "provider" | null {
  const l = label.toLowerCase().trim();
  if (_CLIENT_ROLES.some((r) => l.includes(r))) return "client";
  if (_PROVIDER_ROLES.some((r) => l.includes(r))) return "provider";
  return null;
}

function cleanPartyName(rawName: string): string | null {
  const name = rawName
    .replace(/\s+/g, " ")
    .replace(/^[\s"'""'']+|[\s"'""''.,;:]+$/g, "")
    .replace(/\s*\((?:the\s+)?["']?[A-Za-z][A-Za-z ]{1,28}["']?\)\s*$/i, "")
    .replace(/\s*,?\s*(?:a|an)\s+[A-Za-z ]{3,45}\s+(?:company|corporation|entity|limited liability company)\s*$/i, "")
    .trim();

  if (name.length < 3 || name.length > 100) return null;
  if (/^(?:this|the|a|an|each|any|all|such|either|both|said)\b/i.test(name)) return null;
  if (ROLE_ONLY_PARTY.test(name)) return null;
  if (!/[A-Za-z]/.test(name)) return null;
  return name;
}

/**
 * Extract actual party names from contract text using six progressive patterns.
 *
 * Pattern 1 (high): CompanyName ("Role") / CompanyName (the "Role")
 * Pattern 2 (high): CompanyName, hereinafter referred to as "Role"
 * Pattern 3 (high): CompanyName (hereinafter "Role") / (hereinafter the "Role")
 * Pattern 4 (medium): Role: CompanyName — table / schedule format
 * Pattern 5 (medium): Client Name: Company / Provider Name: Company
 * Pattern 6 (medium): Client means Company / Vendor is Company
 */
function _extractPartiesFromText(text: string): PartyInfo[] {
  if (!text || text.length < 20) return [];

  const results: PartyInfo[] = [];
  const seen = new Set<string>();

  function add(rawName: string, roleLabel: string, confidence: PartyInfo["confidence"]) {
    const name = cleanPartyName(rawName);
    if (!name) return;
    const side = _classifyRole(roleLabel);
    if (!side) return;
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    results.push({ name, roleLabel: roleLabel.trim(), confidence });
  }

  const p1 = /([A-Z][A-Za-z0-9 &.,'·\-]*?)\s*\(\s*(?:the\s+)?["']([A-Za-z][A-Za-z ]{1,28})["']\s*\)/g;
  for (const m of text.matchAll(p1)) add(m[1], m[2], "high");

  const p2 = /([A-Z][A-Za-z0-9 &.,'·\-]+?)\s*,\s*hereinafter\s+(?:referred\s+to\s+as|called|known\s+as)\s+["']([A-Za-z][A-Za-z ]{1,28})["']/gi;
  for (const m of text.matchAll(p2)) add(m[1], m[2], "high");

  const p3 = /([A-Z][A-Za-z0-9 &.,'·\-]+?)\s*\(\s*hereinafter\s+(?:the\s+)?["']([A-Za-z][A-Za-z ]{1,28})["']\s*\)/gi;
  for (const m of text.matchAll(p3)) add(m[1], m[2], "high");

  const p4 = /^([A-Za-z ]{3,25})\s*:\s*([A-Z][A-Za-z0-9 &.,'·\-]+?)(?:[,\n]|$)/gm;
  for (const m of text.matchAll(p4)) {
    if (_classifyRole(m[1])) add(m[2], m[1].trim(), "medium");
  }

  const p5 = /^([A-Za-z ]{3,25})\s+name\s*:\s*([A-Z][A-Za-z0-9 &.,'·\-]+?)(?:[,\n]|$)/gim;
  for (const m of text.matchAll(p5)) {
    if (_classifyRole(m[1])) add(m[2], m[1].trim(), "medium");
  }

  const p6 = /\b(client|customer|provider|vendor|supplier|contractor|consultant|licensor|licensee)\b\s+(?:means|is|shall mean)\s+([A-Z][A-Za-z0-9 &.,'·\-]+?)(?:[.;,\n]|$)/gi;
  for (const m of text.matchAll(p6)) add(m[2], m[1], "medium");

  return results;
}

function extractPartiesFromContract(
  cleanedText: string | null | undefined,
  extractedText: string | null | undefined,
  obligations: Obligation[],
  clauses: Clause[],
  risks: Risk[]
): { client: PartyInfo[]; provider: PartyInfo[]; other: PartyInfo[] } {
  const client: PartyInfo[] = [];
  const provider: PartyInfo[] = [];
  const other: PartyInfo[] = [];

  const text = (cleanedText || extractedText || "").slice(0, 60_000);
  const analysisText = [
    ...clauses.slice(0, 30).map((c) => `${c.heading ?? ""}\n${c.text ?? ""}`),
    ...risks.slice(0, 30).map((r) => `${r.title ?? ""}\n${r.explanation ?? ""}\n${r.source_snippet ?? ""}`),
    ...obligations.slice(0, 30).map((ob) => `${ob.title ?? ""}\n${ob.description ?? ""}\n${ob.source_snippet ?? ""}`),
  ].join("\n").slice(0, 40_000);
  const fromText = _extractPartiesFromText(`${text}\n${analysisText}`);

  fromText.forEach((p) => {
    const side = _classifyRole(p.roleLabel);
    if (side === "client") client.push(p);
    else if (side === "provider") provider.push(p);
  });

  // Fallback: if text extraction found nothing, infer from obligation owners
  if (client.length === 0 && provider.length === 0) {
    const seenObl = new Set<string>();
    obligations.forEach((ob) => {
      if (!ob.owner) return;
      const name = cleanPartyName(ob.owner);
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

function inferContractType(
  detail: ContractDetail | null,
  clauses: Clause[],
  risks: Risk[],
  obligations: Obligation[]
): string {
  if (!detail) return "Not Detected";

  const source = [
    detail.title,
    detail.file_name,
    detail.cleaned_text?.slice(0, 30_000),
    detail.extracted_text?.slice(0, 30_000),
    ...clauses.slice(0, 40).flatMap((c) => [c.category, c.heading, c.text?.slice(0, 500)]),
    ...risks.slice(0, 40).flatMap((r) => [r.risk_type, r.title, r.explanation, r.source_snippet]),
    ...obligations.slice(0, 40).flatMap((ob) => [ob.title, ob.description, ob.source_snippet]),
  ]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();

  if (!source.trim()) return "Not Detected";
  if (/\b(data processing agreement|data processing addendum|dpa\b|processor\b[\s\S]{0,80}\bcontroller\b|controller\b[\s\S]{0,80}\bprocessor\b)\b/.test(source)) return "Data Processing Agreement";
  if (/\b(saas|software as a service|subscription services|cloud service|platform access)\b/.test(source)) return "SaaS Agreement";
  if (/\b(nda|non[- ]?disclosure agreement|confidentiality agreement|receiving party|disclosing party)\b/.test(source)) return "NDA";
  if (/\b(employment agreement|employee|employer|job title|salary|employment term)\b/.test(source)) return "Employment Agreement";
  if (/\b(licensing agreement|license agreement|licence agreement|licensor|licensee|software license|intellectual property license)\b/.test(source)) return "Licensing Agreement";
  if (/\b(consulting agreement|consultant|consulting services|professional services)\b/.test(source)) return "Consulting Agreement";
  if (/\b(vendor agreement|supplier agreement|vendor|supplier|purchase order|supply agreement)\b/.test(source)) return "Vendor Agreement";
  if (/\b(service agreement|services agreement|master services agreement|msa\b|statement of work|services provided)\b/.test(source)) return "Service Agreement";
  return "Not Detected";
}

/* ─── Contract Selector ──────────────────────────────────────────── */
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
          background: selectedId != null ? "rgba(59,130,246,0.09)" : "var(--th-subtle-bg)",
          border: selectedId != null ? "1px solid rgba(59,130,246,0.28)" : "1px solid var(--th-surface-border)",
          color: selectedId != null ? "#60a5fa" : "var(--th-text-2)",
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
              background: "var(--th-dropdown-bg)",
              border: "1px solid var(--th-dropdown-border)",
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
                <p style={{ padding: "20px 16px", fontSize: "0.76rem", color: "#64748b", textAlign: "center" }}>
                  No contracts available
                </p>
              ) : (
                contracts.map((c) => {
                  const isSelected = selectedId === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => { onChange(c.id); setOpen(false); }}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        width: "100%",
                        padding: "11px 16px",
                        background: isSelected ? "rgba(59,130,246,0.09)" : "transparent",
                        border: "none",
                        borderBottom: "1px solid var(--th-divider)",
                        color: isSelected ? "#60a5fa" : "var(--th-text-2)",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.12s ease",
                      }}
                      onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "var(--th-inner-hover)"; }}
                      onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: isSelected ? "#60a5fa" : "var(--th-text-4)", flexShrink: 0, marginTop: "5px" }} />
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
        background: "var(--th-subtle-bg)",
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
        background: "var(--th-subtle-bg)",
        border: "1px solid var(--th-surface-border)",
      }}
    >
      <p
        style={{
          fontSize: "0.6rem",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--th-text-3)",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: "0.85rem",
          fontWeight: 500,
          color: valueColor ?? "var(--th-text-1)",
          lineHeight: 1.4,
        }}
      >
        {value}
      </p>
    </div>
  );
}

/* ─── Date card (horizontal compact layout) ──────────────────────── */
function DateCard({
  icon: Icon,
  label,
  date,
  accent,
  staticValue,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  label: string;
  date?: string | null;
  accent: string;
  /** Override the displayed value with a pre-computed string (e.g. duration). */
  staticValue?: string;
}) {
  const daysUntil = date ? getDaysUntil(date) : null;
  const expired   = daysUntil !== null && daysUntil < 0;
  const urgent    = daysUntil !== null && daysUntil >= 0 && daysUntil <= 30;

  return (
    <div
      style={{
        padding: "18px 20px",
        borderRadius: "14px",
        background: urgent
          ? "rgba(245,158,11,0.05)"
          : expired
          ? "rgba(239,68,68,0.04)"
          : "var(--th-subtle-bg)",
        border: urgent
          ? "1px solid rgba(245,158,11,0.16)"
          : expired
          ? "1px solid rgba(239,68,68,0.16)"
          : "1px solid var(--th-surface-border)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {/* Icon + label row */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
          }}
        >
          <Icon size={12} style={{ color: accent }} />
        </div>
        <p
          style={{
            fontSize: "0.6rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--th-text-3)",
          }}
        >
          {label}
        </p>
      </div>

      {/* Value area */}
      {staticValue !== undefined ? (
        <p style={{ fontSize: "1rem", fontWeight: 600, color: "#a5f3fc", lineHeight: 1.3 }}>
          {staticValue}
        </p>
      ) : date ? (
        <div>
          <p
            style={{
              fontSize: "0.9rem",
              fontWeight: 600,
              color: expired ? "#f87171" : urgent ? "#fbbf24" : "var(--th-text-1)",
              lineHeight: 1.3,
              marginBottom: "3px",
            }}
          >
            {formatDateShort(date)}
          </p>
          {daysUntil !== null && (
            <p style={{ fontSize: "0.7rem", color: expired ? "#f87171" : urgent ? "#fbbf24" : "#475569" }}>
              {expired
                ? `${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? "s" : ""} ago`
                : daysUntil === 0
                ? "Today"
                : `In ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`}
            </p>
          )}
        </div>
      ) : (
        <p style={{ fontSize: "0.85rem", color: "#64748b", fontStyle: "italic" }}>Not detected</p>
      )}
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────── */
export default function ContractOverviewPage() {
  const [contracts, setContracts]             = useState<Contract[]>([]);
  const [selectedId, setSelectedId]           = useState<number | null>(null);
  const [detail, setDetail]                   = useState<ContractDetail | null>(null);
  const [contractsLoading, setContractsLoading] = useState(true);
  const [detailLoading, setDetailLoading]     = useState(false);
  const [error, setError]                     = useState("");
  const [analyzing, setAnalyzing]             = useState(false);
  const [confirmOpen, setConfirmOpen]         = useState(false);
  const [analyzeSuccess, setAnalyzeSuccess]   = useState(false);

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

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    Promise.resolve()
      .then(() => { if (!active) return null; setDetailLoading(true); setError(""); return api.contract(selectedId); })
      .then((d) => { if (active && d) setDetail(d); })
      .catch((e) => { if (active) setError(e.message); })
      .finally(() => { if (active) setDetailLoading(false); });
    return () => { active = false; };
  }, [selectedId]);

  // Auto-clear success banner after 5 seconds
  useEffect(() => {
    if (!analyzeSuccess) return;
    const t = setTimeout(() => setAnalyzeSuccess(false), 5000);
    return () => clearTimeout(t);
  }, [analyzeSuccess]);

  async function reanalyze() {
    if (!detail || analyzing) return;
    setConfirmOpen(false);
    setAnalyzing(true);
    setError("");
    setAnalyzeSuccess(false);
    try {
      await api.analyze(detail.id);
      const updated = await api.contract(detail.id);
      setDetail(updated);
      setAnalyzeSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Re-analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  /* ── Derived values ── */
  const risks       = useMemo(() => detail?.risks ?? [],       [detail?.risks]);
  const obligations = useMemo(() => detail?.obligations ?? [], [detail?.obligations]);
  const clauses     = useMemo(() => detail?.clauses ?? [],     [detail?.clauses]);
  const summaries   = useMemo(() => detail?.summaries ?? [],   [detail?.summaries]);
  const cleanedText  = detail?.cleaned_text ?? null;
  const extractedText = detail?.extracted_text ?? null;

  const parties = useMemo(
    () => extractPartiesFromContract(cleanedText, extractedText, obligations, clauses, risks),
    [cleanedText, extractedText, obligations, clauses, risks]
  );

  const contractType = useMemo(
    () => inferContractType(detail, clauses, risks, obligations),
    [detail, clauses, risks, obligations]
  );

  const hasRenewalRisk = useMemo(
    () => risks.some((r) => r.risk_type?.toLowerCase().includes("renewal")),
    [risks]
  );

  const renewalDate = useMemo(() => {
    const text = [
      cleanedText,
      extractedText,
      ...clauses.map((c) => `${c.heading ?? ""} ${c.text ?? ""}`),
      ...risks.map((r) => `${r.risk_type ?? ""} ${r.title ?? ""} ${r.explanation ?? ""} ${r.source_snippet ?? ""}`),
    ].join("\n").slice(0, 80_000);
    return dateFromTextNearKeywords(text, ["renewal date", "renewal term", "renews on", "automatically renew"]);
  }, [cleanedText, extractedText, clauses, risks]);

  const generalSummary = useMemo(
    () => summaries.find((s) => s.summary_type === "general") ?? summaries[0] ?? null,
    [summaries]
  );

  return (
    <AppShell>
      {/* ── Confirmation modal ── */}
      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              background: "rgba(2,6,15,0.72)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
            }}
            onClick={() => setConfirmOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "var(--th-dropdown-bg)",
                border: "1px solid var(--th-dropdown-border)",
                borderRadius: "20px",
                padding: "32px",
                maxWidth: "460px",
                width: "100%",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                boxShadow: "0 24px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04) inset",
              }}
            >
              {/* Modal header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "12px",
                      background: "rgba(245,158,11,0.12)",
                      border: "1px solid rgba(245,158,11,0.28)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <RefreshCw size={16} style={{ color: "#fbbf24" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--th-text-1)", lineHeight: 1.3 }}>
                      Re-analyze Contract
                    </p>
                    <p style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "2px" }}>
                      Full AI re-analysis
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setConfirmOpen(false)}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: "transparent",
                    border: "1px solid var(--th-surface-border)",
                    color: "#64748b",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "background 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                    (e.currentTarget as HTMLElement).style.color = "#94a3b8";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "#64748b";
                  }}
                >
                  <X size={13} />
                </button>
              </div>

              {/* Modal body */}
              <p style={{ fontSize: "0.875rem", color: "var(--th-text-2)", lineHeight: 1.7, marginBottom: "20px" }}>
                This will run a full AI re-analysis of <span style={{ color: "var(--th-text-1)", fontWeight: 500 }}>{detail?.title ?? "this contract"}</span> and regenerate:
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  padding: "16px",
                  borderRadius: "12px",
                  background: "var(--th-subtle-bg)",
                  border: "1px solid var(--th-surface-border)",
                  marginBottom: "24px",
                }}
              >
                {[
                  { label: "Executive Summary",    color: "#818cf8" },
                  { label: "Risk findings",        color: "#f87171" },
                  { label: "Obligations",          color: "#fbbf24" },
                  { label: "Alerts",               color: "#22d3ee" },
                ].map(({ label, color }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: "0.82rem", color: "var(--th-text-2)" }}>{label}</span>
                  </div>
                ))}
              </div>

              <p style={{ fontSize: "0.78rem", color: "var(--th-text-3)", lineHeight: 1.6, marginBottom: "24px" }}>
                Current analysis results will be replaced. This cannot be undone.
              </p>

              {/* Modal actions */}
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setConfirmOpen(false)}
                  style={{
                    padding: "9px 18px",
                    borderRadius: "10px",
                    fontSize: "0.82rem",
                    fontWeight: 500,
                    background: "transparent",
                    border: "1px solid var(--th-surface-border)",
                    color: "var(--th-text-3)",
                    cursor: "pointer",
                    transition: "background 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                    (e.currentTarget as HTMLElement).style.color = "#94a3b8";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "#64748b";
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={reanalyze}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    padding: "9px 20px",
                    borderRadius: "10px",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    background: "linear-gradient(135deg, #d97706, #b45309)",
                    border: "1px solid rgba(245,158,11,0.3)",
                    color: "#ffffff",
                    cursor: "pointer",
                    boxShadow: "0 4px 16px rgba(217,119,6,0.35)",
                    transition: "opacity 0.15s",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.88")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
                >
                  <RefreshCw size={13} />
                  Re-analyze Contract
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient glow */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "800px",
          height: "600px",
          background: "radial-gradient(ellipse at 70% -10%, rgba(59,130,246,0.07) 0%, transparent 60%)",
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
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
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
              Contract Overview
            </h1>
          </div>

          <p style={{ fontSize: "0.85rem", color: "var(--th-text-3)", marginBottom: "24px", lineHeight: 1.6 }}>
            Executive briefing — parties, dates, and summary for the selected contract.
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
              <>
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
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#60a5fa", display: "inline-block" }} />
                  Contract Analysis
                </span>

                <Link
                  href="/clause-library"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    padding: "8px 14px",
                    borderRadius: "10px",
                    background: "rgba(99,102,241,0.10)",
                    border: "1px solid rgba(99,102,241,0.22)",
                    color: "#818cf8",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.16)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.10)")}
                >
                  <FileSearch size={13} />
                  View in Clause Library
                </Link>

                {/* Re-analyze Contract button */}
                <button
                  onClick={() => setConfirmOpen(true)}
                  disabled={analyzing}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    padding: "8px 14px",
                    borderRadius: "10px",
                    background: analyzing ? "rgba(245,158,11,0.10)" : "rgba(245,158,11,0.07)",
                    border: "1px solid rgba(245,158,11,0.28)",
                    color: "#fbbf24",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    cursor: analyzing ? "not-allowed" : "pointer",
                    opacity: analyzing ? 0.7 : 1,
                    transition: "background 0.15s, opacity 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!analyzing) (e.currentTarget as HTMLElement).style.background = "rgba(245,158,11,0.13)";
                  }}
                  onMouseLeave={(e) => {
                    if (!analyzing) (e.currentTarget as HTMLElement).style.background = "rgba(245,158,11,0.07)";
                  }}
                >
                  {analyzing ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <RefreshCw size={13} />
                  )}
                  {analyzing ? "Analyzing…" : "Re-analyze Contract"}
                </button>
              </>
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

        {/* ── Re-analysis success ── */}
        {analyzeSuccess && (
          <div
            style={{
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "14px 18px",
              borderRadius: "14px",
              fontSize: "0.82rem",
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.20)",
              color: "#34d399",
            }}
          >
            <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
            Re-analysis complete — summary, risks, obligations, and alerts have been updated.
          </div>
        )}

        {/* ── No contracts ── */}
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
                <p style={{ fontSize: "1rem", fontWeight: 600, color: "#64748b", marginBottom: "8px" }}>
                  No Contracts Found
                </p>
                <p style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.65, maxWidth: "340px" }}>
                  Upload and analyze a contract to see its executive overview here.
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
            <SkeletonCard height={260} />
            <SkeletonCard height={200} />
            <SkeletonCard height={180} />
            <SkeletonCard height={220} />
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
                    <InfoRow
                      label="Contract Type"
                      value={contractType}
                      valueColor={contractType !== "Not Detected" ? "#a5b4fc" : undefined}
                    />
                    <InfoRow label="Current Status" value={<StatusBadge status={detail.status} />} />
                    <InfoRow
                      label="Effective Date"
                      value={formatDate(detail.effective_date)}
                      valueColor={detail.effective_date ? "#e2e8f0" : "#475569"}
                    />
                    <InfoRow
                      label="Expiration Date"
                      value={formatDate(detail.expiration_date)}
                      valueColor={detail.expiration_date ? "#e2e8f0" : "#475569"}
                    />
                    <InfoRow
                      label="Contract Duration"
                      value={getContractDuration(detail.effective_date, detail.expiration_date)}
                      valueColor={detail.effective_date && detail.expiration_date ? "#a5f3fc" : undefined}
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
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.82rem", color: "#fbbf24" }}>
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
                  {(parties.client.length > 0 || parties.provider.length > 0 || parties.other.length > 0) && (
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "14px 18px",
                        borderRadius: "13px",
                        background: "rgba(99,102,241,0.06)",
                        border: "1px solid rgba(99,102,241,0.14)",
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Users size={12} style={{ color: "#818cf8" }} />
                        <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                          Parties Detected
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", flex: 1 }}>
                        {parties.client.map((p) => (
                          <span
                            key={p.name}
                            style={{ fontSize: "0.72rem", color: "#60a5fa", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.18)", borderRadius: "6px", padding: "3px 10px", fontWeight: 500, maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          >
                            <span style={{ color: "#3b82f699", marginRight: "4px" }}>{p.roleLabel}:</span>
                            {p.name}
                          </span>
                        ))}
                        {parties.provider.map((p) => (
                          <span
                            key={p.name}
                            style={{ fontSize: "0.72rem", color: "#34d399", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)", borderRadius: "6px", padding: "3px 10px", fontWeight: 500, maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          >
                            <span style={{ color: "#10b98199", marginRight: "4px" }}>{p.roleLabel}:</span>
                            {p.name}
                          </span>
                        ))}
                        {parties.other.map((p) => (
                          <span
                            key={p.name}
                            style={{ fontSize: "0.72rem", color: "var(--th-text-2)", background: "var(--th-subtle-bg)", border: "1px solid var(--th-surface-border)", borderRadius: "6px", padding: "3px 10px", fontWeight: 500 }}
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
                SECTION 2 — Parties Overview
            ════════════════════════════════════════════════════════ */}
            <FadeUp delay={0.05}>
              <div style={CARD}>
                <CardHeader
                  icon={Users}
                  title="Parties Overview"
                  iconColor="#a78bfa"
                  iconBg="rgba(139,92,246,0.12)"
                />
                <div style={{ padding: "20px 24px" }}>
                  {parties.client.length === 0 && parties.provider.length === 0 && parties.other.length === 0 ? (
                    <div style={{ padding: "32px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                      <Users size={28} style={{ color: "#64748b" }} />
                      <div>
                        <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--th-text-3)", marginBottom: "6px" }}>
                          No Parties Detected
                        </p>
                        <p style={{ fontSize: "0.76rem", color: "#64748b", lineHeight: 1.6 }}>
                          Party names are extracted directly from the contract text. Ensure the contract has been analyzed to enable party detection.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                      {/* Client / Customer */}
                      <div
                        style={{
                          padding: "20px",
                          borderRadius: "14px",
                          background: "linear-gradient(135deg, rgba(59,130,246,0.07) 0%, rgba(59,130,246,0.03) 100%)",
                          border: "1px solid rgba(59,130,246,0.18)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                          <div style={{ width: "30px", height: "30px", borderRadius: "10px", background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <UserCheck size={13} style={{ color: "#60a5fa" }} />
                          </div>
                          <div>
                            <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#60a5fa", marginBottom: "1px" }}>Client / Customer</p>
                            <p style={{ fontSize: "0.62rem", color: "#64748b" }}>Receiving party</p>
                          </div>
                        </div>
                        {parties.client.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            {parties.client.map((p) => (
                              <div key={p.name} style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)" }}>
                                <p style={{ fontSize: "0.84rem", fontWeight: 600, color: "#93c5fd", marginBottom: "3px", lineHeight: 1.3 }}>{p.name}</p>
                                <p style={{ fontSize: "0.62rem", color: "#3b82f680", display: "flex", alignItems: "center", gap: "5px" }}>
                                  <span>{p.roleLabel}</span>
                                  {p.confidence === "low" && <span style={{ color: "#64748b", fontStyle: "italic" }}>· inferred from obligations</span>}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ fontSize: "0.76rem", color: "#64748b", fontStyle: "italic" }}>Not detected</p>
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
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                          <div style={{ width: "30px", height: "30px", borderRadius: "10px", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Building2 size={13} style={{ color: "#34d399" }} />
                          </div>
                          <div>
                            <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#34d399", marginBottom: "1px" }}>Provider / Vendor</p>
                            <p style={{ fontSize: "0.62rem", color: "#64748b" }}>Delivering party</p>
                          </div>
                        </div>
                        {parties.provider.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            {parties.provider.map((p) => (
                              <div key={p.name} style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
                                <p style={{ fontSize: "0.84rem", fontWeight: 600, color: "#6ee7b7", marginBottom: "3px", lineHeight: 1.3 }}>{p.name}</p>
                                <p style={{ fontSize: "0.62rem", color: "#10b98180", display: "flex", alignItems: "center", gap: "5px" }}>
                                  <span>{p.roleLabel}</span>
                                  {p.confidence === "low" && <span style={{ color: "#64748b", fontStyle: "italic" }}>· inferred from obligations</span>}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ fontSize: "0.76rem", color: "#64748b", fontStyle: "italic" }}>Not detected</p>
                        )}
                      </div>

                      {/* Other parties */}
                      {parties.other.length > 0 && (
                        <div style={{ gridColumn: "1 / -1", padding: "16px 20px", borderRadius: "12px", background: "rgba(148,163,184,0.05)", border: "1px solid rgba(148,163,184,0.12)" }}>
                          <p style={{ fontSize: "0.62rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>
                            Additional Parties
                          </p>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                            {parties.other.map((p) => (
                              <span key={p.name} style={{ fontSize: "0.76rem", color: "var(--th-text-2)", background: "var(--th-subtle-bg)", border: "1px solid var(--th-surface-border)", borderRadius: "8px", padding: "5px 12px", fontWeight: 500 }}>
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
                SECTION 3 — Important Dates (horizontal cards)
            ════════════════════════════════════════════════════════ */}
            <FadeUp delay={0.1}>
              <div style={CARD}>
                <CardHeader
                  icon={CalendarDays}
                  title="Important Dates"
                  iconColor="#22d3ee"
                  iconBg="rgba(34,211,238,0.12)"
                />
                <div style={{ padding: "20px 24px" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                      gap: "14px",
                    }}
                  >
                    <DateCard
                      icon={Calendar}
                      label="Contract Start"
                      date={detail.effective_date}
                      accent="#60a5fa"
                    />
                    <DateCard
                      icon={Timer}
                      label="Expiration Date"
                      date={detail.expiration_date}
                      accent="#f87171"
                    />
                    <DateCard
                      icon={RefreshCw}
                      label="Renewal Date"
                      date={renewalDate}
                      accent="#22d3ee"
                    />
                    <DateCard
                      icon={Layers}
                      label="Contract Duration"
                      accent="#a78bfa"
                      staticValue={getContractDuration(detail.effective_date, detail.expiration_date)}
                    />
                  </div>
                </div>
              </div>
            </FadeUp>

            {/* ════════════════════════════════════════════════════════
                SECTION 4 — AI Executive Summary
            ════════════════════════════════════════════════════════ */}
            <FadeUp delay={0.15}>
              <div style={CARD}>
                {/* Card header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "20px 24px",
                    ...DIVIDER,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "10px",
                        background: "rgba(99,102,241,0.12)",
                        border: "1px solid rgba(99,102,241,0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Brain size={13} style={{ color: "#818cf8" }} />
                    </div>
                    <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--th-text-1)" }}>
                      AI Executive Summary
                    </span>
                  </div>
                  {generalSummary && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "3px 10px",
                        borderRadius: "999px",
                        background: "rgba(99,102,241,0.07)",
                        border: "1px solid rgba(99,102,241,0.16)",
                      }}
                    >
                      <div
                        className="animate-pulse"
                        style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#818cf8" }}
                      />
                      <span
                        style={{
                          fontSize: "0.58rem",
                          color: "#818cf8",
                          fontWeight: 600,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          fontFamily: "var(--font-mono, monospace)",
                        }}
                      >
                        AI Generated
                      </span>
                    </div>
                  )}
                </div>

                {/* ── Empty state ── */}
                {generalSummary === null ? (
                  <div
                    style={{
                      padding: "56px 28px",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "14px",
                    }}
                  >
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "14px",
                        background: "rgba(99,102,241,0.07)",
                        border: "1px solid rgba(99,102,241,0.14)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Brain size={22} style={{ color: "#6366f1", opacity: 0.45 }} />
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: "0.88rem",
                          fontWeight: 600,
                          color: "var(--th-text-3)",
                          marginBottom: "6px",
                        }}
                      >
                        Summary Not Yet Generated
                      </p>
                      <p
                        style={{
                          fontSize: "0.78rem",
                          color: "#64748b",
                          lineHeight: 1.65,
                          maxWidth: "340px",
                        }}
                      >
                        Run AI analysis on this contract to produce a structured executive
                        summary with key terms, parties, and risk highlights.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: "28px 32px" }}>
                    <SummaryMarkdown text={generalSummary.summary_text} />
                  </div>
                )}
              </div>
            </FadeUp>

          </div>
        )}
      </div>
    </AppShell>
  );
}
