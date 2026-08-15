"use client";

import Link from "next/link";
import { useState } from "react";
import { StudentAvatar } from "@/components/supervisor/StudentAvatar";
import { EntryTypeBadge, ReviewStatusBadge, type EntryType } from "@/components/supervisor/badges";
import { ChevronRightIcon, ChevronLeftIcon } from "@/components/ui/icons";
import type { EntryStatus } from "@/components/dashboard/StatusBadge";

export interface HistoryRowVM {
  id: string;
  studentName: string;
  avatarUrl: string | null;
  type: EntryType;
  status: EntryStatus;
  dateText: string;
}

const PAGE_SIZE = 8;

export function HistoryTable({
  rows,
  dateHeader = "Date Reviewed",
}: {
  rows: HistoryRowVM[];
  dateHeader?: string;
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * PAGE_SIZE;
  const visible = rows.slice(start, start + PAGE_SIZE);
  const rangeStart = rows.length === 0 ? 0 : start + 1;
  const rangeEnd = Math.min(start + PAGE_SIZE, rows.length);

  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="bg-[#F9FAFB] text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
              <th className="px-6 py-3.5">Student Name</th>
              <th className="px-6 py-3.5">Entry Type</th>
              <th className="px-6 py-3.5">{dateHeader}</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F6]">
            {visible.map((r) => (
              <tr key={r.id} className="text-sm">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <StudentAvatar name={r.studentName} url={r.avatarUrl} size={36} />
                    <span className="font-medium text-[#1A1A1A]">{r.studentName}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <EntryTypeBadge type={r.type} />
                </td>
                <td className="px-6 py-4 text-[#666]">{r.dateText}</td>
                <td className="px-6 py-4">
                  <ReviewStatusBadge status={r.status} withDot />
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/supervisor/review/${r.id}`}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-center justify-between gap-4 border-t border-[#F3F4F6] px-6 py-4 sm:flex-row">
        <p className="text-sm text-[#666]">
          Showing <span className="font-semibold text-[#1A1A1A]">{rangeStart}</span>–
          <span className="font-semibold text-[#1A1A1A]">{rangeEnd}</span> of{" "}
          <span className="font-semibold text-[#1A1A1A]">{rows.length}</span>
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={current === 1}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#4B5563] disabled:opacity-40 enabled:hover:bg-gray-50"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`h-9 min-w-9 rounded-lg px-3 text-sm font-medium ${
                  n === current
                    ? "bg-primary text-[#1A1A1A]"
                    : "border border-[#E5E7EB] bg-white text-[#4B5563] hover:bg-gray-50"
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={current === totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#4B5563] disabled:opacity-40 enabled:hover:bg-gray-50"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
