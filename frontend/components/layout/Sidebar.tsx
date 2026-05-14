"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Upload,
  Sparkles,
  BookOpen,
  ShieldAlert,
  ClipboardList,
  BarChart2,
  Bell,
  Settings,
  Hexagon,
  Cpu,
} from "lucide-react";

const NAV_SECTIONS = [
  {
    label: "COMMAND CENTER",
    items: [
      { href: "/dashboard", label: "Dashboard",     icon: LayoutDashboard },
      { href: "/contracts", label: "Contracts",     icon: FileText        },
      { href: "/upload",    label: "Upload Center", icon: Upload          },
    ],
  },
  {
    label: "INTELLIGENCE",
    items: [
      { href: "/ask-ai",         label: "Ask AI",         icon: Sparkles     },
      { href: "/clause-library", label: "Clause Library", icon: BookOpen     },
      { href: "/risks",          label: "Risk Insights",  icon: ShieldAlert  },
      { href: "/obligations",    label: "Obligations",    icon: ClipboardList },
      { href: "/analytics",      label: "Analytics",      icon: BarChart2    },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { href: "/alerts",   label: "Alerts",   icon: Bell     },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <aside
      className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col"
      style={{
        background: "rgba(5, 9, 22, 0.97)",
        backdropFilter: "blur(32px) saturate(180%)",
        WebkitBackdropFilter: "blur(32px) saturate(180%)",
        borderRight: "1px solid rgba(99,102,241,0.09)",
        boxShadow: "4px 0 32px rgba(0,0,0,0.4)",
      }}
    >
      {/* Ambient left glow */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{
          background: "radial-gradient(ellipse 60% 40% at -10% 30%, rgba(99,102,241,0.07) 0%, transparent 60%)",
        }}
      />

      {/* Brand */}
      <div
        className="relative z-10 flex items-center gap-3 px-5 py-5"
        style={{ borderBottom: "1px solid rgba(99,102,241,0.08)" }}
      >
        <div className="relative shrink-0">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{
              background: "linear-gradient(135deg, #5046e5 0%, #4338ca 100%)",
              boxShadow: "0 0 24px rgba(99,102,241,0.45), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            <Hexagon size={18} className="text-white" fill="rgba(255,255,255,0.08)" strokeWidth={1.5} />
          </div>
          {/* Active ring */}
          <div
            className="absolute inset-[-3px] rounded-[13px] animate-ping-slow"
            style={{ border: "1px solid rgba(99,102,241,0.28)" }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold tracking-[0.06em]" style={{ color: "#c7d2f8" }}>
            Contract Lens
          </p>
          <p className="font-mono-label" style={{ color: "#1e2d47", fontSize: "0.58rem" }}>
            INTELLIGENCE SUITE
          </p>
        </div>
        {/* System online indicator */}
        <div className="flex flex-col items-center gap-0.5 shrink-0">
          <div
            className="h-1.5 w-1.5 rounded-full animate-pulse"
            style={{ background: "#10b981", boxShadow: "0 0 6px rgba(16,185,129,0.6)" }}
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p
              className="mb-2 px-3 font-mono-label"
              style={{ color: "#1a2538", fontSize: "0.58rem", letterSpacing: "0.1em" }}
            >
              {section.label}
            </p>

            <div className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200"
                    style={{
                      background: active
                        ? "linear-gradient(90deg, rgba(99,102,241,0.16) 0%, rgba(99,102,241,0.06) 100%)"
                        : "transparent",
                      border: active
                        ? "1px solid rgba(99,102,241,0.18)"
                        : "1px solid transparent",
                      boxShadow: active
                        ? "inset 3px 0 0 rgba(99,102,241,0.7)"
                        : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.05)";
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.1)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                        (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                      }
                    }}
                  >
                    <Icon
                      size={15}
                      className="shrink-0 transition-colors duration-200"
                      style={{ color: active ? "#6366f1" : "#2e3d5a" }}
                    />
                    <span
                      className="flex-1 text-sm font-medium transition-colors duration-200"
                      style={{ color: active ? "#dae2fd" : "#3a4a6a" }}
                    >
                      {label}
                    </span>
                    {active && (
                      <div
                        className="h-1 w-1 rounded-full shrink-0"
                        style={{ background: "#6366f1", boxShadow: "0 0 4px rgba(99,102,241,0.8)" }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* AI Core Status */}
      <div
        className="relative z-10 px-4 py-3"
        style={{ borderTop: "1px solid rgba(99,102,241,0.08)" }}
      >
        <div
          className="mb-3 flex items-center gap-2 rounded-lg px-3 py-2"
          style={{
            background: "rgba(16,185,129,0.04)",
            border: "1px solid rgba(16,185,129,0.09)",
          }}
        >
          <Cpu size={11} style={{ color: "#059669" }} />
          <span className="flex-1 font-mono-label" style={{ color: "#047857", fontSize: "0.56rem" }}>
            NEURAL CORE ACTIVE
          </span>
          <div
            className="h-1.5 w-1.5 rounded-full animate-pulse shrink-0"
            style={{ background: "#10b981", boxShadow: "0 0 5px rgba(16,185,129,0.6)" }}
          />
        </div>

        {/* Workspace user */}
        <div
          className="flex items-center gap-3 rounded-xl px-3 py-2.5"
          style={{
            background: "rgba(99,102,241,0.05)",
            border: "1px solid rgba(99,102,241,0.09)",
          }}
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
            style={{
              background: "linear-gradient(135deg, #5046e5 0%, #22d3ee 100%)",
              color: "white",
            }}
          >
            CL
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold" style={{ color: "#94a3b8" }}>
              Legal Team
            </p>
            <p className="truncate font-mono-label" style={{ color: "#1e2d47", fontSize: "0.56rem" }}>
              ENTERPRISE WORKSPACE
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
