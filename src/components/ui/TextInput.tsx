import { InputHTMLAttributes, ReactNode } from "react";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ReactNode;
  error?: string;
}

export function TextInput({
  label,
  icon,
  error,
  className = "",
  id,
  ...props
}: TextInputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="w-full">
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-[#333]">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={`w-full rounded-lg border border-[#E5E7EB] bg-white py-3 ${
            icon ? "pl-10" : "pl-3"
          } pr-3 text-sm text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-2 focus:border-black focus:outline-none ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
