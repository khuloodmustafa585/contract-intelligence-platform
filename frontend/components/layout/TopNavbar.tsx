"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Bell, LogOut, Upload, ChevronRight } from "lucide-react";
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
    api
      .alerts()
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
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        left: "240px",
        zIndex: 40,
        height: "56px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "0 24px",
        background: "rgba(5, 12, 25, 0.88)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginRight: "auto" }}>
        <span style={{ fontSize: "0.72rem", color: "#1e293b" }}>Contract Lens</span>
        <ChevronRight size={11} style={{ color: "#1e293b" }} />
        <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "#94a3b8" }}>{pageLabel}</span>
      </div>

      {/* Search */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "0 12px",
          height: "34px",
          width: searchFocus ? "260px" : "210px",
          background: "rgba(15, 28, 52, 0.8)",
          border: `1px solid ${searchFocus ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.07)"}`,
          borderRadius: "10px",
          boxShadow: searchFocus ? "0 0 0 3px rgba(59,130,246,0.07)" : "none",
          transition: "width 0.2s ease, border-color 0.15s, box-shadow 0.15s",
        }}
      >
        <Search
          size={12}
          style={{
            color: searchFocus ? "#3b82f6" : "#334155",
            flexShrink: 0,
            transition: "color 0.15s",
          }}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setSearchFocus(true)}
          onBlur={() => setSearchFocus(false)}
          placeholder="Search contracts..."
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#f1f5f9",
            fontSize: "0.78rem",
          }}
        />
        <kbd
          style={{
            fontSize: "0.58rem",
            color: "#1e293b",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "4px",
            padding: "1px 5px",
            fontFamily: "monospace",
            flexShrink: 0,
          }}
        >
          /
        </kbd>
      </div>

      {/* Notification bell */}
      <Link
        href="/alerts"
        style={{
          position: "relative",
          width: "34px",
          height: "34px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "10px",
          color: "#475569",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = "rgba(255,255,255,0.06)";
          el.style.color = "#94a3b8";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = "transparent";
          el.style.color = "#475569";
        }}
      >
        <Bell size={15} />
        {alerts > 0 && (
          <span
            style={{
              position: "absolute",
              top: "7px",
              right: "7px",
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#ef4444",
              border: "1.5px solid #050c19",
            }}
          />
        )}
      </Link>

      {/* User avatar */}
      <Link
        href="/profile"
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "9px",
          background: "linear-gradient(135deg, #3b82f6, #7c3aed)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.58rem",
          fontWeight: 700,
          color: "#ffffff",
          flexShrink: 0,
          textDecoration: "none",
          boxShadow: "0 2px 10px rgba(59,130,246,0.3)",
          letterSpacing: "0.04em",
        }}
      >
        LT
      </Link>

      {/* Logout */}
      <button
        onClick={handleLogout}
        title="Sign out"
        style={{
          width: "34px",
          height: "34px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "10px",
          color: "#475569",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = "rgba(239,68,68,0.08)";
          el.style.color = "#f87171";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = "transparent";
          el.style.color = "#475569";
        }}
      >
        <LogOut size={14} />
      </button>

      {/* Upload CTA */}
      <Link
        href="/upload"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "0 16px",
          height: "34px",
          borderRadius: "10px",
          background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
          color: "#ffffff",
          fontSize: "0.8rem",
          fontWeight: 500,
          textDecoration: "none",
          boxShadow: "0 4px 14px rgba(59,130,246,0.35)",
          transition: "opacity 0.15s",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.85")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
      >
        <Upload size={13} />
        Upload
      </Link>
    </header>
  );
}
