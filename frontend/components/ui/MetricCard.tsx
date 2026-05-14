import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent?: "indigo" | "cyan" | "danger" | "warning" | "success";
  trend?: { value: number; direction: "up" | "down" };
  subtitle?: string;
  loading?: boolean;
  delay?: number;
}

const ACCENT_MAP = {
  indigo:  { iconBg: "rgba(59,130,246,0.1)",   iconColor: "#60a5fa"  },
  cyan:    { iconBg: "rgba(34,211,238,0.08)",   iconColor: "#22d3ee"  },
  danger:  { iconBg: "rgba(239,68,68,0.1)",     iconColor: "#f87171"  },
  warning: { iconBg: "rgba(245,158,11,0.1)",    iconColor: "#fbbf24"  },
  success: { iconBg: "rgba(16,185,129,0.1)",    iconColor: "#34d399"  },
};

const CARD_STYLE = {
  background:  "#0f172a",
  border:      "1px solid rgba(255,255,255,0.06)",
  boxShadow:   "0 1px 4px rgba(0,0,0,0.5)",
  borderRadius: "12px",
};

export default function MetricCard({
  label,
  value,
  icon: Icon,
  accent = "indigo",
  trend,
  subtitle,
  loading = false,
}: MetricCardProps) {
  const colors = ACCENT_MAP[accent];

  if (loading) {
    return (
      <div className="p-6" style={CARD_STYLE}>
        <div className="skeleton h-8 w-8 rounded-lg mb-5" />
        <div className="skeleton h-3 w-20 rounded mb-3" />
        <div className="skeleton h-8 w-12 rounded mb-2" />
        <div className="skeleton h-3 w-28 rounded" />
      </div>
    );
  }

  return (
    <div className="p-6" style={CARD_STYLE}>
      {/* Icon */}
      <div
        className="mb-5 flex h-8 w-8 items-center justify-center rounded-lg"
        style={{ background: colors.iconBg }}
      >
        <Icon size={15} style={{ color: colors.iconColor }} />
      </div>

      {/* Label */}
      <p
        className="mb-2 text-xs font-medium uppercase tracking-widest"
        style={{ color: "#4b5563", letterSpacing: "0.1em" }}
      >
        {label}
      </p>

      {/* Value */}
      <div className="flex items-end gap-2.5">
        <span
          className="tabular-nums leading-none"
          style={{ fontSize: "2rem", fontWeight: 700, color: "#f3f4f6" }}
        >
          {value}
        </span>
        {trend && (
          <span
            className="mb-1 text-xs font-medium"
            style={{ color: trend.direction === "up" ? "#34d399" : "#f87171" }}
          >
            {trend.direction === "up" ? "↑" : "↓"} {trend.value}%
          </span>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="mt-2 text-xs" style={{ color: "#374151" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
