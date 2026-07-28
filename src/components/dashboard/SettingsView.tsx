"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AvatarUpload } from "@/components/dashboard/AvatarUpload";
import { Toggle } from "@/components/ui/Toggle";
import { Modal } from "@/components/ui/Modal";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Banner } from "@/components/ui/Banner";

interface SettingsViewProps {
  userId: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  joinedAt: string;
  isActive: boolean;
  pushNotificationsEnabled: boolean;
  emailSummariesEnabled: boolean;
}

function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
    setPassword("");
    setConfirmPassword("");
  }

  function handleClose() {
    setError(null);
    setSuccess(false);
    setPassword("");
    setConfirmPassword("");
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <h2 className="text-2xl font-bold text-[#1A1A1A]">Change Password</h2>
      <p className="mt-1 text-sm text-[#666]">Choose a new password for your account</p>

      {success && (
        <div className="mt-4">
          <Banner type="success" message="Password updated successfully." />
        </div>
      )}
      {error && (
        <div className="mt-4">
          <Banner type="error" message={error} />
        </div>
      )}

      <div className="mt-6 space-y-4">
        <PasswordInput
          label="New Password"
          placeholder="Enter new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
        />
        <PasswordInput
          label="Confirm Password"
          placeholder="Re-enter new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          minLength={8}
        />
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={handleClose}
          className="w-full rounded-full border border-[#E5E7EB] py-3 text-sm font-semibold text-[#666] hover:bg-gray-50 sm:flex-1"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-[#1A1A1A] hover:bg-[#e6ac00] disabled:opacity-50 sm:flex-1"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </Modal>
  );
}

export function SettingsView({
  userId,
  displayName,
  email,
  avatarUrl,
  joinedAt,
  isActive,
  pushNotificationsEnabled,
  emailSummariesEnabled,
}: SettingsViewProps) {
  const [pushEnabled, setPushEnabled] = useState(pushNotificationsEnabled);
  const [emailEnabled, setEmailEnabled] = useState(emailSummariesEnabled);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  async function updatePref(field: "push_notifications_enabled" | "email_summaries_enabled", value: boolean) {
    const supabase = createClient();
    await supabase.from("profiles").update({ [field]: value }).eq("id", userId);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1A1A1A]">Settings</h1>
      <p className="mt-1 text-sm text-[#666]">Manage your account preferences</p>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_2fr]">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 text-center">
          <div className="flex justify-center">
            <AvatarUpload userId={userId} name={displayName} avatarUrl={avatarUrl} size={112} />
          </div>
          <h3 className="mt-4 text-lg font-bold text-[#1A1A1A]">{displayName}</h3>
          <p className="text-sm text-[#9CA3AF]">{email}</p>

          <div className="mt-6 space-y-3 text-left text-sm">
            <div className="flex items-center justify-between border-t border-[#E5E7EB] pt-3">
              <span className="text-[#666]">Status</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-medium text-[#16A34A]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-[#E5E7EB] pt-3">
              <span className="text-[#666]">Joined</span>
              <span className="text-[#1A1A1A]">
                {new Date(joinedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-[#1A1A1A]">Notification</h3>
            <div className="mt-4 divide-y divide-[#E5E7EB] rounded-2xl border border-[#E5E7EB] bg-white">
              <div className="flex items-center justify-between p-5">
                <div>
                  <p className="font-medium text-[#1A1A1A]">Push Notifications</p>
                  <p className="text-sm text-[#666]">Receive alerts for events</p>
                </div>
                <Toggle
                  checked={pushEnabled}
                  onChange={(value) => {
                    setPushEnabled(value);
                    updatePref("push_notifications_enabled", value);
                  }}
                />
              </div>
              <div className="flex items-center justify-between p-5">
                <div>
                  <p className="font-medium text-[#1A1A1A]">Email Summaries</p>
                  <p className="text-sm text-[#666]">Weekly and monthly reports</p>
                </div>
                <Toggle
                  checked={emailEnabled}
                  onChange={(value) => {
                    setEmailEnabled(value);
                    updatePref("email_summaries_enabled", value);
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-[#1A1A1A]">Change Password</h3>
            <div className="mt-4 flex flex-col items-start justify-between gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-5 sm:flex-row sm:items-center">
              <div>
                <p className="font-medium text-[#1A1A1A]">Account Details</p>
                <p className="text-sm text-[#666]">Keep your account secure</p>
              </div>
              <button
                onClick={() => setPasswordModalOpen(true)}
                className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-[#1A1A1A] hover:bg-[#e6ac00]"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>

      <ChangePasswordModal open={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} />
    </div>
  );
}
