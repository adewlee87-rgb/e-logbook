"use client";

import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export function Button({
  loading,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={`w-full rounded-full py-3 text-sm font-semibold transition-colors ${
        isDisabled
          ? "cursor-not-allowed bg-[#9CA3AF] text-white"
          : "bg-[#FFC107] text-[#1A1A1A] hover:bg-[#e6ac00]"
      } ${className}`}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          Please wait...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
