import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Breadcrumb } from "@/components/dashboard/Breadcrumb";
import { ProfileForm } from "@/components/dashboard/ProfileForm";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "first_name, last_name, username, email, place_of_work, internship_start_date, internship_end_date, passport_photo_url"
    )
    .eq("id", user.id)
    .single();

  const fullName = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();

  return (
    <DashboardShell>
      <Breadcrumb current="/student/profile" />

      <div className="mt-8">
        <ProfileForm
          userId={user.id}
          fullName={fullName}
          username={profile?.username ?? ""}
          email={profile?.email ?? user.email ?? ""}
          placeOfWork={profile?.place_of_work ?? ""}
          startDate={profile?.internship_start_date ?? null}
          endDate={profile?.internship_end_date ?? null}
          avatarUrl={profile?.passport_photo_url ?? null}
        />
      </div>
    </DashboardShell>
  );
}
