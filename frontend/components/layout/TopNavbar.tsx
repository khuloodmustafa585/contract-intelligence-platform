"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Bell, LogOut, Upload, ChevronRight } from "lucide-react";
import { api } from "@/services/api";
import { useUser, getInitials } from "@/contexts/UserContext";

const PAGE_LABELS: Record<string, string> = {
  "/dashboard":   "Dashboard",
  "/contracts":   "Contracts",
  "/upload":      "Upload Center",
  "/ask-ai":      "Ask AI",
  "/risks":       "Risk Insights",
  "/obligations": "Obligations",
  "/alerts":      "Alerts",
  "/settings":    "Settings",
  "/profile":     "Profile",
};

export default function TopNavbar() {
  const router   = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const [alerts,      setAlerts]      = useState(0);
  const [search,      setSearch]      = useState("");
  const [searchFocus, setSearchFocus] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const initials = getInitials(user?.full_name ?? "Legal Team");

  useEffect(() => {
    api
      .alerts()
      .then((items) => setAlerts(items.filter((a) => a.status === "unread").length))
      .catch(() => undefined);
  }, []);

  // Focus search on "/" keypress (skip when user is typing in another input/textarea)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "/") return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return;
      e.preventDefault();
      searchRef.current?.focus();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && search.trim()) {
      router.push(`/contracts?q=${encodeURIComponent(search.trim())}`);
      setSearch("");
    }
    if (e.key === "Escape") {
      setSearch("");
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    // Clear the cookie that the middleware uses for route protection
    document.cookie = "token=; path=/; max-age=0; SameSite=Strict";
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
        background: "var(--th-navbar-bg)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--th-navbar-border)",
      }}
    >
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginRight: "auto" }}>
        <span style={{ fontSize: "0.72rem", color: "var(--th-text-4)" }}>Contract Lens</span>
        <ChevronRight size={11} style={{ color: "var(--th-text-4)" }} />
        <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--th-text-2)" }}>{pageLabel}</span>
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
          background: "var(--th-input-bg)",
          border: `1px solid ${searchFocus ? "rgba(59,130,246,0.4)" : "var(--th-input-border)"}`,
          borderRadius: "10px",
          boxShadow: searchFocus ? "0 0 0 3px rgba(59,130,246,0.07)" : "none",
          transition: "width 0.2s ease, border-color 0.15s, box-shadow 0.15s",
        }}
      >
        <Search
          size={12}
          style={{
            color: searchFocus ? "#3b82f6" : "var(--th-text-4)",
            flexShrink: 0,
            transition: "color 0.15s",
          }}
        />
        <input
          ref={searchRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setSearchFocus(true)}
          onBlur={() => setSearchFocus(false)}
          onKeyDown={handleSearch}
          placeholder="Search contracts…"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--th-text-1)",
            fontSize: "0.78rem",
          }}
        />
        <kbd
          style={{
            fontSize: "0.58rem",
            color: "var(--th-text-4)",
            background: "var(--th-tag-bg)",
            border: "1px solid var(--th-tag-border)",
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
          color: "var(--th-text-3)",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = "var(--th-hover-bg)";
          el.style.color = "var(--th-text-2)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = "transparent";
          el.style.color = "var(--th-text-3)";
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
              border: "1.5px solid var(--th-body-bg)",
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
        {initials}
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
          color: "var(--th-text-3)",
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
          el.style.color = "var(--th-text-3)";
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
