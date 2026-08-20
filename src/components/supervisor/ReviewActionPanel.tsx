"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Banner } from "@/components/ui/Banner";
import { Modal } from "@/components/ui/Modal";
import { BadgeCheckIcon, CheckIcon, CloseIcon, AlertTriangleIcon, EditIcon } from "@/components/ui/icons";
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
  const [confirmingAction, setConfirmingAction] = useState<null | "approved" | "rejected">(null);
  const [unlockEdit, setUnlockEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const isDecided = (status === "approved" || status === "rejected") && !unlockEdit;

  function handleInitiateAction(action: "approved" | "rejected") {
    setError(null);
    if (action === "rejected" && !feedback.trim()) {
      setError("Please add feedback comments explaining why the entry is returned.");
      return;
    }
    // Project the prompt loudly via confirmation modal
    setConfirmingAction(action);
  }

  async function executeDecision(decision: "approved" | "rejected") {
    setError(null);
    setDone(null);
    setConfirmingAction(null);
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

    const { error: statusError } = await supabase
      .from("logbook_entries")
      .update({ status: decision })
      .eq("id", entryId);

    if (statusError) {
      setError(statusError.message || "Could not update entry status.");
      setPending(null);
      return;
    }

    setStatus(decision);
    setUnlockEdit(false);
    setPending(null);
    setDone(
      decision === "approved"
        ? "Entry officially approved and stamped!"
        : "Entry returned to student for corrections."
    );
    router.refresh();
  }

  return (
    <>
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h3 className="text-base font-bold text-[#1A1A1A]">Supervisor Feedback &amp; Decision</h3>

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

        {/* IF ACTION ALREADY TAKEN: HIDE ACCEPT AND REJECT BUTTONS COMPLETELY */}
        {isDecided ? (
          <div className="mt-4">
            <div
              className={`rounded-2xl border p-5 transition-all ${
                status === "approved"
                  ? "border-[#16A34A]/30 bg-[#F0FDF4]"
                  : "border-[#DC2626]/30 bg-[#FEF2F2]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${
                      status === "approved" ? "bg-[#16A34A]" : "bg-[#DC2626]"
                    }`}
                  >
                    {status === "approved" ? (
                      <BadgeCheckIcon className="h-6 w-6" />
                    ) : (
                      <AlertTriangleIcon className="h-6 w-6" />
                    )}
                  </span>
                  <div>
                    <h4
                      className={`text-base font-extrabold ${
                        status === "approved" ? "text-[#15803D]" : "text-[#B91C1C]"
                      }`}
                    >
                      {status === "approved"
                        ? "Logbook Entry Approved & Stamped"
                        : "Logbook Entry Returned to Student"}
                    </h4>
                    <p className="text-xs text-[#666]">
                      {status === "approved"
                        ? "This entry has been verified and recorded."
                        : "The student has been notified to edit and resubmit this entry."}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setUnlockEdit(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-semibold text-[#1A1A1A] hover:bg-gray-50"
                  title="Modify feedback or change decision"
                >
                  <EditIcon className="h-3.5 w-3.5" />
                  Update Decision
                </button>
              </div>

              {feedback && (
                <div className="mt-4 rounded-xl border border-black/5 bg-white/80 p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#666]">
                    Your Feedback Comments:
                  </span>
                  <p className="mt-1 text-sm italic text-[#1A1A1A]">
                    &ldquo;{feedback}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* UN-DECIDED / EDITING MODE: SHOW FEEDBACK TEXTAREA AND PROMPTED BUTTONS */
          <div className="mt-4 space-y-4">
            <p className="text-sm text-[#666]">
              Add your review comments below, then choose whether to approve or return this log entry.
            </p>

            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              placeholder="Write supervisor feedback comments here..."
              className="w-full resize-none rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-2 focus:border-primary focus:outline-none"
            />

            {/* ACCEPT AND REJECT BUTTONS */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => handleInitiateAction("rejected")}
                disabled={pending !== null}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-[#DC2626] bg-white py-3 text-sm font-bold text-[#DC2626] transition-all hover:bg-red-50 disabled:opacity-50"
              >
                <CloseIcon className="h-4 w-4" />
                Reject &amp; Return Entry
              </button>

              <button
                type="button"
                onClick={() => handleInitiateAction("approved")}
                disabled={pending !== null}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#16A34A] py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[#15803D] disabled:opacity-50"
              >
                <CheckIcon className="h-5 w-5" />
                Approve &amp; Stamp Entry
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PROJECTED CONFIRMATION PROMPT MODAL */}
      <Modal
        open={confirmingAction !== null}
        onClose={() => setConfirmingAction(null)}
      >
        {confirmingAction && (
          <div className="text-center sm:text-left">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white ${
                  confirmingAction === "approved" ? "bg-[#16A34A]" : "bg-[#DC2626]"
                }`}
              >
                {confirmingAction === "approved" ? (
                  <CheckIcon className="h-6 w-6" />
                ) : (
                  <AlertTriangleIcon className="h-6 w-6" />
                )}
              </span>
              <div>
                <h3 className="text-xl font-bold text-[#1A1A1A]">
                  {confirmingAction === "approved"
                    ? "Confirm Logbook Approval"
                    : "Confirm Entry Return"}
                </h3>
                <p className="text-xs text-[#666]">
                  {confirmingAction === "approved"
                    ? "Official Supervisor Action"
                    : "Return to Student for Revisions"}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-[#374151]">
              <p>
                {confirmingAction === "approved"
                  ? "Are you sure you want to approve this student's log entry? This will officially stamp the record as verified."
                  : "Are you sure you want to reject and return this log entry? The student will be notified to edit and resubmit their observations."}
              </p>

              {feedback ? (
                <div className="mt-3 border-t border-gray-200 pt-3 text-left">
                  <span className="text-xs font-semibold text-[#666]">Attached Feedback:</span>
                  <p className="mt-1 italic text-[#1A1A1A]">&ldquo;{feedback}&rdquo;</p>
                </div>
              ) : (
                confirmingAction === "approved" && (
                  <p className="mt-2 text-xs italic text-[#9CA3AF]">
                    (No comments attached. Standard approval stamp applied.)
                  </p>
                )
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmingAction(null)}
                className="rounded-full border border-[#E5E7EB] px-6 py-2.5 text-sm font-semibold text-[#666] hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => executeDecision(confirmingAction)}
                className={`rounded-full px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all ${
                  confirmingAction === "approved"
                    ? "bg-[#16A34A] hover:bg-[#15803D]"
                    : "bg-[#DC2626] hover:bg-[#B91C1C]"
                }`}
              >
                {confirmingAction === "approved"
                  ? "Yes, Approve & Stamp"
                  : "Yes, Return to Student"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
