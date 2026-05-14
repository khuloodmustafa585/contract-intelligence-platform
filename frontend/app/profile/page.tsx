"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Mail, Shield, User } from "lucide-react";
import { api } from "@/services/api";
import AppShell from "@/components/layout/AppShell";

type UserData = { id: number; full_name: string; email: string; is_verified: boolean };

function InfoField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-[rgba(99,131,200,0.1)] bg-[#0d1528] p-5">
      <div className="mb-2 flex items-center gap-2 text-slate-500">
        <Icon size={14} />
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-base font-medium text-slate-200">{value}</p>
    </div>
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.me()
      .then(setUser)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <AppShell>
      <div className="page-header">
        <div className="mb-1 flex items-center gap-2">
          <User size={15} className="text-blue-400" />
          <span className="text-xs font-medium uppercase tracking-widest text-blue-400/70">
            Account
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="mt-1 text-sm text-slate-400">Your workspace identity and account details.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-[rgba(239,68,68,0.08)] px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 size={16} className="animate-spin" /> Loading profile…
        </div>
      ) : user ? (
        <div className="max-w-2xl space-y-6">
          {/* Avatar card */}
          <div className="flex items-center gap-5 rounded-2xl border border-[rgba(99,131,200,0.1)] bg-[#0d1528] p-6">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xl font-bold text-white shadow-lg shadow-blue-500/25">
              {initials}
            </div>
            <div>
              <p className="text-lg font-bold text-white">{user.full_name}</p>
              <p className="text-sm text-slate-400">{user.email}</p>
              <div className="mt-2 flex items-center gap-1.5">
                {user.is_verified ? (
                  <>
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    <span className="text-xs text-emerald-400">Verified account</span>
                  </>
                ) : (
                  <>
                    <Shield size={13} className="text-amber-400" />
                    <span className="text-xs text-amber-400">Email not verified</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Detail fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoField label="Full name"    value={user.full_name}                    icon={User} />
            <InfoField label="Email"        value={user.email}                        icon={Mail} />
            <InfoField label="User ID"      value={`#${user.id}`}                     icon={Shield} />
            <InfoField label="Verification" value={user.is_verified ? "Verified" : "Pending"} icon={CheckCircle2} />
          </div>
        </div>
      ) : (
        <p className="text-slate-500">No profile data found.</p>
      )}
    </AppShell>
  );
}
