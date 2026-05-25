"use client";

import { LucideIcon, ArrowRight } from "lucide-react";
import { ReactNode } from "react";
import Link from "next/link";

type Accent = "indigo" | "cyan" | "warning" | "danger" | "success" | "violet";
type StatusDot = "active" | "standby" | "warning" | "none";

const ACCENT: Record<Accent, { iconBg: string; iconColor: string; linkColor: string }> = {
  indigo:  { iconBg: "rgba(59,130,246,0.1)",   iconColor: "#60a5fa", linkColor: "#3b82f6" },
  cyan:    { iconBg: "rgba(34,211,238,0.08)",   iconColor: "#22d3ee", linkColor: "#22d3ee" },
  warning: { iconBg: "rgba(245,158,11,0.1)",    iconColor: "#fbbf24", linkColor: "#f59e0b" },
  danger:  { iconBg: "rgba(239,68,68,0.1)",     iconColor: "#f87171", linkColor: "#ef4444" },
  success: { iconBg: "rgba(16,185,129,0.1)",    iconColor: "#34d399", linkColor: "#10b981" },
  violet:  { iconBg: "rgba(139,92,246,0.1)",    iconColor: "#a78bfa", linkColor: "#8b5cf6" },
};

const DOT_COLORS: Record<StatusDot, string | null> = {
  active:  "#10b981",
  standby: "#4b5563",
  warning: "#f59e0b",
  none:    null,
};

interface DashboardPanelProps {
  title: string;
  icon: LucideIcon;
  accent?: Accent;
  badge?: string;
  statusDot?: StatusDot;
  action?: { label: string; href: string };
  headerRight?: ReactNode;
  children: ReactNode;
  noPadding?: boolean;
  className?: string;
}

export default function DashboardPanel({
  title,
  icon: Icon,
  accent = "indigo",
  badge,
  statusDot = "none",
  action,
  headerRight,
  children,
  noPadding = false,
  className = "",
}: DashboardPanelProps) {
  const a   = ACCENT[accent];
  const dot = DOT_COLORS[statusDot];

  return (
    <div
      className={`overflow-hidden flex flex-col ${className}`}
      style={{
        background:   "var(--th-card-bg)",
        border:       "1px solid var(--th-card-border)",
        boxShadow:    "var(--th-card-shadow)",
        borderRadius: "16px",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-6 py-5 shrink-0"
        style={{ borderBottom: "1px solid var(--th-divider)" }}
      >
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
          style={{ background: a.iconBg }}
        >
          <Icon size={12} style={{ color: a.iconColor }} />
        </div>

        <span className="flex-1 text-sm font-medium" style={{ color: "var(--th-text-1)" }}>
          {title}
        </span>

        {badge && (
          <span
            className="rounded-full px-2 py-0.5 text-xs"
            style={{ background: "var(--th-tag-bg)", color: "var(--th-text-3)" }}
          >
            {badge}
          </span>
        )}

        {dot && (
          <div
            className="h-1.5 w-1.5 rounded-full shrink-0 animate-pulse"
            style={{ background: dot }}
          />
        )}

        {headerRight}

        {action && (
          <Link
            href={action.href}
            className="flex items-center gap-1 text-xs transition-opacity hover:opacity-70 shrink-0"
            style={{ color: a.linkColor }}
          >
            {action.label}
            <ArrowRight size={10} />
          </Link>
        )}
      </div>

      {/* Body */}
      <div className={`flex-1 ${noPadding ? "" : "p-6"}`}>
        {children}
      </div>
    </div>
  );
}
