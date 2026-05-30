"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, AlertCircle, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import GlassCard from "@/components/ui/GlassCard";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api, Alert } from "@/services/api";

const TYPE_MAP: Record<string, { color: string; bg: string; border: string; label: string }> = {
  expiring_soon:    { color: "#f87171", bg: "rgba(239,68,68,0.10)",  border: "rgba(239,68,68,0.20)",  label: "Expiring Soon"    },
  renewal_upcoming: { color: "#fbbf24", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.20)", label: "Renewal Upcoming" },
  due_soon:         { color: "#fbbf24", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.16)", label: "Due Soon"         },
  overdue:          { color: "#f87171", bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.16)",  label: "Overdue"          },
  high_risk:        { color: "#f87171", bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.16)",  label: "High Risk"        },
};
const DEFAULT_TYPE = { color: "#818cf8", bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.16)", label: "Alert" };

function alertTypeLabel(raw: string): string {
  return TYPE_MAP[raw?.toLowerCase()]?.label
    ?? raw?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    ?? "Alert";
}

export default function AlertsPage() {
  const [alerts, setAlerts]   = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  async function load() {
    const data = await api.alerts();
    setAlerts(data);
  }

  useEffect(() => {
    let active = true;
    api.alerts()
      .then((data) => { if (active) setAlerts(data); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const [markingAll, setMarkingAll] = useState(false);

  const unread = alerts.filter((a) => a.status !== "read");
  const read   = alerts.filter((a) => a.status === "read");

  function markRead(id: number) {
    api.markAlertRead(id).then(load).catch(() => undefined);
  }

  async function markAllRead() {
    if (unread.length === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      await Promise.all(unread.map((a) => api.markAlertRead(a.id)));
      await load();
    } catch { /* non-fatal */ }
    finally { setMarkingAll(false); }
  }

  return (
    <AppShell>
      {/* Ambient glow — consistent with dashboard / risks / analytics */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "700px",
          height: "500px",
          background:
            "radial-gradient(ellipse at 80% -10%, rgba(99,102,241,0.05) 0%, transparent 60%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ── Page container — matches dashboard / risks / analytics pattern ── */}
      <div
        style={{
          maxWidth: "1380px",
          margin: "0 auto",
          padding: "48px 52px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* ── Page header ──────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          <div>
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

          {/* Unread count badge + Mark all read */}
          {unread.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "9px 16px",
                  borderRadius: "12px",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  background: "rgba(239,68,68,0.10)",
                  border: "1px solid rgba(239,68,68,0.22)",
                  color: "#f87171",
                }}
              >
                <Bell size={14} />
                {unread.length} unread
              </div>
              <button
                onClick={markAllRead}
                disabled={markingAll}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "9px 16px",
                  borderRadius: "12px",
                  fontSize: "0.82rem",
                  fontWeight: 500,
                  background: "rgba(99,102,241,0.08)",
                  border: "1px solid rgba(99,102,241,0.20)",
                  color: "#818cf8",
                  cursor: markingAll ? "not-allowed" : "pointer",
                  opacity: markingAll ? 0.6 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                <CheckCircle2 size={14} />
                {markingAll ? "Marking…" : "Mark all read"}
              </button>
            </div>
          )}
        </div>

        {/* ── Error banner ─────────────────────────────────────────────── */}
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

        {/* ── Content ──────────────────────────────────────────────────── */}
        {loading ? (
          <LoadingState rows={5} type="list" />
        ) : alerts.length === 0 ? (
          <GlassCard glow>
            <EmptyState
              icon={CheckCircle2}
              title="All clear"
              description="No alerts to display. Your portfolio is up to date."
            />
          </GlassCard>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

            {/* ── Unread alerts ─────────────────────────────────────── */}
            {unread.length > 0 && (
              <div>
                <p
                  style={{
                    fontSize: "0.62rem",
                    fontFamily: "var(--font-mono, monospace)",
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#6366f1",
                    marginBottom: "14px",
                  }}
                >
                  Unread — {unread.length}
                </p>
                <GlassCard>
                  {unread.map((alert, i) => {
                    const t = TYPE_MAP[alert.alert_type?.toLowerCase()] ?? DEFAULT_TYPE;
                    return (
                      <div
                        key={alert.id}
                        className="animate-fade-up"
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "16px",
                          padding: "18px 28px",
                          animationDelay: `${i * 40}ms`,
                          borderBottom:
                            i < unread.length - 1
                              ? "1px solid rgba(99,102,241,0.07)"
                              : "none",
                        }}
                      >
                        {/* Type icon */}
                        <div
                          style={{
                            marginTop: "2px",
                            display: "flex",
                            width: "34px",
                            height: "34px",
                            flexShrink: 0,
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "10px",
                            background: t.bg,
                            border: `1px solid ${t.border}`,
                          }}
                        >
                          <Bell size={14} style={{ color: t.color }} />
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              justifyContent: "space-between",
                              gap: "12px",
                              marginBottom: "5px",
                            }}
                          >
                            <p
                              style={{
                                fontSize: "0.88rem",
                                fontWeight: 600,
                                color: "#dae2fd",
                                lineHeight: 1.4,
                              }}
                            >
                              {alert.title}
                            </p>
                            <span
                              style={{
                                flexShrink: 0,
                                fontSize: "0.6rem",
                                fontFamily: "var(--font-mono, monospace)",
                                fontWeight: 600,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                background: t.bg,
                                color: t.color,
                                border: `1px solid ${t.border}`,
                              }}
                            >
                              {alertTypeLabel(alert.alert_type)}
                            </span>
                          </div>
                          {alert.message && (
                            <p
                              style={{
                                fontSize: "0.78rem",
                                color: "#64748b",
                                lineHeight: 1.6,
                                marginBottom: "6px",
                              }}
                            >
                              {alert.message}
                            </p>
                          )}
                          {alert.trigger_date && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "5px",
                                fontSize: "0.73rem",
                                color: "#f59e0b",
                              }}
                            >
                              <Clock size={10} />
                              {new Date(alert.trigger_date).toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            flexShrink: 0,
                          }}
                        >
                          <Link
                            href={`/contracts/${alert.contract_id}`}
                            style={{
                              display: "flex",
                              width: "30px",
                              height: "30px",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "8px",
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
                          <button
                            onClick={() => markRead(alert.id)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "8px",
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              border: "1px solid rgba(16,185,129,0.20)",
                              color: "#34d399",
                              background: "transparent",
                              cursor: "pointer",
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
                        </div>
                      </div>
                    );
                  })}
                </GlassCard>
              </div>
            )}

            {/* ── Read alerts ───────────────────────────────────────── */}
            {read.length > 0 && (
              <div>
                <p
                  style={{
                    fontSize: "0.62rem",
                    fontFamily: "var(--font-mono, monospace)",
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#3a4560",
                    marginBottom: "14px",
                  }}
                >
                  Read — {read.length}
                </p>
                <GlassCard style={{ opacity: 0.6 }}>
                  {read.map((alert, i) => (
                    <Link
                      key={alert.id}
                      href={`/contracts/${alert.contract_id}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        padding: "14px 28px",
                        borderBottom:
                          i < read.length - 1
                            ? "1px solid rgba(99,102,241,0.07)"
                            : "none",
                        transition: "opacity 0.15s",
                        textDecoration: "none",
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLElement).style.opacity = "0.7")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLElement).style.opacity = "1")
                      }
                    >
                      <CheckCircle2 size={14} style={{ color: "#3a4560", flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: "0.85rem",
                            color: "#64748b",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {alert.title}
                        </p>
                      </div>
                    </Link>
                  ))}
                </GlassCard>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
