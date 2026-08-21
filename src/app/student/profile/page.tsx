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

  let profile: {
    first_name?: string | null;
    last_name?: string | null;
    username?: string | null;
    email?: string | null;
    phone_number?: string | null;
    place_of_work?: string | null;
    internship_start_date?: string | null;
    internship_end_date?: string | null;
    passport_photo_url?: string | null;
  } | null = null;

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "first_name, last_name, username, email, phone_number, place_of_work, internship_start_date, internship_end_date, passport_photo_url"
    )
    .eq("id", user.id)
    .single();

  if (error && error.message?.includes("phone_number")) {
    const { data: fallbackData } = await supabase
      .from("profiles")
      .select(
        "first_name, last_name, username, email, place_of_work, internship_start_date, internship_end_date, passport_photo_url"
      )
      .eq("id", user.id)
      .single();
    profile = fallbackData;
  } else {
    profile = data;
  }

  const metaFirstName = (user.user_metadata?.first_name as string) ?? "";
  const metaLastName = (user.user_metadata?.last_name as string) ?? "";

  const firstName = profile?.first_name || metaFirstName;
  const lastName = profile?.last_name || metaLastName;
  const fullName = `${firstName} ${lastName}`.trim();

  return (
    <DashboardShell>
      <Breadcrumb current="/student/profile" />

      <div className="mt-8">
        <ProfileForm
          userId={user.id}
          fullName={fullName}
          username={profile?.username ?? ""}
          email={profile?.email ?? user.email ?? ""}
          phoneNumber={profile?.phone_number ?? ""}
          placeOfWork={profile?.place_of_work ?? ""}
          startDate={profile?.internship_start_date ?? null}
          endDate={profile?.internship_end_date ?? null}
          avatarUrl={profile?.passport_photo_url ?? null}
        />
      </div>
    </DashboardShell>
  );
}
