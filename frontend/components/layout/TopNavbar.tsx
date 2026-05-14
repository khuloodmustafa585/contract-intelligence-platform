"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Bell, LogOut, User } from "lucide-react";
import { api } from "@/services/api";

const PAGE_LABELS: Record<string, string> = {
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
  const pageLabel = PAGE_LABELS[pathname] ?? segments.at(-1) ?? "Dashboard";

  return (
    <header
      className="fixed top-0 right-0 z-40 flex h-12 items-center gap-3 px-6"
      style={{
        left: "240px",
        background: "#0b1120",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Page title */}
      <span className="mr-auto text-sm font-medium" style={{ color: "#f3f4f6" }}>
        {pageLabel}
      </span>

      {/* Search */}
      <div
        className="relative hidden md:flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all duration-150"
        style={{
          width: searchFocus ? "240px" : "200px",
          background: "#0f172a",
          border: `1px solid ${searchFocus ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.07)"}`,
          boxShadow: searchFocus ? "0 0 0 3px rgba(59,130,246,0.06)" : "none",
          transition: "width 0.2s ease, border-color 0.15s, box-shadow 0.15s",
        }}
      >
        <Search
          size={12}
          style={{ color: searchFocus ? "#3b82f6" : "#374151", flexShrink: 0, transition: "color 0.15s" }}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setSearchFocus(true)}
          onBlur={() => setSearchFocus(false)}
          placeholder="Search contracts..."
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: "#f3f4f6" }}
        />
      </div>

      {/* Alerts */}
      <Link
        href="/alerts"
        className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors duration-150"
        style={{ color: "#4b5563" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
          (e.currentTarget as HTMLElement).style.color = "#94a3b8";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.color = "#4b5563";
        }}
      >
        <Bell size={14} />
        {alerts > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[0.55rem] font-bold text-white"
            style={{ background: "#ef4444" }}
          >
            {alerts > 9 ? "9+" : alerts}
          </span>
        )}
      </Link>

      {/* Avatar */}
      <Link
        href="/profile"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors duration-150"
        style={{ color: "#4b5563" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
          (e.currentTarget as HTMLElement).style.color = "#94a3b8";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.color = "#4b5563";
        }}
      >
        <User size={14} />
      </Link>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors duration-150"
        style={{ color: "#4b5563" }}
        title="Sign out"
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)";
          (e.currentTarget as HTMLElement).style.color = "#f87171";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.color = "#4b5563";
        }}
      >
        <LogOut size={14} />
      </button>
    </header>
  );
}
