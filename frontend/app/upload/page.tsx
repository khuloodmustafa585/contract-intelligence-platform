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
  Scan,
  Database,
  Brain,
  Sparkles,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
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

/* ─── Shared card style (matches dashboard pattern) ─────────────── */
const CARD: React.CSSProperties = {
  background:           "var(--th-card-bg)",
  border:               "1px solid var(--th-card-border)",
  boxShadow:            "var(--th-card-shadow)",
  borderRadius:         "20px",
  backdropFilter:       "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  overflow:             "hidden",
};

const DIVIDER: React.CSSProperties = {
  borderBottom: "1px solid var(--th-divider)",
};

/* ─── AI pipeline stages ─────────────────────────────────────────── */
const PIPELINE_STAGES = [
  { icon: Upload,       label: "Upload",   description: "File saved to server"        },
  { icon: Scan,         label: "Parse",    description: "Text extraction & OCR"       },
  { icon: Database,     label: "Index",    description: "Vector embeddings built"     },
  { icon: Brain,        label: "Analyze",  description: "AI clause & risk detection"  },
  { icon: CheckCircle2, label: "Complete", description: "Results ready to view"       },
];

/* Maps uploadState + live contract status → current pipeline step (1-5, 0 = idle, -1 = error) */
function getPipelineStep(
  uploadState: UploadState,
  contracts: Contract[],
  successContractId: number | null,
): number {
  if (uploadState === "idle")      return 0;
  if (uploadState === "uploading") return 1;
  if (uploadState === "error")     return -1;
  if (uploadState === "success") {
    if (!successContractId) return 1;
    const c = contracts.find((x) => x.id === successContractId);
    if (!c) return 1;
    const s = c.status?.toLowerCase() ?? "";
    if (s === "processing" || s === "parsed")                   return 2;
    if (s === "indexing")                                        return 3;
    if (s === "analysis_pending")                               return 4;
    if (s === "completed" || s === "analyzed" || s === "ready") return 5;
    if (s === "analysis_failed")                                return 4;
    return 1;
  }
  return 0;
}

export default function UploadPage() {
  const [contracts, setContracts]                   = useState<Contract[]>([]);
  const [progress, setProgress]                     = useState(0);
  const [uploadState, setUploadState]               = useState<UploadState>("idle");
  const [error, setError]                           = useState("");
  const [dragging, setDragging]                     = useState(false);
  const [selectedFile, setSelectedFile]             = useState<File | null>(null);
  const [successTitle, setSuccessTitle]             = useState("");
  const [successContractId, setSuccessContractId]   = useState<number | null>(null);
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
      setError("Processing failed — the file could not be parsed. Please try a different file.");
      setUploadState("error");
    }
  }, [contracts, successContractId, successContractSeen, uploadState]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_TYPES.includes(ext) && !ACCEPTED_MIME.includes(file.type)) {
      setError("Unsupported file type. Please upload a PDF, DOCX, JPG, or PNG.");
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

  const pipelineStep = getPipelineStep(uploadState, contracts, successContractId);

  /* Dropzone dynamic styles */
  const dzBg = dragging
    ? "rgba(99,102,241,0.07)"
    : uploadState === "success"
    ? "rgba(16,185,129,0.04)"
    : uploadState === "error"
    ? "rgba(239,68,68,0.04)"
    : "var(--th-card-bg)";

  const dzBorder = dragging
    ? "2px dashed rgba(99,102,241,0.55)"
    : uploadState === "success"
    ? "2px dashed rgba(16,185,129,0.35)"
    : uploadState === "error"
    ? "2px dashed rgba(239,68,68,0.35)"
    : "2px dashed rgba(99,102,241,0.18)";

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
        {/* ── Page header ──────────────────────────────────────────── */}
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
            Upload contracts for AI-powered clause extraction, risk detection, and obligation tracking.
          </p>
        </div>

        {/* ── Two-column grid ───────────────────────────────────────── */}
        <div
          className="grid lg:grid-cols-[1fr_340px]"
          style={{ gap: "20px", alignItems: "start" }}
        >
          {/* ── Left column ─────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Drop zone */}
            <div
              onClick={() => uploadState === "idle" && inputRef.current?.click()}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              style={{
                borderRadius: "20px",
                border: dzBorder,
                background: dzBg,
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                boxShadow: dragging
                  ? "0 0 40px rgba(99,102,241,0.14), var(--th-card-shadow)"
                  : "var(--th-card-shadow)",
                cursor: uploadState === "idle" ? "pointer" : "default",
                transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
                padding: "56px 48px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
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

              {/* ── Idle ── */}
              {uploadState === "idle" && (
                <>
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "18px",
                      background: dragging
                        ? "rgba(99,102,241,0.16)"
                        : "rgba(99,102,241,0.08)",
                      border: "1px solid rgba(99,102,241,0.20)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "20px",
                      transition: "background 0.2s, box-shadow 0.2s",
                      boxShadow: dragging ? "0 0 28px rgba(99,102,241,0.22)" : "none",
                    }}
                  >
                    <Upload
                      size={26}
                      style={{ color: "#818cf8" }}
                      className={dragging ? "animate-bounce" : ""}
                    />
                  </div>
                  <p
                    style={{
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: "#dae2fd",
                      marginBottom: "6px",
                    }}
                  >
                    {dragging ? "Release to upload" : "Drag & drop or click to browse"}
                  </p>
                  <p style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: "22px" }}>
                    PDF, DOCX, JPG, PNG — up to 10 MB
                  </p>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    {ACCEPTED_TYPES.map((t) => (
                      <span
                        key={t}
                        style={{
                          padding: "3px 10px",
                          borderRadius: "6px",
                          background: "rgba(99,102,241,0.07)",
                          border: "1px solid rgba(99,102,241,0.14)",
                          color: "#818cf8",
                          fontSize: "0.6rem",
                          fontFamily: "var(--font-mono, monospace)",
                          fontWeight: 600,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        {t.replace(".", "")}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {/* ── Uploading ── */}
              {uploadState === "uploading" && (
                <>
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "18px",
                      background: "rgba(99,102,241,0.10)",
                      border: "1px solid rgba(99,102,241,0.22)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "20px",
                    }}
                  >
                    <Loader2 size={26} style={{ color: "#818cf8" }} className="animate-spin" />
                  </div>
                  <p
                    style={{
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: "#dae2fd",
                      marginBottom: "4px",
                    }}
                  >
                    {selectedFile?.name}
                  </p>
                  <p style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: "24px" }}>
                    {selectedFile ? formatBytes(selectedFile.size) : ""}
                  </p>
                  {/* Progress bar */}
                  <div style={{ width: "100%", maxWidth: "320px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "8px",
                      }}
                    >
                      <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                        Uploading file…
                      </span>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          color: "#818cf8",
                          fontFamily: "var(--font-mono, monospace)",
                          fontWeight: 600,
                        }}
                      >
                        {progress}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: "4px",
                        borderRadius: "999px",
                        background: "rgba(99,102,241,0.10)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          borderRadius: "999px",
                          width: `${progress}%`,
                          background: "linear-gradient(90deg, #6366f1, #22d3ee)",
                          boxShadow: "0 0 12px rgba(99,102,241,0.45)",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* ── Success ── */}
              {uploadState === "success" && (
                <>
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "18px",
                      background: "rgba(16,185,129,0.10)",
                      border: "1px solid rgba(16,185,129,0.22)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "20px",
                      boxShadow: "0 0 24px rgba(16,185,129,0.14)",
                    }}
                  >
                    <CheckCircle2 size={26} style={{ color: "#10b981" }} />
                  </div>
                  <p
                    style={{
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: "#34d399",
                      marginBottom: "6px",
                    }}
                  >
                    Upload Successful
                  </p>
                  {analysisWarning ? (
                    <div
                      style={{
                        marginBottom: "20px",
                        padding: "10px 16px",
                        borderRadius: "10px",
                        background: "rgba(245,158,11,0.07)",
                        border: "1px solid rgba(245,158,11,0.18)",
                        color: "#fbbf24",
                        fontSize: "0.78rem",
                        maxWidth: "360px",
                        lineHeight: 1.55,
                      }}
                    >
                      Contract saved. AI analysis is currently unavailable — you can retry from the contract page.
                    </div>
                  ) : (
                    <p
                      style={{
                        fontSize: "0.82rem",
                        color: "#64748b",
                        marginBottom: "20px",
                        maxWidth: "340px",
                        lineHeight: 1.55,
                      }}
                    >
                      <span style={{ color: "var(--th-text-2)", fontWeight: 500 }}>
                        {successTitle}
                      </span>{" "}
                      — AI processing in progress
                    </p>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); reset(); }}
                    style={{
                      padding: "8px 18px",
                      borderRadius: "10px",
                      border: "1px solid rgba(99,102,241,0.18)",
                      background: "transparent",
                      color: "#94a3b8",
                      fontSize: "0.8rem",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "background 0.15s, border-color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.08)";
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.28)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.18)";
                    }}
                  >
                    Upload Another
                  </button>
                </>
              )}

              {/* ── Error ── */}
              {uploadState === "error" && (
                <>
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "18px",
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.20)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "20px",
                    }}
                  >
                    <AlertCircle size={26} style={{ color: "#ef4444" }} />
                  </div>
                  <p
                    style={{
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: "#f87171",
                      marginBottom: "6px",
                    }}
                  >
                    Upload Failed
                  </p>
                  <p
                    style={{
                      fontSize: "0.82rem",
                      color: "#64748b",
                      marginBottom: "20px",
                      maxWidth: "340px",
                      lineHeight: 1.55,
                    }}
                  >
                    {error || "An unexpected error occurred."}
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); reset(); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 18px",
                      borderRadius: "10px",
                      background: "rgba(239,68,68,0.07)",
                      border: "1px solid rgba(239,68,68,0.18)",
                      color: "#f87171",
                      fontSize: "0.8rem",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.13)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.07)")
                    }
                  >
                    <X size={13} /> Dismiss & Retry
                  </button>
                </>
              )}
            </div>

            {/* Processing Queue */}
            <div style={CARD}>
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 24px",
                  ...DIVIDER,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "9px",
                      background: "rgba(99,102,241,0.10)",
                      border: "1px solid rgba(99,102,241,0.18)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Clock size={13} style={{ color: "#818cf8" }} />
                  </div>
                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "var(--th-text-1)",
                    }}
                  >
                    Processing Queue
                  </span>
                  {contracts.length > 0 && (
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 500,
                        background: "var(--th-tag-bg)",
                        border: "1px solid var(--th-tag-border)",
                        color: "var(--th-text-3)",
                        borderRadius: "999px",
                        padding: "2px 9px",
                      }}
                    >
                      {contracts.length}
                    </span>
                  )}
                </div>
                <Link
                  href="/contracts"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "0.72rem",
                    fontWeight: 500,
                    color: "#3b82f6",
                    textDecoration: "none",
                    transition: "opacity 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.opacity = "0.65")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.opacity = "1")
                  }
                >
                  All contracts <ArrowRight size={10} />
                </Link>
              </div>

              {/* Rows */}
              {contracts.length === 0 ? (
                <div
                  style={{
                    padding: "44px 24px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: "var(--th-subtle-bg)",
                      border: "1px solid var(--th-tag-border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 12px",
                    }}
                  >
                    <FileText size={14} style={{ color: "var(--th-text-4)" }} />
                  </div>
                  <p
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--th-text-3)",
                      fontWeight: 500,
                      marginBottom: "4px",
                    }}
                  >
                    No contracts yet
                  </p>
                  <p style={{ fontSize: "0.72rem", color: "var(--th-text-4)" }}>
                    Uploaded contracts appear here as they process
                  </p>
                </div>
              ) : (
                <div>
                  {contracts.slice(0, 8).map((c, i) => {
                    const isProcessing = [
                      "processing", "parsed", "indexing",
                      "analysis_pending", "ocr_processing",
                    ].includes(c.status?.toLowerCase() ?? "");
                    return (
                      <Link
                        key={c.id}
                        href={`/contracts/${c.id}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "12px",
                          padding: "13px 24px",
                          borderBottom:
                            i < Math.min(contracts.length, 8) - 1
                              ? "1px solid var(--th-row-divider)"
                              : "none",
                          textDecoration: "none",
                          transition: "background 0.12s",
                        }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLElement).style.background =
                            "var(--th-row-hover)")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLElement).style.background = "transparent")
                        }
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "8px",
                              background: "rgba(99,102,241,0.07)",
                              border: "1px solid rgba(99,102,241,0.12)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <FileText size={12} style={{ color: "#6366f1" }} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p
                              style={{
                                fontSize: "0.82rem",
                                fontWeight: 500,
                                color: "var(--th-text-1)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {c.title}
                            </p>
                            {c.ocr_used && (
                              <span
                                style={{
                                  fontSize: "0.56rem",
                                  color: "#f59e0b",
                                  fontFamily: "var(--font-mono, monospace)",
                                  fontWeight: 600,
                                  letterSpacing: "0.08em",
                                  textTransform: "uppercase",
                                }}
                              >
                                OCR
                              </span>
                            )}
                          </div>
                        </div>
                        <StatusBadge status={c.status} pulse={isProcessing} />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Right sidebar ────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Upload Status */}
            <div style={CARD}>
              <div style={{ padding: "16px 20px", ...DIVIDER }}>
                <p
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--th-text-1)",
                    marginBottom: "2px",
                  }}
                >
                  {uploadState === "success"
                    ? "Upload Complete"
                    : uploadState === "error"
                    ? "Upload Failed"
                    : uploadState === "uploading"
                    ? "Uploading…"
                    : "Upload Status"}
                </p>
                <p style={{ fontSize: "0.72rem", color: "var(--th-text-3)" }}>
                  {uploadState === "success"
                    ? "AI analysis running in the background"
                    : uploadState === "error"
                    ? "Dismiss and retry with a valid file"
                    : uploadState === "uploading"
                    ? "Saving file and queuing AI pipeline"
                    : "Drop a contract above to get started"}
                </p>
              </div>

              <div style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "12px",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background:
                        uploadState === "success"
                          ? "rgba(16,185,129,0.12)"
                          : uploadState === "error"
                          ? "rgba(239,68,68,0.12)"
                          : "rgba(99,102,241,0.12)",
                      border:
                        uploadState === "success"
                          ? "1px solid rgba(16,185,129,0.25)"
                          : uploadState === "error"
                          ? "1px solid rgba(239,68,68,0.25)"
                          : "1px solid rgba(99,102,241,0.25)",
                      boxShadow:
                        uploadState === "success"
                          ? "0 0 14px rgba(16,185,129,0.16)"
                          : uploadState === "error"
                          ? "0 0 14px rgba(239,68,68,0.16)"
                          : "0 0 14px rgba(99,102,241,0.16)",
                    }}
                  >
                    {uploadState === "success" ? (
                      <CheckCircle2 size={17} style={{ color: "#34d399" }} />
                    ) : uploadState === "error" ? (
                      <AlertCircle size={17} style={{ color: "#f87171" }} />
                    ) : (
                      <Loader2
                        size={17}
                        className={uploadState === "uploading" ? "animate-spin" : ""}
                        style={{ color: "#818cf8" }}
                      />
                    )}
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        color:
                          uploadState === "success"
                            ? "#34d399"
                            : uploadState === "error"
                            ? "#f87171"
                            : "var(--th-text-1)",
                        marginBottom: "3px",
                      }}
                    >
                      {uploadState === "success"
                        ? "Analysis queued"
                        : uploadState === "error"
                        ? "Something went wrong"
                        : uploadState === "uploading"
                        ? `Uploading — ${progress}%`
                        : "Ready"}
                    </p>
                    <p style={{ fontSize: "0.72rem", color: "var(--th-text-3)", lineHeight: 1.4 }}>
                      {uploadState === "success"
                        ? "Results appear in the contract list"
                        : uploadState === "error"
                        ? error || "Check file format and size"
                        : uploadState === "uploading"
                        ? "Please wait…"
                        : "No file selected"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Pipeline */}
            <div style={CARD}>
              <div style={{ padding: "16px 20px", ...DIVIDER }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "9px",
                      background: "rgba(139,92,246,0.10)",
                      border: "1px solid rgba(139,92,246,0.18)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Sparkles size={13} style={{ color: "#a78bfa" }} />
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "var(--th-text-1)",
                        lineHeight: 1.2,
                      }}
                    >
                      AI Pipeline
                    </p>
                    <p style={{ fontSize: "0.68rem", color: "var(--th-text-3)", marginTop: "1px" }}>
                      Processing stages after upload
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ padding: "18px 20px" }}>
                {PIPELINE_STAGES.map((stage, idx) => {
                  const step      = idx + 1;
                  const isDone    = pipelineStep >= step;
                  const isActive  = pipelineStep === step && uploadState !== "idle";
                  const isError   = pipelineStep === -1 && step === 1;
                  const Icon      = stage.icon;

                  const iconColor = isError
                    ? "#f87171"
                    : isDone
                    ? "#34d399"
                    : isActive
                    ? "#818cf8"
                    : "var(--th-text-4)";

                  const iconBg = isError
                    ? "rgba(239,68,68,0.08)"
                    : isDone
                    ? "rgba(16,185,129,0.08)"
                    : isActive
                    ? "rgba(99,102,241,0.10)"
                    : "transparent";

                  const iconBorder = isError
                    ? "rgba(239,68,68,0.18)"
                    : isDone
                    ? "rgba(16,185,129,0.18)"
                    : isActive
                    ? "rgba(99,102,241,0.20)"
                    : "var(--th-tag-border)";

                  return (
                    <div
                      key={stage.label}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                        paddingBottom: idx < PIPELINE_STAGES.length - 1 ? "16px" : "0",
                        position: "relative",
                      }}
                    >
                      {/* Vertical connector line */}
                      {idx < PIPELINE_STAGES.length - 1 && (
                        <div
                          style={{
                            position: "absolute",
                            left: "13px",
                            top: "28px",
                            width: "2px",
                            height: "calc(100% - 12px)",
                            background: isDone
                              ? "rgba(16,185,129,0.22)"
                              : "var(--th-tag-border)",
                            borderRadius: "999px",
                          }}
                        />
                      )}

                      {/* Stage icon */}
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "8px",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: iconBg,
                          border: `1px solid ${iconBorder}`,
                          position: "relative",
                          zIndex: 1,
                        }}
                      >
                        <Icon size={12} style={{ color: iconColor }} />
                      </div>

                      {/* Stage label + description */}
                      <div style={{ paddingTop: "4px" }}>
                        <p
                          style={{
                            fontSize: "0.78rem",
                            fontWeight: isActive || isDone ? 600 : 400,
                            color: isDone
                              ? "var(--th-text-1)"
                              : isActive
                              ? "#dae2fd"
                              : "var(--th-text-4)",
                            lineHeight: 1.3,
                            marginBottom: "2px",
                          }}
                        >
                          {stage.label}
                          {isActive && uploadState === "uploading" && step === 1 && (
                            <span
                              style={{
                                marginLeft: "6px",
                                fontSize: "0.65rem",
                                color: "#818cf8",
                                fontFamily: "var(--font-mono, monospace)",
                              }}
                            >
                              {progress}%
                            </span>
                          )}
                        </p>
                        <p style={{ fontSize: "0.68rem", color: "var(--th-text-4)", lineHeight: 1.4 }}>
                          {stage.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Supported Formats */}
            <div style={CARD}>
              <div style={{ padding: "14px 20px", ...DIVIDER }}>
                <p
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "var(--th-text-1)",
                  }}
                >
                  Supported Formats
                </p>
              </div>
              <div style={{ padding: "12px 20px" }}>
                {[
                  { ext: "PDF",  note: "Native text — best quality" },
                  { ext: "DOCX", note: "Word documents"             },
                  { ext: "JPG",  note: "Images — OCR applied"       },
                  { ext: "PNG",  note: "Images — OCR applied"       },
                ].map(({ ext, note }, i, arr) => (
                  <div
                    key={ext}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom:
                        i < arr.length - 1 ? "1px solid var(--th-row-divider)" : "none",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.65rem",
                        fontFamily: "var(--font-mono, monospace)",
                        fontWeight: 600,
                        color: "#818cf8",
                        background: "rgba(99,102,241,0.07)",
                        border: "1px solid rgba(99,102,241,0.14)",
                        borderRadius: "5px",
                        padding: "2px 7px",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {ext}
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "var(--th-text-3)" }}>
                      {note}
                    </span>
                  </div>
                ))}
                <p
                  style={{
                    fontSize: "0.68rem",
                    color: "var(--th-text-4)",
                    marginTop: "10px",
                    lineHeight: 1.5,
                  }}
                >
                  Maximum 10 MB per upload · Rate limit: 12 uploads / min
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </AppShell>
  );
}
