"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "@/services/api";

export type AppUser = {
  id: number;
  full_name: string;
  email: string;
  is_verified: boolean;
  email_notifications_enabled: boolean;
  department?: string | null;
  company?: string | null;
  avatar_url?: string | null;
};

type UserContextType = {
  user: AppUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  updateUser: (data: Partial<AppUser>) => void;
};

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = await api.me();
      setUser(data as AppUser);
    } catch {
      // Invalid / expired token — auth redirect handled by api.ts
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const updateUser = useCallback((data: Partial<AppUser>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, refreshUser: fetchUser, updateUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
