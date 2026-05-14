"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Bell,
  LogOut,
  Upload,
  ChevronRight,
  User,
  Command,
  Zap,
} from "lucide-react";
import { api } from "@/services/api";

const BREADCRUMB_MAP: Record<string, string> = {
  "/dashboard":      "Dashboard",
  "/contracts":      "Contracts",
  "/upload":         "Upload Center",
  "/ask-ai":         "Ask AI",
  "/clause-library": "Clause Library",
  "/risks":          "Risk Insights",
  "/obligations":    "Obligations",
  "/analytics":      "Analytics",
  "/alerts":         "Alerts",
  "/settings":       "Settings",
  "/profile":        "Profile",
};

export default function TopNavbar() {
  const router   = useRouter();
  const pathname = usePathname();
  const [alerts,      setAlerts]      = useState(0);
  const [search,      setSearch]      = useState("");
  const [searchFocus, setSearchFocus] = useState(false);

  useEffect(() => {
    api.alerts()
      .then((items) => setAlerts(items.filter((a) => a.status === "unread").length))
      .catch(() => undefined);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const segments  = pathname.split("/").filter(Boolean);
  const pageLabel = BREADCRUMB_MAP[pathname] ?? segments.at(-1) ?? "Dashboard";

  return (
    <header
      className="fixed top-0 right-0 z-40 flex h-16 items-center gap-3 px-6"
      style={{
        left: "256px",
        background: "rgba(5, 9, 22, 0.92)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderBottom: "1px solid rgba(99,102,241,0.08)",
        boxShadow: "0 1px 24px rgba(0,0,0,0.3)",
      }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 mr-auto min-w-0">
        <span className="font-mono-label" style={{ color: "#1a2538", fontSize: "0.6rem" }}>
          CONTRACT LENS
        </span>
        <ChevronRight size={11} style={{ color: "#1a2538" }} />
        <span className="text-sm font-semibold truncate" style={{ color: "#64748b" }}>
          {pageLabel}
        </span>
      </div>

      {/* AI Core Status pill */}
      <div
        className="hidden lg:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 shrink-0"
        style={{
          background: "rgba(16,185,129,0.04)",
          border: "1px solid rgba(16,185,129,0.1)",
        }}
      >
        <div
          className="h-1.5 w-1.5 rounded-full animate-pulse shrink-0"
          style={{ background: "#10b981", boxShadow: "0 0 5px rgba(16,185,129,0.6)" }}
        />
        <Zap size={10} style={{ color: "#059669" }} />
        <span className="font-mono-label" style={{ color: "#047857", fontSize: "0.56rem" }}>
          AI CORE ACTIVE
        </span>
      </div>

      {/* Search */}
      <div
        className="relative hidden md:flex items-center gap-2 rounded-xl px-3 py-2 transition-all duration-200"
        style={{
          width: searchFocus ? "280px" : "240px",
          background: searchFocus ? "rgba(7, 12, 26, 0.95)" : "rgba(9, 14, 31, 0.85)",
          border: `1px solid ${searchFocus ? "rgba(99,102,241,0.35)" : "rgba(99,102,241,0.1)"}`,
          boxShadow: searchFocus ? "0 0 0 3px rgba(99,102,241,0.06)" : "none",
          transition: "width 0.2s ease, border-color 0.2s, box-shadow 0.2s",
        }}
      >
        <Search size={13} style={{ color: searchFocus ? "#6366f1" : "#2a3550", transition: "color 0.2s" }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setSearchFocus(true)}
          onBlur={() => setSearchFocus(false)}
          placeholder="Search contracts..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#1a2538]"
          style={{ color: "#dae2fd", caretColor: "#6366f1" }}
        />
        <div
          className="flex items-center gap-0.5 rounded-md px-1.5 py-0.5 shrink-0"
          style={{
            background: "rgba(99,102,241,0.08)",
            border: "1px solid rgba(99,102,241,0.14)",
          }}
        >
          <Command size={9} style={{ color: "#2a3550" }} />
          <span className="font-mono-label" style={{ color: "#2a3550", fontSize: "0.56rem" }}>K</span>
        </div>
      </div>

      {/* Upload CTA */}
      <Link
        href="/upload"
        className="hidden sm:flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 hover:opacity-90 shrink-0"
        style={{
          background: "linear-gradient(135deg, #5046e5 0%, #4338ca 100%)",
          boxShadow: "0 0 20px rgba(99,102,241,0.3)",
          color: "#e0e7ff",
          letterSpacing: "0.04em",
        }}
      >
        <Upload size={13} />
        UPLOAD
      </Link>

      {/* Alerts */}
      <Link
        href="/alerts"
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200"
        style={{ border: "1px solid rgba(99,102,241,0.1)" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.07)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
      >
        <Bell size={15} style={{ color: "#3a4560" }} />
        {alerts > 0 && (
          <span
            className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[0.58rem] font-bold text-white"
            style={{ background: "#ef4444", boxShadow: "0 0 8px rgba(239,68,68,0.55)" }}
          >
            {alerts > 9 ? "9+" : alerts}
          </span>
        )}
      </Link>

      {/* Avatar */}
      <button
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200"
        style={{ border: "1px solid rgba(99,102,241,0.1)" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.07)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
      >
        <User size={15} style={{ color: "#3a4560" }} />
      </button>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200"
        style={{ border: "1px solid rgba(239,68,68,0.14)" }}
        title="Sign out"
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.07)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
      >
        <LogOut size={14} style={{ color: "#7f1d1d" }} />
      </button>
    </header>
  );
}
