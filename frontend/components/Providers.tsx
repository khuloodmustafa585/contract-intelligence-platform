"use client";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { UserProvider } from "@/contexts/UserContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <UserProvider>{children}</UserProvider>
    </ThemeProvider>
  );
}
