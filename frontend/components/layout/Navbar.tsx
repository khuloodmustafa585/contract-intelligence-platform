"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, Search, User } from "lucide-react";
import Link from "next/link";
import { api, logoutUser } from "@/services/api";

export default function Navbar() {
  const [unread, setUnread] = useState(0);
  const [user, setUser] = useState<{ full_name: string; email: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.me().then(setUser).catch(() => {});
    api.dashboard().then((d) => setUnread(d.unread_alerts)).catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "CL";

  return (
    <header className="fixed left-64 right-0 top-0 z-40 h-16 border-b border-[rgba(99,131,200,0.1)] bg-[rgba(8,13,26,0.85)] backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-6">

        {/* Search */}
        <div className="relative w-72">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            placeholder="Search contracts, clauses, risks…"
            className="w-full rounded-lg border border-[rgba(99,131,200,0.15)] bg-[rgba(13,21,40,0.6)] py-2 pl-9 pr-4 text-sm text-slate-300 placeholder:text-slate-600 outline-none transition focus:border-blue-500/50 focus:bg-[rgba(13,21,40,0.9)]"
          />
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">

          {/* Alerts bell */}
          <Link
            href="/alerts"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[rgba(99,131,200,0.12)] text-slate-400 transition hover:border-blue-500/30 hover:text-blue-400"
          >
            <Bell size={17} />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold text-white shadow-sm shadow-red-500/40">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </Link>

          {/* Profile dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg border border-[rgba(99,131,200,0.12)] bg-[rgba(13,21,40,0.6)] px-3 py-2 text-sm transition hover:border-blue-500/30"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[10px] font-bold text-white">
                {initials}
              </div>
              <span className="max-w-[120px] truncate text-slate-300">
                {user?.full_name ?? "…"}
              </span>
              <ChevronDown size={14} className="text-slate-500" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-[rgba(99,131,200,0.15)] bg-[#0d1528] shadow-2xl shadow-black/40">
                <div className="border-b border-[rgba(99,131,200,0.1)] px-4 py-3">
                  <p className="text-sm font-medium text-slate-200">{user?.full_name ?? "User"}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{user?.email ?? ""}</p>
                </div>
                <div className="p-1.5">
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-[rgba(99,131,200,0.08)] hover:text-slate-100"
                  >
                    <User size={15} className="text-slate-500" /> Profile
                  </Link>
                  <button
                    onClick={logoutUser}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-[rgba(239,68,68,0.08)]"
                  >
                    <span className="text-red-500">⎋</span> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
