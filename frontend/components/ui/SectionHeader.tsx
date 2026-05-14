import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  accent?: "indigo" | "cyan";
}

export default function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
  accent = "indigo",
}: SectionHeaderProps) {
  const accentColor = accent === "cyan" ? "#22d3ee" : "#818cf8";
  const accentBg   = accent === "cyan" ? "rgba(34,211,238,0.10)" : "rgba(99,102,241,0.10)";
  const accentBorder = accent === "cyan" ? "rgba(34,211,238,0.20)" : "rgba(99,102,241,0.20)";

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: accentBg, border: `1px solid ${accentBorder}` }}
          >
            <Icon size={16} style={{ color: accentColor }} />
          </div>
        )}
        <div>
          <h2
            className="text-lg font-bold tracking-tight"
            style={{ color: "#dae2fd" }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
