"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileUp, Loader2 } from "lucide-react";
import { api, Contract } from "@/services/api";

export default function UploadPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  async function load() {
    setContracts(await api.contracts());
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
    const timer = setInterval(() => load().catch(() => undefined), 5000);
    return () => clearInterval(timer);
  }, []);

  async function onFile(file?: File) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      await api.upload(file, setProgress);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-24 text-slate-100 md:px-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-semibold">Upload</h1>
        <p className="mt-2 text-slate-400">PDF, DOCX, JPG, and PNG files are validated, stored with UUID filenames, and processed in the background.</p>
        {error && <div className="mt-6 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>}
        <label className="mt-8 flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-900 p-8 text-center hover:border-sky-500">
          {uploading ? <Loader2 className="animate-spin text-sky-400" size={40} /> : <FileUp className="text-sky-400" size={42} />}
          <span className="mt-4 text-lg font-medium">{uploading ? `Uploading ${progress}%` : "Select a contract"}</span>
          <span className="mt-2 text-sm text-slate-400">Processing continues after upload, so you can leave this page.</span>
          <input className="hidden" type="file" accept=".pdf,.docx,.jpg,.jpeg,.png" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>

        <section className="mt-8 rounded-lg border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 p-4 font-medium">Recent processing</div>
          <div className="divide-y divide-slate-800">
            {contracts.length === 0 && <p className="p-6 text-sm text-slate-400">No uploads yet.</p>}
            {contracts.slice(0, 8).map((contract) => (
              <Link href={`/contracts/${contract.id}`} key={contract.id} className="flex items-center justify-between p-4 hover:bg-slate-800/60">
                <span>{contract.title}</span>
                <span className="rounded bg-slate-800 px-2 py-1 text-xs uppercase text-slate-300">{contract.status}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
