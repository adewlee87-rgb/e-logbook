"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Banner } from "@/components/ui/Banner";
import { CheckIcon, CloseIcon } from "@/components/ui/icons";
import type { EntryStatus } from "@/components/dashboard/StatusBadge";

export function ReviewActionPanel({
  entryId,
  initialStatus,
  initialFeedback,
}: {
  entryId: string;
  initialStatus: EntryStatus;
  initialFeedback?: string | null;
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState(initialFeedback ?? "");
  const [status, setStatus] = useState<EntryStatus>(initialStatus);
  const [pending, setPending] = useState<null | "approved" | "rejected">(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const decided = status === "approved" || status === "rejected";

  async function submit(decision: "approved" | "rejected") {
    setError(null);
    setDone(null);

    if (decision === "rejected" && !feedback.trim()) {
      setError("Please add a comment so the student knows what to correct.");
      return;
    }

    setPending(decision);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Your session has expired. Please log in again.");
      setPending(null);
      return;
    }

    // Record the review comment (visible to the student)
    const { error: reviewError } = await supabase.from("reviews").insert({
      entry_id: entryId,
      reviewer_id: user.id,
      reviewer_role: "supervisor",
      comment: feedback.trim() || null,
    });
    if (reviewError) {
      setError(reviewError.message || "Could not save your feedback.");
      setPending(null);
      return;
    }

    // Stamp the entry (triggers a notification to the student)
    const { error: statusError } = await supabase
      .from("logbook_entries")
      .update({ status: decision })
      .eq("id", entryId);
    if (statusError) {
      setError(statusError.message || "Could not update the entry status.");
      setPending(null);
      return;
    }

    setStatus(decision);
    setPending(null);
    setDone(decision === "approved" ? "Entry approved and the student was notified." : "Entry returned to the student with your comments.");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
      <h3 className="text-base font-bold text-[#1A1A1A]">Supervisor Feedback</h3>
      <p className="mt-1 text-sm text-[#666]">
        {decided
          ? "You can update your feedback and re-stamp this entry if needed."
          : "Add optional comments, then approve the entry or return it for corrections."}
      </p>

      {error && (
        <div className="mt-4">
          <Banner type="error" message={error} />
        </div>
      )}
      {done && (
        <div className="mt-4">
          <Banner type="success" message={done} />
        </div>
      )}

      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        rows={5}
        placeholder="Write your feedback for the student here..."
        className="mt-4 w-full resize-none rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-3 text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-2 focus:border-primary focus:outline-none"
      />

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => submit("rejected")}
          disabled={pending !== null}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#DC2626] py-3 text-sm font-semibold text-[#DC2626] transition-colors hover:bg-red-50 disabled:opacity-50"
        >
          <CloseIcon className="h-4 w-4" />
          {pending === "rejected" ? "Returning..." : "Reject Entry"}
        </button>
        <button
          onClick={() => submit("approved")}
          disabled={pending !== null}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#16A34A] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#15803D] disabled:opacity-50"
        >
          <CheckIcon className="h-4 w-4" />
          {pending === "approved" ? "Approving..." : "Approve Entry"}
        </button>
      </div>
    </div>
  );
}
