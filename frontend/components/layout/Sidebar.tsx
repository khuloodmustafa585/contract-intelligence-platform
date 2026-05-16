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
  { href: "/upload",         label: "Upload Center",  icon: Upload   },
  { href: "/clause-library", label: "Clause Library", icon: BookOpen },
  { href: "/alerts",         label: "Alerts",         icon: Bell     },
];

const NAV_SYSTEM = [
  { href: "/settings", label: "Settings", icon: Settings },
];

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties; strokeWidth?: number }>;
};

function NavGroup({ label, items, pathname }: { label: string; items: NavItem[]; pathname: string }) {
  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <div>
      <p
        style={{
          fontSize: "0.59rem",
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#1e293b",
          padding: "0 10px",
          marginBottom: "5px",
        }}
      >
        {label}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
        {items.map(({ href, label: itemLabel, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 10px",
                borderRadius: "10px",
                fontSize: "0.82rem",
                fontWeight: active ? 500 : 400,
                color: active ? "#93c5fd" : "#475569",
                background: active
                  ? "linear-gradient(90deg, rgba(59,130,246,0.12) 0%, rgba(59,130,246,0.04) 100%)"
                  : "transparent",
                borderLeft: `2px solid ${active ? "#3b82f6" : "transparent"}`,
                boxShadow: active ? "inset 0 0 0 1px rgba(59,130,246,0.08)" : "none",
                transition: "all 0.15s ease",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "rgba(255,255,255,0.04)";
                  el.style.color = "#94a3b8";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "transparent";
                  el.style.color = "#475569";
                }
              }}
            >
              <Icon
                size={14}
                strokeWidth={active ? 2.2 : 1.75}
                style={{ color: active ? "#60a5fa" : "currentColor", flexShrink: 0 }}
              />
              {itemLabel}
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
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 50,
        width: "240px",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#060d1b",
        borderRight: "1px solid rgba(255,255,255,0.055)",
      }}
    >
      {/* Brand */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "18px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.055)",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 4px 14px rgba(59,130,246,0.35)",
          }}
        >
          <Scale size={15} color="#ffffff" strokeWidth={2} />
        </div>
        <div>
          <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#f1f5f9", lineHeight: 1.2 }}>
            Contract Lens
          </p>
          <p style={{ fontSize: "0.67rem", color: "#334155", lineHeight: 1.2, marginTop: "2px" }}>
            Legal Intelligence
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "28px",
        }}
      >
        <NavGroup label="Main" items={NAV_MAIN} pathname={pathname} />
        <NavGroup label="Tools" items={NAV_TOOLS} pathname={pathname} />
        <NavGroup label="System" items={NAV_SYSTEM} pathname={pathname} />
      </nav>

      {/* User profile */}
      <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.055)" }}>
        <Link
          href="/profile"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 12px",
            borderRadius: "10px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.05)",
            textDecoration: "none",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)")
          }
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #3b82f6, #7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.58rem",
              fontWeight: 700,
              color: "#ffffff",
              flexShrink: 0,
              letterSpacing: "0.03em",
            }}
          >
            LT
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: "0.8rem",
                fontWeight: 500,
                color: "#d1d5db",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Legal Team
            </p>
            <p style={{ fontSize: "0.67rem", color: "#334155" }}>Enterprise</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
