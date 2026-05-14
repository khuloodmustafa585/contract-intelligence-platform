"use client";

interface AIProcessingIndicatorProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "dots" | "ring" | "pulse";
}

export default function AIProcessingIndicator({
  label = "Processing...",
  size = "md",
  variant = "dots",
}: AIProcessingIndicatorProps) {
  if (variant === "ring") {
    const sz = size === "sm" ? 16 : size === "lg" ? 28 : 22;
    return (
      <div className="flex items-center gap-3">
        <div
          className="rounded-full border-2 animate-spin"
          style={{
            width: sz,
            height: sz,
            borderColor: "rgba(99,102,241,0.2)",
            borderTopColor: "#6366f1",
          }}
        />
        <span className="text-sm font-medium" style={{ color: "#94a3b8" }}>
          {label}
        </span>
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className="flex items-center gap-3">
        <div className="relative flex h-3 w-3">
          <span
            className="absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{
              background: "#6366f1",
              animation: "ping-slow 2s cubic-bezier(0,0,0.2,1) infinite",
            }}
          />
          <span
            className="relative inline-flex h-3 w-3 rounded-full"
            style={{ background: "#6366f1" }}
          />
        </div>
        <span className="text-sm font-medium" style={{ color: "#94a3b8" }}>
          {label}
        </span>
      </div>
    );
  }

  // dots
  const dotSize = size === "sm" ? 5 : size === "lg" ? 9 : 7;
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="rounded-full"
            style={{
              width: dotSize,
              height: dotSize,
              background: "#6366f1",
              animation: `dot-bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
              display: "inline-block",
            }}
          />
        ))}
      </div>
      {label && (
        <span className="text-sm font-medium" style={{ color: "#94a3b8" }}>
          {label}
        </span>
      )}
    </div>
  );
}
