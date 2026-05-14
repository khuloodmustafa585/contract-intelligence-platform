"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronRight, FileText, Search, X } from "lucide-react";
import { api, Clause, Contract } from "@/services/api";
import AppShell from "@/components/layout/AppShell";

type EnrichedClause = Clause & { contractTitle: string };

const CATEGORIES = ["All", "Termination", "Liability", "Confidentiality", "Payment", "Renewal", "Indemnity", "General"];

function guessCategory(heading: string | null | undefined, text: string): string {
  const combined = ((heading ?? "") + " " + text).toLowerCase();
  if (/terminat/.test(combined)) return "Termination";
  if (/liabilit|indemnif/.test(combined)) return "Liability";
  if (/confidential|non-disclosure|nda/.test(combined)) return "Confidentiality";
  if (/payment|invoice|fee|price/.test(combined)) return "Payment";
  if (/renew|successive|auto.?renew/.test(combined)) return "Renewal";
  if (/indemnif/.test(combined)) return "Indemnity";
  return "General";
}

export default function ClauseLibraryPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [clauses, setClauses] = useState<EnrichedClause[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState<EnrichedClause | null>(null);

  useEffect(() => {
    async function load() {
      const all = await api.contracts();
      const completed = all.filter((c) => c.status === "completed");
      setContracts(completed);

      const results: EnrichedClause[] = [];
      await Promise.all(
        completed.slice(0, 8).map(async (contract) => {
          try {
            const cls = await api.clauses(contract.id);
            cls.forEach((c) => results.push({ ...c, contractTitle: contract.title }));
          } catch {}
        })
      );
      setClauses(results);
    }
    load()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const enriched = clauses.map((c) => ({
    ...c,
    guessedCategory: guessCategory(c.heading, c.text),
  }));

  const filtered = enriched.filter((c) => {
    const matchSearch =
      !search ||
      c.text.toLowerCase().includes(search.toLowerCase()) ||
      (c.heading ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || c.guessedCategory === category;
    return matchSearch && matchCat;
  });

  const categoryCounts: Record<string, number> = { All: enriched.length };
  enriched.forEach((c) => {
    categoryCounts[c.guessedCategory] = (categoryCounts[c.guessedCategory] ?? 0) + 1;
  });

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-8rem)] gap-5">
        {/* Left: categories */}
        <aside className="w-52 flex-shrink-0 space-y-1 overflow-y-auto">
          <div className="mb-3">
            <div className="mb-1 flex items-center gap-2">
              <BookOpen size={14} className="text-blue-400" />
              <span className="text-xs font-medium uppercase tracking-widest text-blue-400/70">
                Categories
              </span>
            </div>
          </div>
          {CATEGORIES.map((cat) => {
            const count = categoryCounts[cat] ?? 0;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`
                  flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition
                  ${category === cat
                    ? "nav-active"
                    : "text-slate-400 hover:bg-[rgba(99,131,200,0.06)] hover:text-slate-200"
                  }
                `}
              >
                <span>{cat}</span>
                {count > 0 && (
                  <span className="rounded-full bg-[rgba(99,131,200,0.1)] px-1.5 py-0.5 text-[10px] text-slate-500">
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Contracts section */}
          <div className="mt-5 pt-4 border-t border-[rgba(99,131,200,0.1)]">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-slate-600">
              Sources ({contracts.length})
            </p>
            {contracts.slice(0, 6).map((c) => (
              <Link
                key={c.id}
                href={`/contracts/${c.id}`}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-500 transition hover:text-blue-400"
              >
                <FileText size={11} className="flex-shrink-0" />
                <span className="truncate">{c.title}</span>
              </Link>
            ))}
          </div>
        </aside>

        {/* Center: clause list */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Header + search */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-white">Clause Library</h1>
              <p className="text-xs text-slate-500">{filtered.length} clauses</p>
            </div>
            <div className="relative w-56">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                className="w-full rounded-lg border border-[rgba(99,131,200,0.15)] bg-[#0d1528] py-2 pl-8 pr-3 text-xs text-slate-300 placeholder:text-slate-600 outline-none focus:border-blue-500/50"
                placeholder="Search clauses…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                  <X size={12} className="text-slate-600 hover:text-slate-400" />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/20 bg-[rgba(239,68,68,0.08)] px-4 py-3 text-sm text-red-300">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <BookOpen size={36} className="mb-3 text-slate-700" />
              <p className="text-sm text-slate-500">
                {contracts.length === 0
                  ? "No completed contracts yet. Upload and analyze a contract first."
                  : "No clauses match your search."}
              </p>
              {contracts.length === 0 && (
                <Link href="/upload" className="mt-3 text-sm text-blue-400 hover:underline">
                  Upload contract →
                </Link>
              )}
            </div>
          ) : (
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {filtered.map((clause) => (
                <button
                  key={`${clause.contract_id}-${clause.id}`}
                  onClick={() => setSelected(selected?.id === clause.id ? null : clause)}
                  className={`
                    w-full rounded-2xl border p-4 text-left transition-all
                    ${selected?.id === clause.id
                      ? "border-blue-500/30 bg-[rgba(59,130,246,0.08)] shadow-sm"
                      : "border-[rgba(99,131,200,0.1)] bg-[#0d1528] hover:border-[rgba(99,131,200,0.2)]"
                    }
                  `}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="rounded-md border border-[rgba(99,131,200,0.15)] bg-[rgba(99,131,200,0.08)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-400">
                        {clause.guessedCategory}
                      </span>
                      <span className="text-[10px] text-slate-600 truncate max-w-[200px]">{clause.contractTitle}</span>
                    </div>
                    <ChevronRight size={14} className="flex-shrink-0 text-slate-700" />
                  </div>
                  {clause.heading && (
                    <p className="mb-1.5 text-sm font-semibold text-slate-200">{clause.heading}</p>
                  )}
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{clause.text}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: clause preview panel */}
        {selected && (
          <aside className="w-80 flex-shrink-0 overflow-y-auto rounded-2xl border border-[rgba(99,131,200,0.15)] bg-[#0d1528] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-blue-400" />
                <span className="text-xs font-medium text-slate-400">Preview</span>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-600 hover:text-slate-400">
                <X size={15} />
              </button>
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded-md border border-[rgba(99,131,200,0.15)] bg-[rgba(99,131,200,0.08)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-400">
                {(selected as EnrichedClause & { guessedCategory: string }).guessedCategory}
              </span>
            </div>

            {selected.heading && (
              <h2 className="mb-3 text-base font-bold text-white">{selected.heading}</h2>
            )}

            <p className="text-sm leading-relaxed text-slate-300">{selected.text}</p>

            <div className="mt-4 border-t border-[rgba(99,131,200,0.1)] pt-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-600 mb-2">Source</p>
              <Link
                href={`/contracts/${selected.contract_id}`}
                className="flex items-center gap-2 text-xs text-blue-400 hover:underline"
              >
                <FileText size={11} />
                {(selected as EnrichedClause).contractTitle}
                <ChevronRight size={11} />
              </Link>
              <p className="mt-1 text-[10px] text-slate-600">Clause #{selected.order_index + 1}</p>
            </div>
          </aside>
        )}
      </div>
    </AppShell>
  );
}
