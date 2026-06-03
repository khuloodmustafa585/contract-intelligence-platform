type Status =
  | "analyzed"
  | "processing"
  | "pending"
  | "uploaded"
  | "failed"
  | "indexed"
  | "ready"
  | string;

const STATUS_MAP: Record<string, { bg: string; textVar: string; dot: string; label: string }> = {
  completed:        { bg: "rgba(16,185,129,0.12)",  textVar: "var(--badge-success-text)", dot: "#10b981", label: "Analyzed"              },
  analyzed:         { bg: "rgba(16,185,129,0.12)",  textVar: "var(--badge-success-text)", dot: "#10b981", label: "Analyzed"              },
  ready:            { bg: "rgba(16,185,129,0.12)",  textVar: "var(--badge-success-text)", dot: "#10b981", label: "Ready"                 },
  indexed:          { bg: "rgba(34,211,238,0.10)",  textVar: "var(--badge-cyan-text)",    dot: "#22d3ee", label: "Indexed"               },
  analysis_pending: { bg: "rgba(139,92,246,0.12)",  textVar: "var(--badge-purple-text)",  dot: "#a78bfa", label: "Analyzing"             },
  indexing:         { bg: "rgba(34,211,238,0.10)",  textVar: "var(--badge-cyan-text)",    dot: "#22d3ee", label: "Indexing"              },
  parsed:           { bg: "rgba(59,130,246,0.10)",  textVar: "var(--badge-blue-text)",    dot: "#3b82f6", label: "Parsed"               },
  processing:       { bg: "rgba(245,158,11,0.12)",  textVar: "var(--badge-yellow-text)",  dot: "#f59e0b", label: "Processing"            },
  ocr_processing:   { bg: "rgba(245,158,11,0.10)",  textVar: "var(--badge-yellow-text)",  dot: "#f59e0b", label: "OCR Processing"        },
  uploaded:         { bg: "rgba(59,130,246,0.12)",  textVar: "var(--badge-blue-text)",    dot: "#3b82f6", label: "Uploaded"              },
  pending:          { bg: "rgba(100,116,139,0.12)", textVar: "var(--badge-gray-text)",    dot: "#64748b", label: "Pending"              },
  failed:           { bg: "rgba(239,68,68,0.12)",   textVar: "var(--badge-red-text)",     dot: "#ef4444", label: "Failed"               },
  analysis_failed:  { bg: "rgba(245,158,11,0.12)",  textVar: "var(--badge-yellow-text)",  dot: "#f59e0b", label: "Analysis Unavailable"  },
  overdue:          { bg: "rgba(239,68,68,0.12)",   textVar: "var(--badge-red-text)",     dot: "#ef4444", label: "Overdue"              },
};

const DEFAULT_STYLE = { bg: "rgba(100,116,139,0.1)", textVar: "var(--badge-gray-text)", dot: "#64748b", label: "" };

interface StatusBadgeProps {
  status: Status;
  pulse?: boolean;
}

export default function StatusBadge({ status, pulse = false }: StatusBadgeProps) {
  const key = status?.toLowerCase() ?? "";
  const s = STATUS_MAP[key] ?? { ...DEFAULT_STYLE, label: status };

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: s.bg, color: s.textVar }}
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        {pulse && (
          <span
            className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping-slow"
            style={{ background: s.dot }}
          />
        )}
        <span
          className="relative inline-flex h-1.5 w-1.5 rounded-full"
          style={{ background: s.dot }}
        />
      </span>
      {s.label || status}
    </span>
  );
}
