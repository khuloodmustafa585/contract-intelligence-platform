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
  Scale,
} from "lucide-react";

const NAV_MAIN = [
  { href: "/dashboard",   label: "Dashboard",     icon: LayoutDashboard },
  { href: "/contracts",   label: "Contracts",     icon: FileText        },
  { href: "/risks",       label: "Risk Insights", icon: ShieldAlert     },
  { href: "/ask-ai",      label: "Ask AI",        icon: Sparkles        },
  { href: "/obligations", label: "Obligations",   icon: ClipboardList   },
  { href: "/analytics",   label: "Analytics",     icon: BarChart2       },
];

const NAV_TOOLS = [
  { href: "/upload",         label: "Upload",         icon: Upload   },
  { href: "/clause-library", label: "Clause Library", icon: BookOpen },
  { href: "/alerts",         label: "Alerts",         icon: Bell     },
];

const NAV_SYSTEM = [
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: { href: string; label: string; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties; strokeWidth?: number }> }[];
  pathname: string;
}) {
  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <div>
      <p
        className="mb-1.5 px-3 text-xs font-medium uppercase tracking-widest"
        style={{ color: "#1f2937", fontSize: "0.6rem", letterSpacing: "0.12em" }}
      >
        {label}
      </p>
      <div className="space-y-px">
        {items.map(({ href, label: itemLabel, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150"
              style={{
                background: active ? "rgba(59,130,246,0.1)" : "transparent",
                color: active ? "#93c5fd" : "#4b5563",
                borderLeft: active ? "2px solid #3b82f6" : "2px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                  (e.currentTarget as HTMLElement).style.color = "#94a3b8";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "#4b5563";
                }
              }}
            >
              <Icon
                size={14}
                strokeWidth={active ? 2 : 1.75}
                style={{ color: active ? "#60a5fa" : "currentColor", flexShrink: 0 }}
              />
              <span className="font-medium">{itemLabel}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 z-50 flex h-screen flex-col"
      style={{
        width: "240px",
        background: "#080f1e",
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Brand */}
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
          style={{ background: "#3b82f6" }}
        >
          <Scale size={13} className="text-white" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight" style={{ color: "#f3f4f6" }}>
            Contract Lens
          </p>
          <p className="text-xs leading-tight" style={{ color: "#374151" }}>
            Legal Intelligence
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        <NavGroup label="Main" items={NAV_MAIN} pathname={pathname} />
        <NavGroup label="Tools" items={NAV_TOOLS} pathname={pathname} />
        <NavGroup label="System" items={NAV_SYSTEM} pathname={pathname} />
      </nav>

      {/* User */}
      <div
        className="px-4 pb-4 pt-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150"
          style={{ background: "rgba(255,255,255,0.03)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)")}
        >
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold"
            style={{ background: "#3b82f6", color: "#ffffff" }}
          >
            LT
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium" style={{ color: "#d1d5db" }}>
              Legal Team
            </p>
            <p className="text-xs" style={{ color: "#374151" }}>
              Enterprise
            </p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
