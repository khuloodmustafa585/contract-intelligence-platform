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
  ArrowRight,
  Clock,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { api, Contract } from "@/services/api";

type UploadState = "idle" | "uploading" | "success" | "error";

const ACCEPTED_TYPES = [".pdf", ".docx", ".jpg", ".jpeg", ".png"];
const ACCEPTED_MIME  = ["application/pdf","application/vnd.openxmlformats-officedocument.wordprocessingml.document","image/jpeg","image/png"];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [progress, setProgress] = useState(0);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [successTitle, setSuccessTitle] = useState("");
  const [successContractId, setSuccessContractId] = useState<number | null>(null);
  // True once we have observed the recently uploaded contract in at least one poll.
  // Used to distinguish "list hasn't loaded yet" from "contract was deleted".
  const [successContractSeen, setSuccessContractSeen] = useState(false);
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

  // Detect async processing failure: the recently uploaded contract was present
  // in the list at least once, then disappeared — meaning the background task
  // deleted it (OCR failure, corrupt file, empty text, etc.).
  useEffect(() => {
    if (!successContractId || uploadState !== "success") return;
    const inList = contracts.some((c) => c.id === successContractId);
    if (inList) {
      setSuccessContractSeen(true);
    } else if (successContractSeen) {
      setError("Failed to upload contract. Please try again.");
      setUploadState("error");
    }
  }, [contracts, successContractId, successContractSeen, uploadState]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_TYPES.includes(ext) && !ACCEPTED_MIME.includes(file.type)) {
      setError("Failed to upload contract. Please try again.");
      setUploadState("error");
      return;
    }
    setSelectedFile(file);
    setUploadState("uploading");
    setProgress(0);
    setError("");
    try {
      const result = await api.upload(file, setProgress);
      setSuccessTitle(result.title);
      setSuccessContractId(result.id);
      setUploadState("success");
      await loadContracts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload contract. Please try again.");
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
    setSuccessContractId(null);
    setSuccessContractSeen(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const analysisWarning =
    successContractId !== null &&
    contracts.some((c) => c.id === successContractId && c.status === "analysis_failed");

  return (
    <AppShell>
      {/* Ambient glow */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "700px",
          height: "500px",
          background:
            "radial-gradient(ellipse at 80% -10%, rgba(99,102,241,0.055) 0%, transparent 60%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          maxWidth: "1380px",
          margin: "0 auto",
          padding: "48px 52px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <div
              style={{
                height: "4px",
                width: "24px",
                borderRadius: "999px",
                background: "linear-gradient(90deg, #6366f1, #22d3ee)",
              }}
            />
            <span
              style={{
                color: "#6366f1",
                fontSize: "0.65rem",
                fontFamily: "var(--font-mono, monospace)",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Contract Upload
            </span>
          </div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              color: "#dae2fd",
              letterSpacing: "-0.02em",
              marginBottom: "6px",
            }}
          >
            Upload Center
          </h1>
          <p style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.6 }}>
            Upload PDF, DOCX, or image contracts for AI-powered analysis.
          </p>
        </div>

        <div className="grid gap-6 items-start lg:grid-cols-[1fr_340px]">
          {/* Upload Zone */}
          <div className="space-y-10 py-6">

            {/* Dropzone */}
            <div
              className="relative my-10 rounded-2xl transition-all duration-300 hover:scale-[1.005] cursor-pointer"
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
                minHeight: "140px",
                paddingBottom: "50px",
                paddingTop: "50px",
                boxShadow: dragging
                  ? "0 0 40px rgba(99,102,241,0.18)"
                  : "0 0 0 rgba(0,0,0,0)",
              }}
            >
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept={ACCEPTED_TYPES.join(",")}
                onChange={(e) => handleFile(e.target.files?.[0])}
              />

              <div className="flex flex-col items-center justify-center py-8 px-8 text-center">

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
                      PDF, DOCX, JPG, PNG up to 10 MB
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
                    {analysisWarning ? (
                      <div
                        className="mb-4 rounded-xl px-4 py-3 text-sm text-center w-full max-w-sm"
                        style={{
                          background: "rgba(245,158,11,0.08)",
                          border: "1px solid rgba(245,158,11,0.22)",
                          color: "#fbbf24",
                        }}
                      >
                        Contract uploaded successfully. Analysis is currently unavailable. Please try again later.
                      </div>
                    ) : (
                      <p className="text-sm mb-4" style={{ color: "#64748b" }}>
                        {successTitle} — AI analysis in progress
                      </p>
                    )}
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

          <div className="h-6" />
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

          {/* Sidebar — Upload Status */}
          <div className="space-y-5">
            <GlassCard>
              {/* Card header — title reflects current state */}
              <div
                className="px-5 py-4"
                style={{ borderBottom: "1px solid rgba(99,102,241,0.10)" }}
              >
                <p className="text-sm font-semibold" style={{ color: "#dae2fd" }}>
                  {uploadState === "success" ? "Upload Complete"
                    : uploadState === "error"    ? "Upload Failed"
                    : uploadState === "uploading" ? "Uploading…"
                    : "Upload Status"}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                  {uploadState === "success"   ? "AI analysis is running in the background"
                    : uploadState === "error"    ? "Please dismiss and try again"
                    : uploadState === "uploading" ? "Saving file and queueing analysis"
                    : "Drop a contract above to get started"}
                </p>
              </div>

              {/* Status indicator row */}
              <div className="px-5 py-6">
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-full shrink-0"
                    style={{
                      background: uploadState === "success"
                        ? "rgba(16,185,129,0.18)"
                        : uploadState === "error"
                        ? "rgba(239,68,68,0.18)"
                        : "rgba(99,102,241,0.18)",
                      border: uploadState === "success"
                        ? "1px solid rgba(16,185,129,0.35)"
                        : uploadState === "error"
                        ? "1px solid rgba(239,68,68,0.35)"
                        : "1px solid rgba(99,102,241,0.35)",
                      boxShadow: uploadState === "success"
                        ? "0 0 18px rgba(16,185,129,0.22)"
                        : uploadState === "error"
                        ? "0 0 18px rgba(239,68,68,0.22)"
                        : "0 0 18px rgba(99,102,241,0.22)",
                    }}
                  >
                    {uploadState === "success" ? (
                      <CheckCircle2 size={18} style={{ color: "#34d399" }} />
                    ) : uploadState === "error" ? (
                      <AlertCircle size={18} style={{ color: "#f87171" }} />
                    ) : (
                      <Loader2
                        size={18}
                        className={uploadState === "uploading" ? "animate-spin" : ""}
                        style={{ color: "#818cf8" }}
                      />
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-semibold" style={{
                      color: uploadState === "success" ? "#34d399"
                        : uploadState === "error" ? "#f87171"
                        : "#dae2fd",
                    }}>
                      {uploadState === "success"   ? "Analysis queued"
                        : uploadState === "error"    ? "Something went wrong"
                        : uploadState === "uploading" ? `Uploading — ${progress}%`
                        : "Ready"}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "#64748b" }}>
                      {uploadState === "success"   ? "Results appear in the contract list"
                        : uploadState === "error"    ? error || "Check file and try again"
                        : uploadState === "uploading" ? "Please wait…"
                        : "No file selected"}
                    </p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </AppShell>
  );
}