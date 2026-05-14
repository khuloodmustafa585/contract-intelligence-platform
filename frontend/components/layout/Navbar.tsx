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
    <header className="fixed top-0 left-64 right-0 z-40 h-16 border-b border-slate-800 bg-slate-950/70 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-8">

        {/* Left Section */}
        <div className="flex items-center gap-4 w-full max-w-md">

          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search placeholder..."
              className="
                w-full rounded-lg border border-slate-700
                bg-slate-900 px-4 py-2 text-sm
                text-slate-200 placeholder:text-slate-500
                outline-none transition
                focus:border-sky-500
              "
            />
          </div>

        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">

          {/* Notifications */}
          <button
            className="
              rounded-lg border border-slate-800
              bg-slate-900 p-2 text-slate-400
              transition hover:border-sky-500
              hover:text-sky-400
            "
          >
            <Bell size={18} />
          </button>

          {/* Language Buttons */}
          <div className="flex items-center rounded-lg border border-slate-800 overflow-hidden">

            <button
              onClick={() => changeLanguage("en")}
              className="
                px-3 py-2 text-xs font-medium
                text-slate-300 transition
                hover:bg-slate-800
              "
            >
              EN
            </button>

            <button
              onClick={() => changeLanguage("ar")}
              className="
                border-l border-slate-800
                px-3 py-2 text-xs font-medium
                text-slate-300 transition
                hover:bg-slate-800
              "
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
            className="
              flex h-10 w-10 items-center justify-center
              rounded-full border border-slate-800
              bg-slate-900 text-slate-400
            "
          >
            <Globe size={18} />
          </div>

        </div>
      </div>
    </header>
  );
}