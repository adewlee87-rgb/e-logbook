import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/SignOutButton";

export default async function SupervisorDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("first_name").eq("id", user.id).single()
    : { data: null };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold text-[#1A1A1A]">
        Welcome, {profile?.first_name ?? "supervisor"}
      </h1>
      <p className="text-sm text-[#666]">Supervisor dashboard — coming soon.</p>
      <SignOutButton />
    </main>
  );
}
