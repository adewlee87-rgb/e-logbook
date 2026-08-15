import { getSupervisorContext } from "@/lib/supervisor-data";
import { SupervisorShell } from "@/components/supervisor/SupervisorShell";
import { SupervisorSettings } from "@/components/supervisor/SupervisorSettings";
import { fullName } from "@/lib/supervisor";

export default async function SupervisorSettingsPage() {
  const ctx = await getSupervisorContext();
  if (!ctx) return null;
  const { user, profile, shell } = ctx;

  return (
    <SupervisorShell userId={user.id} user={shell}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A1A] sm:text-3xl">Account Settings</h1>
        <p className="mt-1 text-sm text-[#666]">
          Manage your profile, notification preferences, and account security.
        </p>
      </div>

      <SupervisorSettings
        userId={user.id}
        name={fullName(profile) || profile?.username || ""}
        email={profile?.email ?? user.email ?? ""}
        department={profile?.department ?? null}
        bio={profile?.bio ?? null}
        avatarUrl={profile?.passport_photo_url ?? null}
        prefs={{
          newSubmission: profile?.push_notifications_enabled ?? true,
          deadline: profile?.email_summaries_enabled ?? false,
          system: profile?.system_updates_enabled ?? true,
        }}
      />
    </SupervisorShell>
  );
}
