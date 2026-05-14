"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Bell, FileText, Timer } from "lucide-react";
import { api } from "@/services/api";

type Metrics = {
  total_contracts: number;
  high_risk_contracts: number;
  expiring_soon: number;
  overdue_contracts: number;
  upcoming_obligations: number;
  overdue_obligations: number;
  unread_alerts: number;
  recent_uploads: { id: number; title: string; status: string; created_at: string }[];
};

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.dashboard().then((data) => setMetrics(data as Metrics)).catch((err) => setError(err.message));
  }, []);

  const cards = [
    ["Contracts", metrics?.total_contracts ?? 0, FileText],
    ["High risk", metrics?.high_risk_contracts ?? 0, AlertTriangle],
    ["Expiring soon", metrics?.expiring_soon ?? 0, Timer],
    ["Unread alerts", metrics?.unread_alerts ?? 0, Bell],
  ] as const;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-24 text-slate-100 md:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><h1 className="text-3xl font-semibold">Dashboard</h1><p className="mt-2 text-slate-400">Live contract intelligence, deadlines, and processing activity.</p></div>
          <Link href="/upload" className="rounded-lg bg-sky-500 px-4 py-2 font-medium text-slate-950">Upload contract</Link>
        </div>
        {error && <div className="mt-6 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(([label, value, Icon]) => <div key={label} className="rounded-lg border border-slate-800 bg-slate-900 p-5"><Icon className="text-sky-400" size={20} /><p className="mt-4 text-sm text-slate-400">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></div>)}
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="rounded-lg border border-slate-800 bg-slate-900">
            <div className="border-b border-slate-800 p-4 font-medium">Recent uploads</div>
            {metrics?.recent_uploads?.length ? metrics.recent_uploads.map((contract) => (
              <Link key={contract.id} href={`/contracts/${contract.id}`} className="flex items-center justify-between border-b border-slate-800 p-4 last:border-b-0 hover:bg-slate-800/60">
                <span>{contract.title}</span><span className="rounded bg-slate-800 px-2 py-1 text-xs uppercase text-slate-300">{contract.status}</span>
              </Link>
            )) : <p className="p-6 text-slate-400">{metrics ? "No uploads yet." : "Loading..."}</p>}
          </section>
          <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
            <h2 className="font-medium">Deadlines</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p>Upcoming obligations: {metrics?.upcoming_obligations ?? 0}</p>
              <p>Overdue obligations: {metrics?.overdue_obligations ?? 0}</p>
              <p>Overdue contracts: {metrics?.overdue_contracts ?? 0}</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
