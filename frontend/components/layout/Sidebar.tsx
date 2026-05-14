"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  FileText,
  BookOpen,
  CheckSquare,
  ShieldAlert,
  BarChart3,
  Bot,
  Bell,
  User,
  Settings,
  LogOut,
  Zap,
} from "lucide-react";
import { logoutUser } from "@/services/api";

const NAV_ITEMS = [
  { label: "Dashboard",         href: "/dashboard",      icon: LayoutDashboard },
  { label: "Upload",            href: "/upload",         icon: Upload },
  { label: "Contracts",         href: "/contracts",      icon: FileText },
  { label: "Clause Library",    href: "/clause-library", icon: BookOpen },
  { label: "Obligations",       href: "/obligations",    icon: CheckSquare },
  { label: "Risk Insights",     href: "/risks",          icon: ShieldAlert },
  { label: "Analytics",         href: "/analytics",      icon: BarChart3 },
  { label: "Ask AI",            href: "/ask-ai",         icon: Bot },
  { label: "Alerts",            href: "/alerts",         icon: Bell },
];

const BOTTOM_ITEMS = [
  { label: "Profile",  href: "/profile",  icon: User },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[rgba(99,131,200,0.1)] bg-[#080d1a]">
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 border-b border-[rgba(99,131,200,0.1)] px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
          <Zap size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight text-white">Contract Lens</p>
          <p className="text-[10px] font-medium uppercase tracking-widest text-blue-400/70">Intelligence Suite</p>
        </div>
      </div>

      {/* ── Main nav ── */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`
                group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium
                transition-all duration-150
                ${active
                  ? "nav-active"
                  : "text-slate-400 hover:bg-[rgba(99,131,200,0.06)] hover:text-slate-200"
                }
              `}
            >
              <Icon
                size={17}
                className={`flex-shrink-0 transition-colors ${
                  active ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"
                }`}
              />
              <span>{label}</span>
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400 shadow-sm shadow-blue-400/60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom section ── */}
      <div className="border-t border-[rgba(99,131,200,0.1)] px-3 py-3 space-y-1">
        {BOTTOM_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`
                group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium
                transition-all duration-150
                ${active
                  ? "nav-active"
                  : "text-slate-400 hover:bg-[rgba(99,131,200,0.06)] hover:text-slate-200"
                }
              `}
            >
              <Icon size={17} className={`flex-shrink-0 ${active ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"}`} />
              {label}
            </Link>
          );
        })}
        <button
          onClick={logoutUser}
          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-all duration-150 hover:bg-[rgba(239,68,68,0.08)] hover:text-red-400"
        >
          <LogOut size={17} className="flex-shrink-0 text-slate-600 group-hover:text-red-400" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
