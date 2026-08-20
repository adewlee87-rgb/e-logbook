import { ExportPdfButton } from "@/components/ui/ExportPdfButton";
import type { PDFReportEntry } from "@/lib/pdf-export";
import { SupervisorShell } from "@/components/supervisor/SupervisorShell";
import { HistoryTable, type HistoryRowVM } from "@/components/supervisor/HistoryTable";
import { SupervisorStatCard } from "@/components/supervisor/SupervisorStatCard";
import { fullName, formatDate } from "@/lib/supervisor";
import type { EntryType } from "@/components/supervisor/badges";
import type { EntryStatus } from "@/components/dashboard/StatusBadge";
import {
  FilterIcon,
  DownloadIcon,
  CalendarIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  StopwatchIcon,
} from "@/components/ui/icons";

const DAY_MS = 24 * 60 * 60 * 1000;

function pctDelta(thisVal: number, lastVal: number): { text: string; tone: "up" | "down" } {
  if (lastVal === 0) {
    return thisVal > 0 ? { text: "+100%", tone: "up" } : { text: "0%", tone: "up" };
  }
  const pct = Math.round(((thisVal - lastVal) / lastVal) * 100);
  return { text: `${pct >= 0 ? "+" : ""}${pct}%`, tone: pct >= 0 ? "up" : "down" };
}

export default async function ReviewHistoryPage({
  searchParams,
}: {
  searchParams: { student?: string };
}) {
  const ctx = await getSupervisorContext();
  if (!ctx) return null;
  const { supabase, user, studentIds, shell } = ctx;

  // Only allow filtering to a student actually assigned to this supervisor.
  const studentFilter =
    searchParams.student && studentIds.includes(searchParams.student) ? searchParams.student : null;

  // Names for every mapped student
  const { data: profilesRaw } = studentIds.length
    ? await supabase
        .from("profiles")
        .select("id, first_name, last_name, passport_photo_url")
        .in("id", studentIds)
    : { data: [] };
  const studentsById = new Map((profilesRaw ?? []).map((p) => [p.id, p]));

  // All entries for mapped students (drives both the table and the stat cards)
  const { data: entriesRaw } = studentIds.length
    ? await supabase
        .from("logbook_entries")
        .select("id, student_id, type, status, created_at, updated_at, date")
        .in("student_id", studentIds)
        .order("updated_at", { ascending: false })
    : { data: [] };
  const entries = entriesRaw ?? [];

  // ---- Table rows -----------------------------------------------------
  // Default view = reviewed entries (approved/returned). Per-student view
  // ("View Logs") shows every entry for that student, any status.
  const tableEntries = studentFilter
    ? entries.filter((e) => e.student_id === studentFilter)
    : entries.filter((e) => e.status === "approved" || e.status === "rejected");

  const rows: HistoryRowVM[] = tableEntries.map((e) => {
    const s = studentsById.get(e.student_id as string);
    const reviewed = e.status === "approved" || e.status === "rejected";
    return {
      id: e.id as string,
      studentName: fullName(s) || "Student",
      avatarUrl: s?.passport_photo_url ?? null,
      type: e.type as EntryType,
      status: e.status as EntryStatus,
      dateText: reviewed
        ? formatDate((e.updated_at as string) ?? (e.created_at as string))
        : e.status === "submitted"
        ? "Awaiting review"
        : "—",
    };
  });

  // Fetch reviews recorded by this supervisor
  const { data: allReviewsRaw } = await supabase
    .from("reviews")
    .select("id, entry_id, comment, reviewed_at")
    .eq("reviewer_id", user.id);
  const allReviews = allReviewsRaw ?? [];

  // ---- Stat cards (real month-over-month) -----------------------------
  const now = new Date();
  const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();

  const decidedAt = (e: (typeof entries)[number]) =>
    new Date((e.updated_at as string) ?? (e.created_at as string)).getTime();

  const approvals = entries.filter((e) => e.status === "approved");

  const approvalsThis = approvals.filter((e) => decidedAt(e) >= startThisMonth).length;
  const approvalsLast = approvals.filter(
    (e) => decidedAt(e) >= startLastMonth && decidedAt(e) < startThisMonth
  ).length;

  const reviewsThis = allReviews.filter(
    (r) => new Date(r.reviewed_at as string).getTime() >= startThisMonth
  ).length;
  const reviewsLast = allReviews.filter(
    (r) =>
      new Date(r.reviewed_at as string).getTime() >= startLastMonth &&
      new Date(r.reviewed_at as string).getTime() < startThisMonth
  ).length;

  // Corrections sent counts all returned/rejected review actions executed by the supervisor
  const currentlyRejectedThis = entries.filter(
    (e) => e.status === "rejected" && decidedAt(e) >= startThisMonth
  ).length;
  const currentlyRejectedLast = entries.filter(
    (e) =>
      e.status === "rejected" &&
      decidedAt(e) >= startLastMonth &&
      decidedAt(e) < startThisMonth
  ).length;

  const correctionsThis = Math.max(currentlyRejectedThis, reviewsThis - approvalsThis);
  const correctionsLast = Math.max(currentlyRejectedLast, reviewsLast - approvalsLast);

  const approvalDelta = pctDelta(approvalsThis, approvalsLast);
  const correctionDelta = pctDelta(correctionsThis, correctionsLast);

  // Review efficiency = avg days between submission and review action
  const avgDays =
    allReviews.length > 0
      ? allReviews.reduce((sum, r) => {
          const entry = entries.find((e) => e.id === r.entry_id);
          const created = entry
            ? new Date(entry.created_at as string).getTime()
            : new Date(r.reviewed_at as string).getTime();
          const reviewed = new Date(r.reviewed_at as string).getTime();
          return sum + Math.max(0, reviewed - created) / DAY_MS;
        }, 0) / allReviews.length
      : 0.0;

  const filteredStudentName = studentFilter
    ? fullName(studentsById.get(studentFilter)) || "this student"
    : null;

  const rangeLabel = `${formatDate(new Date(startThisMonth).toISOString())} – ${formatDate(
    now.toISOString()
  )}`;

  const pdfEntries: PDFReportEntry[] = tableEntries.map((e) => {
    const s = studentsById.get(e.student_id as string);
    return {
      id: e.id as string,
      title: `${fullName(s) || "Student"} — Logbook Entry`,
      body: `Entry Date: ${e.date || "N/A"}. Created: ${e.created_at || "N/A"}. Status: ${(e.status || "").toUpperCase()}`,
      date: (e.date as string) || (e.created_at as string) || "",
      createdAt: (e.created_at as string) || "",
      status: (e.status as string) || "submitted",
    };
  });

  return (
    <SupervisorShell userId={user.id} user={shell}>
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] sm:text-3xl">Review History</h1>
          <p className="mt-1 text-sm text-[#666]">
            {filteredStudentName
              ? `All logbook entries for ${filteredStudentName}.`
              : "A complete record of the entries you have reviewed."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-medium text-[#1A1A1A]">
            <CalendarIcon className="h-4 w-4 text-primary" />
            {rangeLabel}
          </span>
          <button className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-medium text-[#1A1A1A] hover:bg-gray-50">
            <FilterIcon className="h-4 w-4" />
            Filters
          </button>
          <ExportPdfButton
            entries={pdfEntries}
            title="Supervisor Review History Log"
            label="Export PDF"
          />
        </div>
      </div>

      {/* Table */}
      <div className="mt-6">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-16 text-center">
            <p className="text-sm text-[#666]">
              {filteredStudentName
                ? `${filteredStudentName} has no logbook entries yet.`
                : "You haven't reviewed any entries yet. Approved and returned entries will appear here."}
            </p>
          </div>
        ) : (
          <HistoryTable
            rows={rows}
            dateHeader={studentFilter ? "Date" : "Date Reviewed"}
          />
        )}
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SupervisorStatCard
          icon={<CheckCircleIcon className="h-5 w-5" />}
          iconBg="#DCFCE7"
          iconColor="#16A34A"
          label="Monthly Approvals"
          value={String(approvalsThis)}
          delta={approvalDelta.text}
          deltaTone={approvalDelta.tone}
        />
        <SupervisorStatCard
          icon={<AlertTriangleIcon className="h-5 w-5" />}
          iconBg="#FEE2E2"
          iconColor="#DC2626"
          label="Corrections Sent"
          value={String(correctionsThis)}
          delta={correctionDelta.text}
          deltaTone={correctionDelta.tone}
        />
        <SupervisorStatCard
          icon={<StopwatchIcon className="h-5 w-5" />}
          label="Review Efficiency"
          value={avgDays === 0 ? "0.0" : avgDays.toFixed(1)}
          hint="Days avg."
          highlight
        />
      </div>
    </SupervisorShell>
  );
}
