"use client";

import { useEffect, useState } from "react";
import { Bell, Layout, Settings, Shield } from "lucide-react";
import AppShell from "@/components/layout/AppShell";

const STORAGE_KEY = "cl_settings";

type Prefs = {
  emailAlerts: boolean;
  dueSoonDays: number;
  compactTables: boolean;
  autoAnalyze: boolean;
};

const DEFAULT_PREFS: Prefs = {
  emailAlerts: true,
  dueSoonDays: 30,
  compactTables: false,
  autoAnalyze: true,
};

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-6 py-4 border-b border-[rgba(99,131,200,0.07)] last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-200">{label}</p>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
      <div
        onClick={() => onChange(!checked)}
        className={`
          relative mt-0.5 h-5 w-9 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200
          ${checked ? "bg-blue-500" : "bg-[rgba(99,131,200,0.15)]"}
        `}
      >
        <span
          className={`
            absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200
            ${checked ? "translate-x-4" : "translate-x-0.5"}
          `}
        />
      </div>
    </label>
  );
}

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setPrefs(JSON.parse(stored));
    } catch {}
  }, []);

  function set<K extends keyof Prefs>(key: K, value: Prefs[K]) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const sections = [
    {
      title: "Notifications",
      icon: Bell,
      accent: "text-amber-400",
      items: (
        <>
          <Toggle
            label="Email alerts"
            description="Receive renewal deadlines, overdue, and high-risk notifications via email."
            checked={prefs.emailAlerts}
            onChange={(v) => set("emailAlerts", v)}
          />
        </>
      ),
    },
    {
      title: "Interface",
      icon: Layout,
      accent: "text-blue-400",
      items: (
        <>
          <Toggle
            label="Compact tables"
            description="Use denser row spacing on list pages."
            checked={prefs.compactTables}
            onChange={(v) => set("compactTables", v)}
          />
        </>
      ),
    },
    {
      title: "Processing",
      icon: Shield,
      accent: "text-indigo-400",
      items: (
        <>
          <Toggle
            label="Auto-analyze on upload"
            description="Immediately run AI analysis after a contract finishes parsing and indexing."
            checked={prefs.autoAnalyze}
            onChange={(v) => set("autoAnalyze", v)}
          />
          <div className="flex items-center justify-between gap-6 py-4">
            <div>
              <p className="text-sm font-medium text-slate-200">Due-soon window</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Flag obligations due within this many days as upcoming.
              </p>
            </div>
            <select
              className="rounded-lg border border-[rgba(99,131,200,0.15)] bg-[#0d1528] px-3 py-1.5 text-sm text-slate-300 outline-none focus:border-blue-500/50"
              value={prefs.dueSoonDays}
              onChange={(e) => set("dueSoonDays", Number(e.target.value))}
            >
              {[7, 14, 30, 60, 90].map((d) => (
                <option key={d} value={d}>{d} days</option>
              ))}
            </select>
          </div>
        </>
      ),
    },
  ];

  return (
    <AppShell>
      <div className="page-header flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Settings size={15} className="text-slate-400" />
            <span className="text-xs font-medium uppercase tracking-widest text-slate-500">
              Workspace
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="mt-1 text-sm text-slate-400">
            Preferences are saved locally to your browser.
          </p>
        </div>
        {saved && (
          <span className="rounded-lg border border-emerald-500/20 bg-[rgba(34,197,94,0.08)] px-3 py-1.5 text-xs text-emerald-400">
            Saved ✓
          </span>
        )}
      </div>

      <div className="max-w-2xl space-y-5">
        {sections.map(({ title, icon: Icon, accent, items }) => (
          <div
            key={title}
            className="rounded-2xl border border-[rgba(99,131,200,0.1)] bg-[#0d1528] px-6 py-2"
          >
            <div className="flex items-center gap-2 border-b border-[rgba(99,131,200,0.07)] py-4">
              <Icon size={15} className={accent} />
              <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
            </div>
            {items}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
