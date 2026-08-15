"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AvatarUpload } from "@/components/dashboard/AvatarUpload";
import { Toggle } from "@/components/ui/Toggle";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Banner } from "@/components/ui/Banner";
import { ChevronDownIcon, ShieldIcon, LockIcon } from "@/components/ui/icons";

const DEPARTMENTS = [
  "Computer Science",
  "Electrical/Electronic Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Information Technology",
  "Accounting",
  "Business Administration",
  "Mass Communication",
  "Human Resources",
  "Operations",
];

interface NotifPrefs {
  newSubmission: boolean;
  deadline: boolean;
  system: boolean;
}

interface SupervisorSettingsProps {
  userId: string;
  name: string;
  email: string;
  department: string | null;
  bio: string | null;
  avatarUrl: string | null;
  prefs: NotifPrefs;
}

export function SupervisorSettings({
  userId,
  name,
  email,
  department,
  bio,
  avatarUrl,
  prefs,
}: SupervisorSettingsProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"profile" | "notifications">("profile");

  // Profile form
  const [fullName, setFullName] = useState(name);
  const [dept, setDept] = useState(department ?? "");
  const [bioText, setBioText] = useState(bio ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Notifications
  const [newSubmission, setNewSubmission] = useState(prefs.newSubmission);
  const [deadline, setDeadline] = useState(prefs.deadline);
  const [system, setSystem] = useState(prefs.system);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsMsg, setPrefsMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [pwOpen, setPwOpen] = useState(false);

  const deptOptions = dept && !DEPARTMENTS.includes(dept) ? [dept, ...DEPARTMENTS] : DEPARTMENTS;

  async function saveProfile() {
    setProfileMsg(null);
    const trimmed = fullName.trim();
    if (!trimmed) {
      setProfileMsg({ type: "error", text: "Please enter your full name." });
      return;
    }
    const [first, ...rest] = trimmed.split(/\s+/);
    setSavingProfile(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: first,
        last_name: rest.join(" "),
        department: dept || null,
        bio: bioText.trim() || null,
      })
      .eq("id", userId);
    setSavingProfile(false);
    if (error) {
      setProfileMsg({ type: "error", text: error.message || "Could not save your profile." });
      return;
    }
    setProfileMsg({ type: "success", text: "Profile updated successfully." });
    router.refresh();
  }

  async function savePrefs() {
    setPrefsMsg(null);
    setSavingPrefs(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        push_notifications_enabled: newSubmission,
        email_summaries_enabled: deadline,
        system_updates_enabled: system,
      })
      .eq("id", userId);
    setSavingPrefs(false);
    if (error) {
      setPrefsMsg({ type: "error", text: error.message || "Could not save your preferences." });
      return;
    }
    setPrefsMsg({ type: "success", text: "Notification preferences saved." });
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      {/* Left: tabbed settings card */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-[#F3F4F6] px-5 pt-4">
          <TabButton active={tab === "profile"} onClick={() => setTab("profile")}>
            Profile Settings
          </TabButton>
          <TabButton active={tab === "notifications"} onClick={() => setTab("notifications")}>
            Notifications
          </TabButton>
        </div>

        {tab === "profile" ? (
          <div className="p-5 sm:p-6">
            {profileMsg && (
              <div className="mb-5">
                <Banner type={profileMsg.type} message={profileMsg.text} />
              </div>
            )}

            <div className="flex items-center gap-5">
              <AvatarUpload
                userId={userId}
                name={fullName || name}
                avatarUrl={avatarUrl}
                size={88}
                onUploaded={() => router.refresh()}
              />
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A]">Profile Photo</p>
                <p className="text-xs text-[#9CA3AF]">PNG or JPG. Click the camera to upload.</p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <Field label="Full Name">
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm text-[#1A1A1A] focus:border-2 focus:border-primary focus:outline-none"
                />
              </Field>

              <Field label="Email Address" hint="Your email is your login and can't be changed here.">
                <input
                  value={email}
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3.5 py-2.5 text-sm text-[#9CA3AF]"
                />
              </Field>

              <Field label="Department">
                <div className="relative">
                  <select
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2.5 pr-9 text-sm text-[#1A1A1A] focus:border-2 focus:border-primary focus:outline-none"
                  >
                    <option value="">Select a department</option>
                    {deptOptions.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
                    <ChevronDownIcon className="h-4 w-4" />
                  </span>
                </div>
              </Field>

              <Field label="Professional Bio">
                <textarea
                  value={bioText}
                  onChange={(e) => setBioText(e.target.value)}
                  rows={4}
                  placeholder="Tell students a little about your professional background..."
                  className="w-full resize-none rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-2 focus:border-primary focus:outline-none"
                />
              </Field>
            </div>

            <div className="mt-6 sm:max-w-[200px]">
              <Button onClick={saveProfile} loading={savingProfile}>
                Save Profile
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-5 sm:p-6">
            {prefsMsg && (
              <div className="mb-5">
                <Banner type={prefsMsg.type} message={prefsMsg.text} />
              </div>
            )}
            <div className="divide-y divide-[#F3F4F6]">
              <PrefRow
                title="New Submission Alerts"
                desc="Get notified when a student submits a new log for review."
                checked={newSubmission}
                onChange={setNewSubmission}
              />
              <PrefRow
                title="Deadline Reminders"
                desc="Receive reminders before term review deadlines."
                checked={deadline}
                onChange={setDeadline}
              />
              <PrefRow
                title="System Updates"
                desc="Occasional product news and maintenance notices."
                checked={system}
                onChange={setSystem}
              />
            </div>
            <div className="mt-6 sm:max-w-[220px]">
              <Button onClick={savePrefs} loading={savingPrefs}>
                Save Preferences
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Right: security */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldIcon className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-[#1A1A1A]">Security</h3>
          </div>

          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A]">Change Password</p>
                <p className="text-xs text-[#9CA3AF]">Update your account password.</p>
              </div>
              <button
                onClick={() => setPwOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2 text-xs font-semibold text-[#1A1A1A] hover:bg-gray-50"
              >
                <LockIcon className="h-3.5 w-3.5" />
                Change
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-[#F3F4F6] pt-4">
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A]">Two-Factor Authentication</p>
                <p className="text-xs text-[#9CA3AF]">Add an extra layer of security.</p>
              </div>
              <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-semibold text-[#6B7280]">
                Disabled
              </span>
            </div>
          </div>
        </div>
      </div>

      <ChangePasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-3 text-sm font-semibold transition-colors ${
        active ? "text-[#1A1A1A]" : "text-[#9CA3AF] hover:text-[#4B5563]"
      }`}
    >
      {children}
      {active && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary" />}
    </button>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[#1A1A1A]">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-[#9CA3AF]">{hint}</p>}
    </div>
  );
}

function PrefRow({
  title,
  desc,
  checked,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div>
        <p className="text-sm font-semibold text-[#1A1A1A]">{title}</p>
        <p className="text-xs text-[#9CA3AF]">{desc}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message || "Could not update your password.");
      return;
    }
    setSuccess(true);
    setPassword("");
    setConfirm("");
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1200);
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="max-w-md">
        <h2 className="text-xl font-bold text-[#1A1A1A]">Change Password</h2>
        <p className="mt-1 text-sm text-[#666]">Choose a new password for your account.</p>

        {error && (
          <div className="mt-4">
            <Banner type="error" message={error} />
          </div>
        )}
        {success && (
          <div className="mt-4">
            <Banner type="success" message="Password updated successfully." />
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#1A1A1A]">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm text-[#1A1A1A] focus:border-2 focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#1A1A1A]">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm text-[#1A1A1A] focus:border-2 focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-[#E5E7EB] bg-white py-3 text-sm font-semibold text-[#1A1A1A] hover:bg-gray-50"
            >
              Cancel
            </button>
            <div className="flex-1">
              <Button type="submit" loading={loading}>
                Update Password
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
