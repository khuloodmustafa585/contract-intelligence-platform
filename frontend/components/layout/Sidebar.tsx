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
  LayoutGrid,
} from "lucide-react";
import { useUser, getInitials } from "@/contexts/UserContext";

const NAV_MAIN = [
  { href: "/dashboard",          label: "Dashboard",         icon: LayoutDashboard },
  { href: "/contracts",          label: "Contracts",         icon: FileText        },
  { href: "/contract-overview",  label: "Contract Overview", icon: LayoutGrid      },
  { href: "/risks",              label: "Risk Insights",     icon: ShieldAlert     },
  { href: "/ask-ai",             label: "Ask AI",            icon: Sparkles        },
  { href: "/obligations",        label: "Obligations",       icon: ClipboardList   },
  { href: "/analytics",          label: "Analytics",         icon: BarChart2       },
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
          color: "var(--th-text-5)",
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
                color: active ? "#93c5fd" : "var(--th-text-3)",
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
                  el.style.background = "var(--th-subtle-bg)";
                  el.style.color = "var(--th-text-2)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "transparent";
                  el.style.color = "var(--th-text-3)";
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
  const { user } = useUser();
  const displayName = user?.full_name ?? "Legal Team";
  const initials    = getInitials(displayName);
  // Show job_title → department → email as the subtitle, never a fake tier label
  const userSubtitle = user?.job_title ?? user?.department ?? user?.email ?? "Contract Intelligence";

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
        background: "var(--th-surface)",
        borderRight: "1px solid var(--th-surface-border)",
      }}
    >
      {/* Brand */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "18px 20px",
          borderBottom: "1px solid var(--th-surface-border)",
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
          <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--th-text-1)", lineHeight: 1.2 }}>
            Contract Lens
          </p>
          <p style={{ fontSize: "0.67rem", color: "var(--th-text-4)", lineHeight: 1.2, marginTop: "2px" }}>
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
        <NavGroup label="Main"   items={NAV_MAIN}   pathname={pathname} />
        <NavGroup label="Tools"  items={NAV_TOOLS}  pathname={pathname} />
        <NavGroup label="System" items={NAV_SYSTEM} pathname={pathname} />
      </nav>

      {/* User profile card */}
      <div style={{ padding: "12px", borderTop: "1px solid var(--th-surface-border)" }}>
        <Link
          href="/profile"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 12px",
            borderRadius: "10px",
            background: "var(--th-inner-hover)",
            border: "1px solid var(--th-tag-border)",
            textDecoration: "none",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.background = "var(--th-hover-bg)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.background = "var(--th-inner-hover)")
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
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: "0.8rem",
                fontWeight: 500,
                color: "var(--th-text-1)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {displayName}
            </p>
            <p style={{ fontSize: "0.67rem", color: "var(--th-text-4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userSubtitle}</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
