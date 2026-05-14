"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  FileText,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { api, Contract } from "@/services/api";
import { StatusBadge } from "@/components/common/StatusBadge";
import AppShell from "@/components/layout/AppShell";

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);

  async function load() {
    const data = await api.contracts();
    setContracts(data);
  }

  useEffect(() => {
    load()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: number) {
    if (!confirm("Delete this contract and all its data? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await api.deleteContract(id);
      setContracts((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  async function handleRetry(id: number) {
    try {
      await api.retryContract(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retry failed");
    }
  }

  const filtered = contracts.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="page-header flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <FileText size={15} className="text-blue-400" />
            <span className="text-xs font-medium uppercase tracking-widest text-blue-400/70">
              Repository
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">Contracts</h1>
          <p className="mt-1 text-sm text-slate-400">
            Track ingestion, indexing, analysis, and renewal status.
          </p>
        </div>
        <Link href="/upload" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Upload
        </Link>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-500/20 bg-[rgba(239,68,68,0.08)] px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Search bar */}
      <div className="relative mb-5 max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          className="w-full rounded-lg border border-[rgba(99,131,200,0.15)] bg-[#0d1528] py-2 pl-9 pr-3 text-sm text-slate-300 placeholder:text-slate-600 outline-none transition focus:border-blue-500/50"
          placeholder="Filter contracts…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-[rgba(99,131,200,0.1)] bg-[#0d1528]">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 border-b border-[rgba(99,131,200,0.1)] px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
          <span>Contract</span>
          <span>Status</span>
          <span>Indexed</span>
          <span>Uploaded</span>
          <span />
        </div>

        {/* Rows */}
        {loading ? (
          <div className="space-y-3 p-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 skeleton rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <FileText size={32} className="mx-auto mb-3 text-slate-700" />
            <p className="text-sm text-slate-500">
              {search ? "No contracts match your search." : "No contracts yet."}
            </p>
            {!search && (
              <Link href="/upload" className="mt-3 inline-block text-sm text-blue-400 hover:underline">
                Upload your first contract →
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[rgba(99,131,200,0.07)]">
            {filtered.map((contract) => (
              <div
                key={contract.id}
                className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-4 transition hover:bg-[rgba(99,131,200,0.03)]"
              >
                {/* Name */}
                <div className="flex min-w-0 items-center gap-3">
                  <FileText size={15} className="flex-shrink-0 text-slate-600" />
                  <div className="min-w-0">
                    <Link
                      href={`/contracts/${contract.id}`}
                      className="truncate text-sm font-medium text-slate-200 hover:text-blue-400 transition-colors"
                    >
                      {contract.title}
                    </Link>
                    {contract.processing_error && (
                      <p className="truncate text-xs text-red-400 mt-0.5">
                        {contract.processing_error}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status */}
                <StatusBadge status={contract.status} />

                {/* Indexed */}
                <span className={`text-xs font-medium ${contract.is_indexed ? "text-emerald-400" : "text-slate-600"}`}>
                  {contract.is_indexed ? "Indexed" : "—"}
                </span>

                {/* Date */}
                <span className="text-xs text-slate-500 whitespace-nowrap">
                  {contract.created_at
                    ? new Date(contract.created_at).toLocaleDateString()
                    : "—"}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  {contract.status === "failed" && (
                    <button
                      onClick={() => handleRetry(contract.id)}
                      title="Retry processing"
                      className="rounded-lg border border-amber-500/20 bg-[rgba(245,158,11,0.06)] p-1.5 text-amber-400 transition hover:border-amber-500/40"
                    >
                      <RotateCcw size={13} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(contract.id)}
                    disabled={deleting === contract.id}
                    title="Delete contract"
                    className="rounded-lg border border-[rgba(239,68,68,0.15)] bg-[rgba(239,68,68,0.05)] p-1.5 text-red-400/60 transition hover:border-red-500/30 hover:text-red-400 disabled:opacity-30"
                  >
                    <Trash2 size={13} />
                  </button>
                  <Link
                    href={`/contracts/${contract.id}`}
                    className="rounded-lg border border-[rgba(99,131,200,0.12)] p-1.5 text-slate-500 transition hover:border-blue-500/30 hover:text-blue-400"
                  >
                    <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer count */}
        {filtered.length > 0 && (
          <div className="border-t border-[rgba(99,131,200,0.07)] px-5 py-3 text-xs text-slate-600">
            {filtered.length} contract{filtered.length !== 1 ? "s" : ""}
            {search && ` matching "${search}"`}
          </div>
        )}
      </div>
    </AppShell>
  );
}
