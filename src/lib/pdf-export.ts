"use client";

import { jsPDF } from "jspdf";

export interface PDFReportEntry {
  id: string;
  title: string;
  body: string;
  date: string;
  createdAt: string;
  status: string;
  imageUrl?: string | null;
  studentName?: string | null;
  studentId?: string | null;
  placeOfWork?: string | null;
  supervisorName?: string | null;
  review?: {
    id?: string;
    comment?: string | null;
    reviewedAt?: string | null;
    reviewerRole?: string | null;
  } | null;
}

function formatDate(iso: string) {
  if (!iso) return "N/A";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string) {
  if (!iso) return "N/A";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function drawYelloLogLogo(doc: jsPDF, x: number, y: number, size = 16) {
  const scale = size / 512;
  const borderRadius = size * (120 / 512);

  // Background Yellow rounded rectangle (#FFC107)
  doc.setFillColor(255, 193, 7);
  doc.roundedRect(x, y, size, size, borderRadius, borderRadius, "F");

  // Dark vector 'Y' stroke (#1A1A1A) from icon.svg
  const strokeWidth = 68 * scale;
  doc.setDrawColor(26, 26, 26);
  doc.setLineWidth(strokeWidth);
  try {
    (doc as any).setLineCap("round");
    (doc as any).setLineJoin("round");
  } catch {}

  const xLeft = x + 160 * scale;
  const yTop = y + 150 * scale;
  const xCenter = x + 256 * scale;
  const yJunction = y + 266 * scale;
  const xRight = x + 352 * scale;
  const yBottom = y + 362 * scale;

  doc.line(xLeft, yTop, xCenter, yJunction);
  doc.line(xRight, yTop, xCenter, yJunction);
  doc.line(xCenter, yJunction, xCenter, yBottom);
}

function drawHeaderBanner(doc: jsPDF, titleSuffix = "Official SIWES Entry Report") {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Header Banner Background (Yellow #FFC107)
  doc.setFillColor(255, 193, 7);
  doc.roundedRect(margin, 12, contentWidth, 22, 2.5, 2.5, "F");

  // Dark Logo Badge Frame (#1A1A1A) to make icon.svg pop
  doc.setFillColor(26, 26, 26);
  doc.roundedRect(margin + 3, 14, 18, 18, 3, 3, "F");

  // Y'ello Log Brand Vector Logo from icon.svg
  drawYelloLogLogo(doc, margin + 4, 15, 16);

  // App Name & Subtitle
  doc.setTextColor(26, 26, 26);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Y'ello Log", margin + 25, 21);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(31, 41, 55);
  doc.text(`Student Industrial Work Experience Scheme • ${titleSuffix}`, margin + 25, 28);
}

function addFooters(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const totalPages = doc.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(229, 231, 235);
    doc.line(15, 282, pageWidth - 15, 282);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(156, 163, 175);
    doc.text(
      `Y'ello Log SIWES E-Logbook System • Verified Digital Document`,
      15,
      287
    );
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - 15,
      287,
      { align: "right" }
    );
  }
}

/**
 * Downloads a single logbook entry with full, un-truncated detail and professional layout.
 */
export function downloadSingleEntryPDF(entry: PDFReportEntry) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  drawHeaderBanner(doc, "Detailed Entry Document");

  let y = 42;

  // Title Box
  const statusUpper = (entry.status || "SUBMITTED").toUpperCase();
  let statusBg = [254, 243, 199]; // yellow bg
  let statusText = [180, 83, 9];

  if (entry.status === "approved") {
    statusBg = [220, 252, 231];
    statusText = [21, 128, 61];
  } else if (entry.status === "rejected") {
    statusBg = [254, 226, 226];
    statusText = [185, 28, 28];
  }

  // Title & Status
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(26, 26, 26);
  const titleLines = doc.splitTextToSize(entry.title || "Logbook Entry", contentWidth - 45);
  doc.text(titleLines, margin, y);

  // Status Badge
  doc.setFillColor(statusBg[0], statusBg[1], statusBg[2]);
  doc.roundedRect(pageWidth - margin - 38, y - 5, 38, 9, 2, 2, "F");
  doc.setTextColor(statusText[0], statusText[1], statusText[2]);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text(statusUpper, pageWidth - margin - 19, y + 1, { align: "center" });

  y += Math.max(12, titleLines.length * 6 + 4);

  // Metadata Card
  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, "FD");

  const colWidth = contentWidth / 3;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(107, 114, 128);
  doc.text("LOG DATE", margin + 6, y + 7);
  doc.text("SUBMISSION DATE", margin + colWidth + 6, y + 7);
  doc.text("ENTRY ID", margin + colWidth * 2 + 6, y + 7);

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "semibold");
  doc.setTextColor(17, 24, 39);
  doc.text(formatDate(entry.date), margin + 6, y + 15);
  doc.text(formatDateTime(entry.createdAt), margin + colWidth + 6, y + 15);
  doc.text(entry.id ? entry.id.slice(0, 16) : "N/A", margin + colWidth * 2 + 6, y + 15);

  y += 28;

  // Observations Section Header
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(31, 41, 55);
  doc.text("Detailed Daily Observations & Work Executed:", margin, y);
  y += 7;

  // Observations Text Rendering with Auto Page Break
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(55, 65, 81);

  const rawBody = entry.body || "(No detailed body text provided for this entry.)";
  const paragraphs = rawBody.split("\n");

  paragraphs.forEach((p) => {
    if (!p.trim()) {
      y += 3;
      return;
    }
    const lines = doc.splitTextToSize(p, contentWidth - 8);
    lines.forEach((line: string) => {
      if (y > pageHeight - 35) {
        doc.addPage();
        drawHeaderBanner(doc, "Entry Document (Continuation)");
        y = 42;
      }
      doc.text(line, margin + 4, y);
      y += 5.5;
    });
    y += 2;
  });

  y += 8;

  // Supervisor Review Callout Box if present
  if (entry.review || entry.status === "approved" || entry.status === "rejected") {
    if (y > pageHeight - 55) {
      doc.addPage();
      drawHeaderBanner(doc, "Supervisor Feedback Document");
      y = 42;
    }

    const isApproved = entry.status === "approved";
    const boxBg = isApproved ? [240, 253, 244] : [254, 242, 242];
    const borderCol = isApproved ? [187, 247, 208] : [254, 202, 202];
    const headerCol = isApproved ? [22, 101, 52] : [153, 27, 27];

    const commentText = entry.review?.comment
      ? `"${entry.review.comment}"`
      : "(Supervisor did not leave a written text comment for this review action.)";
    const commentLines = doc.splitTextToSize(commentText, contentWidth - 12);
    const boxHeight = Math.max(22, commentLines.length * 5.5 + 16);

    doc.setFillColor(boxBg[0], boxBg[1], boxBg[2]);
    doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
    doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, "FD");

    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(headerCol[0], headerCol[1], headerCol[2]);
    doc.text(
      isApproved
        ? "✓ SUPERVISOR APPROVAL & FEEDBACK COMMENT"
        : "⚠ SUPERVISOR REVISION & CORRECTION FEEDBACK",
      margin + 6,
      y + 8
    );

    if (entry.review?.reviewedAt) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(107, 114, 128);
      doc.text(
        `Reviewed on: ${formatDateTime(entry.review.reviewedAt)}`,
        pageWidth - margin - 6,
        y + 8,
        { align: "right" }
      );
    }

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(31, 41, 55);

    let commentY = y + 16;
    commentLines.forEach((line: string) => {
      doc.text(line, margin + 6, commentY);
      commentY += 5.5;
    });

    y += boxHeight + 12;
  }

  addFooters(doc);

  const filename = `${(entry.title || "siwes-log-entry").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
  doc.save(filename);
}

/**
 * Downloads a comprehensive, multi-page report containing all entries in high detail without truncation.
 */
export function downloadSummaryReportPDF(
  entries: PDFReportEntry[],
  title = "SIWES Logbook Activity Report",
  studentName = "Student"
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  drawHeaderBanner(doc, "Comprehensive Activity Summary");

  let y = 42;

  // Document Title
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(26, 26, 26);
  doc.text(title, margin, y);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128);
  doc.text(`Generated for: ${studentName} • Date: ${formatDate(new Date().toISOString())}`, margin, y + 6);

  y += 15;

  // Stats Card
  const total = entries.length;
  const approved = entries.filter((e) => e.status === "approved").length;
  const rejected = entries.filter((e) => e.status === "rejected").length;
  const pending = total - approved - rejected;

  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, "FD");

  const statCol = contentWidth / 4;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");

  doc.setTextColor(31, 41, 55);
  doc.text(`TOTAL LOGS: ${total}`, margin + 6, y + 11);

  doc.setTextColor(22, 101, 52);
  doc.text(`APPROVED: ${approved}`, margin + statCol + 4, y + 11);

  doc.setTextColor(153, 27, 27);
  doc.text(`RETURNED: ${rejected}`, margin + statCol * 2 + 4, y + 11);

  doc.setTextColor(180, 83, 9);
  doc.text(`PENDING: ${pending}`, margin + statCol * 3 + 4, y + 11);

  y += 26;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(31, 41, 55);
  doc.text("Complete Submissions Breakdown:", margin, y);
  y += 8;

  entries.forEach((entry, idx) => {
    if (y > pageHeight - 65) {
      doc.addPage();
      drawHeaderBanner(doc, "Activity Summary (Continuation)");
      y = 42;
    }

    const isApproved = entry.status === "approved";
    const isRejected = entry.status === "rejected";
    let statusColor = [180, 83, 9];
    if (isApproved) statusColor = [22, 101, 52];
    if (isRejected) statusColor = [185, 28, 28];

    // Card Header
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(margin, y, contentWidth, 9, 1.5, 1.5, "FD");

    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.rect(margin, y, 3, 9, "F");

    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 24, 39);
    doc.text(`${idx + 1}. ${entry.title}`, margin + 6, y + 6);

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text((entry.status || "SUBMITTED").toUpperCase(), pageWidth - margin - 6, y + 6, { align: "right" });

    y += 12;

    // Body Text
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(55, 65, 81);

    const lines = doc.splitTextToSize(entry.body || "(No details provided)", contentWidth - 10);
    lines.forEach((line: string) => {
      if (y > pageHeight - 35) {
        doc.addPage();
        drawHeaderBanner(doc, "Activity Summary (Continuation)");
        y = 42;
      }
      doc.text(line, margin + 4, y);
      y += 4.5;
    });

    y += 2;

    // Supervisor Comment if present
    if (entry.review?.comment) {
      if (y > pageHeight - 35) {
        doc.addPage();
        drawHeaderBanner(doc, "Activity Summary (Continuation)");
        y = 42;
      }
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      const commentLines = doc.splitTextToSize(`Supervisor Feedback: "${entry.review.comment}"`, contentWidth - 10);
      commentLines.forEach((cline: string) => {
        doc.text(cline, margin + 4, y);
        y += 4.5;
      });
      y += 2;
    }

    y += 4;
  });

  addFooters(doc);

  const filename = `${title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
  doc.save(filename);
}
