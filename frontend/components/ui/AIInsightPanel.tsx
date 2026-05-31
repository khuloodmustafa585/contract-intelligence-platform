import { Sparkles, LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface AIInsightPanelProps {
  title?: string;
  children: ReactNode;
  icon?: LucideIcon;
  variant?: "indigo" | "cyan" | "warning";
  compact?: boolean;
}

const VARIANT_MAP = {
  indigo:  { bg: "rgba(99,102,241,0.08)",  border: "rgba(99,102,241,0.20)", accent: "#818cf8", label: "#6366f1" },
  cyan:    { bg: "rgba(34,211,238,0.07)",  border: "rgba(34,211,238,0.18)", accent: "#22d3ee", label: "#06b6d4" },
  warning: { bg: "rgba(245,158,11,0.07)",  border: "rgba(245,158,11,0.18)", accent: "#fbbf24", label: "#f59e0b" },
};

export default function AIInsightPanel({
  title = "AI Insight",
  children,
  icon: Icon = Sparkles,
  variant = "indigo",
  compact = false,
}: AIInsightPanelProps) {
  const v = VARIANT_MAP[variant];

  return (
    <div
      className="rounded-2xl"
      style={{
        background: v.bg,
        border: `1px solid ${v.border}`,
        padding: compact ? "12px 16px" : "20px",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="flex h-5 w-5 items-center justify-center rounded-md"
          style={{ background: `rgba(${variant === "indigo" ? "99,102,241" : variant === "cyan" ? "34,211,238" : "245,158,11"},0.18)` }}
        >
          <Icon size={11} style={{ color: v.accent }} />
        </div>
        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: v.label, fontFamily: "var(--font-mono, monospace)" }}
        >
          {title}
        </span>
        <div
          className="ml-auto h-1.5 w-1.5 rounded-full animate-pulse"
          style={{ background: v.accent }}
        />
      </div>
      <div className="text-sm leading-relaxed" style={{ color: "var(--th-text-2)" }}>
        {children}
      </div>
    </div>
  );
}
