import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface PremiumEmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
  statusLabel?: string;
  cta?: { label: string; href: string };
  compact?: boolean;
}

export default function PremiumEmptyState({
  icon: Icon,
  title,
  message,
  statusLabel = "AWAITING DATA",
  cta,
  compact = false,
}: PremiumEmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${compact ? "py-7 px-4" : "py-11 px-6"}`}
    >
      <div
        className={`flex ${compact ? "h-10 w-10" : "h-12 w-12"} items-center justify-center rounded-2xl mb-4`}
        style={{
          background: "rgba(99,102,241,0.05)",
          border: "1px solid rgba(99,102,241,0.09)",
        }}
      >
        <Icon size={compact ? 15 : 19} style={{ color: "#1e2d47" }} />
      </div>

      <p
        className={`font-semibold ${compact ? "text-xs" : "text-sm"} mb-1.5`}
        style={{ color: "#2e3d5a" }}
      >
        {title}
      </p>

      <p
        className="text-xs leading-relaxed max-w-[200px]"
        style={{ color: "#1a2538" }}
      >
        {message}
      </p>

      {cta && (
        <Link
          href={cta.href}
          className="mt-4 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:opacity-80"
          style={{
            background: "rgba(99,102,241,0.1)",
            border: "1px solid rgba(99,102,241,0.2)",
            color: "#6366f1",
          }}
        >
          {cta.label}
        </Link>
      )}

      <div className="mt-4 flex items-center gap-1.5">
        <div
          className="h-1 w-1 rounded-full animate-pulse"
          style={{ background: "#1e2d47" }}
        />
        <span className="font-mono-label" style={{ color: "#141e30", fontSize: "0.54rem" }}>
          {statusLabel}
        </span>
      </div>
    </div>
  );
}
