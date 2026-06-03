"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  FileText,
  FileSearch,
  ArrowUpDown,
  ArrowRight,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Trash2,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api, Contract } from "@/services/api";

const PAGE_SIZE = 15;

const STATUS_OPTIONS = ["All", "completed", "processing", "uploaded", "analysis_pending", "analysis_failed"];

const STATUS_LABELS: Record<string, string> = {
  All: "All",
  completed: "Completed",
  processing: "Processing",
  uploaded: "Uploaded",
  analysis_pending: "Analysis Pending",
  analysis_failed: "Analysis Unavailable",
};

type SortField = "title" | "status" | "created_at";
type SortDir   = "asc" | "desc";

/** Returns a health colour and label derived from a contract's processing status. */
function contractHealth(status: string): { color: string; glow: string; label: string } {
  const s = status?.toLowerCase() ?? "";
  if (s === "completed")            return { color: "#10b981", glow: "rgba(16,185,129,0.5)",  label: "Analyzed"             };
  if (s === "analysis_failed")      return { color: "#f59e0b", glow: "rgba(245,158,11,0.5)",  label: "Analysis Unavailable" };
  if (s === "processing" || s === "ocr_processing" || s === "indexing" || s === "analysis_pending" || s === "parsed")
                                    return { color: "#f59e0b", glow: "rgba(245,158,11,0.5)",  label: "Processing"           };
  if (s === "uploaded")             return { color: "#3b82f6", glow: "rgba(59,130,246,0.5)",  label: "Uploaded"             };
  return                                   { color: "#64748b", glow: "rgba(100,116,139,0.4)", label: "Unknown"     };
}

function ContractsContent() {
  const searchParams  = useSearchParams();
  const initialSearch = searchParams.get("q") ?? "";

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [search, setSearch]       = useState(initialSearch);
  const [statusFilter, setStatus] = useState("All");
  const [page, setPage]           = useState(1);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir]     = useState<SortDir>("desc");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading]     = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    api.contracts()
      .then(setContracts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  }

  async function handleDelete(id: number) {
    setDeleteLoading(true);
    try {
      await api.deleteContract(id);
      setContracts((prev) => prev.filter((c) => c.id !== id));
      setConfirmDeleteId(null);
      setPage(1);
      setToast({ type: "success", message: "Contract deleted successfully." });
    } catch {
      setToast({ type: "error", message: "Failed to delete contract. Please try again." });
    } finally {
      setDeleteLoading(false);
      setTimeout(() => setToast(null), 4000);
    }
  }

  const filtered = useMemo(() => {
    let rows = contracts;
    if (statusFilter !== "All") rows = rows.filter((c) => c.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((c) => c.title.toLowerCase().includes(q));
    }
    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortField === "title")       cmp = a.title.localeCompare(b.title);
      else if (sortField === "status") cmp = a.status.localeCompare(b.status);
      else                             cmp = (a.created_at ?? "").localeCompare(b.created_at ?? "");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [contracts, search, statusFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const SortIndicator = ({ field }: { field: SortField }) => (
    <ArrowUpDown
      size={12}
      style={{ color: sortField === field ? "#818cf8" : "#64748b" }}
    />
  );

  return (
    <AppShell>
      {/* Ambient glow — consistent with analytics / alerts */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "700px",
          height: "500px",
          background:
            "radial-gradient(ellipse at 80% -10%, rgba(99,102,241,0.055) 0%, transparent 60%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ── Page container — matches analytics / alerts pattern ── */}
      <div
        style={{
          maxWidth: "1380px",
          margin: "0 auto",
          padding: "48px 52px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* ── Page header ──────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
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
                  background: "linear-gradient(90deg, #6366f1, #22d3ee)",
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
                Contract Management
              </span>
            </div>
            <h1
              style={{
                fontSize: "1.75rem",
                fontWeight: 700,
                color: "var(--th-text-1)",
                letterSpacing: "-0.02em",
                marginBottom: "6px",
              }}
            >
              Contracts Library
            </h1>
            <p style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.6 }}>
              {loading
                ? "Loading…"
                : `${filtered.length} of ${contracts.length} contract${contracts.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          {/* Upload CTA */}
          <Link
            href="/upload"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "11px 20px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              color: "#ffffff",
              fontSize: "0.85rem",
              fontWeight: 600,
              textDecoration: "none",
              flexShrink: 0,
              boxShadow:
                "0 4px 20px rgba(99,102,241,0.28), 0 0 40px rgba(99,102,241,0.10)",
              transition: "opacity 0.15s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = "0.9";
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 6px 28px rgba(99,102,241,0.4), 0 0 50px rgba(99,102,241,0.16)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = "1";
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 4px 20px rgba(99,102,241,0.28), 0 0 40px rgba(99,102,241,0.10)";
            }}
          >
            <Plus size={16} />
            New Contract
          </Link>
        </div>

        {/* ── Error banner ─────────────────────────────────────────── */}
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

        {/* ── Filters row ──────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          {/* Search */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
              width: "280px",
              borderRadius: "12px",
              padding: "10px 14px",
              background: "var(--th-input-bg)",
              border: "1px solid rgba(99,102,241,0.14)",
              flexShrink: 0,
            }}
          >
            <Search size={14} style={{ color: "#64748b", flexShrink: 0 }} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search contracts…"
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: "0.82rem",
                color: "var(--th-text-1)",
              }}
              className="placeholder:text-[#64748b]"
            />
          </div>

          {/* Divider */}
          <div
            style={{
              width: "1px",
              height: "28px",
              background: "rgba(99,102,241,0.12)",
              flexShrink: 0,
            }}
          />

          {/* Status filter chips */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              flexWrap: "wrap",
            }}
          >
            <Filter size={13} style={{ color: "#64748b", flexShrink: 0 }} />
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => { setStatus(s); setPage(1); }}
                style={{
                  padding: "6px 14px",
                  borderRadius: "999px",
                  fontSize: "0.73rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  background:
                    statusFilter === s
                      ? "rgba(99,102,241,0.16)"
                      : "var(--th-subtle-bg)",
                  color: statusFilter === s ? "#a5b4fc" : "#64748b",
                  border:
                    statusFilter === s
                      ? "1px solid rgba(99,102,241,0.30)"
                      : "1px solid var(--th-surface-border)",
                }}
                onMouseEnter={(e) => {
                  if (statusFilter !== s)
                    (e.currentTarget as HTMLElement).style.color = "#94a3b8";
                }}
                onMouseLeave={(e) => {
                  if (statusFilter !== s)
                    (e.currentTarget as HTMLElement).style.color = "#64748b";
                }}
              >
                {STATUS_LABELS[s] ?? s}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ──────────────────────────────────────────────── */}
        {loading ? (
          <LoadingState rows={6} type="table" />
        ) : filtered.length === 0 ? (
          <GlassCard glow>
            <EmptyState
              icon={FileText}
              title={
                search || statusFilter !== "All"
                  ? "No contracts match your filters"
                  : "Your contract library is empty"
              }
              description={
                search || statusFilter !== "All"
                  ? "Try clearing your search or selecting a different status filter."
                  : "Upload a PDF, DOCX, or scanned image to begin AI-powered clause extraction, risk detection, and obligation tracking."
              }
              action={
                search || statusFilter !== "All"
                  ? undefined
                  : { label: "Upload your first contract", href: "/upload" }
              }
            />
          </GlassCard>
        ) : (
          <GlassCard>
            {/* Table header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2.5fr 1fr 1fr 0.8fr 0.9fr",
                padding: "13px 28px",
                borderBottom: "1px solid rgba(99,102,241,0.10)",
                color: "#64748b",
                fontSize: "0.6rem",
                fontFamily: "var(--font-mono, monospace)",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  textAlign: "left",
                  color: "inherit",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "inherit",
                  fontFamily: "inherit",
                  fontWeight: "inherit",
                  letterSpacing: "inherit",
                  textTransform: "inherit",
                  transition: "color 0.15s",
                }}
                onClick={() => toggleSort("title")}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "#94a3b8")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "#64748b")
                }
              >
                Contract <SortIndicator field="title" />
              </button>
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "inherit",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "inherit",
                  fontFamily: "inherit",
                  fontWeight: "inherit",
                  letterSpacing: "inherit",
                  textTransform: "inherit",
                  transition: "color 0.15s",
                }}
                onClick={() => toggleSort("status")}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "#94a3b8")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "#64748b")
                }
              >
                Status <SortIndicator field="status" />
              </button>
              <span>Health</span>
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "inherit",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "inherit",
                  fontFamily: "inherit",
                  fontWeight: "inherit",
                  letterSpacing: "inherit",
                  textTransform: "inherit",
                  transition: "color 0.15s",
                }}
                onClick={() => toggleSort("created_at")}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "#94a3b8")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "#64748b")
                }
              >
                Uploaded <SortIndicator field="created_at" />
              </button>
              <span>Actions</span>
            </div>

            {/* Rows */}
            <div>
              {pageRows.map((contract, i) => (
                <div
                  key={contract.id}
                  className="group"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2.5fr 1fr 1fr 0.8fr 0.9fr",
                    alignItems: "center",
                    padding: "16px 28px",
                    transition: "background 0.15s",
                    borderBottom:
                      i < pageRows.length - 1
                        ? "1px solid rgba(99,102,241,0.07)"
                        : "none",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "rgba(99,102,241,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  {/* Name */}
                  <Link
                    href={`/contracts/${contract.id}`}
                    style={{ textDecoration: "none", minWidth: 0 }}
                  >
                    <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      minWidth: 0,
                    }}
                  >
                    <div
                      className="group-hover:bg-[rgba(99,102,241,0.16)] transition-colors"
                      style={{
                        display: "flex",
                        width: "36px",
                        height: "36px",
                        flexShrink: 0,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "10px",
                        background: "rgba(99,102,241,0.08)",
                        border: "1px solid rgba(99,102,241,0.14)",
                      }}
                    >
                      <FileText size={14} style={{ color: "#6366f1" }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p
                        className="group-hover:text-[#818cf8] transition-colors"
                        style={{
                          fontSize: "0.88rem",
                          fontWeight: 600,
                          color: "var(--th-text-1)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {contract.title}
                      </p>
                      {contract.file_type && (
                        <p
                          style={{
                            fontSize: "0.6rem",
                            fontFamily: "var(--font-mono, monospace)",
                            color: "#64748b",
                            marginTop: "2px",
                          }}
                        >
                          {contract.file_type.toUpperCase()}
                          {contract.ocr_used ? " · OCR" : ""}
                        </p>
                      )}
                    </div>
                    </div>
                  </Link>

                  {/* Status */}
                  <div>
                    <StatusBadge
                      status={contract.status}
                      pulse={contract.status === "processing"}
                    />
                  </div>

                  {/* Health indicator */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {(() => {
                      const h = contractHealth(contract.status);
                      return (
                        <>
                          <span style={{
                            width: "7px", height: "7px", borderRadius: "50%",
                            background: h.color, flexShrink: 0,
                            boxShadow: `0 0 6px ${h.glow}`,
                          }} />
                          <span style={{ fontSize: "0.72rem", color: "#64748b" }}>{h.label}</span>
                        </>
                      );
                    })()}
                  </div>

                  {/* Date */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "0.75rem",
                      color: "#64748b",
                    }}
                  >
                    <Calendar size={11} style={{ flexShrink: 0 }} />
                    {contract.created_at
                      ? new Date(contract.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                    <Link
                      href={`/contracts/${contract.id}`}
                      aria-label={`Open ${contract.title}`}
                      style={{
                        display: "inline-flex",
                        width: "30px",
                        height: "30px",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "9px",
                        border: "1px solid rgba(99,102,241,0.14)",
                      }}
                    >
                      <ArrowRight
                        size={14}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: "#6366f1" }}
                      />
                    </Link>
                    <button
                      onClick={() => setConfirmDeleteId(contract.id)}
                      aria-label={`Delete ${contract.title}`}
                      style={{
                        display: "inline-flex",
                        width: "30px",
                        height: "30px",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "9px",
                        border: "1px solid rgba(239,68,68,0.18)",
                        background: "transparent",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.10)";
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.38)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.18)";
                      }}
                    >
                      <Trash2 size={13} style={{ color: "#ef4444", opacity: 0.75 }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 28px",
                  borderTop: "1px solid rgba(99,102,241,0.10)",
                }}
              >
                <span style={{ fontSize: "0.73rem", color: "#64748b" }}>
                  Page {page} of {totalPages} — {filtered.length} results
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{
                      display: "flex",
                      width: "28px",
                      height: "28px",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "8px",
                      border: "1px solid rgba(99,102,241,0.14)",
                      background: "transparent",
                      cursor: page === 1 ? "not-allowed" : "pointer",
                      opacity: page === 1 ? 0.3 : 1,
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (page !== 1)
                        (e.currentTarget as HTMLElement).style.background =
                          "rgba(99,102,241,0.10)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    <ChevronLeft size={13} style={{ color: "#94a3b8" }} />
                  </button>

                  {Array.from(
                    { length: Math.min(5, totalPages) },
                    (_, i) => {
                      const p =
                        Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          style={{
                            display: "flex",
                            width: "28px",
                            height: "28px",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "8px",
                            fontSize: "0.73rem",
                            fontFamily: "var(--font-mono, monospace)",
                            cursor: "pointer",
                            transition: "all 0.15s",
                            background:
                              p === page
                                ? "rgba(99,102,241,0.18)"
                                : "transparent",
                            border:
                              p === page
                                ? "1px solid rgba(99,102,241,0.35)"
                                : "1px solid transparent",
                            color: p === page ? "#818cf8" : "#64748b",
                          }}
                        >
                          {p}
                        </button>
                      );
                    }
                  )}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{
                      display: "flex",
                      width: "28px",
                      height: "28px",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "8px",
                      border: "1px solid rgba(99,102,241,0.14)",
                      background: "transparent",
                      cursor: page === totalPages ? "not-allowed" : "pointer",
                      opacity: page === totalPages ? 0.3 : 1,
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (page !== totalPages)
                        (e.currentTarget as HTMLElement).style.background =
                          "rgba(99,102,241,0.10)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    <ChevronRight size={13} style={{ color: "#94a3b8" }} />
                  </button>
                </div>
              </div>
            )}
          </GlassCard>
        )}
      </div>
      {/* ── Delete confirmation modal ─────────────────────────────── */}
      {confirmDeleteId !== null && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: "var(--th-dropdown-bg)",
              border: "1px solid rgba(99,102,241,0.20)",
              borderRadius: "18px",
              padding: "32px",
              maxWidth: "420px",
              width: "90%",
              boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
            }}
          >
            <h2
              style={{
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "var(--th-text-1)",
                marginBottom: "10px",
              }}
            >
              Delete Contract
            </h2>
            <p
              style={{
                fontSize: "0.84rem",
                color: "#64748b",
                lineHeight: 1.65,
                marginBottom: "28px",
              }}
            >
              Are you sure you want to delete this contract? This action cannot be undone.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setConfirmDeleteId(null)}
                disabled={deleteLoading}
                style={{
                  padding: "9px 20px",
                  borderRadius: "10px",
                  border: "1px solid rgba(99,102,241,0.20)",
                  background: "transparent",
                  color: "#94a3b8",
                  fontSize: "0.83rem",
                  fontWeight: 500,
                  cursor: deleteLoading ? "not-allowed" : "pointer",
                  opacity: deleteLoading ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deleteLoading}
                style={{
                  padding: "9px 20px",
                  borderRadius: "10px",
                  background: "#ef4444",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "0.83rem",
                  fontWeight: 600,
                  cursor: deleteLoading ? "not-allowed" : "pointer",
                  opacity: deleteLoading ? 0.65 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                {deleteLoading ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast notification ────────────────────────────────────── */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "28px",
            right: "28px",
            zIndex: 60,
            padding: "13px 18px",
            borderRadius: "12px",
            fontSize: "0.83rem",
            fontWeight: 500,
            background:
              toast.type === "success"
                ? "rgba(16,185,129,0.12)"
                : "rgba(239,68,68,0.12)",
            border: `1px solid ${
              toast.type === "success"
                ? "rgba(16,185,129,0.28)"
                : "rgba(239,68,68,0.28)"
            }`,
            color: toast.type === "success" ? "#34d399" : "#f87171",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}
        >
          {toast.message}
        </div>
      )}
    </AppShell>
  );
}

export default function ContractsPage() {
  return (
    <Suspense>
      <ContractsContent />
    </Suspense>
  );
}
