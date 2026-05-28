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
      className={`rounded-2xl transition-all duration-300 ${onClick ? "cursor-pointer" : ""} ${className}`}
      style={{
        background: "var(--th-card-bg)",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        border: glow
          ? "1px solid rgba(99, 102, 241, 0.2)"
          : "1px solid var(--th-card-border)",
        boxShadow: glow
          ? "0 0 24px rgba(99,102,241,0.12), var(--th-card-shadow)"
          : "var(--th-card-shadow)",
        transition: hover ? "background 0.2s, border-color 0.2s" : undefined,
        ...style,
      }}
      onMouseEnter={
        hover
          ? (e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--th-hover-bg)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.28)";
            }
          : undefined
      }
      onMouseLeave={
        hover
          ? (e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--th-card-bg)";
              (e.currentTarget as HTMLElement).style.borderColor = glow
                ? "rgba(99,102,241,0.2)"
                : "var(--th-card-border)";
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
