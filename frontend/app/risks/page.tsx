"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, Risk } from "@/services/api";

export default function RisksPage() {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { api.risks().then(setRisks).catch((err) => setError(err.message)); }, []);
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-24 text-slate-100 md:px-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-semibold">Risks</h1>
        <p className="mt-2 text-slate-400">AI and rule-based issues detected across your contracts.</p>
        {error && <div className="mt-6 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {risks.length === 0 && <p className="text-slate-400">No risks found yet.</p>}
          {risks.map((risk) => (
            <Link href={`/contracts/${risk.contract_id}`} key={risk.id} className="rounded-lg border border-slate-800 bg-slate-900 p-5 hover:border-sky-500">
              <div className="flex justify-between gap-3"><h2 className="font-semibold">{risk.title}</h2><span className="text-xs uppercase text-red-300">{risk.severity}</span></div>
              <p className="mt-3 text-sm text-slate-400">{risk.explanation || risk.source_snippet}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
