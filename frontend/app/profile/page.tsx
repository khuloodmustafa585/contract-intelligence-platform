"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";

type User = { id: number; full_name: string; email: string; is_verified: boolean };

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { api.me().then((data) => setUser(data as User)).catch((err) => setError(err.message)); }, []);
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-24 text-slate-100 md:px-10">
      <div className="mx-auto max-w-3xl rounded-lg border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-3xl font-semibold">Profile</h1>
        {error && <div className="mt-6 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>}
        {!user ? <p className="mt-6 text-slate-400">Loading profile...</p> : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Name" value={user.full_name} />
            <Field label="Email" value={user.email} />
            <Field label="Verification" value={user.is_verified ? "Verified" : "Pending"} />
            <Field label="User ID" value={String(user.id)} />
          </div>
        )}
      </div>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-slate-800 bg-slate-950 p-4"><p className="text-sm text-slate-400">{label}</p><p className="mt-2 font-medium">{value}</p></div>;
}
