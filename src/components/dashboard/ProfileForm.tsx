"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AvatarUpload } from "@/components/dashboard/AvatarUpload";
import { Banner } from "@/components/ui/Banner";

interface ProfileFormProps {
  userId: string;
  fullName: string;
  username: string;
  email: string;
  phoneNumber?: string;
  placeOfWork: string;
  startDate: string | null;
  endDate: string | null;
  avatarUrl: string | null;
}

import { validateDateRange } from "@/lib/validation";

export function ProfileForm({
  userId,
  fullName: initialFullName,
  username: initialUsername,
  email,
  phoneNumber: initialPhoneNumber,
  placeOfWork: initialPlaceOfWork,
  startDate: initialStartDate,
  endDate: initialEndDate,
  avatarUrl,
}: ProfileFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialFullName);
  const [username, setUsername] = useState(initialUsername);
  const [phoneNumber, setPhoneNumber] = useState((initialPhoneNumber ?? "").replace(/\D/g, ""));
  const [placeOfWork, setPlaceOfWork] = useState(initialPlaceOfWork);
  const [startDate, setStartDate] = useState(initialStartDate ?? "");
  const [endDate, setEndDate] = useState(initialEndDate ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    setError(null);
    setSuccess(false);

    if (startDate || endDate) {
      if (!startDate) {
        setError("Please select a start date.");
        return;
      }
      if (!endDate) {
        setError("Please select an end date.");
        return;
      }
      const dateVal = validateDateRange(startDate, endDate);
      if (!dateVal.isValid) {
        setError(dateVal.error ?? "Invalid date range.");
        return;
      }
    }

    setSaving(true);

    const [firstName, ...rest] = fullName.trim().split(/\s+/);
    const lastName = rest.join(" ");

    const supabase = createClient();
    const updatePayload: Record<string, unknown> = {
      first_name: firstName || "",
      last_name: lastName || "",
      username: username.trim() || null,
      phone_number: phoneNumber.trim() || null,
      place_of_work: placeOfWork.trim() || null,
      internship_start_date: startDate || null,
      internship_end_date: endDate || null,
    };

    let { error: updateError } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", userId);

    if (updateError && updateError.message?.includes("phone_number")) {
      delete updatePayload.phone_number;
      const { error: retryError } = await supabase
        .from("profiles")
        .update(updatePayload)
        .eq("id", userId);
      updateError = retryError;
    }

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Edit profile</h1>
          <p className="mt-1 text-sm text-[#666]">Update your personal information</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-[#1A1A1A] hover:bg-[#e6ac00] disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {success && (
        <div className="mt-6">
          <Banner type="success" message="Your profile has been updated." />
        </div>
      )}
      {error && (
        <div className="mt-6">
          <Banner type="error" message={error} />
        </div>
      )}

      <div className="mt-10 flex justify-center">
        <AvatarUpload userId={userId} name={fullName || "Student"} avatarUrl={avatarUrl} size={128} />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-[#333]">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-2 w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#1A1A1A] focus:border-2 focus:border-black focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-[#333]">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-2 w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#1A1A1A] focus:border-2 focus:border-black focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-[#333]">Email Address</label>
          <input
            type="email"
            value={email}
            disabled
            className="mt-2 w-full cursor-not-allowed rounded-lg border border-[#E5E7EB] bg-gray-50 px-4 py-3 text-sm text-[#9CA3AF]"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-[#333]">Phone Number</label>
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            value={phoneNumber}
            onKeyDown={(e) => {
              const allowedKeys = [
                "Backspace",
                "Delete",
                "Tab",
                "Escape",
                "Enter",
                "ArrowLeft",
                "ArrowRight",
                "Home",
                "End",
              ];
              if (
                allowedKeys.includes(e.key) ||
                (e.ctrlKey && ["a", "c", "v", "x", "z"].includes(e.key.toLowerCase())) ||
                (e.metaKey && ["a", "c", "v", "x", "z"].includes(e.key.toLowerCase()))
              ) {
                return;
              }
              if (!/^[0-9]$/.test(e.key)) {
                e.preventDefault();
              }
            }}
            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
            placeholder="e.g. 08012345678"
            className="mt-2 w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#1A1A1A] focus:border-2 focus:border-black focus:outline-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-[#333]">Internship Placement</label>
          <input
            type="text"
            value={placeOfWork}
            onChange={(e) => setPlaceOfWork(e.target.value)}
            className="mt-2 w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#1A1A1A] focus:border-2 focus:border-black focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-6">
        <label className="text-sm font-medium text-[#333]">Internship Duration</label>
        <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row sm:max-w-md">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#1A1A1A] focus:border-2 focus:border-black focus:outline-none"
          />
          <span className="text-sm text-[#666]">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#1A1A1A] focus:border-2 focus:border-black focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
