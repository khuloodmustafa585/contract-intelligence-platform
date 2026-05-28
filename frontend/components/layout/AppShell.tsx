"use client";

import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--th-body-bg)" }}>
      <Sidebar />
      <TopNavbar />
      <main style={{ minHeight: "100vh", paddingTop: "56px", paddingLeft: "240px" }}>
        {children}
      </main>
    </div>
  );
}
