"use client";

import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen" style={{ background: "#0b1326" }}>
      <Sidebar />
      <TopNavbar />
    <main
      className="min-h-screen"
      style={{
        paddingLeft: "266px",
        paddingTop: "70px",
      }}
    > 
        {children}
      </main>
    </div>
  );
}
