"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { api, Obligation } from "@/services/api";

export default function ObligationsPage() {
  const [items, setItems] = useState<Obligation[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { api.obligations().then(setItems).catch((err) => setError(err.message)); }, []);
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-24 text-slate-100 md:px-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-semibold">Obligations</h1>
        <p className="mt-2 text-slate-400">Action items extracted from analyzed agreements.</p>
        {error && <div className="mt-6 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>}
        <div className="mt-8 overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
          {items.length === 0 && <p className="p-6 text-slate-400">No obligations extracted yet.</p>}
          {items.map((item) => (
            <Link href={`/contracts/${item.contract_id}`} key={item.id} className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 p-4 last:border-b-0 hover:bg-slate-800/60">
              <div><h2 className="font-medium">{item.title}</h2><p className="mt-1 max-w-3xl text-sm text-slate-400">{item.description}</p></div>
              <span className="flex items-center gap-2 rounded bg-slate-800 px-3 py-1 text-sm text-slate-300"><CalendarDays size={16} /> {item.due_date || item.status}</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
