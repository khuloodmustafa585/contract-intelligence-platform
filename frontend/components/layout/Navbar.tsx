"use client";

import { Bell, Globe, LogOut } from "lucide-react";

export default function Navbar() {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const changeLanguage = (lang: string) => {
    localStorage.setItem("lang", lang);
    window.location.reload();
  };

  return (
    <header
      className="fixed top-0 left-64 right-0 z-40 h-16 backdrop-blur-xl"
      style={{
        borderBottom: "1px solid var(--th-navbar-border)",
        background: "var(--th-navbar-bg)",
      }}
    >
      <div className="flex h-full items-center justify-between px-8">

        {/* Left Section */}
        <div className="flex items-center gap-4 w-full max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search placeholder..."
              className="w-full rounded-lg px-4 py-2 text-sm outline-none transition placeholder:text-[#64748b] focus:outline-none"
              style={{
                background: "var(--th-input-bg)",
                border: "1px solid var(--th-input-border)",
                color: "var(--th-text-1)",
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#38bdf8";
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--th-input-border)";
              }}
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">

          {/* Notifications */}
          <button
            className="rounded-lg p-2 transition hover:border-sky-500 hover:text-sky-400"
            style={{
              border: "1px solid var(--th-input-border)",
              background: "var(--th-subtle-bg)",
              color: "var(--th-text-3)",
            }}
          >
            <Bell size={18} />
          </button>

          {/* Language Buttons */}
          <div
            className="flex items-center rounded-lg overflow-hidden"
            style={{ border: "1px solid var(--th-input-border)" }}
          >
            <button
              onClick={() => changeLanguage("en")}
              className="px-3 py-2 text-xs font-medium transition"
              style={{ color: "var(--th-text-2)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--th-hover-bg)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              EN
            </button>

            <button
              onClick={() => changeLanguage("ar")}
              className="px-3 py-2 text-xs font-medium transition"
              style={{
                borderLeft: "1px solid var(--th-input-border)",
                color: "var(--th-text-2)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--th-hover-bg)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              AR
            </button>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="
              flex items-center gap-2 rounded-lg
              border border-red-900/40
              bg-red-950/20 px-4 py-2
              text-sm text-red-300
              transition hover:bg-red-900/30
            "
          >
            <LogOut size={16} />
            Logout
          </button>

          {/* User Avatar */}
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{
              border: "1px solid var(--th-input-border)",
              background: "var(--th-subtle-bg)",
              color: "var(--th-text-3)",
            }}
          >
            <Globe size={18} />
          </div>

        </div>
      </div>
    </header>
  );
}
