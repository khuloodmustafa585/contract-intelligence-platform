"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  CloudUpload,
  FileText,
  Loader2,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { api, Contract } from "@/services/api";
import { StatusBadge } from "@/components/common/StatusBadge";
import AppShell from "@/components/layout/AppShell";

const PROCESSING_STEPS = [
  { key: "processing",        label: "Parsing & OCR" },
  { key: "parsed",            label: "Text Cleaned" },
  { key: "indexing",          label: "Embedding Clauses" },
  { key: "analysis_pending",  label: "AI Analysis" },
  { key: "completed",         label: "Complete" },
];

const STEP_ORDER = [
  "uploaded", "processing", "ocr_processing", "parsed",
  "indexing", "analysis_pending", "completed",
];

function stepIndex(status: string) {
  return STEP_ORDER.indexOf(status);
}

function ProcessingTimeline({ status }: { status: string }) {
  const currentIdx = stepIndex(status);
  return (
    <div className="flex items-center gap-1.5">
      {PROCESSING_STEPS.map((step, i) => {
        const stepIdx = stepIndex(step.key);
        const done = currentIdx > stepIdx || status === "completed";
        const active = currentIdx === stepIdx || (step.key === "processing" && status === "ocr_processing");
        const failed = status === "failed";
        return (
          <div key={step.key} className="flex items-center gap-1.5">
            <div className={`flex items-center gap-1.5 text-xs ${done ? "step-done" : active ? "step-active" : "step-pending"}`}>
              {failed && active ? (
                <XCircle size={13} className="text-red-400" />
              ) : done ? (
                <CheckCircle2 size={13} />
              ) : active ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <div className="h-3 w-3 rounded-full border border-current opacity-40" />
              )}
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {i < PROCESSING_STEPS.length - 1 && (
              <ChevronRight size={11} className="text-slate-700" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function UploadPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function load() {
    const data = await api.contracts();
    setContracts(data);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
    const timer = setInterval(() => load().catch(() => undefined), 4000);
    return () => clearInterval(timer);
  }, []);

  async function onFile(file?: File) {
    if (!file) return;
    setUploading(true);
    setError("");
    setProgress(0);
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }, []);

  async function retry(id: number) {
    try {
      await api.retryContract(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retry failed");
    }
  }

  const inProgress = contracts.filter(
    (c) => !["completed", "failed"].includes(c.status)
  );
  const recent = contracts.slice(0, 10);

  return (
    <AppShell>
      <div className="page-header">
        <div className="flex items-center gap-2 mb-1">
          <CloudUpload size={15} className="text-blue-400" />
          <span className="text-xs font-medium uppercase tracking-widest text-blue-400/70">Ingestion</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Upload Contract</h1>
        <p className="mt-1 text-sm text-slate-400">
          PDF, DOCX, JPG, PNG — validated, OCR-processed, and analyzed automatically.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-[rgba(239,68,68,0.08)] px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`
          relative flex min-h-60 cursor-pointer flex-col items-center justify-center rounded-2xl
          border-2 border-dashed p-10 text-center transition-all duration-200
          ${dragging
            ? "border-blue-500 bg-[rgba(59,130,246,0.08)] glow-blue"
            : "border-[rgba(99,131,200,0.2)] bg-[#0d1528] hover:border-blue-500/40 hover:bg-[rgba(59,130,246,0.04)]"
          }
        `}
      >
        <input
          ref={inputRef}
          className="hidden"
          type="file"
          accept=".pdf,.docx,.jpg,.jpeg,.png"
          onChange={(e) => onFile(e.target.files?.[0])}
        />

        {uploading ? (
          <>
            <div className="relative mb-4 flex h-16 w-16 items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(59,130,246,0.15)" strokeWidth="4" />
                <circle
                  cx="32" cy="32" r="28"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
                  style={{ transition: "stroke-dashoffset 0.3s" }}
                />
              </svg>
              <span className="text-sm font-bold text-blue-400">{progress}%</span>
            </div>
            <p className="text-base font-medium text-slate-300">Uploading…</p>
            <p className="mt-1 text-sm text-slate-500">Processing starts immediately after upload.</p>
          </>
        ) : (
          <>
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20">
              <CloudUpload size={30} className="text-blue-400" />
            </div>
            <p className="text-base font-semibold text-slate-200">
              {dragging ? "Drop to upload" : "Drop a contract or click to browse"}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              PDF · DOCX · PNG · JPG · JPEG — max 10 MB
            </p>
          </>
        )}
      </div>

      {/* In-progress banner */}
      {inProgress.length > 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-blue-500/20 bg-[rgba(59,130,246,0.06)] px-4 py-3">
          <Loader2 size={15} className="animate-spin text-blue-400" />
          <span className="text-sm text-slate-300">
            {inProgress.length} contract{inProgress.length > 1 ? "s" : ""} processing…
          </span>
        </div>
      )}

      {/* Recent contracts */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-[rgba(99,131,200,0.1)] bg-[#0d1528]">
        <div className="flex items-center justify-between border-b border-[rgba(99,131,200,0.1)] px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-200">Recent Processing</h2>
          <Link href="/contracts" className="flex items-center gap-1 text-xs text-blue-400 hover:underline">
            All contracts <ChevronRight size={13} />
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No contracts yet.</p>
        ) : (
          <div className="divide-y divide-[rgba(99,131,200,0.07)]">
            {recent.map((contract) => (
              <div key={contract.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText size={15} className="flex-shrink-0 text-slate-600" />
                  <div className="min-w-0">
                    <Link
                      href={`/contracts/${contract.id}`}
                      className="truncate text-sm font-medium text-slate-200 hover:text-blue-400"
                    >
                      {contract.title}
                    </Link>
                    <div className="mt-1">
                      <ProcessingTimeline status={contract.status} />
                    </div>
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-3">
                  <StatusBadge status={contract.status} />
                  {contract.status === "failed" && (
                    <button
                      onClick={() => retry(contract.id)}
                      className="flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-[rgba(245,158,11,0.07)] px-3 py-1 text-xs font-medium text-amber-400 transition hover:border-amber-500/40"
                    >
                      <RotateCcw size={12} /> Retry
                    </button>
                  )}
                  {contract.status === "completed" && (
                    <Link
                      href={`/contracts/${contract.id}`}
                      className="flex items-center gap-1.5 rounded-lg border border-blue-500/20 bg-[rgba(59,130,246,0.07)] px-3 py-1 text-xs font-medium text-blue-400 transition hover:border-blue-500/40"
                    >
                      View <ChevronRight size={12} />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
