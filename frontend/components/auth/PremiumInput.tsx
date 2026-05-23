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
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Label */}
      <label
        style={{
          marginBottom: "8px",
          fontSize: "0.75rem",
          fontWeight: 500,
          color: focused ? "#818cf8" : error ? "#f87171" : "#4f6080",
          transition: "color 0.2s",
          display: "block",
        }}
      >
        {label}
      </label>

      {/* Flex input wrapper — this is the visible "input box" */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          borderRadius: "12px",
          background: focused ? "rgba(5, 9, 20, 0.98)" : "rgba(4, 7, 17, 0.95)",
          border: `1px solid ${
            focused
              ? "rgba(99,102,241,0.45)"
              : error
              ? "rgba(239,68,68,0.3)"
              : "rgba(99,102,241,0.14)"
          }`,
          boxShadow: focused
            ? "0 0 0 3px rgba(99,102,241,0.09), inset 0 1px 0 rgba(255,255,255,0.03)"
            : "inset 0 1px 0 rgba(255,255,255,0.02)",
          transition: "border-color 0.2s, box-shadow 0.2s, background 0.15s",
          minHeight: "52px",
        }}
      >
        {/* Left icon */}
        {icon && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              paddingLeft: "16px",
              paddingRight: "10px",
              flexShrink: 0,
              color: focused ? "#818cf8" : "#3a5070",
              transition: "color 0.2s",
            }}
          >
            {icon}
          </span>
        )}

        {/* Native input — transparent, grows to fill */}
        <input
          {...rest}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e)  => { setFocused(false); onBlur?.(e); }}
          style={{
            flex: 1,
            minWidth: 0,
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: "0.875rem",
            color: "#dae2fd",
            caretColor: "#6366f1",
            lineHeight: "1.5",
            paddingTop: "14px",
            paddingBottom: "14px",
            paddingLeft: icon ? "0" : "16px",
            paddingRight: rightSlot ? "0" : "16px",
          }}
          /* Tailwind can't reach ::placeholder via inline style, so keep one class */
          className="placeholder:text-[#364d66]"
        />

        {/* Right slot (eye toggle etc.) */}
        {rightSlot && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              paddingLeft: "10px",
              paddingRight: "16px",
              flexShrink: 0,
            }}
          >
            {rightSlot}
          </span>
        )}
      </div>

      {/* Inline error */}
      {error && (
        <p
          style={{
            marginTop: "6px",
            fontSize: "0.75rem",
            color: "#f87171",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
