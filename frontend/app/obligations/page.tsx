"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api, Obligation } from "@/services/api";

function isOverdue(dueDate?: string | null) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

export default function ObligationsPage() {
  const [items, setItems]     = useState<Obligation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    api.obligations()
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const overdue  = items.filter((i) => isOverdue(i.due_date));
  const upcoming = items.filter((i) => !isOverdue(i.due_date) && i.due_date);
  const noDue    = items.filter((i) => !i.due_date);

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
            "radial-gradient(ellipse at 80% -10%, rgba(245,158,11,0.05) 0%, transparent 60%)",
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
        {/* Header */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
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

        {!loading && items.length > 0 && (
          <div
            className="grid grid-cols-3"
            style={{ gap: "16px", marginBottom: "24px" }}
          >
            {[
              { label: "Overdue",      value: overdue.length,  color: "#f87171", bg: "rgba(239,68,68,0.10)",  icon: AlertCircle },
              { label: "Upcoming",     value: upcoming.length, color: "#fbbf24", bg: "rgba(245,158,11,0.10)", icon: Clock        },
              { label: "No Deadline",  value: noDue.length,    color: "#818cf8", bg: "rgba(99,102,241,0.10)", icon: CheckCircle2 },
            ].map(({ label, value, color, bg, icon: Icon }) => (
              <div
                key={label}
                className="animate-fade-up"
                style={{
                  borderRadius: "16px",
                  padding: "20px 22px",
                  background: bg,
                  border: `1px solid ${color}25`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <Icon size={14} style={{ color }} />
                  <p
                    style={{
                      color,
                      fontSize: "0.62rem",
                      fontFamily: "var(--font-mono, monospace)",
                      fontWeight: 600,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    {label}
                  </p>
                </div>
                <p
                  style={{
                    fontSize: "2rem",
                    fontWeight: 700,
                    color,
                    fontVariantNumeric: "tabular-nums",
                    lineHeight: 1,
                  }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}

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

        {loading ? (
          <LoadingState rows={5} type="list" />
        ) : items.length === 0 ? (
          <GlassCard glow>
            <EmptyState
              icon={ClipboardList}
              title="No obligations extracted"
              description="Analyze contracts to extract obligations and action items."
              action={{ label: "Upload Contract", href: "/upload" }}
            />
          </GlassCard>
        ) : (
          <GlassCard>
            <div>
              {items.map((item, i) => {
                const overdue = isOverdue(item.due_date);
                return (
                  <Link
                    key={item.id}
                    href={`/contracts/${item.contract_id}`}
                    className="animate-fade-up"
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "16px",
                      padding: "18px 28px",
                      animationDelay: `${i * 30}ms`,
                      borderBottom: i < items.length - 1 ? "1px solid rgba(99,102,241,0.07)" : "none",
                      textDecoration: "none",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.04)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.background = "transparent")
                    }
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          marginTop: "2px",
                          display: "flex",
                          width: "28px",
                          height: "28px",
                          flexShrink: 0,
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "8px",
                          background: overdue ? "rgba(239,68,68,0.10)" : "rgba(99,102,241,0.10)",
                          border: `1px solid ${overdue ? "rgba(239,68,68,0.20)" : "rgba(99,102,241,0.16)"}`,
                        }}
                      >
                        <ClipboardList size={12} style={{ color: overdue ? "#f87171" : "#818cf8" }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h2
                          style={{
                            fontSize: "0.88rem",
                            fontWeight: 600,
                            color: "#dae2fd",
                            marginBottom: "4px",
                            lineHeight: 1.4,
                          }}
                        >
                          {item.title}
                        </h2>
                        {item.description && (
                          <p
                            style={{
                              fontSize: "0.78rem",
                              color: "#64748b",
                              lineHeight: 1.6,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical" as React.CSSProperties["WebkitBoxOrient"],
                              overflow: "hidden",
                            }}
                          >
                            {item.description}
                          </p>
                        )}
                        {item.owner && (
                          <div
                            style={{
                              marginTop: "6px",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "0.73rem",
                              color: "#3a4560",
                            }}
                          >
                            <User size={10} />
                            {item.owner}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px", flexShrink: 0 }}>
                      <StatusBadge status={item.status} />
                      {item.due_date && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "0.73rem",
                            fontWeight: 500,
                            color: overdue ? "#f87171" : "#fbbf24",
                          }}
                        >
                          <Calendar size={11} />
                          {new Date(item.due_date).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                          })}
                          {overdue && <span style={{ marginLeft: "4px" }}>· Overdue</span>}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </GlassCard>
        )}
      </div>
    </AppShell>
  );
}
