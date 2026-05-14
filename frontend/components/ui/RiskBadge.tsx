type RiskLevel = "high" | "medium" | "low" | "moderate" | "critical" | string;

const RISK_MAP: Record<string, { bg: string; text: string; border: string; label: string }> = {
  critical: { bg: "rgba(239,68,68,0.15)",  text: "#f87171", border: "rgba(239,68,68,0.3)",  label: "Critical" },
  high:     { bg: "rgba(239,68,68,0.10)",  text: "#f87171", border: "rgba(239,68,68,0.22)", label: "High"     },
  moderate: { bg: "rgba(245,158,11,0.10)", text: "#fbbf24", border: "rgba(245,158,11,0.22)",label: "Moderate" },
  medium:   { bg: "rgba(245,158,11,0.10)", text: "#fbbf24", border: "rgba(245,158,11,0.22)",label: "Medium"   },
  low:      { bg: "rgba(16,185,129,0.10)", text: "#34d399", border: "rgba(16,185,129,0.22)",label: "Low"      },
  standard: { bg: "rgba(99,102,241,0.10)", text: "#818cf8", border: "rgba(99,102,241,0.22)",label: "Standard" },
};

const DEFAULT = { bg: "rgba(100,116,139,0.12)", text: "#94a3b8", border: "rgba(100,116,139,0.20)", label: "" };

interface RiskBadgeProps {
  level: RiskLevel;
  size?: "sm" | "md";
}

export default function RiskBadge({ level, size = "sm" }: RiskBadgeProps) {
  const key = level?.toLowerCase() ?? "";
  const s = RISK_MAP[key] ?? { ...DEFAULT, label: level };

  return (
    <span
      className="inline-flex items-center rounded-lg font-semibold"
      style={{
        background: s.bg,
        color: s.text,
        border: `1px solid ${s.border}`,
        fontSize: size === "sm" ? "0.68rem" : "0.75rem",
        padding: size === "sm" ? "2px 8px" : "4px 12px",
        fontFamily: "var(--font-mono, monospace)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      {s.label || level}
    </span>
  );
}
