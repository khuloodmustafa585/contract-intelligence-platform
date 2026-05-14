"use client";

import { InputHTMLAttributes, ReactNode, useState } from "react";

interface PremiumInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ReactNode;
  rightSlot?: ReactNode;
  error?: string;
}

export default function PremiumInput({
  label,
  icon,
  rightSlot,
  error,
  onFocus,
  onBlur,
  ...rest
}: PremiumInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div>
      <label
        className="mb-1.5 block font-mono-label"
        style={{
          color: focused ? "#5046e5" : error ? "#7f1d1d" : "#1e2d47",
          fontSize: "0.62rem",
          transition: "color 0.2s",
        }}
      >
        {label}
      </label>

      <div className="relative">
        {icon && (
          <div
            className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2"
            style={{
              color: focused ? "#5046e5" : "#1e2d47",
              transition: "color 0.2s",
            }}
          >
            {icon}
          </div>
        )}

        <input
          {...rest}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          className={[
            "w-full rounded-xl py-3 text-sm outline-none placeholder:text-[#141e30]",
            icon ? "pl-10" : "pl-4",
            rightSlot ? "pr-11" : "pr-4",
          ].join(" ")}
          style={{
            background: focused ? "rgba(5, 9, 20, 0.98)" : "rgba(4, 7, 17, 0.96)",
            border: `1px solid ${
              focused
                ? "rgba(99,102,241,0.42)"
                : error
                ? "rgba(239,68,68,0.28)"
                : "rgba(99,102,241,0.1)"
            }`,
            boxShadow: focused
              ? "0 0 0 3px rgba(99,102,241,0.07), inset 0 1px 0 rgba(255,255,255,0.02)"
              : "inset 0 1px 0 rgba(255,255,255,0.015)",
            color: "#dae2fd",
            caretColor: "#6366f1",
            transition: "border-color 0.2s, box-shadow 0.2s, background 0.15s",
          }}
        />

        {rightSlot && (
          <div className="absolute right-3 top-1/2 z-10 -translate-y-1/2">
            {rightSlot}
          </div>
        )}
      </div>

      {error && (
        <p
          className="mt-1 font-mono-label"
          style={{ color: "#ef4444", fontSize: "0.58rem" }}
        >
          ⚠ {error}
        </p>
      )}
    </div>
  );
}
