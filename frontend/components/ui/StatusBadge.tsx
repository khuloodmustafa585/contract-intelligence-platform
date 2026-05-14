type Status =
  | "analyzed"
  | "processing"
  | "pending"
  | "uploaded"
  | "failed"
  | "indexed"
  | "ready"
  | string;

const STATUS_MAP: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  analyzed:   { bg: "rgba(16,185,129,0.10)",  text: "#34d399", dot: "#10b981", label: "Analyzed"   },
  ready:      { bg: "rgba(16,185,129,0.10)",  text: "#34d399", dot: "#10b981", label: "Ready"      },
  indexed:    { bg: "rgba(34,211,238,0.10)",  text: "#22d3ee", dot: "#06b6d4", label: "Indexed"    },
  processing: { bg: "rgba(245,158,11,0.10)",  text: "#fbbf24", dot: "#f59e0b", label: "Processing" },
  pending:    { bg: "rgba(100,116,139,0.14)", text: "#94a3b8", dot: "#64748b", label: "Pending"    },
  uploaded:   { bg: "rgba(99,102,241,0.12)",  text: "#818cf8", dot: "#6366f1", label: "Uploaded"   },
  failed:     { bg: "rgba(239,68,68,0.10)",   text: "#f87171", dot: "#ef4444", label: "Failed"     },
};

const DEFAULT_STYLE = { bg: "rgba(100,116,139,0.14)", text: "#94a3b8", dot: "#64748b", label: "" };

interface StatusBadgeProps {
  status: Status;
  pulse?: boolean;
}

export default function StatusBadge({ status, pulse = false }: StatusBadgeProps) {
  const key = status?.toLowerCase() ?? "";
  const s = STATUS_MAP[key] ?? { ...DEFAULT_STYLE, label: status };

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{
        background: s.bg,
        color: s.text,
        fontFamily: "var(--font-mono, monospace)",
        letterSpacing: "0.06em",
      }}
    >
      <span
        className="relative flex h-1.5 w-1.5 shrink-0"
      >
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
