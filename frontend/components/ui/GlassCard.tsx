import { ReactNode, CSSProperties } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

export default function GlassCard({
  children,
  className = "",
  style,
  hover = false,
  glow = false,
  onClick,
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl transition-all duration-300 ${hover ? "hover:border-[rgba(99,102,241,0.28)] hover:bg-[rgba(26,35,64,0.75)]" : ""} ${onClick ? "cursor-pointer" : ""} ${className}`}
      style={{
        background: "rgba(19, 27, 46, 0.7)",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        border: "1px solid rgba(99, 102, 241, 0.14)",
        boxShadow: glow
          ? "0 0 24px rgba(99,102,241,0.12), 0 4px 24px rgba(0,0,0,0.3)"
          : "0 4px 24px rgba(0,0,0,0.25)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
