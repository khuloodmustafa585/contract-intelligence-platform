"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  ShieldAlert,
  Timer,
  Bell,
  Upload,
  ArrowRight,
  Sparkles,
  ClipboardList,
  BarChart2,
  Activity,
  AlertCircle,
  Clock,
  CheckCircle2,
  Cpu,
  BookOpen,
  Circle,
  Zap,
  Database,
  GitMerge,
  LayoutGrid,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MetricCard from "@/components/ui/MetricCard";
import DashboardPanel from "@/components/ui/DashboardPanel";
import PremiumEmptyState from "@/components/ui/PremiumEmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import { api } from "@/services/api";

/* ─── Types ─────────────────────────────────────────────────────── */
type Metrics = {
  total_contracts: number;
  high_risk_contracts: number;
  expiring_soon: number;
  overdue_contracts: number;
  upcoming_obligations: number;
  overdue_obligations: number;
  unread_alerts: number;
  recent_uploads: { id: number; title: string; status: string; created_at: string }[];
};

/* ─── Fade animation helper ─────────────────────────────────────── */
function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Page header ───────────────────────────────────────────────── */
function DashboardHeader({ loading }: { loading: boolean }) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div
            className="h-px w-8"
            style={{ background: "linear-gradient(90deg, #5046e5, #22d3ee)" }}
          />
          <span className="font-mono-label" style={{ color: "#3a3a7c", fontSize: "0.6rem" }}>
            INTELLIGENCE COMMAND CENTER
          </span>
        </div>
        <h1 className="text-[1.85rem] font-bold tracking-tight" style={{ color: "#dae2fd" }}>
          Command Center
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#1e2d47" }}>
          Contract intelligence, risk monitoring, and workflow operations.
        </p>
      </div>

      {/* Right: time + upload CTA */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex flex-col items-end">
          <span className="font-mono-label" style={{ color: "#1a2538", fontSize: "0.58rem" }}>
            {dateStr}
          </span>
          <span className="font-mono-label" style={{ color: "#1a2538", fontSize: "0.58rem" }}>
            {timeStr}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Sync status */}
          <div
            className="hidden sm:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
            style={{
              background: loading ? "rgba(99,102,241,0.05)" : "rgba(16,185,129,0.04)",
              border: `1px solid ${loading ? "rgba(99,102,241,0.12)" : "rgba(16,185,129,0.1)"}`,
            }}
          >
            <div
              className={`h-1.5 w-1.5 rounded-full ${loading ? "animate-pulse" : "animate-pulse"}`}
              style={{
                background: loading ? "#5046e5" : "#10b981",
                boxShadow: `0 0 5px ${loading ? "rgba(99,102,241,0.6)" : "rgba(16,185,129,0.6)"}`,
              }}
            />
            <span className="font-mono-label" style={{ color: loading ? "#4f46e5" : "#047857", fontSize: "0.56rem" }}>
              {loading ? "SYNCING" : "SYNCHRONIZED"}
            </span>
          </div>

          <Link
            href="/upload"
            className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #5046e5 0%, #4338ca 100%)",
              color: "#e0e7ff",
              boxShadow: "0 0 24px rgba(99,102,241,0.35)",
              letterSpacing: "0.03em",
            }}
          >
            <Upload size={14} />
            Upload
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Contract row item ─────────────────────────────────────────── */
function ContractRow({
  contract,
  isLast,
}: {
  contract: { id: number; title: string; status: string; created_at: string };
  isLast: boolean;
}) {
  return (
    <Link
      href={`/contracts/${contract.id}`}
      className="group flex items-center justify-between px-5 py-3 transition-all duration-200"
      style={{
        borderBottom: isLast ? "none" : "1px solid rgba(99,102,241,0.06)",
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.04)")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLElement).style.background = "transparent")
      }
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: "rgba(99,102,241,0.08)",
            border: "1px solid rgba(99,102,241,0.14)",
          }}
        >
          <FileText size={13} style={{ color: "#5046e5" }} />
        </div>
        <div className="min-w-0">
          <p
            className="text-sm font-medium truncate transition-colors duration-200 group-hover:text-[#818cf8]"
            style={{ color: "#94a3b8" }}
          >
            {contract.title}
          </p>
          <p className="font-mono-label" style={{ color: "#1a2538", fontSize: "0.56rem" }}>
            {contract.created_at
              ? new Date(contract.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <StatusBadge status={contract.status} />
        <ArrowRight
          size={13}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ color: "#5046e5" }}
        />
      </div>
    </Link>
  );
}

/* ─── AI Neural Core status panel body ─────────────────────────── */
function AICorePanelBody() {
  const modules = [
    { name: "Clause Extractor",    status: "READY" },
    { name: "Risk Scorer",         status: "READY" },
    { name: "Obligation Parser",   status: "READY" },
    { name: "Entity Recognizer",   status: "READY" },
  ];

  return (
    <div className="space-y-4">
      {/* System meta */}
      <div className="space-y-2">
        {[
          { k: "MODEL",       v: "CLv4.2 Legal LLM" },
          { k: "STATUS",      v: "READY" },
          { k: "QUEUE",       v: "EMPTY" },
          { k: "LAST RUN",    v: "—" },
          { k: "THROUGHPUT",  v: "0 docs/hr" },
        ].map(({ k, v }) => (
          <div key={k} className="flex items-center justify-between">
            <span className="font-mono-label" style={{ color: "#1e2d47", fontSize: "0.58rem" }}>
              {k}
            </span>
            <span
              className="font-mono-label"
              style={{
                color: v === "READY" || v === "EMPTY" ? "#059669" : "#3a4560",
                fontSize: "0.6rem",
              }}
            >
              {v}
            </span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px" style={{ background: "rgba(99,102,241,0.07)" }} />

      {/* Analysis modules */}
      <div>
        <p className="font-mono-label mb-2.5" style={{ color: "#1a2538", fontSize: "0.56rem" }}>
          ANALYSIS MODULES
        </p>
        <div className="space-y-1.5">
          {modules.map(({ name, status }) => (
            <div key={name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ background: "#10b981", boxShadow: "0 0 4px rgba(16,185,129,0.5)" }}
                />
                <span className="text-xs" style={{ color: "#2e3d5a" }}>{name}</span>
              </div>
              <span className="font-mono-label" style={{ color: "#047857", fontSize: "0.56rem" }}>
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px" style={{ background: "rgba(99,102,241,0.07)" }} />

      {/* Quick ask */}
      <Link
        href="/ask-ai"
        className="flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all duration-200 group"
        style={{
          background: "rgba(99,102,241,0.07)",
          border: "1px solid rgba(99,102,241,0.14)",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.12)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.07)")}
      >
        <Sparkles size={13} style={{ color: "#818cf8" }} />
        <span className="flex-1 text-xs font-medium" style={{ color: "#818cf8" }}>
          Ask AI about a contract
        </span>
        <ArrowRight size={12} style={{ color: "#5046e5" }} className="opacity-60 group-hover:opacity-100 transition-opacity" />
      </Link>
    </div>
  );
}

/* ─── Risk Monitor body ─────────────────────────────────────────── */
function RiskMonitorBody({ metrics, loading }: { metrics: Metrics | null; loading: boolean }) {
  const highRisk = metrics?.high_risk_contracts ?? 0;
  const rows = [
    { label: "CRITICAL",  value: 0,        color: "#ef4444", glow: "rgba(239,68,68,0.4)" },
    { label: "HIGH",      value: highRisk,  color: "#f87171", glow: "rgba(239,68,68,0.3)" },
    { label: "MEDIUM",    value: 0,         color: "#f59e0b", glow: "rgba(245,158,11,0.3)" },
    { label: "LOW",       value: 0,         color: "#22d3ee", glow: "rgba(34,211,238,0.3)" },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-2.5">
        {rows.map(({ label, value, color, glow }) => (
          <div key={label} className="flex items-center gap-3">
            <div
              className="h-1.5 w-1.5 rounded-full shrink-0"
              style={{ background: value > 0 ? color : "#1a2538", boxShadow: value > 0 ? `0 0 5px ${glow}` : "none" }}
            />
            <span className="flex-1 font-mono-label" style={{ color: "#2e3d5a", fontSize: "0.6rem" }}>
              {label}
            </span>
            {loading ? (
              <div className="skeleton h-3 w-4 rounded" />
            ) : (
              <span
                className="font-mono-label tabular-nums"
                style={{ color: value > 0 ? color : "#1a2538", fontSize: "0.65rem", fontWeight: 700 }}
              >
                {value}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="h-px" style={{ background: "rgba(99,102,241,0.07)" }} />

      {/* Status line */}
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#10b981" }} />
        <span className="font-mono-label" style={{ color: "#047857", fontSize: "0.56rem" }}>
          {!loading && highRisk === 0 ? "RISK MATRIX CLEAR" : "RISK VECTORS DETECTED"}
        </span>
      </div>

      <Link
        href="/risks"
        className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-200"
        style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.1)" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.09)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.05)")}
      >
        <span className="font-mono-label" style={{ color: "#7f1d1d", fontSize: "0.58rem" }}>
          OPEN RISK REPORT
        </span>
        <ArrowRight size={11} style={{ color: "#7f1d1d" }} />
      </Link>
    </div>
  );
}

/* ─── Obligation Tracker body ───────────────────────────────────── */
function ObligationBody({ metrics, loading }: { metrics: Metrics | null; loading: boolean }) {
  const rows = [
    {
      label: "OVERDUE",
      value: metrics?.overdue_obligations ?? 0,
      color: "#f87171",
      icon: AlertCircle,
    },
    {
      label: "UPCOMING (30d)",
      value: metrics?.upcoming_obligations ?? 0,
      color: "#fbbf24",
      icon: Clock,
    },
    {
      label: "CONTRACTS EXPIRING",
      value: metrics?.expiring_soon ?? 0,
      color: "#f59e0b",
      icon: Timer,
    },
    {
      label: "OVERDUE CONTRACTS",
      value: metrics?.overdue_contracts ?? 0,
      color: "#f87171",
      icon: CheckCircle2,
    },
  ];

  const hasAny = rows.some((r) => (r.value ?? 0) > 0);

  return (
    <div className="space-y-4">
      <div className="space-y-2.5">
        {rows.map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon size={12} style={{ color: (value ?? 0) > 0 ? color : "#1e2d47" }} />
              <span className="font-mono-label" style={{ color: "#2e3d5a", fontSize: "0.6rem" }}>
                {label}
              </span>
            </div>
            {loading ? (
              <div className="skeleton h-3 w-4 rounded" />
            ) : (
              <span
                className="font-mono-label tabular-nums"
                style={{ color: (value ?? 0) > 0 ? color : "#1a2538", fontSize: "0.65rem", fontWeight: 700 }}
              >
                {value ?? 0}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="h-px" style={{ background: "rgba(99,102,241,0.07)" }} />

      <div className="flex items-center gap-2">
        <div
          className="h-1.5 w-1.5 rounded-full animate-pulse"
          style={{ background: hasAny && !loading ? "#f59e0b" : "#10b981" }}
        />
        <span className="font-mono-label" style={{ color: hasAny && !loading ? "#92400e" : "#047857", fontSize: "0.56rem" }}>
          {loading ? "LOADING..." : hasAny ? "ACTION REQUIRED" : "ALL OBLIGATIONS CLEAR"}
        </span>
      </div>

      <Link
        href="/obligations"
        className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-200"
        style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.1)" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(245,158,11,0.09)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(245,158,11,0.05)")}
      >
        <span className="font-mono-label" style={{ color: "#78350f", fontSize: "0.58rem" }}>
          OBLIGATION TRACKER
        </span>
        <ArrowRight size={11} style={{ color: "#78350f" }} />
      </Link>
    </div>
  );
}

/* ─── Upload Queue body ─────────────────────────────────────────── */
function UploadQueueBody({ uploads, loading }: { uploads: Metrics["recent_uploads"]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton h-8 w-8 rounded-xl shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton h-3 w-3/4 rounded" />
              <div className="skeleton h-2.5 w-1/2 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!uploads || uploads.length === 0) {
    return (
      <PremiumEmptyState
        icon={Upload}
        title="Queue Synchronized"
        message="No pending uploads. Pipeline ready to receive new contracts."
        statusLabel="QUEUE EMPTY · PIPELINE READY"
        compact
        cta={{ label: "Upload Contract", href: "/upload" }}
      />
    );
  }

  return (
    <div className="space-y-2.5">
      {uploads.slice(0, 3).map((u) => (
        <Link
          key={u.id}
          href={`/contracts/${u.id}`}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200"
          style={{ border: "1px solid rgba(99,102,241,0.07)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.05)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "rgba(34,211,238,0.07)", border: "1px solid rgba(34,211,238,0.12)" }}
          >
            <Database size={12} style={{ color: "#0891b2" }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium truncate" style={{ color: "#64748b" }}>
              {u.title}
            </p>
            <StatusBadge status={u.status} />
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ─── Activity Stream body ──────────────────────────────────────── */
function ActivityStreamBody({ uploads, loading }: { uploads: Metrics["recent_uploads"]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-0">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-start gap-3 py-3"
            style={{ borderBottom: "1px solid rgba(99,102,241,0.06)" }}
          >
            <div className="skeleton h-7 w-7 rounded-lg shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton h-3 w-2/3 rounded" />
              <div className="skeleton h-2.5 w-1/3 rounded" />
            </div>
            <div className="skeleton h-2.5 w-12 rounded shrink-0 mt-1" />
          </div>
        ))}
      </div>
    );
  }

  if (!uploads || uploads.length === 0) {
    return (
      <PremiumEmptyState
        icon={Activity}
        title="Activity Log Clear"
        message="No system events recorded yet. Activity will appear here as contracts are uploaded and analyzed."
        statusLabel="AWAITING SYSTEM EVENTS"
      />
    );
  }

  const EVENT_ICONS: Record<string, { icon: typeof Activity; bg: string; color: string }> = {
    analyzed:   { icon: CheckCircle2, bg: "rgba(16,185,129,0.08)",  color: "#10b981" },
    processing: { icon: Zap,          bg: "rgba(99,102,241,0.08)",  color: "#6366f1" },
    uploaded:   { icon: Upload,       bg: "rgba(34,211,238,0.07)",  color: "#22d3ee" },
    failed:     { icon: AlertCircle,  bg: "rgba(239,68,68,0.07)",   color: "#ef4444" },
    pending:    { icon: Circle,       bg: "rgba(100,116,139,0.08)", color: "#64748b" },
    indexed:    { icon: Database,     bg: "rgba(34,211,238,0.07)",  color: "#22d3ee" },
  };

  return (
    <div>
      {uploads.map((u, i) => {
        const ev = EVENT_ICONS[u.status?.toLowerCase()] ?? EVENT_ICONS.pending;
        const Icon = ev.icon;
        return (
          <Link
            key={u.id}
            href={`/contracts/${u.id}`}
            className="flex items-start gap-3 py-3 transition-all duration-200"
            style={{
              borderBottom: i < uploads.length - 1 ? "1px solid rgba(99,102,241,0.06)" : "none",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.03)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
          >
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg mt-0.5"
              style={{ background: ev.bg }}
            >
              <Icon size={12} style={{ color: ev.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: "#64748b" }}>
                {u.title}
              </p>
              <p className="font-mono-label" style={{ color: "#1a2538", fontSize: "0.55rem" }}>
                CONTRACT {u.status?.toUpperCase() ?? "PENDING"}
              </p>
            </div>
            <span className="font-mono-label shrink-0 mt-0.5" style={{ color: "#1a2538", fontSize: "0.54rem" }}>
              {u.created_at
                ? new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : "—"}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

/* ─── Quick Commands body ───────────────────────────────────────── */
function QuickCommandsBody() {
  const commands = [
    { label: "Run Risk Scan",       sub: "Analyze all contracts",   href: "/risks",         icon: ShieldAlert,   bg: "rgba(239,68,68,0.07)",   color: "#f87171"  },
    { label: "Review Obligations",  sub: "Check deadlines",         href: "/obligations",   icon: ClipboardList, bg: "rgba(245,158,11,0.07)",   color: "#fbbf24"  },
    { label: "Clause Library",      sub: "Browse extracted clauses", href: "/clause-library",icon: BookOpen,      bg: "rgba(34,211,238,0.07)",   color: "#22d3ee"  },
    { label: "Ask AI",              sub: "Query the neural core",   href: "/ask-ai",        icon: Sparkles,      bg: "rgba(139,92,246,0.09)",   color: "#a78bfa"  },
    { label: "Analytics",           sub: "Portfolio insights",      href: "/analytics",     icon: BarChart2,     bg: "rgba(99,102,241,0.08)",   color: "#818cf8"  },
    { label: "Alerts Center",       sub: "Review notifications",    href: "/alerts",        icon: Bell,          bg: "rgba(16,185,129,0.07)",   color: "#34d399"  },
  ];

  return (
    <div className="space-y-1.5">
      {commands.map(({ label, sub, href, icon: Icon, bg, color }) => (
        <Link
          key={href}
          href={href}
          className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200"
          style={{ border: "1px solid transparent" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.05)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.1)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.borderColor = "transparent";
          }}
        >
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
            style={{ background: bg }}
          >
            <Icon size={13} style={{ color }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium" style={{ color: "#4f5c78" }}>{label}</p>
            <p className="font-mono-label" style={{ color: "#1a2538", fontSize: "0.54rem" }}>{sub}</p>
          </div>
          <ArrowRight
            size={12}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0"
            style={{ color: "#5046e5" }}
          />
        </Link>
      ))}
    </div>
  );
}

/* ─── Error Banner ──────────────────────────────────────────────── */
function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="mb-6 flex items-center gap-3 rounded-xl px-4 py-3 text-sm"
      style={{
        background: "rgba(239,68,68,0.06)",
        border: "1px solid rgba(239,68,68,0.18)",
        color: "#f87171",
      }}
    >
      <AlertCircle size={15} className="shrink-0" />
      {message}
    </div>
  );
}

/* ─── Main Dashboard Page ───────────────────────────────────────── */
export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .dashboard()
      .then((data) => setMetrics(data as Metrics))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const kpiCards = [
    {
      label: "Total Contracts",
      value: metrics?.total_contracts ?? 0,
      icon: FileText,
      accent: "indigo" as const,
      subtitle: "Ingested documents",
      delay: 0,
    },
    {
      label: "High Risk",
      value: metrics?.high_risk_contracts ?? 0,
      icon: ShieldAlert,
      accent: "danger" as const,
      subtitle: "Require immediate review",
      delay: 60,
    },
    {
      label: "Expiring Soon",
      value: metrics?.expiring_soon ?? 0,
      icon: Timer,
      accent: "warning" as const,
      subtitle: "Within 30 days",
      delay: 120,
    },
    {
      label: "Unread Alerts",
      value: metrics?.unread_alerts ?? 0,
      icon: Bell,
      accent: "cyan" as const,
      subtitle: "Action required",
      delay: 180,
    },
  ];

  const uploads = metrics?.recent_uploads ?? [];

  return (
    <AppShell>
      <div className="px-8 py-8">

        {/* ── Page Header ────────────────────────────────────── */}
        <FadeUp>
          <DashboardHeader loading={loading} />
        </FadeUp>

        {error && <ErrorBanner message={error} />}

        {/* ── KPI Row ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
          {kpiCards.map((card) => (
            <MetricCard key={card.label} {...card} loading={loading} />
          ))}
        </div>

        {/* ── Row A: Contract Pipeline + AI Core ─────────────── */}
        <FadeUp delay={0.15}>
          <div className="grid gap-5 lg:grid-cols-3 mb-5">

            {/* Contract Pipeline — wide */}
            <DashboardPanel
              title="CONTRACT PIPELINE"
              icon={GitMerge}
              accent="indigo"
              statusDot={loading ? "standby" : uploads.length > 0 ? "active" : "standby"}
              action={{ label: "VIEW ALL", href: "/contracts" }}
              noPadding
              className="lg:col-span-2"
            >
              {loading && (
                <div className="space-y-0">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-5 py-3.5"
                      style={{ borderBottom: "1px solid rgba(99,102,241,0.06)" }}
                    >
                      <div className="skeleton h-8 w-8 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="skeleton h-3.5 w-3/4 rounded" />
                        <div className="skeleton h-2.5 w-1/3 rounded" />
                      </div>
                      <div className="skeleton h-5 w-20 rounded-full" />
                    </div>
                  ))}
                </div>
              )}

              {!loading && uploads.length === 0 && (
                <PremiumEmptyState
                  icon={FileText}
                  title="Pipeline Synchronized"
                  message="No contracts have been ingested yet. Upload your first document to begin AI analysis."
                  statusLabel="AWAITING INGESTION"
                  cta={{ label: "Upload Contract", href: "/upload" }}
                />
              )}

              {!loading && uploads.length > 0 && (
                <div>
                  {uploads.map((c, i) => (
                    <ContractRow
                      key={c.id}
                      contract={c}
                      isLast={i === uploads.length - 1}
                    />
                  ))}
                </div>
              )}
            </DashboardPanel>

            {/* AI Neural Core */}
            <DashboardPanel
              title="AI NEURAL CORE"
              icon={Cpu}
              accent="violet"
              statusDot="active"
              badge="v4.2"
            >
              <AICorePanelBody />
            </DashboardPanel>
          </div>
        </FadeUp>

        {/* ── Row B: Risk + Obligations + Upload Queue ─────────── */}
        <FadeUp delay={0.25}>
          <div className="grid gap-5 lg:grid-cols-3 mb-5">

            {/* Risk Monitor */}
            <DashboardPanel
              title="RISK MONITOR"
              icon={ShieldAlert}
              accent="danger"
              statusDot={!loading && (metrics?.high_risk_contracts ?? 0) > 0 ? "warning" : "active"}
              action={{ label: "FULL REPORT", href: "/risks" }}
            >
              <RiskMonitorBody metrics={metrics} loading={loading} />
            </DashboardPanel>

            {/* Obligation Tracker */}
            <DashboardPanel
              title="OBLIGATION TRACKER"
              icon={ClipboardList}
              accent="warning"
              statusDot={
                !loading && ((metrics?.overdue_obligations ?? 0) > 0 || (metrics?.overdue_contracts ?? 0) > 0)
                  ? "warning"
                  : "active"
              }
            >
              <ObligationBody metrics={metrics} loading={loading} />
            </DashboardPanel>

            {/* Upload Queue */}
            <DashboardPanel
              title="UPLOAD QUEUE"
              icon={Upload}
              accent="cyan"
              statusDot={loading ? "standby" : "active"}
              badge={!loading && uploads.length > 0 ? `${uploads.length} FILES` : undefined}
              action={{ label: "UPLOAD", href: "/upload" }}
            >
              <UploadQueueBody uploads={uploads} loading={loading} />
            </DashboardPanel>
          </div>
        </FadeUp>

        {/* ── Row C: Activity Stream + Quick Commands ──────────── */}
        <FadeUp delay={0.35}>
          <div className="grid gap-5 lg:grid-cols-3">

            {/* Activity Stream — wide */}
            <DashboardPanel
              title="ACTIVITY STREAM"
              icon={Activity}
              accent="success"
              statusDot="active"
              action={{ label: "VIEW CONTRACTS", href: "/contracts" }}
              noPadding
              className="lg:col-span-2"
            >
              <div className="px-5 py-0">
                <ActivityStreamBody uploads={uploads} loading={loading} />
              </div>
            </DashboardPanel>

            {/* Quick Commands */}
            <DashboardPanel
              title="QUICK COMMANDS"
              icon={LayoutGrid}
              accent="indigo"
            >
              <QuickCommandsBody />
            </DashboardPanel>
          </div>
        </FadeUp>

        {/* ── Footer ───────────────────────────────────────────── */}
        <div className="mt-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {["SOC 2 TYPE II", "ISO 27001", "AES-256", "GDPR"].map((b) => (
              <span key={b} className="font-mono-label" style={{ color: "#0f1e30", fontSize: "0.52rem" }}>
                {b}
              </span>
            ))}
          </div>
          <span className="font-mono-label" style={{ color: "#0f1e30", fontSize: "0.52rem" }}>
            CONTRACT LENS INTELLIGENCE SUITE · {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </AppShell>
  );
}
