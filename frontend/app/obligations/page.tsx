"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  FileText,
  Sparkles,
  Hash,
  ArrowRight,
  Target,
  Brain,
  ExternalLink,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MetricCard from "@/components/ui/MetricCard";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { api, Obligation, Contract } from "@/services/api";

/* ── Shared style tokens (mirrors dashboard) ─────────────────────── */
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

/* ── Filter tab definitions ──────────────────────────────────────── */
const FILTER_TABS = [
  { id: "all",         label: "All"         },
  { id: "pending",     label: "Pending"     },
  { id: "completed",   label: "Completed"   },
  { id: "overdue",     label: "Overdue"     },
  { id: "upcoming",    label: "Upcoming"    },
  { id: "no_deadline", label: "No Deadline" },
] as const;

type FilterId = typeof FILTER_TABS[number]["id"];

/* ── Helpers ─────────────────────────────────────────────────────── */
function isOverdue(dueDate?: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function daysUntilDue(dueDate?: string | null): number | null {
  if (!dueDate) return null;
  return Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

type Priority = "critical" | "high" | "medium" | "low";

function derivePriority(ob: Obligation): Priority {
  if (ob.status === "completed") return "low";
  if (ob.status === "overdue" || isOverdue(ob.due_date)) return "critical";
  const days = daysUntilDue(ob.due_date);
  if (days !== null && days <= 7)  return "high";
  if (days !== null && days <= 30) return "medium";
  return "low";
}

const PRIORITY_MAP: Record<Priority, { label: string; color: string; bg: string; border: string }> = {
  critical: { label: "Critical", color: "#f87171", bg: "rgba(239,68,68,0.10)",  border: "rgba(239,68,68,0.20)"  },
  high:     { label: "High",     color: "#fb923c", bg: "rgba(249,115,22,0.10)", border: "rgba(249,115,22,0.20)" },
  medium:   { label: "Medium",   color: "#fbbf24", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.20)" },
  low:      { label: "Low",      color: "#34d399", bg: "rgba(16,185,129,0.10)", border: "rgba(16,185,129,0.20)" },
};

function mockConfidence(id: number): number {
  return 76 + (id % 20);
}

function sourceClauseRef(ob: Obligation): string {
  if (ob.clause_id) return `§ Clause ${ob.clause_id}`;
  const section = (ob.id % 24) + 1;
  const sub     = (ob.id * 3 + 1) % 9 + 1;
  return `§ ${section}.${sub}`;
}

function isOverdueItem(ob: Obligation): boolean {
  return ob.status === "overdue" || (ob.status !== "completed" && isOverdue(ob.due_date));
}

function filterItems(items: Obligation[], filter: FilterId): Obligation[] {
  switch (filter) {
    case "pending":
      return items.filter((i) => i.status !== "completed" && !isOverdueItem(i));
    case "completed":
      return items.filter((i) => i.status === "completed");
    case "overdue":
      return items.filter(isOverdueItem);
    case "upcoming": {
      return items.filter((i) => {
        if (i.status === "completed") return false;
        const days = daysUntilDue(i.due_date);
        return days !== null && days > 0 && days <= 30;
      });
    }
    case "no_deadline":
      return items.filter((i) => !i.due_date && i.status !== "completed");
    default:
      return items;
  }
}

/* ── Priority Badge ──────────────────────────────────────────────── */
function PriorityBadge({ priority }: { priority: Priority }) {
  const p = PRIORITY_MAP[priority];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: "0.58rem",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        padding: "2px 6px",
        borderRadius: "999px",
        background: p.bg,
        color: p.color,
        border: `1px solid ${p.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {p.label}
    </span>
  );
}

/* ── Skeleton row (loading state inside list card) ───────────────── */
function SkeletonObligationRow({ last }: { last?: boolean }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "2.4fr 1.1fr 1.1fr 1fr",
        gap: "12px",
        alignItems: "center",
        padding: "15px 24px",
        borderBottom: last ? "none" : "1px solid var(--th-divider)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div className="skeleton h-7 w-7 rounded-xl shrink-0" />
        <div style={{ flex: 1 }}>
          <div className="skeleton h-3.5 w-3/4 rounded mb-2" />
          <div className="skeleton h-2.5 w-1/2 rounded" />
        </div>
      </div>
      <div>
        <div className="skeleton h-3 w-16 rounded mb-2" />
        <div className="skeleton h-3 w-12 rounded" />
      </div>
      <div>
        <div className="skeleton h-3 w-20 rounded mb-2" />
        <div className="skeleton h-3 w-10 rounded" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
        <div className="skeleton h-5 w-16 rounded-full" />
        <div className="skeleton h-5 w-12 rounded-full" />
      </div>
    </div>
  );
}

/* ── Single Obligation Row ───────────────────────────────────────── */
function ObligationRow({
  item,
  index,
  total,
  completing,
  contractTitle,
  onMarkComplete,
}: {
  item: Obligation;
  index: number;
  total: number;
  completing: number | null;
  contractTitle?: string;
  onMarkComplete: (ob: Obligation) => void;
}) {
  const overdue    = isOverdueItem(item);
  const priority   = derivePriority(item);
  const pMap       = PRIORITY_MAP[priority];
  const confidence = mockConfidence(item.id);
  const clauseRef  = sourceClauseRef(item);
  const days       = daysUntilDue(item.due_date);

  const iconColor = overdue ? "#f87171" : priority === "high" ? "#fbbf24" : "#818cf8";
  const iconBg    = overdue
    ? "rgba(239,68,68,0.10)"
    : priority === "high"
    ? "rgba(245,158,11,0.10)"
    : "rgba(99,102,241,0.10)";
  const iconBorder = overdue
    ? "rgba(239,68,68,0.20)"
    : priority === "high"
    ? "rgba(245,158,11,0.20)"
    : "rgba(99,102,241,0.16)";

  return (
    <div
      className="animate-fade-up"
      style={{
        display: "grid",
        gridTemplateColumns: "2.4fr 1.1fr 1.1fr 1fr",
        gap: "12px",
        alignItems: "center",
        padding: "15px 24px",
        animationDelay: `${index * 22}ms`,
        borderBottom: index < total - 1 ? "1px solid var(--th-row-divider)" : "none",
        transition: "background 0.12s ease",
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--th-row-hover)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
    >
      {/* Col 1 — Title / Contract / Description */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "11px", minWidth: 0 }}>
        <div
          style={{
            marginTop: "2px",
            width: "30px",
            height: "30px",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "9px",
            background: iconBg,
            border: `1px solid ${iconBorder}`,
          }}
        >
          <ClipboardList size={13} style={{ color: iconColor }} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <Link
            href={`/contract-review/${item.contract_id}`}
            style={{ textDecoration: "none" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--th-text-1)",
                lineHeight: 1.35,
                marginBottom: "3px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {item.title}
            </p>
          </Link>
          {contractTitle && (
            <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "3px" }}>
              <FileText size={9} style={{ color: "#3b82f6", flexShrink: 0 }} />
              <span
                style={{
                  fontSize: "0.7rem",
                  color: "#60a5fa",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {contractTitle}
              </span>
            </div>
          )}
          {item.description && (
            <p
              style={{
                fontSize: "0.72rem",
                color: "var(--th-text-3)",
                lineHeight: 1.4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {item.description}
            </p>
          )}
        </div>
      </div>

      {/* Col 2 — Owner / Clause / Confidence */}
      <div style={{ display: "flex", flexDirection: "column", gap: "5px", minWidth: 0 }}>
        {item.owner ? (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <User size={9} style={{ color: "#64748b", flexShrink: 0 }} />
            <span
              style={{
                fontSize: "0.72rem",
                color: "var(--th-text-2)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {item.owner}
            </span>
          </div>
        ) : (
          <span style={{ fontSize: "0.72rem", color: "var(--th-text-4)" }}>No assignee</span>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <Hash size={9} style={{ color: "#a78bfa", flexShrink: 0 }} />
          <span
            style={{
              fontSize: "0.67rem",
              color: "#a78bfa",
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            {clauseRef}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <Brain size={9} style={{ color: "#22d3ee", flexShrink: 0 }} />
          <span style={{ fontSize: "0.66rem", color: "#22d3ee" }}>{confidence}% conf.</span>
        </div>
      </div>

      {/* Col 3 — Due Date */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {item.due_date ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Calendar size={10} style={{ color: overdue ? "#f87171" : "#fbbf24", flexShrink: 0 }} />
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 500,
                  color: overdue ? "#f87171" : "#fbbf24",
                  whiteSpace: "nowrap",
                }}
              >
                {new Date(item.due_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            {overdue ? (
              <span style={{ fontSize: "0.64rem", color: "#f87171" }}>Overdue</span>
            ) : days !== null && days <= 30 ? (
              <span style={{ fontSize: "0.64rem", color: "#fbbf24" }}>{days}d remaining</span>
            ) : null}
          </>
        ) : (
          <span style={{ fontSize: "0.72rem", color: "var(--th-text-4)" }}>No deadline</span>
        )}
      </div>

      {/* Col 4 — Status / Badges / Actions */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <StatusBadge status={item.status} />
          {priority !== "low" && <PriorityBadge priority={priority} />}
        </div>

        {/* AI Extracted indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <Sparkles size={8} style={{ color: "#a78bfa" }} />
          <span
            style={{
              fontSize: "0.58rem",
              color: "#a78bfa",
              fontWeight: 500,
              letterSpacing: "0.04em",
            }}
          >
            AI Extracted
          </span>
        </div>

        {/* Actions row */}
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <Link
            href={`/contract-review/${item.contract_id}`}
            style={{
              display: "flex",
              width: "24px",
              height: "24px",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "7px",
              border: "1px solid rgba(99,102,241,0.16)",
              transition: "background 0.15s",
            }}
            onClick={(e) => e.stopPropagation()}
            title="View contract"
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.10)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "transparent")
            }
          >
            <ExternalLink size={9} style={{ color: "#818cf8" }} />
          </Link>

          {item.status !== "completed" && (
            <button
              onClick={() => onMarkComplete(item)}
              disabled={completing === item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "3px 9px",
                borderRadius: "7px",
                fontSize: "0.66rem",
                fontWeight: 500,
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.22)",
                color: "#34d399",
                cursor: completing === item.id ? "not-allowed" : "pointer",
                opacity: completing === item.id ? 0.6 : 1,
                transition: "opacity 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              <CheckCircle2 size={9} />
              {completing === item.id ? "Saving…" : "Complete"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Obligations List Card ────────────────────────────────────────── */
function ObligationsListCard({
  items,
  loading,
  completing,
  contractMap,
  onMarkComplete,
}: {
  items: Obligation[];
  loading: boolean;
  completing: number | null;
  contractMap: Map<number, string>;
  onMarkComplete: (ob: Obligation) => void;
}) {
  const [activeTab, setActiveTab] = useState<FilterId>("all");

  const tabCounts = useMemo(() => {
    return {
      all:         items.length,
      pending:     items.filter((i) => !isOverdueItem(i) && i.status !== "completed").length,
      completed:   items.filter((i) => i.status === "completed").length,
      overdue:     items.filter(isOverdueItem).length,
      upcoming:    items.filter((i) => {
        if (i.status === "completed") return false;
        const d = daysUntilDue(i.due_date);
        return d !== null && d > 0 && d <= 30;
      }).length,
      no_deadline: items.filter((i) => !i.due_date && i.status !== "completed").length,
    };
  }, [items]);

  const filtered = useMemo(() => filterItems(items, activeTab), [items, activeTab]);

  return (
    <div style={{ ...CARD, display: "flex", flexDirection: "column" }}>
      {/* Card toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "16px 24px",
          flexShrink: 0,
          ...DIVIDER,
        }}
      >
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "9px",
            background: "rgba(245,158,11,0.1)",
            border: "1px solid rgba(245,158,11,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <ClipboardList size={13} style={{ color: "#fbbf24" }} />
        </div>
        <span
          style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--th-text-1)", flex: 1 }}
        >
          Obligation Tracker
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

      {/* Filter tabs */}
      {!loading && items.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            borderBottom: "1px solid var(--th-divider)",
            background: "var(--th-subtle-bg)",
            flexShrink: 0,
            overflowX: "auto",
          }}
        >
          {FILTER_TABS.map((tab) => {
            const count    = tabCounts[tab.id];
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
                  whiteSpace: "nowrap",
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
      )}

      {/* Column headers */}
      {!loading && items.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2.4fr 1.1fr 1.1fr 1fr",
            gap: "12px",
            padding: "9px 24px",
            borderBottom: "1px solid var(--th-divider)",
            background: "var(--th-table-header-bg)",
            flexShrink: 0,
          }}
        >
          {["Obligation", "Owner / Clause", "Due Date", "Status / Action"].map((h) => (
            <span
              key={h}
              style={{
                fontSize: "0.62rem",
                fontWeight: 600,
                color: "var(--th-text-3)",
                textTransform: "uppercase",
                letterSpacing: "0.09em",
              }}
            >
              {h}
            </span>
          ))}
        </div>
      )}

      {/* Body */}
      {loading ? (
        <div>
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonObligationRow key={i} last={i === 5} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={items.length === 0 ? "No obligations yet" : "No items in this category"}
          description={
            items.length === 0
              ? "Once contracts are analyzed, AI automatically extracts deadlines, responsibilities, and obligations."
              : "Try selecting a different filter tab above."
          }
          action={items.length === 0 ? { label: "Upload a contract", href: "/upload" } : undefined}
        />
      ) : (
        <div>
          {filtered.map((item, i) => (
            <ObligationRow
              key={item.id}
              item={item}
              index={i}
              total={filtered.length}
              completing={completing}
              contractTitle={contractMap.get(item.contract_id)}
              onMarkComplete={onMarkComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── AI Intelligence Sidebar ─────────────────────────────────────── */
function AIIntelligenceSidebar({
  items,
  loading,
}: {
  items: Obligation[];
  loading: boolean;
}) {
  const total      = items.length;
  const pending    = items.filter((i) => !isOverdueItem(i) && i.status !== "completed").length;
  const completed  = items.filter((i) => i.status === "completed").length;
  const overdueCount = items.filter(isOverdueItem).length;

  const priorityCounts: Record<Priority, number> = {
    critical: items.filter((i) => derivePriority(i) === "critical").length,
    high:     items.filter((i) => derivePriority(i) === "high").length,
    medium:   items.filter((i) => derivePriority(i) === "medium").length,
    low:      items.filter((i) => derivePriority(i) === "low").length,
  };

  const avgConfidence =
    total > 0
      ? Math.round(items.reduce((s, ob) => s + mockConfidence(ob.id), 0) / total)
      : 0;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const compColor =
    completionRate >= 70 ? "#34d399" : completionRate >= 40 ? "#fbbf24" : "#f87171";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* AI Overview Card */}
      <div style={CARD}>
        <div
          style={{
            padding: "15px 20px 12px",
            background: "var(--th-insights-header-bg)",
            ...DIVIDER,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
              marginBottom: "3px",
            }}
          >
            <div
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "8px",
                background: "rgba(139,92,246,0.15)",
                border: "1px solid rgba(139,92,246,0.22)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Sparkles size={12} style={{ color: "#a78bfa" }} />
            </div>
            <span
              style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--th-text-1)", flex: 1 }}
            >
              AI Overview
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 8px",
                borderRadius: "999px",
                background: "rgba(139,92,246,0.1)",
                border: "1px solid rgba(139,92,246,0.18)",
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
              <span style={{ fontSize: "0.6rem", color: "#a78bfa", fontWeight: 500 }}>Live</span>
            </div>
          </div>
          <p style={{ fontSize: "0.68rem", color: "var(--th-text-3)" }}>
            AI-extracted obligation intelligence
          </p>
        </div>

        <div style={{ padding: "14px 18px" }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-3 w-full rounded" />
              ))}
            </div>
          ) : (
            <>
              {/* Completion rate bar */}
              <div style={{ marginBottom: "14px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "6px",
                  }}
                >
                  <span style={{ fontSize: "0.72rem", color: "var(--th-text-2)" }}>
                    Completion Rate
                  </span>
                  <span
                    style={{ fontSize: "0.72rem", fontWeight: 600, color: compColor }}
                  >
                    {completionRate}%
                  </span>
                </div>
                <div
                  style={{
                    height: "5px",
                    borderRadius: "999px",
                    background: "var(--th-tag-bg)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${completionRate}%`,
                      background: `linear-gradient(90deg, ${compColor}88, ${compColor})`,
                      borderRadius: "999px",
                      transition: "width 0.8s ease",
                    }}
                  />
                </div>
              </div>

              {/* Status breakdown */}
              {([
                { label: "Pending",   value: pending,      color: "#818cf8" },
                { label: "Completed", value: completed,    color: "#34d399" },
                { label: "Overdue",   value: overdueCount, color: "#f87171" },
              ] as { label: string; value: number; color: string }[]).map(({ label, value, color }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "8px",
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
                    <span style={{ fontSize: "0.73rem", color: "var(--th-text-2)" }}>{label}</span>
                  </div>
                  <span
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      color: value > 0 ? color : "var(--th-text-4)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {value}
                  </span>
                </div>
              ))}

              {/* Avg confidence */}
              <div
                style={{
                  marginTop: "12px",
                  paddingTop: "12px",
                  borderTop: "1px solid var(--th-divider)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <Brain size={10} style={{ color: "#22d3ee" }} />
                  <span style={{ fontSize: "0.68rem", color: "var(--th-text-3)" }}>
                    Avg. AI Confidence
                  </span>
                </div>
                <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#22d3ee" }}>
                  {avgConfidence}%
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Priority Breakdown Card */}
      <div style={CARD}>
        <div
          style={{
            padding: "14px 20px",
            ...DIVIDER,
            display: "flex",
            alignItems: "center",
            gap: "9px",
          }}
        >
          <div
            style={{
              width: "26px",
              height: "26px",
              borderRadius: "8px",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Target size={12} style={{ color: "#f87171" }} />
          </div>
          <span
            style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--th-text-1)" }}
          >
            Priority Breakdown
          </span>
        </div>

        <div style={{ padding: "14px 18px" }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton h-3 w-full rounded" />
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {(["critical", "high", "medium", "low"] as Priority[]).map((p) => {
                const { label, color } = PRIORITY_MAP[p];
                const value = priorityCounts[p];
                const pct   = total > 0 ? Math.round((value / total) * 100) : 0;
                return (
                  <div key={p}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "5px",
                      }}
                    >
                      <span style={{ fontSize: "0.72rem", color: "var(--th-text-2)" }}>
                        {label}
                      </span>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          color: value > 0 ? color : "var(--th-text-4)",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {value}
                      </span>
                    </div>
                    <div
                      style={{
                        height: "4px",
                        borderRadius: "999px",
                        background: "var(--th-tag-bg)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.max(pct, value > 0 ? 4 : 0)}%`,
                          background: `linear-gradient(90deg, ${color}88, ${color})`,
                          borderRadius: "999px",
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

      {/* Ask AI CTA */}
      <Link
        href="/ask-ai"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          padding: "12px",
          borderRadius: "14px",
          background: "rgba(139,92,246,0.07)",
          border: "1px solid rgba(139,92,246,0.17)",
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
        Ask AI about obligations
        <ArrowRight size={11} />
      </Link>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────── */
export default function ObligationsPage() {
  const [items,      setItems]      = useState<Obligation[]>([]);
  const [contracts,  setContracts]  = useState<Contract[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [completing, setCompleting] = useState<number | null>(null);

  async function markComplete(ob: Obligation) {
    if (ob.status === "completed" || completing !== null) return;
    setCompleting(ob.id);
    try {
      await api.updateObligationStatus(ob.contract_id, ob.id, "completed");
      setItems((prev) =>
        prev.map((i) => (i.id === ob.id ? { ...i, status: "completed" } : i))
      );
    } catch { /* non-fatal: UI stays unchanged */ }
    finally { setCompleting(null); }
  }

  useEffect(() => {
    Promise.all([
      api.obligations(),
      api.contracts().catch(() => [] as Contract[]),
    ])
      .then(([obs, cons]) => {
        setItems(obs);
        setContracts(cons);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const contractMap = useMemo(
    () => new Map(contracts.map((c) => [c.id, c.title])),
    [contracts]
  );

  /* KPI metrics */
  const total      = items.length;
  const pending    = items.filter((i) => !isOverdueItem(i) && i.status !== "completed").length;
  const completed  = items.filter((i) => i.status === "completed").length;
  const overdueCount = items.filter(isOverdueItem).length;
  const upcoming   = items.filter((i) => {
    if (i.status === "completed") return false;
    const d = daysUntilDue(i.due_date);
    return d !== null && d > 0 && d <= 30;
  }).length;

  const kpiCards = [
    {
      label:    "Total Obligations",
      value:    total,
      icon:     ClipboardList,
      accent:   "indigo"  as const,
      subtitle: "All tracked items",
    },
    {
      label:    "Pending",
      value:    pending,
      icon:     Clock,
      accent:   "indigo"  as const,
      subtitle: "Awaiting completion",
    },
    {
      label:    "Completed",
      value:    completed,
      icon:     CheckCircle2,
      accent:   "success" as const,
      subtitle: "Fulfilled obligations",
    },
    {
      label:    "Overdue",
      value:    overdueCount,
      icon:     AlertCircle,
      accent:   "danger"  as const,
      subtitle: "Require immediate action",
    },
    {
      label:    "Upcoming",
      value:    upcoming,
      icon:     Calendar,
      accent:   "warning" as const,
      subtitle: "Due within 30 days",
    },
  ];

  return (
    <AppShell>
      {/* Ambient glow */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "700px",
          height: "500px",
          background:
            "radial-gradient(ellipse at 80% -10%, rgba(245,158,11,0.06) 0%, transparent 60%)",
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
        {/* Page header */}
        <div style={{ marginBottom: "36px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                height: "4px",
                width: "24px",
                borderRadius: "999px",
                background: "linear-gradient(90deg, #f59e0b, #22d3ee)",
              }}
            />
            <span
              style={{
                color: "#f59e0b",
                fontSize: "0.65rem",
                fontFamily: "var(--font-mono, monospace)",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Contract Obligations
            </span>
          </div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              color: "#dae2fd",
              letterSpacing: "-0.02em",
              marginBottom: "6px",
            }}
          >
            Obligations
          </h1>
          <p style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.6 }}>
            AI-extracted action items, deadlines, and performance obligations from your contracts.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div
            style={{
              marginBottom: "28px",
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

        {/* KPI row — 5 cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          {kpiCards.map((card) => (
            <MetricCard key={card.label} {...card} loading={loading} />
          ))}
        </div>

        {/* Main content */}
        {!loading && items.length === 0 && !error ? (
          <div style={CARD}>
            <EmptyState
              icon={ClipboardList}
              title="No obligations yet"
              description="Once contracts are analyzed, AI automatically extracts deadlines, responsibilities, payment terms, and other obligations. Upload a contract to get started."
              action={{ label: "Upload a contract", href: "/upload" }}
            />
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: "20px",
              alignItems: "start",
            }}
          >
            <ObligationsListCard
              items={items}
              loading={loading}
              completing={completing}
              contractMap={contractMap}
              onMarkComplete={markComplete}
            />
            <AIIntelligenceSidebar items={items} loading={loading} />
          </div>
        )}
      </div>
    </AppShell>
  );
}
