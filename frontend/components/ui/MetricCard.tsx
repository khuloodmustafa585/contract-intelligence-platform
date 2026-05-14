import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

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
  indigo:  { bg: "rgba(99,102,241,0.12)",  icon: "rgba(99,102,241,0.9)",  text: "#818cf8", ring: "rgba(99,102,241,0.25)" },
  cyan:    { bg: "rgba(34,211,238,0.10)",  icon: "rgba(34,211,238,0.9)",  text: "#22d3ee", ring: "rgba(34,211,238,0.25)" },
  danger:  { bg: "rgba(239,68,68,0.10)",   icon: "rgba(239,68,68,0.9)",   text: "#f87171", ring: "rgba(239,68,68,0.25)" },
  warning: { bg: "rgba(245,158,11,0.10)",  icon: "rgba(245,158,11,0.9)",  text: "#fbbf24", ring: "rgba(245,158,11,0.25)" },
  success: { bg: "rgba(16,185,129,0.10)",  icon: "rgba(16,185,129,0.9)",  text: "#34d399", ring: "rgba(16,185,129,0.25)" },
};

export default function MetricCard({
  label,
  value,
  icon: Icon,
  accent = "indigo",
  trend,
  subtitle,
  loading = false,
  delay = 0,
}: MetricCardProps) {
  const colors = ACCENT_MAP[accent];

  if (loading) {
    return (
      <div
        className="rounded-2xl p-5"
        style={{
          background: "rgba(19,27,46,0.7)",
          border: "1px solid rgba(99,102,241,0.10)",
        }}
      >
        <div className="skeleton h-9 w-9 rounded-xl mb-4" />
        <div className="skeleton h-3 w-20 rounded mb-3" />
        <div className="skeleton h-7 w-14 rounded" />
      </div>
    );
  }

  return (
    <div
      className="group relative rounded-2xl p-5 animate-fade-up transition-all duration-300 hover:scale-[1.02]"
      style={{
        animationDelay: `${delay}ms`,
        background: "rgba(19,27,46,0.7)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid rgba(99,102,241,0.14)`,
        boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: `0 0 32px ${colors.ring}, inset 0 0 32px rgba(0,0,0,0.1)` }}
      />

      {/* Icon */}
      <div
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110"
        style={{
          background: colors.bg,
          border: `1px solid ${colors.ring}`,
        }}
      >
        <Icon size={18} style={{ color: colors.icon }} />
      </div>

      {/* Label */}
      <p
        className="text-xs font-medium uppercase tracking-widest mb-1"
        style={{ color: "#64748b", fontFamily: "var(--font-mono, monospace)" }}
      >
        {label}
      </p>

      {/* Value */}
      <div className="flex items-end gap-2">
        <span
          className="text-3xl font-bold tabular-nums leading-none"
          style={{ color: "#dae2fd" }}
        >
          {value}
        </span>
        {trend && (
          <div
            className="mb-0.5 flex items-center gap-0.5 text-xs font-medium"
            style={{
              color: trend.direction === "up" ? "#34d399" : "#f87171",
            }}
          >
            {trend.direction === "up" ? (
              <TrendingUp size={12} />
            ) : (
              <TrendingDown size={12} />
            )}
            {trend.value}%
          </div>
        )}
      </div>

      {subtitle && (
        <p className="mt-1.5 text-xs" style={{ color: "#3a4560" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
