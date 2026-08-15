import { createClient } from "@/lib/supabase/server";
import { fullName, shortStudentId } from "@/lib/supervisor";

// Shared "who is the supervisor + which students are mapped to them" lookup.
// Every supervisor screen starts from here.
export async function getSupervisorContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, username, email, department, place_of_work, passport_photo_url, bio, created_at, push_notifications_enabled, email_summaries_enabled, system_updates_enabled")
    .eq("id", user.id)
    .single();

  const { data: links } = await supabase
    .from("supervisors_students")
    .select("student_id")
    .eq("supervisor_id", user.id);

  const studentIds = (links ?? []).map((l) => l.student_id as string);

  const name = fullName(profile) || profile?.username || "Supervisor";

  return {
    supabase,
    user,
    profile,
    studentIds,
    shell: {
      name,
      studentId: shortStudentId(user.id),
      avatarUrl: profile?.passport_photo_url ?? null,
    },
  };
}
