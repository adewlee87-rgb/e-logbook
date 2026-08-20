"use client";

import { useMemo } from "react";
import { DownloadIcon, StopwatchIcon } from "@/components/ui/icons";
import type { ReportEntry } from "@/components/dashboard/ReportCard";
import { downloadSummaryReportPDF } from "@/lib/pdf-export";

export function ProgressSummaryHeader({ entries }: { entries: ReportEntry[] }) {
  const stats = useMemo(() => {
    const total = entries.length;
    const approved = entries.filter((e) => e.status === "approved").length;
    const submitted = entries.filter((e) => e.status === "submitted").length;
    const rejected = entries.filter((e) => e.status === "rejected").length;
    const drafts = entries.filter((e) => e.status === "draft").length;

    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

    return { total, approved, submitted, rejected, drafts, approvalRate };
  }, [entries]);

  function handleExportPDF() {
    if (entries && entries.length > 0) {
      downloadSummaryReportPDF(entries, "SIWES Logbook Progress Summary");
    } else {
      window.print();
    }
  }

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF3D6] px-3 py-1 text-xs font-bold text-[#B45309]">
            <StopwatchIcon className="h-3.5 w-3.5" />
            Internship Period Activity Summary
          </span>
          <h2 className="mt-2 text-xl font-extrabold text-[#1A1A1A]">
            Student Activity &amp; Progress Report
          </h2>
          <p className="mt-1 text-sm text-[#666]">
            Comprehensive breakdown of all daily, weekly, and monthly logbook activities.
          </p>
        </div>

        <button
          onClick={handleExportPDF}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-[#1A1A1A] hover:bg-[#e6ac00] shadow-sm"
        >
          <DownloadIcon className="h-4 w-4" />
          Export PDF Summary
        </button>
      </div>

      {/* Progress & Stat grid */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <div className="rounded-xl border border-[#F3F4F6] bg-[#F9FAFB] p-3.5 text-center">
          <p className="text-xs font-semibold text-[#666]">Total Submissions</p>
          <p className="mt-1 text-xl font-bold text-[#1A1A1A]">{stats.total}</p>
        </div>

        <div className="rounded-xl border border-[#DCFCE7] bg-[#F0FDF4] p-3.5 text-center">
          <p className="text-xs font-semibold text-[#16A34A]">Approved &amp; Stamped</p>
          <p className="mt-1 text-xl font-bold text-[#15803D]">{stats.approved}</p>
        </div>

        <div className="rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] p-3.5 text-center">
          <p className="text-xs font-semibold text-[#2563EB]">Under Review</p>
          <p className="mt-1 text-xl font-bold text-[#1D4ED8]">{stats.submitted}</p>
        </div>

        <div className="rounded-xl border border-[#FEE2E2] bg-[#FEF2F2] p-3.5 text-center">
          <p className="text-xs font-semibold text-[#DC2626]">Returned / Needs Edit</p>
          <p className="mt-1 text-xl font-bold text-[#B91C1C]">{stats.rejected}</p>
        </div>

        <div className="col-span-2 rounded-xl border border-[#FEF3D6] bg-[#FFFBEB] p-3.5 text-center sm:col-span-4 lg:col-span-1">
          <p className="text-xs font-semibold text-[#B45309]">Approval Rate</p>
          <p className="mt-1 text-xl font-bold text-[#B45309]">{stats.approvalRate}%</p>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs font-semibold text-[#666]">
          <span>Progress Completion</span>
          <span>{stats.approved} of {stats.total} Approved</span>
        </div>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-[#16A34A] transition-all duration-500"
            style={{ width: `${stats.total > 0 ? (stats.approved / stats.total) * 100 : 0}%` }}
          />
        </div>
      </div>
    </div>
  );
}
