"use client";

import { useState } from "react";
import type { SiwesCompletionSummary } from "@/app/actions/offboarding";
import { SiwesCompletionEmailModal } from "@/components/ui/SiwesCompletionEmailModal";
import { downloadSummaryReportPDF, type PDFReportEntry } from "@/lib/pdf-export";
import { CheckCircleIcon, MailIcon, PrinterIcon } from "@/components/ui/icons";

interface SiwesCompletionBannerProps {
  studentName: string;
  siwesStatus: "active" | "completed";
  siwesCompletedAt?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  totalLogs: number;
  approvedLogs: number;
  entries: {
    id: string;
    title: string;
    observations?: string | null;
    objective?: string | null;
    date: string;
    created_at: string;
    status: string;
    reviews?: { comment: string | null; reviewed_at: string }[] | null;
  }[];
}

export function SiwesCompletionBanner({
  studentName,
  siwesStatus,
  siwesCompletedAt,
  startDate,
  endDate,
  totalLogs,
  approvedLogs,
  entries,
}: SiwesCompletionBannerProps) {
  const [summary, setSummary] = useState<SiwesCompletionSummary | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  const todayKey = new Date().toISOString().slice(0, 10);
  const isEndDateReached = Boolean(endDate && todayKey >= endDate);
  const isCompleted = siwesStatus === "completed" && isEndDateReached;

  const handleDownloadBulkPdf = () => {
    const approvedList = entries.filter((e) => e.status === "approved");
    const targetEntries = approvedList.length > 0 ? approvedList : entries;

    const formatted: PDFReportEntry[] = targetEntries.map((e) => {
      const latestReview = e.reviews && e.reviews.length > 0 ? e.reviews[0] : null;
      return {
        id: e.id,
        title: e.title || "Logbook Entry",
        body: e.observations || e.objective || "No detailed observations recorded.",
        date: e.date,
        createdAt: e.created_at,
        status: e.status,
        studentName,
        review: latestReview
          ? {
              comment: latestReview.comment,
              reviewedAt: latestReview.reviewed_at,
            }
          : null,
      };
    });

    downloadSummaryReportPDF(
      formatted,
      "Official SIWES Logbook Approved Portfolio",
      studentName
    );
  };

  if (!isCompleted) {
    return null;
  }

  return (
    <>
      <div className="mt-6 rounded-3xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 via-[#FFFBEB] to-emerald-100/60 p-6 shadow-sm animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white font-black text-3xl shadow-md">
              🎓
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-200/90 px-3 py-1 text-xs font-extrabold text-emerald-900 flex items-center gap-1.5 shadow-2xs">
                  <CheckCircleIcon className="h-4 w-4 text-emerald-800" />
                  SIWES Program Completed &amp; Offboarded
                </span>
                {siwesCompletedAt && (
                  <span className="text-xs font-semibold text-emerald-800">
                    Offboarded on {new Date(siwesCompletedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                )}
              </div>

              <h3 className="mt-2 text-xl font-black text-[#111827]">
                Congratulations, {studentName}!
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-emerald-950 max-w-2xl leading-relaxed font-medium">
                You have officially completed your SIWES internship stay. All your weekly entries have been compiled. You can preview your activity history below or download your bulk approved logbook portfolio.
              </p>

              {/* Summary Badges */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-lg bg-white/80 px-2.5 py-1 text-xs font-bold text-gray-800 border border-emerald-200">
                  Total Logs: <strong className="ml-1 text-emerald-700">{totalLogs}</strong>
                </span>
                <span className="inline-flex items-center rounded-lg bg-white/80 px-2.5 py-1 text-xs font-bold text-gray-800 border border-emerald-200">
                  Approved Logs: <strong className="ml-1 text-emerald-700">{approvedLogs}</strong>
                </span>
                {startDate && endDate && (
                  <span className="inline-flex items-center rounded-lg bg-white/80 px-2.5 py-1 text-xs font-bold text-gray-800 border border-emerald-200">
                    Duration: <strong className="ml-1 text-emerald-700">{startDate} to {endDate}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 pt-2 lg:pt-0">
            <button
              onClick={() => {
                if (!summary) {
                  setSummary({
                    studentName,
                    studentEmail: "",
                    department: "SIWES Program",
                    placeOfWork: "SIWES Workplace",
                    supervisorName: "Assigned Supervisor",
                    startDate: startDate || null,
                    endDate: endDate || null,
                    totalLogs,
                    approvedLogs,
                    completedAt: siwesCompletedAt || new Date().toISOString(),
                  });
                }
                setEmailModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-3 text-xs font-bold text-emerald-900 hover:bg-emerald-50 transition-colors shadow-2xs"
            >
              <MailIcon className="h-4 w-4 text-emerald-700" />
              View Completion Notice
            </button>

            <button
              onClick={handleDownloadBulkPdf}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-extrabold text-white hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg transform active:scale-95"
            >
              <PrinterIcon className="h-4 w-4 text-white" />
              Bulk Print Approved Logs (PDF)
            </button>
          </div>
        </div>
      </div>

      {/* Completion Email Modal */}
      {summary && (
        <SiwesCompletionEmailModal
          isOpen={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          summary={summary}
          onDownloadBulkPdf={handleDownloadBulkPdf}
        />
      )}
    </>
  );
}
