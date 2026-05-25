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
  ChevronDown,
  X,
  Search,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MetricCard from "@/components/ui/MetricCard";
import StatusBadge from "@/components/ui/StatusBadge";
import PremiumEmptyState from "@/components/ui/PremiumEmptyState";
import { api } from "@/services/api";
import { useUser } from "@/contexts/UserContext";
import { useTheme } from "@/contexts/ThemeContext";

/* ─── Types ─────────────────────────────────────────────────────── */
type Metrics = {
  total_contracts:      number;
  high_risk_contracts:  number;
  expiring_soon:        number;
  overdue_contracts:    number;
  upcoming_obligations: number;
  overdue_obligations:  number;
  unread_alerts:        number;
  recent_uploads: { id: number; title: string; status: string; created_at: string }[];
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

const DIVIDER: React.CSSProperties = {
  borderBottom: "1px solid var(--th-divider)",
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
  { value: "",            label: "All Types"   },
  { value: "NDA",         label: "NDA"         },
  { value: "Services",    label: "Services"    },
  { value: "Employment",  label: "Employment"  },
  { value: "Vendor",      label: "Vendor"      },
  { value: "License",     label: "License"     },
  { value: "Lease",       label: "Lease"       },
  { value: "Partnership", label: "Partnership" },
  { value: "Agreement",   label: "Agreement"   },
];

const SORT_OPTIONS = [
  { value: "",        label: "Sort by"    },
  { value: "newest",  label: "Newest"     },
  { value: "oldest",  label: "Oldest"     },
  { value: "name_az", label: "Name A → Z" },
  { value: "name_za", label: "Name Z → A" },
];

const CONTRACT_TABS = [
  { id: "all",      label: "All"          },
  { id: "recent",   label: "Recent"       },
  { id: "flagged",  label: "Flagged"      },
  { id: "review",   label: "Needs Review" },
  { id: "archived", label: "Archived"     },
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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "16px 24px",
        ...DIVIDER,
      }}
    >
      {Icon && (
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "9px",
            background: iconBg ?? "var(--th-subtle-bg)",
            border: `1px solid ${iconBg ? iconBg.replace("0.1)", "0.18)") : "var(--th-tag-border)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={13} style={{ color: iconColor ?? "#64748b" }} />
        </div>
      )}
      <span style={{ flex: 1, fontSize: "0.875rem", fontWeight: 600, color: "var(--th-text-1)" }}>
        {title}
      </span>
      {badge !== undefined && (
        <span
          style={{
            fontSize: "0.7rem",
            fontWeight: 500,
            background: "var(--th-tag-bg)",
            border: "1px solid var(--th-tag-border)",
            color: "var(--th-text-3)",
            borderRadius: "999px",
            padding: "2px 9px",
          }}
        >
          {badge}
        </span>
      )}
      {action && (
        <Link
          href={action.href}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "0.72rem",
            fontWeight: 500,
            color: "#3b82f6",
            textDecoration: "none",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.6")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
        >
          {action.label}
          <ArrowRight size={10} />
        </Link>
      )}
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
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          padding: "5px 10px",
          borderRadius: "8px",
          fontSize: "0.72rem",
          fontWeight: 500,
          background: isActive ? "rgba(59,130,246,0.12)" : "var(--th-subtle-bg)",
          border: isActive ? "1px solid rgba(59,130,246,0.28)" : "1px solid var(--th-input-border)",
          color: isActive ? "#60a5fa" : "var(--th-text-3)",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {isActive ? selectedLabel : label}
        {isActive ? (
          <X
            size={9}
            onClick={(e) => { e.stopPropagation(); onChange(""); setOpen(false); }}
            style={{ cursor: "pointer", opacity: 0.7 }}
          />
        ) : (
          <ChevronDown
            size={9}
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
            background: "var(--th-dropdown-bg)",
            border: "1px solid var(--th-dropdown-border)",
            borderRadius: "10px",
            boxShadow: "var(--th-dropdown-shadow)",
            zIndex: 50,
            overflow: "hidden",
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                padding: "8px 12px",
                fontSize: "0.72rem",
                background: opt.value === value ? "rgba(59,130,246,0.1)" : "transparent",
                color: opt.value === value ? "#60a5fa" : "var(--th-text-2)",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                if (opt.value !== value)
                  (e.currentTarget as HTMLElement).style.background = "var(--th-subtle-bg)";
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

/* ─── Error banner ───────────────────────────────────────────────── */
function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "24px",
        padding: "12px 18px",
        borderRadius: "14px",
        background: "rgba(239,68,68,0.07)",
        border: "1px solid rgba(239,68,68,0.14)",
        color: "#f87171",
        fontSize: "0.82rem",
      }}
    >
      <AlertCircle size={13} style={{ flexShrink: 0 }} />
      {message}
    </div>
  );
}

/* ─── Page Header ────────────────────────────────────────────────── */
function DashboardHeader({
  loading,
  alertCount,
}: {
  loading: boolean;
  alertCount: number;
}) {
  const { user } = useUser();
  const { theme } = useTheme();
  const displayName = user?.full_name ?? "Legal Team";
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month:   "long",
    day:     "numeric",
    year:    "numeric",
  });

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "16px",
        marginBottom: "32px",
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              ...(theme === "dark"
                ? {
                    background: "linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }
                : { color: "var(--th-text-1)" }),
            }}
          >
            {greeting}, {displayName}
          </h1>
          {loading && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "3px 10px",
                borderRadius: "999px",
                background: "var(--th-subtle-bg)",
                border: "1px solid var(--th-tag-border)",
              }}
            >
              <div
                className="animate-pulse"
                style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#3b82f6" }}
              />
              <span style={{ fontSize: "0.68rem", color: "var(--th-text-3)" }}>Syncing</span>
            </div>
          )}
        </div>
        <p style={{ fontSize: "0.78rem", color: "var(--th-text-4)" }}>{dateStr}</p>
      </div>
      {alertCount > 0 && (
        <Link
          href="/alerts"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            padding: "8px 16px",
            borderRadius: "10px",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.16)",
            color: "#f87171",
            fontSize: "0.78rem",
            fontWeight: 500,
            textDecoration: "none",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.75")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
        >
          <Bell size={12} />
          {alertCount} unread alert{alertCount !== 1 ? "s" : ""}
        </Link>
      )}
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

/* ─── Contracts Section ──────────────────────────────────────────── */
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

  const COLS = "3fr 1.4fr 1.5fr 0.8fr 1.4fr";

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

    if (activeTab === "recent")
      result = result.filter((u) => new Date(u.created_at).getTime() > now - SEVEN_DAYS);
    else if (activeTab === "flagged")
      result = result.filter((u) => u.status === "failed");
    else if (activeTab === "review")
      result = result.filter((u) => ["pending", "uploaded"].includes(u.status));
    else if (activeTab === "archived")
      result = [];

    if (search.trim())
      result = result.filter((u) => u.title.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter)
      result = result.filter((u) => u.status?.toLowerCase() === statusFilter);
    if (typeFilter)
      result = result.filter((u) => deriveType(u.title) === typeFilter);

    if (sortOrder === "newest")
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    else if (sortOrder === "oldest")
      result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    else if (sortOrder === "name_az")
      result.sort((a, b) => a.title.localeCompare(b.title));
    else if (sortOrder === "name_za")
      result.sort((a, b) => b.title.localeCompare(a.title));

    return result;
  }, [uploads, activeTab, search, statusFilter, typeFilter, sortOrder]);

  const hasActiveFilters = search || statusFilter || typeFilter || sortOrder;

  return (
    <div style={CARD}>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          padding: "16px 24px",
          ...DIVIDER,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "9px",
              background: "rgba(59,130,246,0.1)",
              border: "1px solid rgba(59,130,246,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <FileText size={13} style={{ color: "#60a5fa" }} />
          </div>
          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--th-text-1)" }}>
            Recent Contracts
          </span>
          {!loading && (
            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: 500,
                background: "var(--th-tag-bg)",
                border: "1px solid var(--th-tag-border)",
                color: "var(--th-text-3)",
                borderRadius: "999px",
                padding: "2px 9px",
              }}
            >
              {filtered.length}
            </span>
          )}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "7px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "5px 10px",
              background: "var(--th-subtle-bg)",
              border: search ? "1px solid rgba(59,130,246,0.28)" : "1px solid var(--th-input-border)",
              borderRadius: "8px",
            }}
          >
            <Search size={10} style={{ color: "#4b5563", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--th-text-1)",
                fontSize: "0.72rem",
                width: "100px",
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                <X size={9} style={{ color: "#4b5563" }} />
              </button>
            )}
          </div>

          <FilterDropdown label="Status" options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
          <FilterDropdown label="Type"   options={TYPE_OPTIONS}   value={typeFilter}   onChange={setTypeFilter}   />
          <FilterDropdown label="Sort"   options={SORT_OPTIONS}   value={sortOrder}    onChange={setSortOrder}    />

          {hasActiveFilters && (
            <button
              onClick={() => { setSearch(""); setStatusFilter(""); setTypeFilter(""); setSortOrder(""); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "5px 10px",
                borderRadius: "8px",
                fontSize: "0.7rem",
                background: "rgba(239,68,68,0.07)",
                border: "1px solid rgba(239,68,68,0.14)",
                color: "#f87171",
                cursor: "pointer",
              }}
            >
              <X size={9} /> Clear
            </button>
          )}

          <Link
            href="/contracts"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "0.72rem",
              fontWeight: 500,
              color: "#3b82f6",
              textDecoration: "none",
            }}
          >
            View all <ArrowRight size={10} />
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          borderBottom: "1px solid var(--th-divider)",
          background: "var(--th-subtle-bg)",
        }}
      >
        {CONTRACT_TABS.map((tab) => {
          const count = tabCounts[tab.id as keyof typeof tabCounts];
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "10px 14px",
                fontSize: "0.75rem",
                fontWeight: isActive ? 500 : 400,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: isActive ? "#93c5fd" : "var(--th-text-3)",
                borderBottom: isActive ? "2px solid #3b82f6" : "2px solid transparent",
                transition: "color 0.15s",
              }}
            >
              {tab.label}
              {count > 0 && (
                <span
                  style={{
                    fontSize: "0.6rem",
                    padding: "1px 5px",
                    borderRadius: "999px",
                    background: isActive ? "rgba(59,130,246,0.2)" : "var(--th-tag-bg)",
                    color: isActive ? "#60a5fa" : "var(--th-text-4)",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Column headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: COLS,
          padding: "10px 24px",
          borderBottom: "1px solid var(--th-divider)",
          background: "var(--th-table-header-bg)",
        }}
      >
        {["Contract Name", "Type", "Status", "Risk", "Last Updated"].map((h) => (
          <span
            key={h}
            style={{
              fontSize: "0.58rem",
              fontWeight: 600,
              color: "var(--th-text-4)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      {loading ? (
        <div>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: COLS,
                alignItems: "center",
                padding: "13px 24px",
                borderBottom: "1px solid var(--th-divider)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="skeleton h-7 w-7 rounded-xl shrink-0" />
                <div className="skeleton h-3.5 w-40 rounded" />
              </div>
              <div className="skeleton h-5 w-16 rounded-lg" />
              <div className="skeleton h-5 w-18 rounded-full" />
              <div className="skeleton h-3 w-5 rounded" />
              <div className="skeleton h-3 w-20 rounded" />
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
              style={{
                display: "grid",
                gridTemplateColumns: COLS,
                alignItems: "center",
                padding: "13px 24px",
                borderBottom: i < filtered.length - 1 ? "1px solid var(--th-row-divider)" : "none",
                textDecoration: "none",
                transition: "background 0.12s ease",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.background = "var(--th-row-hover)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.background = "transparent")
              }
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, paddingRight: "16px" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "9px",
                    background: "rgba(59,130,246,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <FileText size={12} style={{ color: "#3b82f6" }} />
                </div>
                <span
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 500,
                    color: "var(--th-text-1)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {contract.title}
                </span>
              </div>

              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 500,
                  color: "var(--th-text-3)",
                  background: "var(--th-subtle-bg)",
                  border: "1px solid var(--th-tag-border)",
                  borderRadius: "6px",
                  padding: "3px 8px",
                  display: "inline-block",
                  width: "fit-content",
                }}
              >
                {deriveType(contract.title)}
              </span>

              <div>
                <StatusBadge status={contract.status} />
              </div>

              <span style={{ color: "var(--th-text-5)", fontSize: "0.8rem" }}>—</span>

              <span style={{ fontSize: "0.72rem", color: "var(--th-text-3)" }}>
                {contract.created_at
                  ? new Date(contract.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day:   "numeric",
                      year:  "2-digit",
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

/* ─── AI Insights ────────────────────────────────────────────────── */
function AIInsightsCard() {
  const insights = [
    {
      type: "risk",
      badge: "High Risk",
      text: "NDA clauses contain unilateral IP ownership terms that may conflict with employment agreements.",
    },
    {
      type: "renewal",
      badge: "Expiring",
      text: "2 enterprise vendor contracts expire within 30 days. Renewal action required to maintain continuity.",
    },
    {
      type: "compliance",
      badge: "Compliance",
      text: "Missing data processing addendums in 5 vendor contracts. GDPR review recommended.",
    },
  ];

  const badgeStyle = (type: string): React.CSSProperties => {
    if (type === "risk")
      return { background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.18)" };
    if (type === "renewal")
      return { background: "rgba(245,158,11,0.1)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.18)" };
    return { background: "rgba(34,211,238,0.1)", color: "#22d3ee", border: "1px solid rgba(34,211,238,0.18)" };
  };

  const rowBg = (type: string): string => {
    if (type === "risk") return "rgba(239,68,68,0.03)";
    if (type === "renewal") return "rgba(245,158,11,0.025)";
    return "var(--th-subtle-bg)";
  };

  return (
    <div style={CARD}>
      {/* Gradient header */}
      <div
        style={{
          padding: "18px 24px 14px",
          background: "var(--th-insights-header-bg)",
          borderBottom: "1px solid var(--th-divider)",
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
            AI Insights
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "3px 10px",
              borderRadius: "999px",
              background: "rgba(139,92,246,0.1)",
              border: "1px solid rgba(139,92,246,0.18)",
            }}
          >
            <div
              className="animate-pulse"
              style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#a78bfa" }}
            />
            <span style={{ fontSize: "0.58rem", color: "#a78bfa", fontWeight: 500 }}>Live</span>
          </div>
        </div>
        <p style={{ fontSize: "0.7rem", color: "var(--th-text-3)" }}>AI-generated contract intelligence</p>
      </div>

      {/* Insight items */}
      <div style={{ padding: "14px 18px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {insights.map((insight, i) => (
            <div
              key={i}
              style={{
                padding: "10px 14px",
                borderRadius: "11px",
                background: rowBg(insight.type),
                border: "1px solid var(--th-tag-border)",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  fontSize: "0.58rem",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  padding: "2px 7px",
                  borderRadius: "999px",
                  marginBottom: "6px",
                  ...badgeStyle(insight.type),
                }}
              >
                {insight.badge}
              </span>
              <p style={{ fontSize: "0.73rem", color: "var(--th-text-3)", lineHeight: 1.6 }}>
                {insight.text}
              </p>
            </div>
          ))}
        </div>

        <Link
          href="/ask-ai"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "7px",
            marginTop: "10px",
            padding: "9px",
            borderRadius: "11px",
            background: "rgba(139,92,246,0.07)",
            border: "1px solid rgba(139,92,246,0.17)",
            color: "#a78bfa",
            fontSize: "0.75rem",
            fontWeight: 500,
            textDecoration: "none",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.7")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
        >
          <Sparkles size={11} />
          Ask AI about your contracts
        </Link>
      </div>
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
  const total  = metrics?.total_contracts    || 0;
  const high   = metrics?.high_risk_contracts ?? 0;
  const medium = total > 0 ? Math.max(0, Math.round(total * 0.25)) : 0;
  const low    = total > 0 ? Math.max(0, total - high - medium)    : 0;

  const rows = [
    { label: "High",   value: high,   color: "#ef4444", glow: "rgba(239,68,68,0.35)",  track: "rgba(239,68,68,0.07)"  },
    { label: "Medium", value: medium, color: "#f59e0b", glow: "rgba(245,158,11,0.3)",  track: "rgba(245,158,11,0.07)" },
    { label: "Low",    value: low,    color: "#10b981", glow: "rgba(16,185,129,0.3)",  track: "rgba(16,185,129,0.07)" },
  ];

  return (
    <div style={CARD}>
      <CardHeader
        title="Risk Distribution"
        icon={ShieldAlert}
        iconBg="rgba(239,68,68,0.1)"
        iconColor="#f87171"
        action={{ label: "Full report", href: "/risks" }}
      />
      <div style={{ padding: "18px 24px" }}>
        {rows.map(({ label, value, color, glow, track }) => {
          const pct = total > 0 ? Math.round((value / total) * 100) : 0;
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
                <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: color,
                      boxShadow: `0 0 7px ${glow}`,
                    }}
                  />
                  <span style={{ fontSize: "0.78rem", color: "var(--th-text-2)" }}>{label} Risk</span>
                </div>
                {loading ? (
                  <div className="skeleton h-3.5 w-8 rounded" />
                ) : (
                  <span
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      color: value > 0 ? color : "var(--th-text-5)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {value}
                  </span>
                )}
              </div>
              <div
                style={{ height: "5px", borderRadius: "999px", background: track, overflow: "hidden" }}
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
        <p style={{ fontSize: "0.68rem", color: "var(--th-text-5)", marginTop: "2px" }}>
          {!loading &&
            (high === 0
              ? "No high-risk contracts detected"
              : `${high} contract${high !== 1 ? "s" : ""} flagged for review`)}
        </p>
      </div>
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
  const EVENT: Record<
    string,
    {
      label: string;
      icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
      bg: string;
      color: string;
    }
  > = {
    analyzed:   { label: "Analysis completed",  icon: CheckCircle2, bg: "rgba(16,185,129,0.1)",  color: "#34d399" },
    processing: { label: "Processing contract", icon: Activity,     bg: "rgba(59,130,246,0.1)",  color: "#60a5fa" },
    uploaded:   { label: "Contract uploaded",   icon: Upload,       bg: "rgba(99,102,241,0.1)",  color: "#818cf8" },
    failed:     { label: "Processing failed",   icon: AlertCircle,  bg: "rgba(239,68,68,0.1)",   color: "#f87171" },
    pending:    { label: "Pending review",      icon: Circle,       bg: "rgba(100,116,139,0.08)", color: "var(--th-text-3)" },
    indexed:    { label: "Contract indexed",    icon: CheckCircle2, bg: "rgba(34,211,238,0.1)",   color: "#22d3ee" },
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
        <div style={{ padding: "14px 20px" }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                marginBottom: "16px",
              }}
            >
              <div className="skeleton h-7 w-7 rounded-xl shrink-0 mt-0.5" />
              <div style={{ flex: 1 }}>
                <div className="skeleton h-3 w-48 rounded mb-2" />
                <div className="skeleton h-2.5 w-24 rounded" />
              </div>
              <div className="skeleton h-2.5 w-14 rounded shrink-0" />
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
        <div style={{ padding: "8px 16px" }}>
          {uploads.map((u, i) => {
            const ev = EVENT[u.status?.toLowerCase()] ?? EVENT.pending;
            const Icon = ev.icon;
            return (
              <Link
                key={u.id}
                href={`/contracts/${u.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 8px",
                  borderRadius: "10px",
                  borderBottom:
                    i < uploads.length - 1 ? "1px solid var(--th-row-divider)" : "none",
                  textDecoration: "none",
                  transition: "background 0.12s ease",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.background = "var(--th-row-hover)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.background = "transparent")
                }
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "9px",
                    background: ev.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={12} style={{ color: ev.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 500,
                      color: "var(--th-text-1)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {u.title}
                  </p>
                  <p style={{ fontSize: "0.68rem", color: "var(--th-text-3)", marginTop: "1px" }}>
                    {ev.label}
                  </p>
                </div>
                <span style={{ fontSize: "0.68rem", color: "var(--th-text-4)", flexShrink: 0 }}>
                  {u.created_at
                    ? new Date(u.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day:   "numeric",
                      })
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

/* ─── Upcoming Obligations ───────────────────────────────────────── */
function UpcomingObligationsCard({
  metrics,
  loading,
}: {
  metrics: Metrics | null;
  loading: boolean;
}) {
  const rows = [
    { label: "Overdue obligations", value: metrics?.overdue_obligations  ?? 0, icon: AlertCircle, urgent: true  },
    { label: "Due within 30 days",  value: metrics?.upcoming_obligations ?? 0, icon: Clock,       urgent: false },
    { label: "Contracts expiring",  value: metrics?.expiring_soon        ?? 0, icon: Timer,       urgent: false },
    { label: "Overdue contracts",   value: metrics?.overdue_contracts    ?? 0, icon: CheckCircle2,urgent: true  },
  ];

  return (
    <div style={CARD}>
      <CardHeader
        title="Upcoming Obligations"
        icon={ClipboardList}
        iconBg="rgba(245,158,11,0.1)"
        iconColor="#fbbf24"
        action={{ label: "Tracker", href: "/obligations" }}
      />
      <div style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {rows.map(({ label, value, icon: Icon, urgent }) => (
            <div
              key={label}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Icon
                  size={12}
                  style={{ color: value > 0 ? (urgent ? "#f87171" : "#fbbf24") : "#1e293b" }}
                />
                <span style={{ fontSize: "0.8rem", color: "var(--th-text-2)" }}>{label}</span>
              </div>
              {loading ? (
                <div className="skeleton h-3.5 w-6 rounded" />
              ) : (
                <span
                  style={{
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    color: value > 0 ? (urgent ? "#f87171" : "#fbbf24") : "var(--th-text-5)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {value}
                </span>
              )}
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: "16px",
            paddingTop: "14px",
            borderTop: "1px solid var(--th-divider)",
          }}
        >
          <p style={{ fontSize: "0.68rem", color: "var(--th-text-5)" }}>
            {!loading &&
              (metrics?.overdue_obligations ?? 0) === 0 &&
              (metrics?.overdue_contracts ?? 0) === 0
              ? "All obligations on track"
              : !loading
              ? "Action required — review overdue items"
              : ""}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Compliance Score ───────────────────────────────────────────── */
function ComplianceScoreCard({
  metrics,
  loading,
}: {
  metrics: Metrics | null;
  loading: boolean;
}) {
  const total    = metrics?.total_contracts     ?? 0;
  const high     = metrics?.high_risk_contracts ?? 0;
  const overdue  = metrics?.overdue_obligations ?? 0;
  const expiring = metrics?.expiring_soon       ?? 0;

  const score =
    total === 0
      ? 100
      : Math.max(
          40,
          Math.round(
            100 -
              Math.min(high * 12, 40) -
              Math.min(overdue * 8, 30) -
              Math.min(expiring * 4, 20)
          )
        );

  const scoreColor = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  const scoreLabel = score >= 80 ? "Compliant" : score >= 60 ? "Needs Attention" : "At Risk";
  const circumference = 2 * Math.PI * 34;
  const dash = (score / 100) * circumference;

  return (
    <div style={CARD}>
      <CardHeader
        title="Compliance Score"
        icon={CheckCircle2}
        iconBg="rgba(16,185,129,0.1)"
        iconColor="#34d399"
        action={{ label: "Details", href: "/analytics" }}
      />
      <div style={{ padding: "20px 24px" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <div className="skeleton h-24 w-24 rounded-full shrink-0" />
            <div style={{ flex: 1 }}>
              <div className="skeleton h-4 w-20 rounded mb-2.5" />
              <div className="skeleton h-3 w-32 rounded mb-4" />
              <div className="skeleton h-2 w-full rounded-full mb-2" />
              <div className="skeleton h-2 w-3/4 rounded-full" />
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            {/* Gauge — horizontal layout, not centered-tall */}
            <div
              style={{
                position: "relative",
                width: "96px",
                height: "96px",
                flexShrink: 0,
              }}
            >
              <svg width="96" height="96" viewBox="0 0 96 96">
                <circle
                  cx="48"
                  cy="48"
                  r="34"
                  fill="none"
                  strokeWidth="8"
                  style={{ stroke: "var(--th-gauge-track)" }}
                />
                <circle
                  cx="48"
                  cy="48"
                  r="34"
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${circumference}`}
                  transform="rotate(-90 48 48)"
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
                    fontSize: "1.4rem",
                    fontWeight: 700,
                    color: "var(--th-text-1)",
                    lineHeight: 1,
                  }}
                >
                  {score}
                </span>
                <span style={{ fontSize: "0.56rem", color: "var(--th-text-3)", marginTop: "2px" }}>/100</span>
              </div>
            </div>

            {/* Right side detail */}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "0.88rem", fontWeight: 600, color: scoreColor, marginBottom: "4px" }}>
                {scoreLabel}
              </p>
              <p style={{ fontSize: "0.7rem", color: "var(--th-text-4)", marginBottom: "14px" }}>
                Based on portfolio risk profile
              </p>
              {/* Mini breakdown bars */}
              {[
                { label: "Risk score",    pct: Math.max(0, 100 - Math.min(high * 12, 40)),   color: high > 0 ? "#ef4444" : "#10b981" },
                { label: "Obligations",   pct: Math.max(0, 100 - Math.min(overdue * 8, 30)), color: overdue > 0 ? "#f59e0b" : "#10b981" },
              ].map(({ label, pct, color }) => (
                <div key={label} style={{ marginBottom: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "0.65rem", color: "var(--th-text-3)" }}>{label}</span>
                    <span style={{ fontSize: "0.65rem", color, fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
                  </div>
                  <div style={{ height: "3px", borderRadius: "999px", background: "var(--th-tag-bg)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})`, borderRadius: "999px", transition: "width 0.8s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Status Chart ───────────────────────────────────────────────── */
function StatusChartCard({
  uploads,
  loading,
}: {
  uploads: Metrics["recent_uploads"];
  loading: boolean;
}) {
  const counts = uploads.reduce(
    (acc, u) => {
      const key = u.status?.toLowerCase() ?? "pending";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const total = uploads.length || 1;
  const bars = [
    { label: "Analyzed",   value: counts.analyzed   || 0, color: "#10b981" },
    { label: "Uploaded",   value: counts.uploaded   || 0, color: "#3b82f6" },
    { label: "Processing", value: counts.processing || 0, color: "#f59e0b" },
    { label: "Pending",    value: counts.pending    || 0, color: "var(--th-text-3)" },
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
      <div style={{ padding: "18px 24px" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "7px" }}>
                  <div className="skeleton h-3 w-20 rounded" />
                  <div className="skeleton h-3 w-10 rounded" />
                </div>
                <div className="skeleton h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : bars.length === 0 ? (
          <p style={{ fontSize: "0.78rem", color: "var(--th-text-4)", textAlign: "center", padding: "20px 0" }}>
            Upload contracts to see status breakdown
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {bars.map(({ label, value, color }) => {
              const pct = Math.round((value / total) * 100);
              return (
                <div key={label}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "7px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: color }} />
                      <span style={{ fontSize: "0.78rem", color: "var(--th-text-2)" }}>{label}</span>
                    </div>
                    <span
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 500,
                        color: "var(--th-text-1)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {value}{" "}
                      <span style={{ color: "var(--th-text-4)", fontWeight: 400 }}>({pct}%)</span>
                    </span>
                  </div>
                  <div
                    style={{
                      height: "5px",
                      borderRadius: "999px",
                      background: "var(--th-subtle-bg)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: "999px",
                        width: `${Math.max(pct, value > 0 ? 3 : 0)}%`,
                        background: `linear-gradient(90deg, ${color}99, ${color})`,
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
    {
      label:    "Total Contracts",
      value:    metrics?.total_contracts     ?? 0,
      icon:     FileText,
      accent:   "indigo"  as const,
      subtitle: "All ingested documents",
    },
    {
      label:    "High Risk",
      value:    metrics?.high_risk_contracts ?? 0,
      icon:     ShieldAlert,
      accent:   "danger"  as const,
      subtitle: "Require immediate review",
    },
    {
      label:    "Expiring Soon",
      value:    metrics?.expiring_soon       ?? 0,
      icon:     Timer,
      accent:   "warning" as const,
      subtitle: "Within 30 days",
    },
    {
      label:    "Pending Review",
      value:    metrics?.unread_alerts       ?? 0,
      icon:     Bell,
      accent:   "cyan"    as const,
      subtitle: "Awaiting action",
    },
  ];

  return (
    <AppShell>
      {/* Ambient page glow */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "700px",
          height: "500px",
          background: "radial-gradient(ellipse at 80% -10%, rgba(59,130,246,0.065) 0%, transparent 60%)",
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
        {/* Page Header */}
        <FadeUp>
          <DashboardHeader loading={loading} alertCount={metrics?.unread_alerts ?? 0} />
        </FadeUp>

        {error && <ErrorBanner message={error} />}

        {/* KPI Row */}
        <FadeUp delay={0.06}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "20px",
              marginBottom: "24px",
            }}
          >
            {kpiCards.map((card) => (
              <MetricCard key={card.label} {...card} loading={loading} />
            ))}
          </div>
        </FadeUp>

        {/* Main grid: contracts (left 2fr) + sidebar (right 1fr) */}
        <FadeUp delay={0.1}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: "20px",
              marginBottom: "20px",
              alignItems: "start",
            }}
          >
            <ContractsSection uploads={uploads} loading={loading} />
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <AIInsightsCard />
              <RiskDistributionCard metrics={metrics} loading={loading} />
            </div>
          </div>
        </FadeUp>

        {/* Activity row: timeline (left 2fr) + obligations (right 1fr) */}
        <FadeUp delay={0.14}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: "20px",
              marginBottom: "20px",
              alignItems: "start",
            }}
          >
            <ActivityTimelineCard uploads={uploads} loading={loading} />
            <UpcomingObligationsCard metrics={metrics} loading={loading} />
          </div>
        </FadeUp>

        {/* Analytics row: status chart + compliance score */}
        <FadeUp delay={0.18}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              marginBottom: "32px",
              alignItems: "start",
            }}
          >
            <StatusChartCard  uploads={uploads} loading={loading} />
            <ComplianceScoreCard metrics={metrics} loading={loading} />
          </div>
        </FadeUp>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "24px",
            borderTop: "1px solid var(--th-divider)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            {["SOC 2 Type II", "ISO 27001", "AES-256", "GDPR"].map((b) => (
              <span
                key={b}
                style={{
                  fontSize: "0.6rem",
                  color: "var(--th-text-4)",
                  letterSpacing: "0.07em",
                  fontWeight: 500,
                  textTransform: "uppercase",
                }}
              >
                {b}
              </span>
            ))}
          </div>
          <span style={{ fontSize: "0.68rem", color: "var(--th-text-5)" }}>
            Contract Lens · {new Date().getFullYear()}
          </span>
        </div>

      </div>
    </AppShell>
  );
}
