"use client";

import { DownloadIcon } from "@/components/ui/icons";
import { downloadSummaryReportPDF, downloadSingleEntryPDF, type PDFReportEntry } from "@/lib/pdf-export";

interface ExportPdfButtonProps {
  entries?: PDFReportEntry[];
  singleEntry?: PDFReportEntry;
  title?: string;
  studentName?: string;
  label?: string;
  className?: string;
}

export function ExportPdfButton({
  entries,
  singleEntry,
  title = "SIWES Logbook Activity Report",
  studentName = "Student",
  label = "Download PDF",
  className = "",
}: ExportPdfButtonProps) {
  function handleExport() {
    if (singleEntry) {
      downloadSingleEntryPDF(singleEntry);
    } else if (entries && entries.length > 0) {
      downloadSummaryReportPDF(entries, title, studentName);
    } else {
      window.print();
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className={`inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-[#1A1A1A] transition-all hover:bg-[#e6ac00] shadow-sm ${className}`}
    >
      <DownloadIcon className="h-4 w-4" />
      {label}
    </button>
  );
}
