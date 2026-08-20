import Link from "next/link";
import { getSupervisorContext } from "@/lib/supervisor-data";
import { SupervisorShell } from "@/components/supervisor/SupervisorShell";
import { SupervisorStatCard } from "@/components/supervisor/SupervisorStatCard";
import { QuickSearchCard } from "@/components/supervisor/QuickSearchCard";
import { StudentAvatar } from "@/components/supervisor/StudentAvatar";
import { EntryTypeBadge, type EntryType } from "@/components/supervisor/badges";
import { fullName, formatDateTime, formatDate } from "@/lib/supervisor";
import type { EntryStatus } from "@/components/dashboard/StatusBadge";
import {
  UsersIcon,
  ClipboardClockIcon,
  CheckCircleIcon,
  FilterIcon,
  DownloadIcon,
  AlertTriangleIcon,
  ChevronRightIcon,
} from "@/components/ui/icons";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function upcomingDeadlines() {
  const now = new Date();
  const midTerm = new Date(now.getFullYear(), now.getMonth() + 1, 0); // end of this month
  const signOff = new Date(now.getFullYear(), now.getMonth() + 1, 15); // 15th of next month
  return [
    { label: "Mid-Term Log Review", date: midTerm, tone: "#DC2626" },
    { label: "Supervisor Sign-off", date: signOff, tone: "#F59E0B" },
  ];
}

import { ExportPdfButton } from "@/components/ui/ExportPdfButton";
import type { PDFReportEntry } from "@/lib/pdf-export";
import { UserTips, type TipItem } from "@/components/ui/UserTips";

const SUPERVISOR_TIPS: TipItem[] = [
  {
    id: "sup-1",
    title: "Timely Entry Reviews",
    content: "Review pending student submissions daily to keep their industrial training logbooks up to date.",
  },
  {
    id: "sup-2",
    title: "Action Projection",
    content: "When returning an entry for revisions, include clear comments so the student knows what to update before resubmitting.",
  },
];

export default async function SupervisorDashboardPage() {
  const ctx = await getSupervisorContext();
  if (!ctx) return null;
  const { supabase, user, studentIds, shell } = ctx;

  // Pending submissions from mapped students
  const { data: pendingRaw } = studentIds.length
    ? await supabase
        .from("logbook_entries")
        .select("id, title, type, status, created_at, date, student_id")
        .in("student_id", studentIds)
        .eq("status", "submitted")
        .order("created_at", { ascending: false })
    : { data: [] };
  const pending = pendingRaw ?? [];

  // Reviews this week (by this supervisor)
  const weekAgo = new Date(Date.now() - WEEK_MS).toISOString();
  const { count: reviewsThisWeek } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("reviewer_id", user.id)
    .gte("reviewed_at", weekAgo);

  // Recent reviews (by this supervisor)
  const { data: recentReviewsRaw } = await supabase
    .from("reviews")
    .select("id, comment, reviewed_at, entry_id")
    .eq("reviewer_id", user.id)
    .order("reviewed_at", { ascending: false })
    .limit(3);
  const recentReviews = recentReviewsRaw ?? [];

  // Entries referenced by the recent reviews
  const reviewEntryIds = recentReviews.map((r) => r.entry_id as string);
  const { data: reviewEntriesRaw } = reviewEntryIds.length
    ? await supabase
        .from("logbook_entries")
        .select("id, title, type, status, student_id")
        .in("id", reviewEntryIds)
    : { data: [] };
  const reviewEntries = reviewEntriesRaw ?? [];

  // All student profiles we need to name
  const nameIds = Array.from(
    new Set([...studentIds, ...reviewEntries.map((e) => e.student_id as string)])
  );
  const { data: studentsRaw } = nameIds.length
    ? await supabase
        .from("profiles")
        .select("id, first_name, last_name, passport_photo_url")
        .in("id", nameIds)
    : { data: [] };
  const studentsById = new Map((studentsRaw ?? []).map((s) => [s.id, s]));
  const entriesById = new Map(reviewEntries.map((e) => [e.id, e]));

  const deadlines = upcomingDeadlines();

  const pdfEntries: PDFReportEntry[] = pending.map((e) => {
    const s = studentsById.get(e.student_id as string);
    return {
      id: e.id as string,
      title: `${fullName(s) || "Student"} — Pending Logbook Submission`,
      body: `Submitted Date: ${e.date || "N/A"}. Created: ${e.created_at || "N/A"}. Status: PENDING REVIEW`,
      date: (e.date as string) || (e.created_at as string) || "",
      createdAt: (e.created_at as string) || "",
      status: "submitted",
    };
  });

  return (
    <SupervisorShell userId={user.id} user={shell}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] sm:text-3xl">Supervisor Overview</h1>
          <p className="mt-1 text-sm text-[#666]">
            Manage and review student submissions for the current term.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-medium text-[#1A1A1A] hover:bg-gray-50">
            <FilterIcon className="h-4 w-4" />
            Filters
          </button>
          <ExportPdfButton
            entries={pdfEntries}
            title="Pending Submissions Overview Report"
            label="Export PDF"
          />
        </div>
      </div>

      {/* Stat cards */}
      <UserTips tips={SUPERVISOR_TIPS} className="mt-6" />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SupervisorStatCard
          icon={<UsersIcon className="h-5 w-5" />}
          label="Students Assigned"
          value={String(studentIds.length)}
        />
        <SupervisorStatCard
          icon={<ClipboardClockIcon className="h-5 w-5" />}
          iconBg="#FEE2E2"
          iconColor="#DC2626"
          label="Pending Reviews"
          value={String(pending.length)}
          dot={pending.length > 0}
        />
        <SupervisorStatCard
          icon={<CheckCircleIcon className="h-5 w-5" />}
          iconBg="#DBEAFE"
          iconColor="#2563EB"
          label="Reviews This Week"
          value={String(reviewsThisWeek ?? 0)}
        />
      </div>

      {/* Main grid */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* Pending submissions */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="text-base font-bold text-[#1A1A1A]">Pending Submissions</h2>
            <Link href="/supervisor/students" className="text-sm font-semibold text-primary hover:underline">
              View All
            </Link>
          </div>
          {pending.length === 0 ? (
            <div className="border-t border-[#E5E7EB] px-5 py-12 text-center text-sm text-[#666]">
              🎉 No submissions waiting for review.
            </div>
          ) : (
            <div className="overflow-x-auto border-t border-[#E5E7EB]">
              <table className="w-full min-w-[560px] text-left">
                <thead>
                  <tr className="bg-[#F9FAFB] text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                    <th className="px-5 py-3">Student Name</th>
                    <th className="px-5 py-3">Entry Type</th>
                    <th className="px-5 py-3">Date Submitted</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {pending.map((e) => {
                    const s = studentsById.get(e.student_id as string);
                    const name = fullName(s) || "Student";
                    return (
                      <tr key={e.id} className="text-sm">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <StudentAvatar name={name} url={s?.passport_photo_url} size={36} />
                            <span className="font-medium text-[#1A1A1A]">{name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <EntryTypeBadge type={e.type as EntryType} />
                        </td>
                        <td className="px-5 py-3.5 text-[#666]">{formatDateTime(e.created_at)}</td>
                        <td className="px-5 py-3.5 text-right">
                          <Link
                            href={`/supervisor/review/${e.id}`}
                            className="inline-flex rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-[#1A1A1A] hover:bg-[#e6ac00]"
                          >
                            Review
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <QuickSearchCard />

          <div className="rounded-2xl border border-dashed border-primary/50 bg-primary/5 p-5">
            <h3 className="text-base font-bold text-[#1A1A1A]">Term Deadlines</h3>
            <ul className="mt-4 space-y-4">
              {deadlines.map((d) => (
                <li key={d.label} className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: d.tone }} />
                  <div>
                    <p className="text-sm font-semibold text-[#1A1A1A]">{d.label}</p>
                    <p className="text-xs text-[#666]">{formatDate(d.date.toISOString())} • 23:59</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Recent review history */}
      <div className="mt-6 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-[#1A1A1A]">Review History (Recent)</h2>
        {recentReviews.length === 0 ? (
          <p className="mt-6 text-center text-sm text-[#666]">
            Your reviewed entries will appear here.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[#F3F4F6]">
            {recentReviews.map((r) => {
              const entry = entriesById.get(r.entry_id as string);
              const s = entry ? studentsById.get(entry.student_id as string) : null;
              const name = fullName(s) || "Student";
              const status = (entry?.status ?? "approved") as EntryStatus;
              const approved = status === "approved";
              const typeLabel =
                entry?.type === "weekly" ? "Weekly Log" : entry?.type === "monthly" ? "Monthly Log" : "Daily Log";
              return (
                <li key={r.id}>
                  <Link
                    href={entry ? `/supervisor/review/${entry.id}` : "/supervisor/history"}
                    className="flex items-center gap-4 py-3.5 transition-colors hover:bg-gray-50"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: approved ? "#DBEAFE" : "#FEE2E2",
                        color: approved ? "#2563EB" : "#DC2626",
                      }}
                    >
                      {approved ? <CheckCircleIcon className="h-5 w-5" /> : <AlertTriangleIcon className="h-5 w-5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#1A1A1A]">
                        {approved ? "Approved" : "Returned"} {typeLabel} — {name}
                      </p>
                      <p className="text-xs text-[#9CA3AF]">Reviewed on {formatDateTime(r.reviewed_at)}</p>
                    </div>
                    {r.comment && (
                      <p className="hidden max-w-[220px] truncate text-sm italic text-[#666] md:block">
                        &ldquo;{r.comment}&rdquo;
                      </p>
                    )}
                    <ChevronRightIcon className="h-4 w-4 shrink-0 text-[#9CA3AF]" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </SupervisorShell>
  );
}
