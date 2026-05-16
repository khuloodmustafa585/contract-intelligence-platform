"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  FileText,
  ArrowUpDown,
  ArrowRight,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api, Contract } from "@/services/api";

const PAGE_SIZE = 15;

const STATUS_OPTIONS = ["All", "pending", "processing", "uploaded", "analyzed", "failed"];

type SortField = "title" | "status" | "created_at";
type SortDir   = "asc" | "desc";

export default function ContractsPage() {
  const [contracts, setContracts]   = useState<Contract[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState("All");
  const [page, setPage]             = useState(1);
  const [sortField, setSortField]   = useState<SortField>("created_at");
  const [sortDir, setSortDir]       = useState<SortDir>("desc");

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

  const filtered = useMemo(() => {
    let rows = contracts;
    if (statusFilter !== "All") rows = rows.filter((c) => c.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((c) => c.title.toLowerCase().includes(q));
    }
    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortField === "title")      cmp = a.title.localeCompare(b.title);
      else if (sortField === "status") cmp = a.status.localeCompare(b.status);
      else cmp = (a.created_at ?? "").localeCompare(b.created_at ?? "");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [contracts, search, statusFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const SortIndicator = ({ field }: { field: SortField }) => (
    <ArrowUpDown
      size={12}
      style={{ color: sortField === field ? "#818cf8" : "#3a4560" }}
    />
  );

  return (
    <AppShell>
      <div className="px-8 py-8">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <div className="h-1 w-6 rounded-full" style={{ background: "linear-gradient(90deg, #6366f1, #22d3ee)" }} />
              <span className="font-mono-label" style={{ color: "#6366f1", fontSize: "0.65rem" }}>Contract Management</span>
            </div>
                      <div className="h-1" />
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#dae2fd" }}>Contracts Library</h1>
                      <div className="h-1" />

            <p className="mt-1 text-sm" style={{ color: "#64748b" }}>
              {loading ? "Loading..." : `${filtered.length} of ${contracts.length} contracts`}
            </p>
          </div>
          <Link
            href="/upload"
            className="flex items-center gap-2 rounded-xl px-6 py-5 text-sm font-semibold transition-all hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #7e80ef, #7a75da)",
              color: "white",
              boxShadow: "2px 9px 39px rgba(99,102,241,0.35)",
            }}
          >
               New Contract <Plus size={20} />
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-5 flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.20)", color: "#f87171" }}
          >
            {error}
          </div>
        )}
          <div className="h-4" />

        {/* Filters row */}
        <div className="mb-4 flex flex-wrap gap-3">
          {/* Search */}
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2 w-64"
            style={{ background: "rgba(19,27,46,0.8)", border: "1px solid rgba(99,102,241,0.12)" }}
          >
            <Search size={14} style={{ color: "#64748b" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search contracts..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#3a4560]"
              style={{ color: "#dae2fd" }}
            />
          </div>
          <div className="h-6" />

          {/* Status filter */}
          <div className="flex items-center gap-1">
            <Filter size={13} style={{ color: "#64748b" }} />
            <div className="flex items-center gap-2 flex-wrap">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatus(s); setPage(1); }}
                  className="rounded-full px-4 py-2.5 text-xs font-medium capitalize transition-all border"                   
                    style={{
                      background:
                        statusFilter === s
                          ? "rgba(99,102,241,0.16)"
                          : "rgba(255,255,255,0.03)",
                      color:
                        statusFilter === s
                          ? "#a5b4fc"
                          : "#64748b",
                      border:
                        statusFilter === s
                          ? "1px solid rgba(99,102,241,0.28)"
                          : "1px solid rgba(255,255,255,0.06)",
                    }}>
               {s}
                </button>
              ))}
            </div>
          </div>
        </div>
          <div className="h-6" />

        {/* Table */}
        {loading ? (
          <LoadingState rows={6} type="table" />
        ) : filtered.length === 0 ? (
          <GlassCard>
            <EmptyState
              icon={FileText}
              title={search || statusFilter !== "All" ? "No contracts match your filters" : "No contracts yet"}
              description={search || statusFilter !== "All" ? "Try adjusting your search or filters." : "Upload your first contract to get started."}
              action={{ label: "Upload Contract", href: "/upload" }}
            />
          </GlassCard>
        ) : (
          <GlassCard>
            {/* Table header */}
            <div
              className="grid text-xs uppercase tracking-widest"
              style={{
                gridTemplateColumns: "2.5fr 1fr 1fr 0.8fr 0.5fr",
                padding: "14px 24px",
                borderBottom: "1px solid rgba(99,102,241,0.10)",
                color: "#64748b",
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              <button className="flex items-center gap-1.5 text-left hover:text-[#94a3b8] transition-colors" onClick={() => toggleSort("title")}>
                Contract <SortIndicator field="title" />
              </button>
              <button className="flex items-center gap-1.5 hover:text-[#94a3b8] transition-colors" onClick={() => toggleSort("status")}>
                Status <SortIndicator field="status" />
              </button>
              <span>Embedding</span>
              <button className="flex items-center gap-1.5 hover:text-[#94a3b8] transition-colors" onClick={() => toggleSort("created_at")}>
                Uploaded <SortIndicator field="created_at" />
              </button>
              <span />
            </div>

            {/* Rows */}
            <div>
              {pageRows.map((contract, i) => (
                <Link
                  key={contract.id}
                  href={`/contracts/${contract.id}`}
                  className="group grid items-center px-6 py-5 transition-all hover:bg-[rgba(99,102,241,0.06)] hover:shadow-[0_0_20px_rgba(99,102,241,0.06)]"
                  style={{
                    gridTemplateColumns: "2.5fr 1fr 1fr 0.8fr 0.5fr",
                    borderBottom: i < pageRows.length - 1 ? "1px solid rgba(99,102,241,0.07)" : "none",
                  }}
                >
                  {/* Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all group-hover:bg-[rgba(99,102,241,0.16)]"
                      style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.14)" }}
                    >
                      <FileText size={14} style={{ color: "#6366f1" }} />
                    </div>
                    <div className="min-w-0">
                      <p
                        className="text-[0.95rem] font-semibold truncate transition-colors group-hover:text-[#818cf8]"
                        style={{ color: "#dae2fd" }}
                      >
                        {contract.title}
                      </p>
                      {contract.file_type && (
                        <p className="text-xs font-mono-label mt-0.5" style={{ color: "#3a4560", fontSize: "0.6rem" }}>
                          {contract.file_type.toUpperCase()}
                          {contract.ocr_used ? " · OCR" : ""}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <StatusBadge status={contract.status} pulse={contract.status === "processing"} />
                  </div>

                  {/* Embedding */}
                  <div>
                    <StatusBadge status={contract.embedding_status} />
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: "#64748b" }}>
                    <Calendar size={11} />
                    {contract.created_at
                      ? new Date(contract.created_at).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })
                      : "—"}
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-end">
                    <ArrowRight
                      size={14}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "#6366f1" }}
                    />
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                className="flex items-center justify-between px-6 py-3"
                style={{ borderTop: "1px solid rgba(99,102,241,0.10)" }}
              >
                <span className="text-xs" style={{ color: "#64748b" }}>
                  Page {page} of {totalPages} — {filtered.length} results
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex h-7 w-7 items-center justify-center rounded-lg transition-all disabled:opacity-30 hover:bg-[rgba(99,102,241,0.10)]"
                    style={{ border: "1px solid rgba(99,102,241,0.14)" }}
                  >
                    <ChevronLeft size={13} style={{ color: "#94a3b8" }} />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-xs transition-all"
                        style={{
                          background: p === page ? "rgba(99,102,241,0.18)" : "transparent",
                          border: p === page ? "1px solid rgba(99,102,241,0.35)" : "1px solid transparent",
                          color: p === page ? "#818cf8" : "#64748b",
                          fontFamily: "var(--font-mono,monospace)",
                        }}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="flex h-7 w-7 items-center justify-center rounded-lg transition-all disabled:opacity-30 hover:bg-[rgba(99,102,241,0.10)]"
                    style={{ border: "1px solid rgba(99,102,241,0.14)" }}
                  >
                    <ChevronRight size={13} style={{ color: "#94a3b8" }} />
                  </button>
                </div>
              </div>
            )}
          </GlassCard>
        )}
      </div>
    </AppShell>
  );
}
