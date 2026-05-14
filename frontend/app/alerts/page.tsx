"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { api, Alert } from "@/services/api";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [error, setError] = useState("");
  async function load() {
    const data = await api.alerts();
    setAlerts(data);
  }
  useEffect(() => {
    let active = true;
    api.alerts().then((data) => {
      if (active) setAlerts(data);
    }).catch((err) => {
      if (active) setError(err.message);
    });
    return () => { active = false; };
  }, []);
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-24 text-slate-100 md:px-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold">Alerts</h1>
        <p className="mt-2 text-slate-400">Deadline, renewal, overdue, and high-risk notifications.</p>
        {error && <div className="mt-6 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>}
        <div className="mt-8 rounded-lg border border-slate-800 bg-slate-900">
          {alerts.length === 0 && <p className="p-6 text-slate-400">No alerts yet.</p>}
          {alerts.map((alert) => (
            <div key={alert.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 p-4 last:border-b-0">
              <Link href={`/contracts/${alert.contract_id}`} className="flex items-start gap-3 hover:text-sky-300"><Bell className="mt-1 text-sky-400" size={18} /><span><strong>{alert.title}</strong><br /><span className="text-sm text-slate-400">{alert.message}</span></span></Link>
              {alert.status !== "read" && <button onClick={() => api.markAlertRead(alert.id).then(load)} className="rounded-lg border border-slate-700 px-3 py-1 text-sm">Mark read</button>}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
