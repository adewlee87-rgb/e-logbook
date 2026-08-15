import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupervisorContext } from "@/lib/supervisor-data";
import { SupervisorShell } from "@/components/supervisor/SupervisorShell";
import { ReviewActionPanel } from "@/components/supervisor/ReviewActionPanel";
import { StudentAvatar } from "@/components/supervisor/StudentAvatar";
import { EntryTypeBadge, ReviewStatusBadge, type EntryType } from "@/components/supervisor/badges";
import { fullName, formatDate, formatDateTime } from "@/lib/supervisor";
import type { EntryStatus } from "@/components/dashboard/StatusBadge";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  TargetIcon,
  ImageIcon,
  BadgeCheckIcon,
} from "@/components/ui/icons";

const STATUS_DOT: Record<EntryStatus, string> = {
  draft: "#9CA3AF",
  submitted: "#F59E0B",
  approved: "#16A34A",
  rejected: "#DC2626",
};

export default async function ReviewDetailPage({ params }: { params: { id: string } }) {
  const ctx = await getSupervisorContext();
  if (!ctx) return null;
  const { supabase, user, studentIds, shell } = ctx;

  const { data: entry } = await supabase
    .from("logbook_entries")
    .select("id, student_id, type, title, date, objective, observations, status, created_at, updated_at")
    .eq("id", params.id)
    .single();

  // Guard: entry must exist AND belong to a student this supervisor is assigned to.
  if (!entry || !studentIds.includes(entry.student_id as string)) notFound();

  const { data: student } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, passport_photo_url, place_of_work, department")
    .eq("id", entry.student_id)
    .single();
  const studentName = fullName(student) || "Student";

  const { data: mediaRaw } = await supabase
    .from("entry_media")
    .select("id, file_url, file_type")
    .eq("entry_id", entry.id);
  const media = mediaRaw ?? [];

  // This student's recent entries → timeline
  const { data: timelineRaw } = await supabase
    .from("logbook_entries")
    .select("id, title, type, status, date, created_at")
    .eq("student_id", entry.student_id)
    .order("date", { ascending: false })
    .limit(6);
  const timeline = timelineRaw ?? [];

  // Quick stats for this student
  const { count: totalCount } = await supabase
    .from("logbook_entries")
    .select("id", { count: "exact", head: true })
    .eq("student_id", entry.student_id);
  const { count: approvedCount } = await supabase
    .from("logbook_entries")
    .select("id", { count: "exact", head: true })
    .eq("student_id", entry.student_id)
    .eq("status", "approved");
  const compliance =
    totalCount && totalCount > 0 ? Math.round(((approvedCount ?? 0) / totalCount) * 100) : 0;

  // Latest supervisor comment (prefill the feedback box)
  const { data: lastReview } = await supabase
    .from("reviews")
    .select("comment, reviewer_role, reviewed_at")
    .eq("entry_id", entry.id)
    .eq("reviewer_role", "supervisor")
    .order("reviewed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const status = entry.status as EntryStatus;
  const hasObjective = !!(entry.objective && entry.objective.trim());

  return (
    <SupervisorShell userId={user.id} user={shell}>
      <Link
        href="/supervisor"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#666] hover:text-[#1A1A1A]"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* Main column */}
        <div className="space-y-6">
          {/* Student header card */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <StudentAvatar name={studentName} url={student?.passport_photo_url} size={56} />
                <div>
                  <h1 className="text-lg font-bold text-[#1A1A1A]">{studentName}</h1>
                  <p className="text-sm text-[#9CA3AF]">
                    {student?.place_of_work || student?.department || "Industrial Training"}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <EntryTypeBadge type={entry.type as EntryType} uppercase />
                <ReviewStatusBadge status={status} withDot />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-[#F3F4F6] pt-4 text-sm">
              <span className="text-[#666]">
                Entry date: <span className="font-medium text-[#1A1A1A]">{formatDate(entry.date)}</span>
              </span>
              <span className="text-[#666]">
                Submitted: <span className="font-medium text-[#1A1A1A]">{formatDateTime(entry.created_at)}</span>
              </span>
            </div>
          </div>

          {/* Log content */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-[#1A1A1A]">{entry.title}</h2>

            {/* Tasks completed / observations */}
            <section className="mt-5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#DCFCE7] text-[#16A34A]">
                  <CheckCircleIcon className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-bold text-[#1A1A1A]">Tasks Completed &amp; Observations</h3>
              </div>
              {entry.observations && entry.observations.trim() ? (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#374151]">
                  {entry.observations}
                </p>
              ) : (
                <p className="mt-3 text-sm italic text-[#9CA3AF]">
                  The student did not add written observations for this entry.
                </p>
              )}
            </section>

            {/* Objective (only if present) */}
            {hasObjective && (
              <section className="mt-6">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FEF3C7] text-[#B45309]">
                    <TargetIcon className="h-4 w-4" />
                  </span>
                  <h3 className="text-sm font-bold text-[#1A1A1A]">Objective</h3>
                </div>
                <blockquote className="mt-3 rounded-r-lg border-l-4 border-primary bg-[#FFFBEB] px-4 py-3 text-sm italic leading-relaxed text-[#374151]">
                  {entry.objective}
                </blockquote>
              </section>
            )}

            {/* Evidence */}
            {media.length > 0 && (
              <section className="mt-6">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#DBEAFE] text-[#2563EB]">
                    <ImageIcon className="h-4 w-4" />
                  </span>
                  <h3 className="text-sm font-bold text-[#1A1A1A]">Attached Evidence</h3>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {media.map((m) =>
                    m.file_type?.startsWith("video") ? (
                      <video
                        key={m.id}
                        src={m.file_url}
                        controls
                        className="h-32 w-full rounded-lg border border-[#E5E7EB] object-cover"
                      />
                    ) : (
                      <a
                        key={m.id}
                        href={m.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block overflow-hidden rounded-lg border border-[#E5E7EB]"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.file_url} alt="Entry evidence" className="h-32 w-full object-cover" />
                      </a>
                    )
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Feedback + approve/reject */}
          <ReviewActionPanel
            entryId={entry.id as string}
            initialStatus={status}
            initialFeedback={lastReview?.comment ?? ""}
          />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Entry history timeline */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-[#1A1A1A]">Entry History</h3>
            {timeline.length === 0 ? (
              <p className="mt-4 text-sm text-[#9CA3AF]">No other entries yet.</p>
            ) : (
              <ul className="mt-4 space-y-1">
                {timeline.map((t, i) => {
                  const isCurrent = t.id === entry.id;
                  return (
                    <li key={t.id} className="relative flex gap-3 pb-4 last:pb-0">
                      {/* connector line */}
                      {i < timeline.length - 1 && (
                        <span className="absolute left-[5px] top-4 h-full w-px bg-[#E5E7EB]" />
                      )}
                      <span
                        className="relative mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-white"
                        style={{ backgroundColor: STATUS_DOT[t.status as EntryStatus] }}
                      />
                      <Link
                        href={`/supervisor/review/${t.id}`}
                        className={`min-w-0 flex-1 rounded-lg px-2 py-1 -mt-0.5 transition-colors hover:bg-gray-50 ${
                          isCurrent ? "bg-[#FEF3D6]" : ""
                        }`}
                      >
                        <p className="truncate text-sm font-medium text-[#1A1A1A]">{t.title}</p>
                        <p className="text-xs text-[#9CA3AF]">
                          {formatDate(t.date)} • {t.status === "submitted" ? "Pending" : t.status === "rejected" ? "Returned" : t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Quick stats */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-[#1A1A1A]">Quick Stats</h3>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-[#666]">
                  <BadgeCheckIcon className="h-4 w-4 text-[#16A34A]" />
                  Logs Approved
                </span>
                <span className="text-sm font-bold text-[#1A1A1A]">
                  {approvedCount ?? 0}
                  <span className="font-normal text-[#9CA3AF]"> / {totalCount ?? 0}</span>
                </span>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#666]">Compliance</span>
                  <span className="font-bold text-[#1A1A1A]">{compliance}%</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${compliance}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SupervisorShell>
  );
}
