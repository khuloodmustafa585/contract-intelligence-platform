"use client";

import { useEffect, useRef, useState, useMemo } from "react";
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
  Activity,
  AlertCircle,
  Clock,
  CheckCircle2,
  Circle,
  BarChart2,
  TrendingUp,
  ChevronDown,
  X,
  Zap,
  Search,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MetricCard from "@/components/ui/MetricCard";
import StatusBadge from "@/components/ui/StatusBadge";
import PremiumEmptyState from "@/components/ui/PremiumEmptyState";
import { api } from "@/services/api";

/* ─── Types ─────────────────────────────────────────────────────── */
type Metrics = {
  total_contracts:     number;
  high_risk_contracts: number;
  expiring_soon:       number;
  overdue_contracts:   number;
  upcoming_obligations:number;
  overdue_obligations: number;
  unread_alerts:       number;
  recent_uploads: { id: number; title: string; status: string; created_at: string }[];
};

/* ─── Shared style constants ─────────────────────────────────────── */
const CARD: React.CSSProperties = {
  background:   "#0f172a",
  border:       "1px solid rgba(255,255,255,0.06)",
  boxShadow:    "0 1px 4px rgba(0,0,0,0.5)",
  borderRadius: "12px",
  overflow:     "hidden",
};

const DIVIDER: React.CSSProperties = {
  borderBottom: "1px solid rgba(255,255,255,0.04)",
};

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

/* ─── Filter option constants ────────────────────────────────────── */
const STATUS_OPTIONS = [
  { value: "",           label: "All Statuses" },
  { value: "analyzed",   label: "Analyzed"     },
  { value: "processing", label: "Processing"   },
  { value: "pending",    label: "Pending"      },
  { value: "uploaded",   label: "Uploaded"     },
  { value: "failed",     label: "Failed"       },
];

const TYPE_OPTIONS = [
  { value: "",            label: "All Types"  },
  { value: "NDA",         label: "NDA"        },
  { value: "Services",    label: "Services"   },
  { value: "Employment",  label: "Employment" },
  { value: "Vendor",      label: "Vendor"     },
  { value: "License",     label: "License"    },
  { value: "Lease",       label: "Lease"      },
  { value: "Partnership", label: "Partnership"},
  { value: "Agreement",   label: "Agreement"  },
];

const SORT_OPTIONS = [
  { value: "",        label: "Sort by"     },
  { value: "newest",  label: "Newest"      },
  { value: "oldest",  label: "Oldest"      },
  { value: "name_az", label: "Name A → Z"  },
  { value: "name_za", label: "Name Z → A"  },
];

const CONTRACT_TABS = [
  { id: "all",      label: "All Contracts" },
  { id: "recent",   label: "Recent"        },
  { id: "flagged",  label: "Flagged"       },
  { id: "review",   label: "Needs Review"  },
  { id: "archived", label: "Archived"      },
];

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

/* ─── Card header ────────────────────────────────────────────────── */
function CardHeader({
  title,
  icon: Icon,
  iconBg,
  iconColor,
  action,
  badge,
}: {
  title: string;
  icon?: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  iconBg?: string;
  iconColor?: string;
  action?: { label: string; href: string };
  badge?: string | number;
}) {
  return (
    <div className="flex items-center gap-3 px-6 py-4" style={DIVIDER}>
      {Icon && (
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
          style={{ background: iconBg ?? "rgba(255,255,255,0.06)" }}
        >
          <Icon size={12} style={{ color: iconColor ?? "#64748b" }} />
        </div>
      )}
      <span className="flex-1 text-sm font-medium" style={{ color: "#f3f4f6" }}>
        {title}
      </span>
      {badge !== undefined && (
        <span
          className="rounded-full px-2 py-0.5 text-xs"
          style={{ background: "rgba(255,255,255,0.06)", color: "#64748b" }}
        >
          {badge}
        </span>
      )}
      {action && (
        <Link
          href={action.href}
          className="flex items-center gap-1 text-xs transition-opacity hover:opacity-60"
          style={{ color: "#3b82f6" }}
        >
          {action.label}
          <ArrowRight size={10} />
        </Link>
      )}
    </div>
  );
}

/* ─── Collapsible Card ───────────────────────────────────────────── */
function CollapsibleCard({
  title,
  icon: Icon,
  iconBg,
  iconColor,
  action,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  iconBg: string;
  iconColor: string;
  action?: { label: string; href: string };
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={CARD}>
      <div className="flex items-center gap-3 px-6 py-4" style={DIVIDER}>
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
          style={{ background: iconBg }}
        >
          <Icon size={12} style={{ color: iconColor }} />
        </div>
        <span className="flex-1 text-sm font-medium" style={{ color: "#f3f4f6" }}>
          {title}
        </span>
        {action && (
          <Link
            href={action.href}
            className="flex items-center gap-1 text-xs transition-opacity hover:opacity-60"
            style={{ color: "#3b82f6" }}
          >
            {action.label}
            <ArrowRight size={10} />
          </Link>
        )}
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center justify-center rounded-md transition-colors"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "2px",
            color: "#4b5563",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#94a3b8")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#4b5563")}
        >
          <ChevronDown
            size={14}
            style={{
              transform: open ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform 0.2s ease",
            }}
          />
        </button>
      </div>
      <div
        style={{
          maxHeight: open ? "1000px" : "0px",
          overflow: "hidden",
          transition: "max-height 0.3s ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ─── Filter Dropdown ────────────────────────────────────────────── */
function FilterDropdown({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isActive = value !== "";
  const selectedLabel = options.find((o) => o.value === value)?.label ?? label;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
        style={{
          background: isActive ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.04)",
          border: isActive ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.08)",
          color: isActive ? "#60a5fa" : "#64748b",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {isActive ? selectedLabel : label}
        {isActive ? (
          <X
            size={10}
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              setOpen(false);
            }}
            style={{ cursor: "pointer", opacity: 0.7 }}
          />
        ) : (
          <ChevronDown
            size={10}
            style={{
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.15s ease",
            }}
          />
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            minWidth: "140px",
            background: "#111827",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
            zIndex: 50,
            overflow: "hidden",
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className="flex w-full items-center px-3 py-2 text-xs transition-colors text-left"
              style={{
                background: opt.value === value ? "rgba(59,130,246,0.1)" : "transparent",
                color: opt.value === value ? "#60a5fa" : "#94a3b8",
                border: "none",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                if (opt.value !== value)
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
              }}
              onMouseLeave={(e) => {
                if (opt.value !== value)
                  (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Page header ────────────────────────────────────────────────── */
function DashboardHeader({ loading }: { loading: boolean }) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month:   "long",
    day:     "numeric",
    year:    "numeric",
  });

  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl font-semibold mb-1" style={{ color: "#f3f4f6" }}>
          Dashboard
        </h1>
        <p className="text-sm" style={{ color: "#374151" }}>
          {dateStr}
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        {loading && (
          <div
            className="hidden sm:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#374151" }} />
            <span className="text-xs" style={{ color: "#374151" }}>Syncing</span>
          </div>
        )}
        <Link
          href="/upload"
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-85"
          style={{ background: "#3b82f6", color: "#ffffff" }}
        >
          <Upload size={13} />
          Upload Contract
        </Link>
      </div>
    </div>
  );
}

/* ─── Quick Actions Bar ──────────────────────────────────────────── */
function QuickActionsBar() {
  const actions = [
    { label: "Upload Contract", href: "/upload",   icon: Upload,  primary: true  },
    { label: "Run Analysis",    href: "/contracts", icon: Zap,     primary: false },
    { label: "Ask AI",          href: "/ask-ai",    icon: Sparkles,primary: false },
    { label: "Review Risks",    href: "/risks",     icon: ShieldAlert, primary: false },
  ];

  return (
    <div
      className="flex flex-wrap items-center gap-2 mb-8 px-5 py-3 rounded-xl"
      style={{
        background: "#0f172a",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
      }}
    >
      <span className="text-xs font-medium mr-2" style={{ color: "#374151" }}>
        Quick Actions
      </span>
      {actions.map(({ label, href, icon: Icon, primary }) => (
        <Link
          key={label}
          href={href}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
          style={
            primary
              ? { background: "#3b82f6", color: "#ffffff" }
              : {
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#64748b",
                }
          }
        >
          <Icon size={11} />
          {label}
        </Link>
      ))}
    </div>
  );
}

/* ─── Error banner ───────────────────────────────────────────────── */
function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="mb-6 flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm"
      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171" }}
    >
      <AlertCircle size={14} className="shrink-0" />
      {message}
    </div>
  );
}

/* ─── Contract type helper ───────────────────────────────────────── */
function deriveType(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("nda") || t.includes("non-disclosure") || t.includes("confidential")) return "NDA";
  if (t.includes("service") || t.includes("sow") || t.includes("msa")) return "Services";
  if (t.includes("employment") || t.includes("offer") || t.includes("hire")) return "Employment";
  if (t.includes("vendor") || t.includes("supplier") || t.includes("purchase")) return "Vendor";
  if (t.includes("license") || t.includes("saas") || t.includes("software")) return "License";
  if (t.includes("lease") || t.includes("rent")) return "Lease";
  if (t.includes("partner") || t.includes("reseller")) return "Partnership";
  return "Agreement";
}

/* ─── Contracts Section (with filtering) ────────────────────────── */
function ContractsSection({
  uploads,
  loading,
}: {
  uploads: Metrics["recent_uploads"];
  loading: boolean;
}) {
  const [activeTab,    setActiveTab]    = useState("all");
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter,   setTypeFilter]   = useState("");
  const [sortOrder,    setSortOrder]    = useState("");

  const COLS = "3fr 1.5fr 1.5fr 1fr 1.5fr";

  const tabCounts = useMemo(() => {
    const now = Date.now();
    return {
      all:      uploads.length,
      recent:   uploads.filter((u) => new Date(u.created_at).getTime() > now - SEVEN_DAYS).length,
      flagged:  uploads.filter((u) => u.status === "failed").length,
      review:   uploads.filter((u) => ["pending", "uploaded"].includes(u.status)).length,
      archived: 0,
    };
  }, [uploads]);

  const filtered = useMemo(() => {
    const now = Date.now();
    let result = [...uploads];

    // Tab filter
    if (activeTab === "recent") {
      result = result.filter((u) => new Date(u.created_at).getTime() > now - SEVEN_DAYS);
    } else if (activeTab === "flagged") {
      result = result.filter((u) => u.status === "failed");
    } else if (activeTab === "review") {
      result = result.filter((u) => ["pending", "uploaded"].includes(u.status));
    } else if (activeTab === "archived") {
      result = [];
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((u) => u.title.toLowerCase().includes(q));
    }

    // Status filter
    if (statusFilter) {
      result = result.filter((u) => u.status?.toLowerCase() === statusFilter);
    }

    // Type filter
    if (typeFilter) {
      result = result.filter((u) => deriveType(u.title) === typeFilter);
    }

    // Sort
    if (sortOrder === "newest") {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortOrder === "oldest") {
      result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortOrder === "name_az") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOrder === "name_za") {
      result.sort((a, b) => b.title.localeCompare(a.title));
    }

    return result;
  }, [uploads, activeTab, search, statusFilter, typeFilter, sortOrder]);

  const hasActiveFilters = search || statusFilter || typeFilter || sortOrder;

  return (
    <div style={CARD}>
      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
        style={DIVIDER}
      >
        {/* Left: title + count */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
            style={{ background: "rgba(59,130,246,0.1)" }}
          >
            <FileText size={12} style={{ color: "#60a5fa" }} />
          </div>
          <span className="text-sm font-medium" style={{ color: "#f3f4f6" }}>
            Recent Contracts
          </span>
          {!loading && (
            <span
              className="rounded-full px-2 py-0.5 text-xs"
              style={{ background: "rgba(255,255,255,0.06)", color: "#64748b" }}
            >
              {filtered.length}
            </span>
          )}
        </div>

        {/* Right: search + filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-1.5"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: search ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Search size={11} style={{ color: "#4b5563", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search contracts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#e2e8f0",
                fontSize: "0.75rem",
                width: "150px",
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                <X size={10} style={{ color: "#4b5563" }} />
              </button>
            )}
          </div>

          <FilterDropdown
            label="Status"
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <FilterDropdown
            label="Type"
            options={TYPE_OPTIONS}
            value={typeFilter}
            onChange={setTypeFilter}
          />
          <FilterDropdown
            label="Sort by"
            options={SORT_OPTIONS}
            value={sortOrder}
            onChange={setSortOrder}
          />

          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setTypeFilter("");
                setSortOrder("");
              }}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs transition-opacity hover:opacity-70"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.15)",
                color: "#f87171",
                cursor: "pointer",
              }}
            >
              <X size={9} />
              Clear
            </button>
          )}

          <Link
            href="/contracts"
            className="flex items-center gap-1 text-xs transition-opacity hover:opacity-60"
            style={{ color: "#3b82f6" }}
          >
            View all
            <ArrowRight size={10} />
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex items-center gap-0 px-6"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.01)" }}
      >
        {CONTRACT_TABS.map((tab) => {
          const count = tabCounts[tab.id as keyof typeof tabCounts];
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-4 py-3 text-xs font-medium transition-colors relative"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: isActive ? "#93c5fd" : "#4b5563",
                borderBottom: isActive ? "2px solid #3b82f6" : "2px solid transparent",
              }}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className="rounded-full px-1.5 py-0.5"
                  style={{
                    fontSize: "0.6rem",
                    background: isActive ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.06)",
                    color: isActive ? "#60a5fa" : "#374151",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Table column headers */}
      <div
        className="grid px-6 py-2.5"
        style={{
          gridTemplateColumns: COLS,
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        {["Contract Name", "Type", "Status", "Risk", "Last Updated"].map((h) => (
          <span
            key={h}
            className="text-xs font-medium"
            style={{ color: "#374151", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.65rem" }}
          >
            {h}
          </span>
        ))}
      </div>

      {/* Table rows */}
      {loading ? (
        <div>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="grid items-center px-6 py-4"
              style={{ gridTemplateColumns: COLS, borderBottom: "1px solid rgba(255,255,255,0.03)" }}
            >
              <div className="flex items-center gap-3">
                <div className="skeleton h-7 w-7 rounded-md shrink-0" />
                <div className="skeleton h-3.5 w-40 rounded" />
              </div>
              <div className="skeleton h-3.5 w-20 rounded" />
              <div className="skeleton h-5 w-20 rounded-full" />
              <div className="skeleton h-3.5 w-5 rounded" />
              <div className="skeleton h-3.5 w-24 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <PremiumEmptyState
          icon={FileText}
          title={uploads.length === 0 ? "No contracts yet" : "No results found"}
          message={
            uploads.length === 0
              ? "Upload your first contract to begin AI-powered analysis and risk detection."
              : "Try adjusting your filters or search query."
          }
          cta={uploads.length === 0 ? { label: "Upload contract", href: "/upload" } : undefined}
        />
      ) : (
        <div>
          {filtered.map((contract, i) => (
            <Link
              key={contract.id}
              href={`/contracts/${contract.id}`}
              className="group grid items-center px-6 py-4 transition-colors duration-150"
              style={{
                gridTemplateColumns: COLS,
                borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.025)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
            >
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  <FileText size={12} style={{ color: "#4b5563" }} />
                </div>
                <span className="text-sm font-medium truncate" style={{ color: "#e2e8f0" }}>
                  {contract.title}
                </span>
              </div>

              <span className="text-sm" style={{ color: "#64748b" }}>
                {deriveType(contract.title)}
              </span>

              <div>
                <StatusBadge status={contract.status} />
              </div>

              <span className="text-sm" style={{ color: "#1f2937" }}>—</span>

              <span className="text-sm" style={{ color: "#64748b" }}>
                {contract.created_at
                  ? new Date(contract.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day:   "numeric",
                      year:  "numeric",
                    })
                  : "—"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Activity Timeline ──────────────────────────────────────────── */
function ActivityTimelineCard({
  uploads,
  loading,
}: {
  uploads: Metrics["recent_uploads"];
  loading: boolean;
}) {
  const EVENT: Record<string, {
    label: string;
    icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
    bg: string;
    color: string;
  }> = {
    analyzed:   { label: "Analysis completed",  icon: CheckCircle2, bg: "rgba(16,185,129,0.1)",  color: "#34d399" },
    processing: { label: "Processing contract", icon: Activity,     bg: "rgba(59,130,246,0.1)",  color: "#60a5fa" },
    uploaded:   { label: "Contract uploaded",   icon: Upload,       bg: "rgba(99,102,241,0.1)",  color: "#818cf8" },
    failed:     { label: "Processing failed",   icon: AlertCircle,  bg: "rgba(239,68,68,0.1)",   color: "#f87171" },
    pending:    { label: "Pending review",      icon: Circle,       bg: "rgba(100,116,139,0.1)", color: "#64748b" },
    indexed:    { label: "Contract indexed",    icon: CheckCircle2, bg: "rgba(34,211,238,0.08)", color: "#22d3ee" },
  };

  return (
    <div style={CARD}>
      <CardHeader
        title="Contract Activity"
        icon={Activity}
        iconBg="rgba(16,185,129,0.1)"
        iconColor="#34d399"
        action={{ label: "View contracts", href: "/contracts" }}
      />

      {loading ? (
        <div className="p-6 space-y-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="skeleton h-7 w-7 rounded-md shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3.5 w-52 rounded" />
                <div className="skeleton h-3 w-28 rounded" />
              </div>
              <div className="skeleton h-3 w-14 rounded shrink-0" />
            </div>
          ))}
        </div>
      ) : uploads.length === 0 ? (
        <PremiumEmptyState
          icon={Activity}
          title="No activity yet"
          message="Activity events appear here as contracts are uploaded and analyzed."
          compact
        />
      ) : (
        <div className="px-6 py-2">
          {uploads.map((u, i) => {
            const ev = EVENT[u.status?.toLowerCase()] ?? EVENT.pending;
            const Icon = ev.icon;
            return (
              <Link
                key={u.id}
                href={`/contracts/${u.id}`}
                className="flex items-start gap-3 rounded-lg px-3 py-3 transition-colors duration-150"
                style={{
                  borderBottom: i < uploads.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
              >
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md mt-0.5"
                  style={{ background: ev.bg }}
                >
                  <Icon size={12} style={{ color: ev.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "#e2e8f0" }}>
                    {u.title}
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: "#4b5563" }}>
                    {ev.label}
                  </p>
                </div>
                <span className="text-xs shrink-0 mt-0.5" style={{ color: "#374151" }}>
                  {u.created_at
                    ? new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    : "—"}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Risk Distribution ──────────────────────────────────────────── */
function RiskDistributionCard({
  metrics,
  loading,
}: {
  metrics: Metrics | null;
  loading: boolean;
}) {
  const total  = metrics?.total_contracts || 0;
  const high   = metrics?.high_risk_contracts ?? 0;
  const medium = total > 0 ? Math.max(0, Math.round(total * 0.25)) : 0;
  const low    = total > 0 ? Math.max(0, total - high - medium) : 0;

  const rows = [
    { label: "High",   value: high,   color: "#ef4444", track: "rgba(239,68,68,0.1)"   },
    { label: "Medium", value: medium, color: "#f59e0b", track: "rgba(245,158,11,0.1)"  },
    { label: "Low",    value: low,    color: "#10b981", track: "rgba(16,185,129,0.1)"  },
  ];

  return (
    <CollapsibleCard
      title="Risk Distribution"
      icon={ShieldAlert}
      iconBg="rgba(239,68,68,0.1)"
      iconColor="#f87171"
      action={{ label: "Full report", href: "/risks" }}
    >
      <div className="p-6 space-y-5">
        {rows.map(({ label, value, color, track }) => {
          const pct = total > 0 ? Math.round((value / total) * 100) : 0;
          return (
            <div key={label}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: "#94a3b8" }}>{label} Risk</span>
                {loading ? (
                  <div className="skeleton h-3.5 w-6 rounded" />
                ) : (
                  <span className="text-sm font-semibold tabular-nums" style={{ color: value > 0 ? color : "#1f2937" }}>
                    {value}
                  </span>
                )}
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: track }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: loading ? "0%" : `${Math.max(pct, value > 0 ? 3 : 0)}%`, background: color, opacity: 0.9 }}
                />
              </div>
            </div>
          );
        })}

        <p className="text-xs" style={{ color: "#374151" }}>
          {!loading && high === 0
            ? "No high-risk contracts detected"
            : !loading
            ? `${high} contract${high !== 1 ? "s" : ""} flagged for review`
            : ""}
        </p>
      </div>
    </CollapsibleCard>
  );
}

/* ─── Upcoming Obligations ───────────────────────────────────────── */
function UpcomingObligationsCard({
  metrics,
  loading,
}: {
  metrics: Metrics | null;
  loading: boolean;
}) {
  const rows = [
    { label: "Overdue obligations",  value: metrics?.overdue_obligations  ?? 0, icon: AlertCircle, urgent: true  },
    { label: "Due within 30 days",   value: metrics?.upcoming_obligations ?? 0, icon: Clock,       urgent: false },
    { label: "Contracts expiring",   value: metrics?.expiring_soon        ?? 0, icon: Timer,       urgent: false },
    { label: "Overdue contracts",    value: metrics?.overdue_contracts    ?? 0, icon: CheckCircle2,urgent: true  },
  ];

  return (
    <CollapsibleCard
      title="Upcoming Obligations"
      icon={ClipboardList}
      iconBg="rgba(245,158,11,0.1)"
      iconColor="#fbbf24"
      action={{ label: "Tracker", href: "/obligations" }}
    >
      <div className="p-6 space-y-4">
        {rows.map(({ label, value, icon: Icon, urgent }) => (
          <div key={label} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Icon
                size={13}
                style={{ color: value > 0 ? (urgent ? "#f87171" : "#fbbf24") : "#1f2937" }}
              />
              <span className="text-sm" style={{ color: "#94a3b8" }}>{label}</span>
            </div>
            {loading ? (
              <div className="skeleton h-3.5 w-5 rounded" />
            ) : (
              <span
                className="text-sm font-semibold tabular-nums"
                style={{ color: value > 0 ? (urgent ? "#f87171" : "#fbbf24") : "#1f2937" }}
              >
                {value}
              </span>
            )}
          </div>
        ))}

        <div className="pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <p className="text-xs" style={{ color: "#374151" }}>
            {!loading && (metrics?.overdue_obligations ?? 0) === 0 && (metrics?.overdue_contracts ?? 0) === 0
              ? "All obligations on track"
              : !loading
              ? "Action required — review overdue items"
              : ""}
          </p>
        </div>
      </div>
    </CollapsibleCard>
  );
}

/* ─── AI Insights ────────────────────────────────────────────────── */
function AIInsightsCard() {
  return (
    <CollapsibleCard
      title="AI Insights"
      icon={Sparkles}
      iconBg="rgba(139,92,246,0.1)"
      iconColor="#a78bfa"
    >
      <div className="p-6 space-y-5">
        <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>
          Your contract portfolio has been scanned. Review high-risk items and pending obligations to maintain compliance posture.
        </p>

        <div className="space-y-3">
          {[
            "Review NDA clauses for IP ownership rights",
            "3 contracts expire within 30 days",
            "Check vendor termination notice periods",
          ].map((s) => (
            <div key={s} className="flex items-start gap-2.5">
              <div
                className="mt-1.5 h-1 w-1 rounded-full shrink-0"
                style={{ background: "#3b82f6" }}
              />
              <p className="text-xs leading-relaxed" style={{ color: "#4b5563" }}>
                {s}
              </p>
            </div>
          ))}
        </div>

        <Link
          href="/ask-ai"
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-opacity hover:opacity-80"
          style={{
            background: "rgba(59,130,246,0.08)",
            border:     "1px solid rgba(59,130,246,0.15)",
            color:      "#60a5fa",
          }}
        >
          <Sparkles size={13} />
          Ask AI about your contracts
        </Link>
      </div>
    </CollapsibleCard>
  );
}

/* ─── Contracts by Status chart ──────────────────────────────────── */
function StatusChartCard({
  uploads,
  loading,
}: {
  uploads: Metrics["recent_uploads"];
  loading: boolean;
}) {
  const counts = uploads.reduce((acc, u) => {
    const key = u.status?.toLowerCase() ?? "pending";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = uploads.length || 1;
  const bars = [
    { label: "Analyzed",   value: counts.analyzed   || 0, color: "#10b981" },
    { label: "Uploaded",   value: counts.uploaded   || 0, color: "#3b82f6" },
    { label: "Processing", value: counts.processing || 0, color: "#f59e0b" },
    { label: "Pending",    value: counts.pending    || 0, color: "#64748b" },
    { label: "Failed",     value: counts.failed     || 0, color: "#ef4444" },
  ].filter((b) => b.value > 0);

  return (
    <div style={CARD}>
      <CardHeader
        title="Contracts by Status"
        icon={BarChart2}
        iconBg="rgba(59,130,246,0.1)"
        iconColor="#60a5fa"
      />
      <div className="p-6">
        {loading ? (
          <div className="space-y-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2.5">
                <div className="flex justify-between">
                  <div className="skeleton h-3.5 w-20 rounded" />
                  <div className="skeleton h-3.5 w-10 rounded" />
                </div>
                <div className="skeleton h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : bars.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: "#374151" }}>
            Upload contracts to see status breakdown
          </p>
        ) : (
          <div className="space-y-5">
            {bars.map(({ label, value, color }) => {
              const pct = Math.round((value / total) * 100);
              return (
                <div key={label}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: color }} />
                      <span className="text-sm" style={{ color: "#94a3b8" }}>{label}</span>
                    </div>
                    <span className="text-sm font-medium tabular-nums" style={{ color: "#f3f4f6" }}>
                      {value}{" "}
                      <span style={{ color: "#374151", fontWeight: 400 }}>({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.max(pct, value > 0 ? 2 : 0)}%`, background: color, opacity: 0.8 }}
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

/* ─── Platform Overview ──────────────────────────────────────────── */
function PlatformOverviewCard({
  metrics,
  loading,
}: {
  metrics: Metrics | null;
  loading: boolean;
}) {
  const stats = [
    { label: "Total Contracts",    value: metrics?.total_contracts      ?? 0 },
    { label: "High Risk",          value: metrics?.high_risk_contracts  ?? 0 },
    { label: "Expiring (30d)",     value: metrics?.expiring_soon        ?? 0 },
    { label: "Overdue Obligations",value: metrics?.overdue_obligations  ?? 0 },
    { label: "Upcoming (30d)",     value: metrics?.upcoming_obligations ?? 0 },
    { label: "Unread Alerts",      value: metrics?.unread_alerts        ?? 0 },
  ];

  return (
    <div style={CARD}>
      <CardHeader
        title="Platform Overview"
        icon={TrendingUp}
        iconBg="rgba(16,185,129,0.1)"
        iconColor="#34d399"
      />
      <div className="p-6">
        <div className="grid grid-cols-3 gap-3">
          {stats.map(({ label, value }) => (
            <div
              key={label}
              className="rounded-lg p-3.5 text-center"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              {loading ? (
                <div className="skeleton h-6 w-8 rounded mx-auto mb-2" />
              ) : (
                <span
                  className="block tabular-nums mb-1"
                  style={{ fontSize: "1.35rem", fontWeight: 700, color: "#f3f4f6", lineHeight: 1 }}
                >
                  {value}
                </span>
              )}
              <span className="text-xs leading-tight" style={{ color: "#374151" }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Dashboard Page ────────────────────────────────────────── */
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

  const uploads = metrics?.recent_uploads ?? [];

  const kpiCards = [
    { label: "Total Contracts", value: metrics?.total_contracts     ?? 0, icon: FileText,   accent: "indigo"  as const, subtitle: "All ingested documents"   },
    { label: "High Risk",       value: metrics?.high_risk_contracts ?? 0, icon: ShieldAlert, accent: "danger"  as const, subtitle: "Require immediate review" },
    { label: "Expiring Soon",   value: metrics?.expiring_soon       ?? 0, icon: Timer,       accent: "warning" as const, subtitle: "Within 30 days"          },
    { label: "Pending Review",  value: metrics?.unread_alerts       ?? 0, icon: Bell,        accent: "cyan"    as const, subtitle: "Awaiting action"         },
  ];

  return (
    <AppShell>
      <div className="px-10 py-9">

        {/* Page Header */}
        <FadeUp>
          <DashboardHeader loading={loading} />
        </FadeUp>

        {/* Quick Actions */}
        <FadeUp delay={0.04}>
          <QuickActionsBar />
        </FadeUp>

        {error && <ErrorBanner message={error} />}

        {/* ── KPI Row ── */}
        <FadeUp delay={0.08}>
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4 mb-8">
            {kpiCards.map((card) => (
              <MetricCard key={card.label} {...card} loading={loading} />
            ))}
          </div>
        </FadeUp>

        {/* ── Main Grid: left 2/3 + right 1/3 ── */}
        <FadeUp delay={0.12}>
          <div className="grid gap-6 lg:grid-cols-3 mb-6">

            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
              <ContractsSection uploads={uploads} loading={loading} />
              <ActivityTimelineCard uploads={uploads} loading={loading} />
            </div>

            {/* Right column */}
            <div className="space-y-6">
              <RiskDistributionCard metrics={metrics} loading={loading} />
              <UpcomingObligationsCard metrics={metrics} loading={loading} />
              <AIInsightsCard />
            </div>

          </div>
        </FadeUp>

        {/* ── Analytics Row ── */}
        <FadeUp delay={0.18}>
          <div className="grid gap-6 lg:grid-cols-2">
            <StatusChartCard uploads={uploads} loading={loading} />
            <PlatformOverviewCard metrics={metrics} loading={loading} />
          </div>
        </FadeUp>

        {/* Footer */}
        <div className="mt-10 flex items-center justify-between">
          <div className="flex items-center gap-5">
            {["SOC 2 Type II", "ISO 27001", "AES-256", "GDPR"].map((b) => (
              <span key={b} className="text-xs" style={{ color: "#1f2937" }}>
                {b}
              </span>
            ))}
          </div>
          <span className="text-xs" style={{ color: "#1f2937" }}>
            Contract Lens · {new Date().getFullYear()}
          </span>
        </div>

      </div>
    </AppShell>
  );
}
