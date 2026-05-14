export function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, " ");
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize tracking-wide status-${status}`}
    >
      {label}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wider severity-${severity}`}
    >
      {severity}
    </span>
  );
}

export function RiskTypeBadge({ type }: { type: string }) {
  const colours: Record<string, string> = {
    liability:       "bg-red-500/10 text-red-400 border-red-500/20",
    termination:     "bg-amber-500/10 text-amber-400 border-amber-500/20",
    payment:         "bg-orange-500/10 text-orange-400 border-orange-500/20",
    confidentiality: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    renewal:         "bg-teal-500/10 text-teal-400 border-teal-500/20",
  };
  const cls = colours[type] ?? "bg-slate-500/10 text-slate-400 border-slate-500/20";
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${cls}`}>
      {type}
    </span>
  );
}
