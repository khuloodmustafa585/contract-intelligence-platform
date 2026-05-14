"use client";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#080d1a]">
      <Sidebar />
      <div className="flex flex-1 flex-col pl-64">
        <Navbar />
        <main className="flex-1 overflow-y-auto pt-16 px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
