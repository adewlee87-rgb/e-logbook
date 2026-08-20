import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Breadcrumb } from "@/components/dashboard/Breadcrumb";
import { AddNewLogButton } from "@/components/dashboard/AddNewLogButton";
import { ReportView } from "@/components/dashboard/ReportView";
import type { ReportEntry } from "@/components/dashboard/ReportCard";
import type { EntryStatus } from "@/components/dashboard/StatusBadge";

interface EntryMediaRow {
  file_url: string;
  file_type: string;
}

interface ReviewRow {
  id: string;
  comment: string | null;
  reviewed_at: string;
  reviewer_role: string;
}

export default async function ReportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: entries } = await supabase
    .from("logbook_entries")
    .select(
      `id, title, date, objective, observations, status, created_at, 
       entry_media(file_url, file_type),
       reviews(id, comment, reviewed_at, reviewer_role)`
    )
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  const todayKey = new Date().toISOString().slice(0, 10);
  const alreadyLoggedToday = (entries ?? []).some((e) => e.date === todayKey);

  const reportEntries: ReportEntry[] = (entries ?? []).map((e) => {
    const media = (e.entry_media ?? []) as unknown as EntryMediaRow[];
    const image = media.find((m) => m.file_type?.startsWith("image/"));
    
    const rawReviews = (e.reviews ?? []) as unknown as ReviewRow[];
    const sortedReviews = [...rawReviews].sort(
      (a, b) => new Date(b.reviewed_at).getTime() - new Date(a.reviewed_at).getTime()
    );
    const latestReview = sortedReviews[0] ?? null;

    return {
      id: e.id,
      title: e.title,
      body: e.observations ?? e.objective ?? "",
      date: e.date,
      createdAt: e.created_at,
      imageUrl: image?.file_url ?? null,
      status: e.status as EntryStatus,
      review: latestReview
        ? {
            id: latestReview.id,
            comment: latestReview.comment,
            reviewedAt: latestReview.reviewed_at,
            reviewerRole: latestReview.reviewer_role,
          }
        : null,
    };
  });

  return (
    <DashboardShell>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Breadcrumb current="/student/report" />
        <AddNewLogButton alreadyLoggedToday={alreadyLoggedToday} />
      </div>

      <div className="mt-8">
        <Suspense fallback={null}>
          <ReportView entries={reportEntries} />
        </Suspense>
      </div>
    </DashboardShell>
  );
}
