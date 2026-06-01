"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Bell,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  ClipboardList,
  Timer,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import GlassCard from "@/components/ui/GlassCard";
import EmptyState from "@/components/ui/EmptyState";
import { api, Alert, Contract } from "@/services/api";

/* ── Alert type config ────────────────────────────────────────────── */
const TYPE_MAP: Record<string, { color: string; bg: string; border: string; label: string }> = {
  expiring_soon:    { color: "#f87171", bg: "rgba(239,68,68,0.10)",  border: "rgba(239,68,68,0.20)",  label: "Expiring Soon"    },
  renewal_upcoming: { color: "#fbbf24", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.20)", label: "Renewal Upcoming" },
  due_soon:         { color: "#fbbf24", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.16)", label: "Due Soon"         },
  overdue:          { color: "#f87171", bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.16)",  label: "Overdue"          },
  high_risk:        { color: "#f87171", bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.16)",  label: "High Risk"        },
};
const DEFAULT_TYPE = {
  color: "#818cf8", bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.16)", label: "Alert",
};

function alertConfig(raw: string) {
  return (
    TYPE_MAP[raw?.toLowerCase()] ?? {
      ...DEFAULT_TYPE,
      label: raw?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ?? "Alert",
    }
  );
}

function alertIcon(alertType: string): React.ComponentType<{ size?: number; style?: React.CSSProperties }> {
  const t = alertType?.toLowerCase();
  if (t === "high_risk")                    return ShieldAlert;
  if (t === "overdue" || t === "due_soon")  return ClipboardList;
  if (t === "expiring_soon" || t === "renewal_upcoming") return Timer;
  return Bell;
}

/* ── Backend message parsers ─────────────────────────────────────── */

function extractRiskName(message: string | null | undefined): string | null {
  if (!message) return null;
  const m = message.match(/high risk found:\s*(.+)/i);
  return m ? m[1].trim() : null;
}

function extractObligationName(message: string | null | undefined): string | null {
  if (!message) return null;
  const m = message.match(/obligation\s+'([^']+)'/i);
  return m ? m[1].trim() : null;
}

function extractExpirationDate(message: string | null | undefined): string | null {
  if (!message) return null;
  const m = message.match(/expires on\s+(\d{4}-\d{2}-\d{2})/i);
  if (!m) return null;
  const d = new Date(m[1] + "T00:00:00");
  return isNaN(d.getTime())
    ? null
    : d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/* ── Enriched title ───────────────────────────────────────────────── */
function enrichTitle(alert: Alert): string {
  const t = alert.alert_type?.toLowerCase();
  if (t === "high_risk") {
    const name = extractRiskName(alert.message);
    return name ? `${name} Detected` : "High Risk Detected";
  }
  if (t === "overdue") {
    const name = extractObligationName(alert.message);
    return name ? `Overdue: ${name}` : "Obligation Overdue";
  }
  if (t === "due_soon") {
    const name = extractObligationName(alert.message);
    return name ? `Due Soon: ${name}` : "Obligation Due Soon";
  }
  if (t === "expiring_soon")    return "Contract Expiring Soon";
  if (t === "renewal_upcoming") return "Upcoming Contract Renewal";
  return alert.title || "Alert";
}

/* ── Concise context descriptions ────────────────────────────────── */
function enrichDescription(alert: Alert): string {
  const t = alert.alert_type?.toLowerCase();
  if (t === "high_risk") {
    const name = extractRiskName(alert.message);
    return name
      ? `${name} clause requires legal attention.`
      : "A high-severity clause was flagged for review.";
  }
  if (t === "overdue")          return "Past due — immediate action required.";
  if (t === "due_soon")         return "Assign an owner before the deadline.";
  if (t === "expiring_soon") {
    const date = extractExpirationDate(alert.message);
    return date ? `Expires ${date}.` : "Nearing expiration — initiate renewal.";
  }
  if (t === "renewal_upcoming") return "Review terms before the renewal window opens.";
  return alert.message || "";
}

/* ── Relative timestamp ───────────────────────────────────────────── */
function relativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const diffH  = Math.floor(diffMs / (1000 * 60 * 60));
  const diffD  = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffH < 1)  return "Just now";
  if (diffH < 24) return `${diffH}h ago`;
  if (diffD === 1) return "Yesterday";
  if (diffD < 7)  return `${diffD}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ── Type-aware primary action ────────────────────────────────────── */
function quickAction(
  alertType: string,
  contractId: number,
): { label: string; href: string; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }> } | null {
  const t = alertType?.toLowerCase();
  if (t === "high_risk")                   return { label: "View Risks",       href: "/risks",                   icon: ShieldAlert   };
  if (t === "overdue" || t === "due_soon") return { label: "View Obligations", href: "/obligations",             icon: ClipboardList };
  if (t === "expiring_soon")               return { label: "View Contract",    href: `/contract-review/${contractId}`, icon: Timer         };
  if (t === "renewal_upcoming")            return { label: "View Contract",    href: `/contract-review/${contractId}`, icon: Timer         };
  return null;
}

/* ── Filter tab definitions ───────────────────────────────────────── */
const FILTER_TABS = [
  { id: "all",           label: "All"           },
  { id: "unread",        label: "Unread"        },
  { id: "high_risk",     label: "High Risk"     },
  { id: "overdue",       label: "Overdue"       },
  { id: "expiring_soon", label: "Expiring Soon" },
  { id: "renewal",       label: "Renewal"       },
  { id: "read",          label: "Read"          },
];

/* ─────────────────────────────────────────────────────────────────── */

export default function AlertsPage() {
  const [alerts,    setAlerts]    = useState<Alert[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [markingAll, setMarkingAll] = useState(false);
  const [activeTab,  setActiveTab]  = useState("all");

  async function reloadAlerts() {
    const data = await api.alerts();
    setAlerts(data);
  }

  useEffect(() => {
    let active = true;
    Promise.all([
      api.alerts(),
      api.contracts().catch(() => [] as Contract[]),
    ])
      .then(([alertData, contractData]) => {
        if (!active) return;
        setAlerts(alertData);
        setContracts(contractData);
      })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const contractMap = useMemo(() => {
    const m: Record<number, Contract> = {};
    contracts.forEach((c) => { m[c.id] = c; });
    return m;
  }, [contracts]);

  const unreadAlerts = useMemo(() => alerts.filter((a) => a.status !== "read"), [alerts]);

  const tabCounts = useMemo(() => ({
    all:           alerts.length,
    unread:        alerts.filter((a) => a.status !== "read").length,
    high_risk:     alerts.filter((a) => a.alert_type?.toLowerCase() === "high_risk").length,
    overdue:       alerts.filter((a) => a.alert_type?.toLowerCase() === "overdue").length,
    expiring_soon: alerts.filter((a) => a.alert_type?.toLowerCase() === "expiring_soon").length,
    renewal:       alerts.filter((a) => a.alert_type?.toLowerCase() === "renewal_upcoming").length,
    read:          alerts.filter((a) => a.status === "read").length,
  }), [alerts]);

  const filteredAlerts = useMemo(() => {
    switch (activeTab) {
      case "unread":        return alerts.filter((a) => a.status !== "read");
      case "high_risk":     return alerts.filter((a) => a.alert_type?.toLowerCase() === "high_risk");
      case "overdue":       return alerts.filter((a) => a.alert_type?.toLowerCase() === "overdue");
      case "expiring_soon": return alerts.filter((a) => a.alert_type?.toLowerCase() === "expiring_soon");
      case "renewal":       return alerts.filter((a) => a.alert_type?.toLowerCase() === "renewal_upcoming");
      case "read":          return alerts.filter((a) => a.status === "read");
      default:              return alerts;
    }
  }, [alerts, activeTab]);

  const dedupedAlerts = useMemo(() => {
    const seen = new Set<string>();
    return filteredAlerts.filter((a) => {
      const key = `${a.alert_type}:${a.contract_id}:${a.message ?? ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [filteredAlerts]);

  const groupedAlerts = useMemo(() => {
    const todayStart     = new Date(); todayStart.setHours(0, 0, 0, 0);
    const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const todayMs     = todayStart.getTime();
    const yesterdayMs = yesterdayStart.getTime();

    const buckets: Record<"today" | "yesterday" | "earlier", Alert[]> = {
      today: [], yesterday: [], earlier: [],
    };
    for (const a of dedupedAlerts) {
      const raw = new Date(a.created_at);
      if (isNaN(raw.getTime())) { buckets.earlier.push(a); continue; }
      const dayStart = new Date(raw.getFullYear(), raw.getMonth(), raw.getDate()).getTime();
      if      (dayStart >= todayMs)     buckets.today.push(a);
      else if (dayStart >= yesterdayMs) buckets.yesterday.push(a);
      else                              buckets.earlier.push(a);
    }
    return (["today", "yesterday", "earlier"] as const)
      .filter((k) => buckets[k].length > 0)
      .map((k) => ({
        label:  k === "today" ? "Today" : k === "yesterday" ? "Yesterday" : "Earlier",
        alerts: buckets[k],
      }));
  }, [dedupedAlerts]);

  function markRead(id: number) {
    api.markAlertRead(id).then(reloadAlerts).catch(() => undefined);
  }

  async function markAllRead() {
    if (unreadAlerts.length === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      await Promise.all(unreadAlerts.map((a) => api.markAlertRead(a.id)));
      await reloadAlerts();
    } catch { /* non-fatal */ }
    finally { setMarkingAll(false); }
  }

  return (
    <AppShell>
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "700px",
          height: "500px",
          background: "radial-gradient(ellipse at 80% -10%, rgba(99,102,241,0.05) 0%, transparent 60%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          maxWidth: "860px",
          margin: "0 auto",
          padding: "48px 40px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* ── Page header ──────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <div
                style={{
                  height: "4px",
                  width: "24px",
                  borderRadius: "999px",
                  background: "linear-gradient(90deg, #6366f1, #ef4444)",
                }}
              />
              <span
                style={{
                  color: "#6366f1",
                  fontSize: "0.65rem",
                  fontFamily: "var(--font-mono, monospace)",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                Notification Center
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
              Alerts
            </h1>
            <p style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.6 }}>
              Deadline, renewal, overdue, and risk notifications across your portfolio.
            </p>
          </div>

          {!loading && unreadAlerts.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "8px 14px",
                  borderRadius: "10px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  background: "rgba(239,68,68,0.10)",
                  border: "1px solid rgba(239,68,68,0.22)",
                  color: "#f87171",
                }}
              >
                <Bell size={13} />
                {unreadAlerts.length} unread
              </div>
              <button
                onClick={markAllRead}
                disabled={markingAll}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "10px",
                  fontSize: "0.78rem",
                  fontWeight: 500,
                  background: "rgba(99,102,241,0.08)",
                  border: "1px solid rgba(99,102,241,0.20)",
                  color: "#818cf8",
                  cursor: markingAll ? "not-allowed" : "pointer",
                  opacity: markingAll ? 0.6 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                <CheckCircle2 size={13} />
                {markingAll ? "Marking…" : "Mark all read"}
              </button>
            </div>
          )}
        </div>

        {/* ── Error banner ─────────────────────────────────────────── */}
        {error && (
          <div
            style={{
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 16px",
              borderRadius: "12px",
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

        {/* ── Main content ─────────────────────────────────────────── */}
        {loading ? (
          <GlassCard>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "16px 22px",
                  borderBottom: i < 5 ? "1px solid rgba(99,102,241,0.07)" : "none",
                }}
              >
                <div className="skeleton h-8 w-8 rounded-lg shrink-0" />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <div className="skeleton h-3.5 w-52 rounded" />
                    <div className="skeleton h-3 w-12 rounded" />
                  </div>
                  <div className="skeleton h-3 w-36 rounded mb-3" />
                  <div className="skeleton h-2.5 w-64 rounded mb-3" />
                  <div className="skeleton h-5 w-24 rounded-lg" />
                </div>
              </div>
            ))}
          </GlassCard>
        ) : alerts.length === 0 ? (
          <GlassCard glow>
            <EmptyState
              icon={CheckCircle2}
              title="All clear"
              description="No alerts to display. Your portfolio is up to date."
            />
          </GlassCard>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* ── Filter tabs ───────────────────────────────────────── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "5px",
                background: "rgba(10,20,38,0.60)",
                border: "1px solid rgba(99,102,241,0.12)",
                borderRadius: "14px",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                overflowX: "auto",
              }}
            >
              {FILTER_TABS.map((tab) => {
                const count    = tabCounts[tab.id as keyof typeof tabCounts] ?? 0;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "7px 14px",
                      borderRadius: "10px",
                      fontSize: "0.78rem",
                      fontWeight: isActive ? 600 : 400,
                      background: isActive ? "rgba(99,102,241,0.18)" : "transparent",
                      border: isActive ? "1px solid rgba(99,102,241,0.28)" : "1px solid transparent",
                      color: isActive ? "#818cf8" : "#64748b",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "all 0.15s",
                    }}
                  >
                    {tab.label}
                    {count > 0 && (
                      <span
                        style={{
                          fontSize: "0.62rem",
                          padding: "1px 5px",
                          borderRadius: "999px",
                          background: isActive ? "rgba(99,102,241,0.25)" : "rgba(99,102,241,0.08)",
                          color: isActive ? "#a5b4fc" : "#475569",
                        }}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── Alert list — grouped by day ───────────────────────── */}
            {groupedAlerts.length === 0 ? (
              <GlassCard>
                <EmptyState
                  icon={CheckCircle2}
                  title="No alerts in this category"
                  description="Try selecting a different filter tab."
                />
              </GlassCard>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {groupedAlerts.map((group) => (
                  <div key={group.label}>

                    {/* ── Group header ─────────────────────────────── */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        marginBottom: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.63rem",
                          fontFamily: "var(--font-mono, monospace)",
                          fontWeight: 600,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "#64748b",
                          flexShrink: 0,
                        }}
                      >
                        {group.label}
                      </span>
                      <div style={{ flex: 1, height: "1px", background: "rgba(99,102,241,0.08)" }} />
                      <span
                        style={{
                          fontSize: "0.63rem",
                          color: "#2d3748",
                          fontVariantNumeric: "tabular-nums",
                          flexShrink: 0,
                        }}
                      >
                        {group.alerts.length}
                      </span>
                    </div>

                    {/* ── Group card ───────────────────────────────── */}
                    <GlassCard>
                      {group.alerts.map((alert, i) => {
                        const cfg         = alertConfig(alert.alert_type);
                        const IconComp    = alertIcon(alert.alert_type);
                        const contract    = contractMap[alert.contract_id];
                        const isRead      = alert.status === "read";
                        const action      = quickAction(alert.alert_type, alert.contract_id);
                        const timestamp   = relativeTime(alert.created_at) || relativeTime(alert.trigger_date);
                        const title       = enrichTitle(alert);
                        const description = enrichDescription(alert);

                        return (
                          <div
                            key={alert.id}
                            className="animate-fade-up"
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "12px",
                              padding: "14px 22px",
                              animationDelay: `${i * 30}ms`,
                              borderBottom:
                                i < group.alerts.length - 1
                                  ? "1px solid rgba(99,102,241,0.07)"
                                  : "none",
                              opacity: isRead ? 0.55 : 1,
                              transition: "opacity 0.15s",
                            }}
                          >
                            {/* Type icon */}
                            <div
                              style={{
                                marginTop: "2px",
                                display: "flex",
                                width: "30px",
                                height: "30px",
                                flexShrink: 0,
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "8px",
                                background: cfg.bg,
                                border: `1px solid ${cfg.border}`,
                              }}
                            >
                              <IconComp size={13} style={{ color: cfg.color }} />
                            </div>

                            {/* Content */}
                            <div style={{ flex: 1, minWidth: 0 }}>

                              {/* Row 1: title + unread dot + timestamp */}
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  marginBottom: "3px",
                                }}
                              >
                                <p
                                  style={{
                                    flex: 1,
                                    fontSize: "0.875rem",
                                    fontWeight: isRead ? 500 : 600,
                                    color: isRead ? "#64748b" : "#dae2fd",
                                    lineHeight: 1.4,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    minWidth: 0,
                                  }}
                                >
                                  {title}
                                </p>
                                {!isRead && (
                                  <span
                                    style={{
                                      width: "6px",
                                      height: "6px",
                                      borderRadius: "50%",
                                      background: cfg.color,
                                      flexShrink: 0,
                                      display: "inline-block",
                                    }}
                                  />
                                )}
                                {timestamp && (
                                  <span
                                    style={{
                                      fontSize: "0.7rem",
                                      color: "#374151",
                                      flexShrink: 0,
                                      fontVariantNumeric: "tabular-nums",
                                    }}
                                  >
                                    {timestamp}
                                  </span>
                                )}
                              </div>

                              {/* Row 2: contract name + due date */}
                              {(contract || alert.trigger_date) && (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    marginBottom: "5px",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  {contract && (
                                    <span
                                      style={{
                                        fontSize: "0.78rem",
                                        fontWeight: 500,
                                        color: "#60a5fa",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        maxWidth: "320px",
                                      }}
                                    >
                                      {contract.title}
                                    </span>
                                  )}
                                  {alert.trigger_date && (
                                    <>
                                      {contract && (
                                        <span style={{ color: "#475569", fontSize: "0.7rem", userSelect: "none" }}>·</span>
                                      )}
                                      <span style={{ fontSize: "0.71rem", color: "#f59e0b" }}>
                                        Due{" "}
                                        {new Date(alert.trigger_date).toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                        })}
                                      </span>
                                    </>
                                  )}
                                </div>
                              )}

                              {/* Row 3: description */}
                              {description && (
                                <p
                                  style={{
                                    fontSize: "0.78rem",
                                    color: "#475569",
                                    lineHeight: 1.5,
                                    marginBottom: "8px",
                                  }}
                                >
                                  {description}
                                </p>
                              )}

                              {/* Row 4: actions */}
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                              >
                                {action && (
                                  <Link
                                    href={action.href}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      padding: "4px 10px",
                                      borderRadius: "7px",
                                      fontSize: "0.72rem",
                                      fontWeight: 500,
                                      background: cfg.bg,
                                      border: `1px solid ${cfg.border}`,
                                      color: cfg.color,
                                      textDecoration: "none",
                                      whiteSpace: "nowrap",
                                      transition: "opacity 0.15s",
                                    }}
                                    onMouseEnter={(e) =>
                                      ((e.currentTarget as HTMLElement).style.opacity = "0.7")
                                    }
                                    onMouseLeave={(e) =>
                                      ((e.currentTarget as HTMLElement).style.opacity = "1")
                                    }
                                  >
                                    <action.icon size={10} />
                                    {action.label}
                                  </Link>
                                )}

                                <Link
                                  href={`/contract-review/${alert.contract_id}`}
                                  title="View contract"
                                  style={{
                                    display: "flex",
                                    width: "26px",
                                    height: "26px",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: "7px",
                                    border: "1px solid rgba(99,102,241,0.16)",
                                    transition: "background 0.15s",
                                  }}
                                  onMouseEnter={(e) =>
                                    ((e.currentTarget as HTMLElement).style.background =
                                      "rgba(99,102,241,0.10)")
                                  }
                                  onMouseLeave={(e) =>
                                    ((e.currentTarget as HTMLElement).style.background = "transparent")
                                  }
                                >
                                  <ExternalLink size={11} style={{ color: "#818cf8" }} />
                                </Link>

                                {!isRead && (
                                  <button
                                    onClick={() => markRead(alert.id)}
                                    style={{
                                      padding: "4px 10px",
                                      borderRadius: "7px",
                                      fontSize: "0.72rem",
                                      fontWeight: 500,
                                      border: "1px solid rgba(16,185,129,0.20)",
                                      color: "#34d399",
                                      background: "transparent",
                                      cursor: "pointer",
                                      whiteSpace: "nowrap",
                                      transition: "background 0.15s",
                                    }}
                                    onMouseEnter={(e) =>
                                      ((e.currentTarget as HTMLElement).style.background =
                                        "rgba(16,185,129,0.08)")
                                    }
                                    onMouseLeave={(e) =>
                                      ((e.currentTarget as HTMLElement).style.background = "transparent")
                                    }
                                  >
                                    Mark read
                                  </button>
                                )}
                              </div>

                            </div>
                          </div>
                        );
                      })}
                    </GlassCard>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
