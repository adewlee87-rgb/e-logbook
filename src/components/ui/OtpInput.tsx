"use client";

import { ClipboardEvent, KeyboardEvent, useRef } from "react";

interface OtpInputProps {
  length: number;
  value: string[];
  onChange: (value: string[]) => void;
}

export function OtpInput({ length, value, onChange }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function setDigit(index: number, digit: string) {
    const next = [...value];
    next[index] = digit;
    onChange(next);
  }

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    setDigit(index, digit);
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setDigit(index - 1, "");
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length).split("");
    const next = Array.from({ length }, (_, i) => digits[i] ?? "");
    onChange(next);
    inputRefs.current[Math.min(digits.length, length - 1)]?.focus();
  }

  return (
    <div className="flex justify-center gap-3">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          inputMode="numeric"
          maxLength={1}
          className="h-14 w-14 rounded-lg border border-[#E5E7EB] text-center text-xl font-semibold text-[#1A1A1A] focus:border-2 focus:border-black focus:outline-none"
        />
      ))}
    </div>
  );
}
