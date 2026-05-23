"use client";

import { CSSProperties, ReactNode, useState } from "react";
import { motion } from "framer-motion";

interface GlowButtonProps {
  children: ReactNode;
  variant?: "primary" | "ghost";
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  style?: CSSProperties;
}

export default function GlowButton({
  children,
  variant = "primary",
  fullWidth = false,
  loading = false,
  disabled,
  type,
  onClick,
  className = "",
  style,
}: GlowButtonProps) {
  const [hovered, setHovered] = useState(false);
  const isDisabled = disabled || loading;
  const isPrimary = variant === "primary";

  return (
    <motion.button
      type={type}
      onClick={onClick}
      whileTap={{ scale: isDisabled ? 1 : 0.975 }}
      whileHover={{ y: isDisabled ? 0 : -1 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      disabled={isDisabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={[
        "relative flex items-center justify-center gap-2 overflow-hidden rounded-xl px-6 py-3.5 text-sm font-semibold select-none",
        fullWidth ? "w-full" : "",
        isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        className,
      ].join(" ")}
      style={
        isPrimary
          ? {
              background: "linear-gradient(135deg, #5046e5 0%, #4338ca 55%, #3730a3 100%)",
              color: "#dde5ff",
              border: "1px solid rgba(129,140,248,0.22)",
              boxShadow: hovered && !isDisabled
                ? "0 0 52px rgba(99,102,241,0.6), 0 0 100px rgba(99,102,241,0.18), 0 6px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)"
                : "0 0 28px rgba(99,102,241,0.32), 0 4px 18px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)",
              transition: "box-shadow 0.25s ease",
              ...style,
            }
          : {
              background: "rgba(7, 12, 26, 0.8)",
              color: hovered && !isDisabled ? "#5a6480" : "#2e3d5a",
              border: `1px solid ${hovered && !isDisabled ? "rgba(99,102,241,0.22)" : "rgba(99,102,241,0.1)"}`,
              transition: "border-color 0.2s, color 0.2s",
              ...style,
            }
      }
    >
      {/* Shimmer sweep on hover (primary only) */}
      {isPrimary && (
        <motion.div
          className="pointer-events-none absolute inset-y-0"
          style={{
            left: 0,
            width: "45%",
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.07) 50%, transparent 100%)",
          }}
          initial={{ x: "-100%" }}
          animate={{ x: hovered && !isDisabled ? "300%" : "-100%" }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        />
      )}
      {children}
    </motion.button>
  );
}
