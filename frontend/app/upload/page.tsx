"use client";

import { useEffect, useState, useRef, DragEvent } from "react";
import Link from "next/link";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  File,
  ArrowRight,
  Sparkles,
  Clock,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import AIInsightPanel from "@/components/ui/AIInsightPanel";
import { api, Contract } from "@/services/api";

type UploadState = "idle" | "uploading" | "success" | "error";

const ACCEPTED_TYPES = [".pdf", ".docx", ".jpg", ".jpeg", ".png"];
const ACCEPTED_MIME  = ["application/pdf","application/vnd.openxmlformats-officedocument.wordprocessingml.document","image/jpeg","image/png"];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const TIMELINE_STEPS = [
  { label: "File Validation",    icon: File,         key: "validation" },
  { label: "OCR Processing",     icon: Sparkles,     key: "ocr"        },
  { label: "Text Extraction",    icon: FileText,     key: "extraction" },
  { label: "AI Analysis",        icon: Loader2,      key: "analysis"   },
  { label: "Ready",              icon: CheckCircle2, key: "ready"      },
];

export default function UploadPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [progress, setProgress] = useState(0);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [successTitle, setSuccessTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function loadContracts() {
    const data = await api.contracts();
    setContracts(data);
  }

  useEffect(() => {
    loadContracts().catch(() => undefined);
    const timer = setInterval(() => loadContracts().catch(() => undefined), 6000);
    return () => clearInterval(timer);
  }, []);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_TYPES.includes(ext) && !ACCEPTED_MIME.includes(file.type)) {
      setError(`Unsupported file type. Accepted: ${ACCEPTED_TYPES.join(", ")}`);
      return;
    }
    setSelectedFile(file);
    setUploadState("uploading");
    setProgress(0);
    setError("");
    try {
      const result = await api.upload(file, setProgress);
      setSuccessTitle(result.title);
      setUploadState("success");
      await loadContracts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploadState("error");
    }
  }

  const onDragOver  = (e: DragEvent) => { e.preventDefault(); setDragging(true);  };
  const onDragLeave = (e: DragEvent) => { e.preventDefault(); setDragging(false); };
  const onDrop      = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const reset = () => {
    setUploadState("idle");
    setSelectedFile(null);
    setProgress(0);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const activeStep =
    uploadState === "uploading" ? (progress < 100 ? 0 : 1)
    : uploadState === "success" ? 4
    : -1;

  return (
    <AppShell>
      <div className="px-8 py-8 max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1 w-6 rounded-full" style={{ background: "linear-gradient(90deg, #6366f1, #22d3ee)" }} />
            <span className="font-mono-label" style={{ color: "#6366f1", fontSize: "0.65rem" }}>
              Document Ingestion
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#dae2fd" }}>
            Upload Center
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#64748b" }}>
            Upload PDF, DOCX, or image contracts for AI-powered analysis.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">

          {/* Upload Zone */}
          <div className="space-y-5">

            {/* Dropzone */}
            <div
              className="relative rounded-2xl transition-all duration-300 cursor-pointer"
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => uploadState === "idle" && inputRef.current?.click()}
              style={{
                background: dragging
                  ? "rgba(99,102,241,0.10)"
                  : uploadState === "success"
                  ? "rgba(16,185,129,0.06)"
                  : uploadState === "error"
                  ? "rgba(239,68,68,0.06)"
                  : "rgba(19,27,46,0.7)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: dragging
                  ? "2px dashed rgba(99,102,241,0.6)"
                  : uploadState === "success"
                  ? "2px dashed rgba(16,185,129,0.4)"
                  : uploadState === "error"
                  ? "2px dashed rgba(239,68,68,0.4)"
                  : "2px dashed rgba(99,102,241,0.18)",
                minHeight: "280px",
              }}
            >
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept={ACCEPTED_TYPES.join(",")}
                onChange={(e) => handleFile(e.target.files?.[0])}
              />

              <div className="flex flex-col items-center justify-center py-16 px-8 text-center">

                {/* Idle */}
                {uploadState === "idle" && (
                  <>
                    <div
                      className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
                      style={{
                        background: dragging ? "rgba(99,102,241,0.18)" : "rgba(99,102,241,0.10)",
                        border: "1px solid rgba(99,102,241,0.25)",
                        boxShadow: dragging ? "0 0 32px rgba(99,102,241,0.3)" : undefined,
                      }}
                    >
                      <Upload
                        size={28}
                        style={{ color: "#818cf8" }}
                        className={dragging ? "animate-bounce" : ""}
                      />
                    </div>
                    <p className="text-base font-semibold mb-1" style={{ color: "#dae2fd" }}>
                      {dragging ? "Drop to upload" : "Drag & drop or click to select"}
                    </p>
                    <p className="text-sm mb-4" style={{ color: "#64748b" }}>
                      PDF, DOCX, JPG, PNG up to 50MB
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {ACCEPTED_TYPES.map((t) => (
                        <span
                          key={t}
                          className="rounded-lg px-2.5 py-1 font-mono-label"
                          style={{
                            background: "rgba(99,102,241,0.10)",
                            border: "1px solid rgba(99,102,241,0.16)",
                            color: "#818cf8",
                            fontSize: "0.65rem",
                          }}
                        >
                          {t.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </>
                )}

                {/* Uploading */}
                {uploadState === "uploading" && (
                  <>
                    <div
                      className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
                      style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}
                    >
                      <Loader2 size={28} style={{ color: "#818cf8" }} className="animate-spin" />
                    </div>
                    <p className="text-base font-semibold mb-1" style={{ color: "#dae2fd" }}>
                      {selectedFile?.name}
                    </p>
                    <p className="text-sm mb-5" style={{ color: "#64748b" }}>
                      {selectedFile ? formatBytes(selectedFile.size) : ""}
                    </p>

                    {/* Progress bar */}
                    <div className="w-full max-w-xs">
                      <div className="flex justify-between text-xs mb-2">
                        <span style={{ color: "#64748b" }}>Uploading</span>
                        <span style={{ color: "#818cf8", fontFamily: "var(--font-mono,monospace)" }}>
                          {progress}%
                        </span>
                      </div>
                      <div
                        className="h-1.5 w-full rounded-full overflow-hidden"
                        style={{ background: "rgba(99,102,241,0.12)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${progress}%`,
                            background: "linear-gradient(90deg, #6366f1, #22d3ee)",
                            boxShadow: "0 0 10px rgba(99,102,241,0.5)",
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Success */}
                {uploadState === "success" && (
                  <>
                    <div
                      className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
                      style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}
                    >
                      <CheckCircle2 size={28} style={{ color: "#10b981" }} />
                    </div>
                    <p className="text-base font-semibold mb-1" style={{ color: "#34d399" }}>
                      Upload Successful
                    </p>
                    <p className="text-sm mb-4" style={{ color: "#64748b" }}>
                      {successTitle} — AI analysis in progress
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); reset(); }}
                        className="rounded-xl px-4 py-2 text-sm font-medium transition-all hover:bg-[rgba(99,102,241,0.08)]"
                        style={{ border: "1px solid rgba(99,102,241,0.18)", color: "#94a3b8" }}
                      >
                        Upload Another
                      </button>
                    </div>
                  </>
                )}

                {/* Error */}
                {uploadState === "error" && (
                  <>
                    <div
                      className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
                      style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.25)" }}
                    >
                      <AlertCircle size={28} style={{ color: "#ef4444" }} />
                    </div>
                    <p className="text-base font-semibold mb-1" style={{ color: "#f87171" }}>
                      Upload Failed
                    </p>
                    <p className="text-sm mb-4" style={{ color: "#64748b" }}>{error}</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); reset(); }}
                      className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all"
                      style={{
                        background: "rgba(239,68,68,0.10)",
                        border: "1px solid rgba(239,68,68,0.22)",
                        color: "#f87171",
                      }}
                    >
                      <X size={14} /> Dismiss & Retry
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* AI Insight */}
            <AIInsightPanel title="AI Processing Note">
              After upload, documents are parsed, OCR-processed if needed, embedded into the vector store, and analyzed for risks, clauses, and obligations. Processing continues in the background — you can safely navigate away.
            </AIInsightPanel>

            {/* Recent Queue */}
            <GlassCard>
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: "1px solid rgba(99,102,241,0.10)" }}
              >
                <div className="flex items-center gap-2">
                  <Clock size={14} style={{ color: "#64748b" }} />
                  <span className="text-sm font-semibold" style={{ color: "#dae2fd" }}>
                    Processing Queue
                  </span>
                </div>
                <Link
                  href="/contracts"
                  className="flex items-center gap-1 text-xs"
                  style={{ color: "#6366f1" }}
                >
                  All contracts <ArrowRight size={11} />
                </Link>
              </div>
              <div>
                {contracts.length === 0 && (
                  <p className="px-5 py-6 text-sm text-center" style={{ color: "#3a4560" }}>
                    No uploads yet.
                  </p>
                )}
                {contracts.slice(0, 7).map((c, i) => (
                  <Link
                    key={c.id}
                    href={`/contracts/${c.id}`}
                    className="group flex items-center justify-between px-5 py-3 transition-all hover:bg-[rgba(99,102,241,0.04)]"
                    style={{ borderBottom: i < Math.min(contracts.length, 7) - 1 ? "1px solid rgba(99,102,241,0.07)" : "none" }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.14)" }}
                      >
                        <FileText size={12} style={{ color: "#6366f1" }} />
                      </div>
                      <span className="text-sm truncate" style={{ color: "#94a3b8" }}>
                        {c.title}
                      </span>
                    </div>
                    <StatusBadge status={c.status} pulse={c.status === "processing"} />
                  </Link>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Sidebar — OCR Timeline */}
          <div className="space-y-5">
            <GlassCard>
              <div
                className="px-5 py-4"
                style={{ borderBottom: "1px solid rgba(99,102,241,0.10)" }}
              >
                <p className="text-sm font-semibold" style={{ color: "#dae2fd" }}>
                  Processing Pipeline
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                  OCR-to-intelligence workflow
                </p>
              </div>
              <div className="px-5 py-5">
                <div className="relative">
                  {/* vertical line */}
                  <div
                    className="absolute left-3.5 top-4 bottom-4 w-px"
                    style={{ background: "rgba(99,102,241,0.12)" }}
                  />

                  <div className="space-y-5">
                    {TIMELINE_STEPS.map((step, idx) => {
                      const done    = activeStep > idx;
                      const current = activeStep === idx;
                      const Icon = step.icon;
                      return (
                        <div key={step.key} className="flex items-start gap-4 relative">
                          {/* Node */}
                          <div
                            className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300"
                            style={{
                              background: done
                                ? "rgba(16,185,129,0.15)"
                                : current
                                ? "rgba(99,102,241,0.18)"
                                : "rgba(30,45,71,0.8)",
                              border: done
                                ? "1px solid rgba(16,185,129,0.35)"
                                : current
                                ? "1px solid rgba(99,102,241,0.45)"
                                : "1px solid rgba(99,102,241,0.12)",
                              boxShadow: current ? "0 0 12px rgba(99,102,241,0.3)" : undefined,
                            }}
                          >
                            <Icon
                              size={13}
                              style={{
                                color: done ? "#10b981" : current ? "#818cf8" : "#3a4560",
                              }}
                              className={current ? "animate-spin" : ""}
                            />
                          </div>

                          <div>
                            <p
                              className="text-xs font-semibold"
                              style={{
                                color: done ? "#34d399" : current ? "#dae2fd" : "#3a4560",
                              }}
                            >
                              {step.label}
                            </p>
                            {current && (
                              <p className="text-xs mt-0.5" style={{ color: "#6366f1" }}>
                                In progress...
                              </p>
                            )}
                            {done && (
                              <p className="text-xs mt-0.5" style={{ color: "#34d399" }}>
                                Complete
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Format Guide */}
            <GlassCard>
              <div className="px-5 py-4">
                <p className="text-xs font-semibold mb-3 uppercase tracking-widest" style={{ color: "#3a4560", fontFamily: "var(--font-mono,monospace)" }}>
                  Accepted Formats
                </p>
                <div className="space-y-2">
                  {[
                    { ext: "PDF", desc: "Native text extraction", color: "#f87171" },
                    { ext: "DOCX", desc: "Word document parsing", color: "#818cf8" },
                    { ext: "JPG/PNG", desc: "OCR image processing", color: "#22d3ee" },
                  ].map(({ ext, desc, color }) => (
                    <div key={ext} className="flex items-center gap-3">
                      <span
                        className="rounded-md px-2 py-0.5 text-xs font-bold"
                        style={{
                          background: `${color}18`,
                          color,
                          fontFamily: "var(--font-mono,monospace)",
                        }}
                      >
                        {ext}
                      </span>
                      <span className="text-xs" style={{ color: "#64748b" }}>{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
