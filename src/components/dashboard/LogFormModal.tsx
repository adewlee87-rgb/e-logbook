"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { AlertTriangleIcon, CloseIcon, ImageIcon } from "@/components/ui/icons";

const ACCEPTED_TYPES = "image/svg+xml,image/png,image/jpeg,video/mp4";

export interface LogFormEntry {
  id: string;
  title: string;
  body: string;
  status?: string;
  reviewComment?: string | null;
}

interface LogFormModalProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  entry?: LogFormEntry;
}

export function LogFormModal({ open, onClose, mode, entry }: LogFormModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = mode === "edit";

  const [title, setTitle] = useState(entry?.title ?? "");
  const [details, setDetails] = useState(entry?.body ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setError(null);
    onClose();
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  }

  async function uploadMedia(
    supabase: ReturnType<typeof createClient>,
    userId: string,
    entryId: string
  ) {
    if (!file) return;
    const path = `${userId}/${entryId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("entry-media")
      .upload(path, file);
    if (uploadError) return;
    const {
      data: { publicUrl },
    } = supabase.storage.from("entry-media").getPublicUrl(path);
    await supabase.from("entry_media").insert({
      entry_id: entryId,
      file_url: publicUrl,
      file_type: file.type,
    });
  }

  async function handleSave() {
    if (!title.trim() || !details.trim()) {
      setError("Please fill in both title and details.");
      return;
    }

    setSaving(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in to save a log.");
      setSaving(false);
      return;
    }

    if (isEdit) {
      if (!entry) {
        setError("Nothing to edit.");
        setSaving(false);
        return;
      }
      const { error: updateError } = await supabase
        .from("logbook_entries")
        .update({
          title: title.trim(),
          observations: details.trim(),
          status: "submitted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", entry.id);

      if (updateError) {
        setError(updateError.message || "Could not update this log. Please try again.");
        setSaving(false);
        return;
      }
      await uploadMedia(supabase, user.id, entry.id);
    } else {
      const { data: created, error: insertError } = await supabase
        .from("logbook_entries")
        .insert({
          student_id: user.id,
          title: title.trim(),
          observations: details.trim(),
          date: new Date().toISOString().slice(0, 10),
          status: "submitted",
        })
        .select("id")
        .single();

      if (insertError || !created) {
        setError(
          insertError?.code === "23505"
            ? "You've already logged today — you can edit today's entry instead."
            : insertError?.message ?? "Could not save this log. Please try again."
        );
        setSaving(false);
        return;
      }
      await uploadMedia(supabase, user.id, created.id);
    }

    setSaving(false);
    setFile(null);
    onClose();
    router.refresh();
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A1A]">
            {isEdit
              ? entry?.status === "rejected"
                ? "Edit & Resubmit Log"
                : "Edit Log"
              : "Add New Log"}
          </h2>
          <p className="mt-1 text-sm text-[#666]">
            {isEdit
              ? entry?.status === "rejected"
                ? "Correct your observations based on supervisor feedback and resubmit for review."
                : "Update the details of this entry"
              : "Document your internship progress here"}
          </p>
        </div>
        <button onClick={handleClose} aria-label="Close" className="text-[#1A1A1A]">
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      {/* SUPERVISOR REJECTION FEEDBACK CALLOUT IN EDIT MODAL */}
      {isEdit && entry?.status === "rejected" && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <div className="flex items-center gap-2 font-extrabold text-[#B91C1C]">
            <AlertTriangleIcon className="h-4 w-4 shrink-0 text-[#DC2626]" />
            Supervisor Feedback for Revisions:
          </div>
          <p className="mt-1.5 italic text-red-900">
            {entry.reviewComment ? `"${entry.reviewComment}"` : "(No written feedback comment attached.)"}
          </p>
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <div className="mt-6">
        <label className="text-sm font-medium text-[#333]">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter title here"
          className="mt-2 w-full rounded-lg bg-gray-50 px-4 py-3 text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-2 focus:border-black focus:outline-none"
        />
      </div>

      <div className="mt-6">
        <label className="text-sm font-medium text-[#333]">Details</label>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Write your details here"
          rows={6}
          className="mt-2 w-full resize-none rounded-lg bg-gray-50 px-4 py-3 text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-2 focus:border-black focus:outline-none"
        />
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`mt-6 flex cursor-pointer items-center gap-4 rounded-lg bg-gray-50 p-4 ${
          dragActive ? "ring-2 ring-primary" : ""
        }`}
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[#666]">
          <ImageIcon className="h-6 w-6" />
        </span>
        <p className="text-sm text-[#666]">
          <span className="font-semibold text-primary">Click to upload</span> or drag and drop
          SVG, PNG, JPG or MP4
          {file && <span className="mt-1 block truncate text-[#1A1A1A]">{file.name}</span>}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={handleClose}
          className="w-full rounded-full border border-[#E5E7EB] py-3 text-sm font-semibold text-[#666] hover:bg-gray-50 sm:flex-1"
        >
          {isEdit ? "Cancel" : "Discard"}
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-[#1A1A1A] hover:bg-[#e6ac00] disabled:opacity-50 sm:flex-1"
        >
          {saving
            ? "Saving..."
            : entry?.status === "rejected"
            ? "Resubmit Log"
            : isEdit
            ? "Save Changes"
            : "Save"}
        </button>
      </div>
    </Modal>
  );
}
