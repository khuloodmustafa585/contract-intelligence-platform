"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [compact, setCompact] = useState(false);
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-24 text-slate-100 md:px-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="mt-2 text-slate-400">Workspace preferences for contract review workflows.</p>
        <section className="mt-8 rounded-lg border border-slate-800 bg-slate-900 p-6">
          <h2 className="font-semibold">Notifications</h2>
          <label className="mt-5 flex items-center justify-between gap-4">
            <span><strong>Email alerts</strong><br /><span className="text-sm text-slate-400">Receive renewal, overdue, and high-risk notices.</span></span>
            <input type="checkbox" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} />
          </label>
        </section>
        <section className="mt-6 rounded-lg border border-slate-800 bg-slate-900 p-6">
          <h2 className="font-semibold">Interface</h2>
          <label className="mt-5 flex items-center justify-between gap-4">
            <span><strong>Compact tables</strong><br /><span className="text-sm text-slate-400">Use denser rows on list pages.</span></span>
            <input type="checkbox" checked={compact} onChange={(e) => setCompact(e.target.checked)} />
          </label>
        </section>
      </div>
    </main>
  );
}
