"use client";

import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen" style={{ background: "#0b1120" }}>
      <Sidebar />
      <TopNavbar />
      <main
        className="min-h-screen pt-12"
        style={{ paddingLeft: "240px" }}
      >
        {children}
      </main>
    </div>
  );
}
