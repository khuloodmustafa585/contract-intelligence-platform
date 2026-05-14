import { LucideIcon, FileX } from "lucide-react";
import { ReactNode } from "react";
import Link from "next/link";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  children?: ReactNode;
}

export default function EmptyState({
  icon: Icon = FileX,
  title,
  description,
  action,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div
        className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{
          background: "rgba(99,102,241,0.08)",
          border: "1px solid rgba(99,102,241,0.16)",
        }}
      >
        <Icon size={28} style={{ color: "#6366f1", opacity: 0.7 }} />
      </div>

      <h3 className="text-base font-semibold mb-2" style={{ color: "#dae2fd" }}>
        {title}
      </h3>

      {description && (
        <p className="text-sm max-w-xs mb-6" style={{ color: "#64748b" }}>
          {description}
        </p>
      )}

      {children}

      {action && (
        action.href ? (
          <Link
            href={action.href}
            className="mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              color: "white",
              boxShadow: "0 0 20px rgba(99,102,241,0.3)",
            }}
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              color: "white",
              boxShadow: "0 0 20px rgba(99,102,241,0.3)",
            }}
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
