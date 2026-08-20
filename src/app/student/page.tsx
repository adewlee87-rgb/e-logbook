import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Topbar } from "@/components/dashboard/Topbar";
import { StatCard } from "@/components/dashboard/StatCard";
import { AddNewLogButton } from "@/components/dashboard/AddNewLogButton";
import { RecentActivityTable, type RecentActivityRow } from "@/components/dashboard/RecentActivityTable";
import { Tracker } from "@/components/dashboard/Tracker";
import {
  BadgeCheckIcon,
  CalendarCheckIcon,
  HourglassIcon,
  StopwatchIcon,
} from "@/components/ui/icons";
import type { EntryStatus } from "@/components/dashboard/StatusBadge";

const DAY_MS = 24 * 60 * 60 * 1000;

function truncate(text: string | null, length: number) {
  if (!text) return "";
  return text.length > length ? `${text.slice(0, length).trim()}...` : text;
}

import { UserTips } from "@/components/ui/UserTips";

export default async function StudentDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "first_name, last_name, email, passport_photo_url, internship_start_date, internship_end_date"
    )
    .eq("id", user.id)
    .single();

  const { data: entries } = await supabase
    .from("logbook_entries")
    .select(
      `id, date, title, objective, observations, status,
       reviews(id, comment, reviewed_at, reviewer_role)`
    )
    .eq("student_id", user.id)
    .order("date", { ascending: false });

  const allEntries = entries ?? [];
  const todayKey = new Date().toISOString().slice(0, 10);
  const alreadyLoggedToday = allEntries.some((e) => e.date === todayKey);
  const submittedEntries = allEntries.filter((e) => e.status !== "draft");

  const totalSubmissions = submittedEntries.length;
  const activeDates = Array.from(new Set(submittedEntries.map((e) => e.date)));
  const daysCompleted = activeDates.length;

  const startDate = profile?.internship_start_date ?? null;
  const endDate = profile?.internship_end_date ?? null;

  let durationWeeks: number | null = null;
  let completionProgress = 0;
  let isActive = false;

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    durationWeeks = Math.round((end.getTime() - start.getTime()) / (DAY_MS * 7));
    const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / DAY_MS));
    const elapsedDays = Math.min(
      totalDays,
      Math.max(0, Math.round((today.getTime() - start.getTime()) / DAY_MS))
    );
    completionProgress = Math.round((elapsedDays / totalDays) * 100);
    isActive = today >= start && today <= end;
  }

  const recentActivity: RecentActivityRow[] = allEntries.slice(0, 2).map((e) => {
    const rawReviews = (e.reviews ?? []) as unknown as { comment: string | null; reviewed_at: string }[];
    const latestReview = [...rawReviews].sort(
      (a, b) => new Date(b.reviewed_at).getTime() - new Date(a.reviewed_at).getTime()
    )[0] ?? null;

    return {
      id: e.id,
      date: e.date,
      description: truncate(e.observations ?? e.objective ?? e.title, 40),
      status: e.status as EntryStatus,
      reviewComment: latestReview?.comment ?? null,
    };
  });

  const fullName = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || "Student";

  return (
    <DashboardShell profileIncomplete={!startDate || !endDate}>
      <Topbar
        title="Dashboard"
        userId={user.id}
        user={{
          name: fullName,
          email: profile?.email ?? user.email ?? "",
          avatarUrl: profile?.passport_photo_url,
        }}
      />

      <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[#666]">Welcome Back,</p>
          <h2 className="text-3xl font-bold text-[#1A1A1A]">
            {profile?.first_name ?? "Student"}
          </h2>
        </div>
        <AddNewLogButton alreadyLoggedToday={alreadyLoggedToday} />
      </div>

      <UserTips className="mt-6" />

      {(!startDate || !endDate) && (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border-2 border-[#F59E0B] bg-gradient-to-r from-[#FFFBEB] via-[#FEF3D6] to-[#FFFBEB] p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F59E0B] text-white shadow-sm">
              <StopwatchIcon className="h-6 w-6" />
            </span>
            <div>
              <h4 className="text-base font-extrabold text-[#92400E]">
                Action Required: Complete Your Profile
              </h4>
              <p className="mt-0.5 text-xs text-[#B45309] sm:text-sm">
                Set your Internship Start &amp; End dates in your profile so the dashboard can compute your live completion progress %, active duration, and tracker calendar.
              </p>
            </div>
          </div>

          <Link
            href="/student/profile"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#D97706] px-5 py-2.5 text-xs font-extrabold text-white shadow transition-all hover:bg-[#B45309]"
          >
            Complete profile Now <span className="animate-bounce inline-block text-sm">→</span>
          </Link>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<BadgeCheckIcon />}
          label="Total Submission"
          value={String(totalSubmissions)}
        />
        <StatCard
          icon={<StopwatchIcon />}
          label="Internship Duration Status"
          value={durationWeeks !== null ? `${durationWeeks} weeks` : "Set Dates"}
          rightSlot={
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${isActive
                ? "bg-[#DCFCE7] text-[#16A34A]"
                : "bg-[#FEF3D6] text-[#B45309]"
                }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-[#16A34A]" : "bg-[#B45309]"
                  }`}
              />
              {isActive ? "Active" : startDate ? "Inactive" : "Pending Profile"}
            </span>
          }
        />
        <StatCard
          icon={<HourglassIcon />}
          label="Completion Progress"
          value={startDate && endDate ? `${completionProgress}%` : "0% (Setup)"}
        />
        <StatCard
          icon={<CalendarCheckIcon />}
          label="Days Completed"
          value={`${daysCompleted} days`}
        />
      </div>

      <div className="mt-10 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-bold text-[#1A1A1A]">Recent Activity</h3>
          <p className="mt-1 text-sm text-[#666]">
            Manage and track your latest logbook submission
          </p>
        </div>
        <Link href="/student/report" className="text-sm font-medium text-[#1A1A1A] hover:underline">
          See more
        </Link>
      </div>

      <div className="mt-4">
        <RecentActivityTable rows={recentActivity} />
      </div>

      <div className="mt-10">
        <h3 className="text-xl font-bold text-[#1A1A1A]">Tracker</h3>
        <p className="mt-1 text-sm text-[#666]">
          Here you can track your active status per day, week &amp; month
        </p>
        <div className="mt-4">
          <Tracker startDate={startDate} endDate={endDate} activeDates={activeDates} />
        </div>
      </div>
    </DashboardShell>
  );
}
