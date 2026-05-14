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
  statusLabel,
  cta,
  compact = false,
}: PremiumEmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${compact ? "py-8 px-5" : "py-12 px-8"}`}
    >
      <div
        className={`flex ${compact ? "h-9 w-9" : "h-11 w-11"} items-center justify-center rounded-xl mb-4`}
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <Icon size={compact ? 14 : 18} style={{ color: "#374151" }} />
      </div>

      <p
        className={`font-medium ${compact ? "text-xs" : "text-sm"} mb-1.5`}
        style={{ color: "#6b7280" }}
      >
        {title}
      </p>

      <p
        className="text-xs leading-relaxed max-w-[220px]"
        style={{ color: "#374151" }}
      >
        {message}
      </p>

      {cta && (
        <Link
          href={cta.href}
          className="mt-4 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
          style={{
            background: "rgba(59,130,246,0.1)",
            border: "1px solid rgba(59,130,246,0.2)",
            color: "#60a5fa",
          }}
        >
          {cta.label}
        </Link>
      )}

      {statusLabel && (
        <p className="mt-3 text-xs" style={{ color: "#1f2937" }}>
          {statusLabel}
        </p>
      )}
    </div>
  );
}
