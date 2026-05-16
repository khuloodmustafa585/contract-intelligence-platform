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
  indigo:  { iconBg: "rgba(59,130,246,0.12)",  iconColor: "#60a5fa", glowColor: "rgba(59,130,246,0.15)",  border: "rgba(59,130,246,0.12)"  },
  cyan:    { iconBg: "rgba(34,211,238,0.1)",    iconColor: "#22d3ee", glowColor: "rgba(34,211,238,0.12)",  border: "rgba(34,211,238,0.1)"   },
  danger:  { iconBg: "rgba(239,68,68,0.12)",    iconColor: "#f87171", glowColor: "rgba(239,68,68,0.15)",   border: "rgba(239,68,68,0.12)"   },
  warning: { iconBg: "rgba(245,158,11,0.12)",   iconColor: "#fbbf24", glowColor: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.1)"   },
  success: { iconBg: "rgba(16,185,129,0.12)",   iconColor: "#34d399", glowColor: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.1)"   },
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
      <div
        style={{
          padding: "20px 22px",
          background: "rgba(10, 20, 38, 0.65)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "20px",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="skeleton h-9 w-9 rounded-xl mb-4" />
        <div className="skeleton h-2.5 w-20 rounded mb-3" />
        <div className="skeleton h-8 w-14 rounded mb-2" />
        <div className="skeleton h-2.5 w-28 rounded" />
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "20px 22px",
        background: "rgba(10, 20, 38, 0.65)",
        border: `1px solid ${colors.border}`,
        borderRadius: "20px",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: `0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          bottom: "-20px",
          right: "-20px",
          width: "110px",
          height: "110px",
          borderRadius: "50%",
          background: colors.glowColor,
          filter: "blur(45px)",
          pointerEvents: "none",
        }}
      />

      {/* Icon */}
      <div
        style={{
          width: "38px",
          height: "38px",
          borderRadius: "12px",
          background: colors.iconBg,
          border: `1px solid ${colors.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "14px",
          position: "relative",
        }}
      >
        <Icon size={16} style={{ color: colors.iconColor }} />
      </div>

      {/* Label */}
      <p
        style={{
          fontSize: "0.6rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "#475569",
          marginBottom: "8px",
        }}
      >
        {label}
      </p>

      {/* Value + trend */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
        <span
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            color: "#f8fafc",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </span>
        {trend && (
          <span
            style={{
              marginBottom: "3px",
              fontSize: "0.68rem",
              fontWeight: 600,
              color: trend.direction === "up" ? "#34d399" : "#f87171",
              background:
                trend.direction === "up"
                  ? "rgba(16,185,129,0.1)"
                  : "rgba(239,68,68,0.1)",
              padding: "2px 7px",
              borderRadius: "999px",
            }}
          >
            {trend.direction === "up" ? "↑" : "↓"} {trend.value}%
          </span>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p style={{ marginTop: "6px", fontSize: "0.7rem", color: "#334155" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
