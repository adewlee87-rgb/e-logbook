"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircleIcon, DownloadIcon, MailIcon, PrintIcon } from "@/components/ui/icons";
import { formatDate } from "@/lib/supervisor";
import type { SiwesCompletionSummary } from "@/app/actions/offboarding";

interface SiwesCompletionEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: SiwesCompletionSummary;
  onDownloadBulkPdf?: () => void;
}

export function SiwesCompletionEmailModal({
  isOpen,
  onClose,
  summary,
  onDownloadBulkPdf,
}: SiwesCompletionEmailModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] rounded-3xl bg-white p-5 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100 overflow-hidden">
        
        {/* Header Ribbon / Email Header (Fixed Top) */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 pb-3 sm:pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FFC107] text-[#111827] shadow-xs">
              <MailIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#D97706]">
                  Official System Notice
                </span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  Verified
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-[#111827]">
                Y&apos;ello Log SIWES Completion Notice
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Email Content Body */}
        <div className="flex-1 overflow-y-auto min-h-0 py-4 space-y-4 pr-1 sm:pr-2">
          {/* Email Metadata Card */}
          <div className="rounded-2xl bg-[#F9FAFB] p-3.5 text-xs text-gray-600 flex flex-col gap-1 border border-gray-100">
            <div>
              <span className="font-semibold text-gray-900">From:</span> Y&apos;ello Log SIWES Portal &lt;notifications@yellolog.app&gt;
            </div>
            <div>
              <span className="font-semibold text-gray-900">To:</span> {summary.studentName} &lt;{summary.studentEmail}&gt;
            </div>
            <div>
              <span className="font-semibold text-gray-900">Subject:</span> 🎉 Congratulations on Completing Your SIWES Internship Program!
            </div>
            <div>
              <span className="font-semibold text-gray-900">Date:</span> {formatDate(summary.completedAt)}
            </div>
          </div>

          <div className="rounded-2xl bg-[#FEF9E6] p-4 sm:p-5 border border-[#FDE68A] flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFC107] text-[#111827] font-black text-2xl shadow-xs">
              🎓
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#111827]">
                Dear {summary.studentName},
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-[#78350F] leading-relaxed">
                Congratulations! We are delighted to inform you that you have successfully completed your Student Industrial Work Experience Scheme (SIWES) program. Your hard work, daily observations, and supervisor reviews have been verified and archived.
              </p>
            </div>
          </div>

          {/* Program Overview Table */}
          <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-700">
              SIWES Program Completion Summary
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 p-4 text-xs sm:text-sm">
              <div>
                <span className="text-gray-500 block text-[11px] font-medium uppercase">Student Name:</span>
                <span className="font-bold text-gray-900">{summary.studentName}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[11px] font-medium uppercase">Department / Course:</span>
                <span className="font-bold text-gray-900">{summary.department}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[11px] font-medium uppercase">Place of Work (Organization):</span>
                <span className="font-bold text-gray-900">{summary.placeOfWork}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[11px] font-medium uppercase">Assigned Supervisor:</span>
                <span className="font-bold text-gray-900">{summary.supervisorName}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[11px] font-medium uppercase">Program Duration:</span>
                <span className="font-bold text-gray-900">
                  {summary.startDate ? formatDate(summary.startDate) : "N/A"} – {summary.endDate ? formatDate(summary.endDate) : "Present"}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-[11px] font-medium uppercase">Approved Logbook Entries:</span>
                <span className="font-bold text-emerald-700">
                  {summary.approvedLogs} of {summary.totalLogs} logs approved
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed">
            Your assigned supervisor (<span className="font-semibold text-gray-900">{summary.supervisorName}</span>) and institutional administration have been notified of your completion. You can download a complete PDF booklet containing all your approved log entries for your official records at any time.
          </p>
        </div>

        {/* Action Footer (Fixed Bottom) */}
        <div className="shrink-0 pt-3 sm:pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
            <span>Verified by Y&apos;ello Log SIWES Portal</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <PrintIcon className="h-4 w-4 text-gray-500" />
              Print Email Notice
            </button>

            {onDownloadBulkPdf && (
              <button
                onClick={onDownloadBulkPdf}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FFC107] px-5 py-2.5 text-xs font-bold text-[#111827] hover:bg-[#e5ac00] transition-colors shadow-xs"
              >
                <DownloadIcon className="h-4 w-4" />
                Print All Approved Logs (Bulk PDF)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
