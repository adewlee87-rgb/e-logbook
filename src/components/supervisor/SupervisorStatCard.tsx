import { ReactNode } from "react";

interface SupervisorStatCardProps {
  icon: ReactNode;
  iconBg?: string;
  iconColor?: string;
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "up" | "down";
  hint?: string;
  dot?: boolean;
  highlight?: boolean;
}

export function SupervisorStatCard({
  icon,
  iconBg = "#F3F4F6",
  iconColor = "#4B5563",
  label,
  value,
  delta,
  deltaTone = "up",
  hint,
  dot,
  highlight,
}: SupervisorStatCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm ${
        highlight ? "border-transparent bg-primary" : "border-[#E5E7EB] bg-white"
      }`}
    >
      {dot && <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-red-500" />}
      <div className="flex items-center gap-4">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
          style={highlight ? { backgroundColor: "rgba(255,255,255,0.35)", color: "#1A1A1A" } : { backgroundColor: iconBg, color: iconColor }}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p
            className={`text-xs font-semibold uppercase tracking-wide ${
              highlight ? "text-[#1A1A1A]/70" : "text-[#9CA3AF]"
            }`}
          >
            {label}
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#1A1A1A]">{value}</span>
            {delta && (
              <span
                className={`text-xs font-semibold ${
                  highlight
                    ? "text-[#1A1A1A]/70"
                    : deltaTone === "up"
                    ? "text-[#16A34A]"
                    : "text-[#DC2626]"
                }`}
              >
                {delta}
              </span>
            )}
            {hint && <span className="text-xs text-[#1A1A1A]/70">{hint}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
