"use client";

import { LucideIcon, ArrowRight } from "lucide-react";
import { ReactNode } from "react";
import Link from "next/link";

type Accent = "indigo" | "cyan" | "warning" | "danger" | "success" | "violet";
type StatusDot = "active" | "standby" | "warning" | "none";

const ACCENT: Record<Accent, { line: string; icon: string; iconBg: string; linkColor: string }> = {
  indigo:  { line: "rgba(99,102,241,0.65)",  icon: "#5046e5", iconBg: "rgba(99,102,241,0.09)",  linkColor: "#6366f1" },
  cyan:    { line: "rgba(34,211,238,0.6)",   icon: "#06b6d4", iconBg: "rgba(34,211,238,0.08)",  linkColor: "#22d3ee" },
  warning: { line: "rgba(245,158,11,0.6)",   icon: "#d97706", iconBg: "rgba(245,158,11,0.08)",  linkColor: "#f59e0b" },
  danger:  { line: "rgba(239,68,68,0.6)",    icon: "#dc2626", iconBg: "rgba(239,68,68,0.08)",   linkColor: "#f87171" },
  success: { line: "rgba(16,185,129,0.55)",  icon: "#059669", iconBg: "rgba(16,185,129,0.08)",  linkColor: "#10b981" },
  violet:  { line: "rgba(139,92,246,0.6)",   icon: "#7c3aed", iconBg: "rgba(139,92,246,0.09)",  linkColor: "#a78bfa" },
};

const DOT_COLORS: Record<StatusDot, { bg: string; glow: string } | null> = {
  active:  { bg: "#10b981", glow: "rgba(16,185,129,0.5)"  },
  standby: { bg: "#6366f1", glow: "rgba(99,102,241,0.4)"  },
  warning: { bg: "#f59e0b", glow: "rgba(245,158,11,0.5)"  },
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
  const a = ACCENT[accent];
  const dot = DOT_COLORS[statusDot];

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl flex flex-col transition-all duration-300 ${className}`}
      style={{
        background: "rgba(9, 14, 31, 0.85)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        border: "1px solid rgba(99,102,241,0.09)",
        boxShadow: "0 4px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${a.line} 35%, ${a.line} 65%, transparent 100%)`,
        }}
      />

      {/* Hover corner glow */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle, ${a.line.replace("0.65", "0.08").replace("0.6", "0.07").replace("0.55", "0.06")} 0%, transparent 70%)`,
          filter: "blur(16px)",
        }}
      />

      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-5 py-3.5 shrink-0"
        style={{ borderBottom: "1px solid rgba(99,102,241,0.07)" }}
      >
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
          style={{ background: a.iconBg }}
        >
          <Icon size={12} style={{ color: a.icon }} />
        </div>

        <span className="flex-1 font-mono-label" style={{ color: "#2e3d5a", fontSize: "0.62rem" }}>
          {title}
        </span>

        {badge && (
          <span
            className="rounded-md px-1.5 py-0.5 font-mono-label"
            style={{
              background: a.iconBg,
              color: a.linkColor,
              fontSize: "0.54rem",
              border: `1px solid ${a.iconBg.replace("0.09", "0.18").replace("0.08", "0.16")}`,
            }}
          >
            {badge}
          </span>
        )}

        {dot && (
          <div
            className="h-1.5 w-1.5 rounded-full animate-pulse shrink-0"
            style={{ background: dot.bg, boxShadow: `0 0 6px ${dot.glow}` }}
          />
        )}

        {headerRight}

        {action && (
          <Link
            href={action.href}
            className="flex items-center gap-0.5 transition-opacity hover:opacity-70 shrink-0"
            style={{ color: a.linkColor }}
          >
            <span className="font-mono-label" style={{ fontSize: "0.57rem" }}>{action.label}</span>
            <ArrowRight size={9} />
          </Link>
        )}
      </div>

      {/* Body */}
      <div className={`flex-1 ${noPadding ? "" : "p-5"}`}>
        {children}
      </div>
    </div>
  );
}
