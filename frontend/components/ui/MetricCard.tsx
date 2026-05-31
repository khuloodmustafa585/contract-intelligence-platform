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
  indigo:  { iconBg: "rgba(59,130,246,0.15)",  iconColor: "#60a5fa", glowColor: "rgba(59,130,246,0.22)",  border: "rgba(59,130,246,0.20)"  },
  cyan:    { iconBg: "rgba(34,211,238,0.13)",   iconColor: "#22d3ee", glowColor: "rgba(34,211,238,0.20)",  border: "rgba(34,211,238,0.18)"  },
  danger:  { iconBg: "rgba(239,68,68,0.15)",    iconColor: "#f87171", glowColor: "rgba(239,68,68,0.24)",   border: "rgba(239,68,68,0.20)"   },
  warning: { iconBg: "rgba(245,158,11,0.15)",   iconColor: "#fbbf24", glowColor: "rgba(245,158,11,0.22)",  border: "rgba(245,158,11,0.18)"  },
  success: { iconBg: "rgba(16,185,129,0.15)",   iconColor: "#34d399", glowColor: "rgba(16,185,129,0.22)",  border: "rgba(16,185,129,0.18)"  },
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
          background: "var(--th-card-bg)",
          border: "1px solid var(--th-card-border)",
          borderRadius: "20px",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: "var(--th-card-shadow)",
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
        background: "var(--th-card-bg)",
        border: `1px solid ${colors.border}`,
        borderRadius: "20px",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: "var(--th-card-shadow)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow — bottom-right corner, accent-tinted */}
      <div
        style={{
          position: "absolute",
          bottom: "-24px",
          right: "-24px",
          width: "130px",
          height: "130px",
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
        <Icon size={17} style={{ color: colors.iconColor }} />
      </div>

      {/* Label */}
      <p
        style={{
          fontSize: "0.65rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "var(--th-text-2)",
          marginBottom: "8px",
        }}
      >
        {label}
      </p>

      {/* Value + trend — colorize by semantic accent for quick scanning */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
        <span
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            color: accent === "indigo" ? "var(--th-text-1)" : colors.iconColor,
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
        <p style={{ marginTop: "6px", fontSize: "0.72rem", color: "var(--th-text-3)" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
