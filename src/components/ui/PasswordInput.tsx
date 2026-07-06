"use client";

import { InputHTMLAttributes, useState } from "react";
import { EyeIcon, EyeOffIcon, LockIcon } from "./icons";

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function PasswordInput({
  label,
  error,
  className = "",
  id,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="w-full">
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-[#333]">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
          <LockIcon />
        </span>
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          className={`w-full rounded-lg border border-[#E5E7EB] bg-white py-3 pl-10 pr-10 text-sm text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-2 focus:border-black focus:outline-none ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
          aria-label={visible ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
