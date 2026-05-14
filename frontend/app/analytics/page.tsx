"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";

type Metrics = {
  total_contracts: number; high_risk_contracts: number; expiring_soon: number; overdue_contracts: number; upcoming_obligations: number; overdue_obligations: number; unread_alerts: number;
};

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { api.dashboard().then((data) => setMetrics(data as Metrics)).catch((err) => setError(err.message)); }, []);
  const cards = metrics ? [
    ["Contracts", metrics.total_contracts],
    ["High risk", metrics.high_risk_contracts],
    ["Expiring soon", metrics.expiring_soon],
    ["Overdue contracts", metrics.overdue_contracts],
    ["Upcoming obligations", metrics.upcoming_obligations],
    ["Overdue obligations", metrics.overdue_obligations],
    ["Unread alerts", metrics.unread_alerts],
  ] : [];
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-24 text-slate-100 md:px-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-semibold">Analytics</h1>
        <p className="mt-2 text-slate-400">Operational view of contract risk, deadlines, and processing volume.</p>
        {error && <div className="mt-6 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {!metrics && <p className="text-slate-400">Loading analytics...</p>}
          {cards.map(([label, value]) => <div key={label} className="rounded-lg border border-slate-800 bg-slate-900 p-5"><p className="text-sm text-slate-400">{label}</p><p className="mt-3 text-3xl font-semibold">{value}</p></div>)}
        </div>
      </div>
    </main>
  );
}
