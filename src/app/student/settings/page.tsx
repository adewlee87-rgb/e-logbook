import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Breadcrumb } from "@/components/dashboard/Breadcrumb";
import { SettingsView } from "@/components/dashboard/SettingsView";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "first_name, last_name, username, email, department, passport_photo_url, created_at, internship_start_date, internship_end_date, push_notifications_enabled, email_summaries_enabled"
    )
    .eq("id", user.id)
    .single();

  const fullName = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();
  const displayName = profile?.username || fullName || "Student";

  let isActive = false;
  if (profile?.internship_start_date && profile?.internship_end_date) {
    const today = new Date();
    const start = new Date(profile.internship_start_date);
    const end = new Date(profile.internship_end_date);
    isActive = today >= start && today <= end;
  }

  return (
    <DashboardShell>
      <Breadcrumb current="/student/settings" />

      <div className="mt-8">
        <SettingsView
          userId={user.id}
          displayName={displayName}
          email={profile?.email ?? user.email ?? ""}
          department={profile?.department ?? ""}
          avatarUrl={profile?.passport_photo_url ?? null}
          joinedAt={profile?.created_at ?? user.created_at}
          isActive={isActive}
          pushNotificationsEnabled={profile?.push_notifications_enabled ?? true}
          emailSummariesEnabled={profile?.email_summaries_enabled ?? false}
        />
      </div>
    </DashboardShell>
  );
}
