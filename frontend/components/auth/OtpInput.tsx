"use client";

import { useRef, useState, ChangeEvent, KeyboardEvent, ClipboardEvent } from "react";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export default function OtpInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  autoFocus = true,
}: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Pad / trim value to exactly `length` characters for display
  const chars = value.padEnd(length, " ").split("").slice(0, length).map((c) => (c === " " ? "" : c));

  function focusAt(index: number) {
    const clamped = Math.max(0, Math.min(length - 1, index));
    refs.current[clamped]?.focus();
  }

  function handleChange(index: number, e: ChangeEvent<HTMLInputElement>) {
    // Allow only digits; take the last character entered (handles replacement)
    const digit = e.target.value.replace(/\D/g, "").slice(-1);
    const next = [...chars];
    next[index] = digit;
    onChange(next.join(""));
    if (digit && index < length - 1) {
      focusAt(index + 1);
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = [...chars];
      if (chars[index]) {
        next[index] = "";
        onChange(next.join(""));
      } else if (index > 0) {
        next[index - 1] = "";
        onChange(next.join(""));
        focusAt(index - 1);
      }
    } else if (e.key === "Delete") {
      e.preventDefault();
      const next = [...chars];
      next[index] = "";
      onChange(next.join(""));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusAt(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusAt(index + 1);
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>, startIndex: number) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length - startIndex);
    if (!pasted) return;
    const next = [...chars];
    pasted.split("").forEach((d, i) => { next[startIndex + i] = d; });
    onChange(next.join(""));
    focusAt(Math.min(startIndex + pasted.length, length - 1));
  }

  return (
    <div style={{ display: "flex", gap: "8px" }}>
      {chars.map((char, i) => {
        const isFocused = focusedIndex === i;
        const isFilled = !!char;

        return (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={char}
            disabled={disabled}
            autoFocus={autoFocus && i === 0}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={(e) => handlePaste(e, i)}
            onFocus={(e) => { setFocusedIndex(i); e.target.select(); }}
            onBlur={() => setFocusedIndex(null)}
            style={{
              flex: 1,
              minWidth: 0,
              height: "60px",
              textAlign: "center",
              fontSize: "1.375rem",
              fontWeight: 600,
              letterSpacing: "0.02em",
              borderRadius: "12px",
              background: isFocused
                ? "rgba(5, 9, 20, 0.98)"
                : isFilled
                ? "rgba(99,102,241,0.07)"
                : "rgba(4, 7, 17, 0.95)",
              border: `1px solid ${
                isFocused
                  ? "rgba(99,102,241,0.45)"
                  : isFilled
                  ? "rgba(99,102,241,0.30)"
                  : "rgba(99,102,241,0.14)"
              }`,
              boxShadow: isFocused
                ? "0 0 0 3px rgba(99,102,241,0.09), inset 0 1px 0 rgba(255,255,255,0.03)"
                : isFilled
                ? "0 0 12px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.03)"
                : "inset 0 1px 0 rgba(255,255,255,0.02)",
              color: "#dae2fd",
              caretColor: "#6366f1",
              outline: "none",
              transition: "border-color 0.2s, box-shadow 0.2s, background 0.15s",
              cursor: disabled ? "not-allowed" : "text",
              opacity: disabled ? 0.45 : 1,
            }}
            className="placeholder:text-[#364d66]"
          />
        );
      })}
    </div>
  );
}
