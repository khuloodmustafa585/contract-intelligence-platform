"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { api, Contract } from "@/services/api";

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.contracts().then(setContracts).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-24 text-slate-100 md:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Contracts</h1>
            <p className="mt-2 text-slate-400">Track ingestion, indexing, analysis, and renewal status.</p>
          </div>
          <Link href="/upload" className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 font-medium text-slate-950"><Plus size={18} /> Upload</Link>
        </div>
        {error && <div className="mt-6 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>}
        <div className="mt-8 overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-xs uppercase text-slate-400">
              <tr><th className="p-4">Name</th><th className="p-4">Status</th><th className="p-4">Indexed</th><th className="p-4">Uploaded</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading && <tr><td className="p-6 text-slate-400" colSpan={4}>Loading contracts...</td></tr>}
              {!loading && contracts.length === 0 && <tr><td className="p-6 text-slate-400" colSpan={4}>No contracts uploaded yet.</td></tr>}
              {contracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-slate-800/60">
                  <td className="p-4 font-medium"><Link href={`/contracts/${contract.id}`} className="text-sky-300 hover:underline">{contract.title}</Link></td>
                  <td className="p-4"><span className="rounded bg-slate-800 px-2 py-1 text-xs uppercase">{contract.status}</span></td>
                  <td className="p-4 text-slate-300">{contract.embedding_status}</td>
                  <td className="p-4 text-slate-400">{contract.created_at ? new Date(contract.created_at).toLocaleDateString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
