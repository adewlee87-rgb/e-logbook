import { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  rightSlot?: ReactNode;
}

export function StatCard({ icon, label, value, rightSlot }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-h-[50px] text-sm text-[#666]">
          <span className="text-[#1A1A1A]">{icon}</span>
          {label}
        </div>
        {rightSlot}
      </div>
      <div className="mt-4 text-2xl font-bold text-[#1A1A1A]">{value}</div>
    </div>
  );
}
