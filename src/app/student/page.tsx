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
    .select("id, date, title, objective, observations, status")
    .eq("student_id", user.id)
    .order("date", { ascending: false });

  const allEntries = entries ?? [];
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

  const recentActivity: RecentActivityRow[] = allEntries.slice(0, 2).map((e) => ({
    id: e.id,
    date: e.date,
    description: truncate(e.observations ?? e.objective ?? e.title, 40),
    status: e.status as EntryStatus,
  }));

  const fullName = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || "Student";

  return (
    <DashboardShell>
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
        <AddNewLogButton />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<BadgeCheckIcon />}
          label="Total Submission"
          value={String(totalSubmissions)}
        />
        <StatCard
          icon={<StopwatchIcon />}
          label="Internship Duration Status"
          value={durationWeeks !== null ? `${durationWeeks} weeks` : "—"}
          rightSlot={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-medium text-[#16A34A]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
              {isActive ? "Active" : "Inactive"}
            </span>
          }
        />
        <StatCard
          icon={<HourglassIcon />}
          label="Completion Progress"
          value={`${completionProgress}%`}
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
