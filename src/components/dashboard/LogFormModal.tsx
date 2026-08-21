"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { AlertTriangleIcon, CloseIcon, ImageIcon, TrashIcon } from "@/components/ui/icons";

const ACCEPTED_TYPES = "image/svg+xml,image/png,image/jpeg,video/mp4";

export interface LogFormEntry {
  id: string;
  title: string;
  body: string;
  status?: string;
  reviewComment?: string | null;
}

interface ExistingMedia {
  id: string;
  file_url: string;
  file_type?: string;
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
  const [files, setFiles] = useState<File[]>([]);
  const [existingMedia, setExistingMedia] = useState<ExistingMedia[]>([]);
  const [mediaToDelete, setMediaToDelete] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(entry?.title ?? "");
      setDetails(entry?.body ?? "");
      setFiles([]);
      setMediaToDelete([]);
      setError(null);
      setShowConfirmModal(false);

      if (isEdit && entry?.id) {
        const fetchMedia = async () => {
          const supabase = createClient();
          const { data } = await supabase
            .from("entry_media")
            .select("id, file_url, file_type")
            .eq("entry_id", entry.id);
          setExistingMedia(data ?? []);
        };
        fetchMedia();
      } else {
        setExistingMedia([]);
      }
    }
  }, [open, entry, isEdit]);

  function handleClose() {
    setError(null);
    setShowConfirmModal(false);
    onClose();
  }

  function handleAddFiles(newFiles: FileList | File[]) {
    const valid = Array.from(newFiles).filter((f) =>
      f.type.startsWith("image/") || f.type === "video/mp4"
    );
    setFiles((prev) => [...prev, ...valid]);
  }

  function handleRemoveNewFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleRemoveExistingMedia(id: string) {
    setExistingMedia((prev) => prev.filter((m) => m.id !== id));
    setMediaToDelete((prev) => [...prev, id]);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) {
      handleAddFiles(e.dataTransfer.files);
    }
  }

  function handleFormSubmitAttempt() {
    if (!title.trim() || !details.trim()) {
      setError("Please fill in both title and details.");
      return;
    }
    setError(null);
    setShowConfirmModal(true);
  }

  async function uploadMedia(
    supabase: ReturnType<typeof createClient>,
    userId: string,
    entryId: string
  ) {
    for (const file of files) {
      const path = `${userId}/${entryId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("entry-media")
        .upload(path, file);
      if (uploadError) continue;
      const {
        data: { publicUrl },
      } = supabase.storage.from("entry-media").getPublicUrl(path);
      await supabase.from("entry_media").insert({
        entry_id: entryId,
        file_url: publicUrl,
        file_type: file.type,
      });
    }
  }

  async function executeSave() {
    setShowConfirmModal(false);
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

    // Process media deletions if any
    if (mediaToDelete.length > 0) {
      await supabase.from("entry_media").delete().in("id", mediaToDelete);
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
    setFiles([]);
    onClose();
    router.refresh();
  }

  const totalMediaCount = existingMedia.length + files.length;

  return (
    <>
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
            rows={5}
            className="mt-2 w-full resize-none rounded-lg bg-gray-50 px-4 py-3 text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-2 focus:border-black focus:outline-none"
          />
        </div>

        {/* Upload dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-6 flex cursor-pointer items-center gap-4 rounded-lg bg-gray-50 p-4 border-2 border-dashed transition-colors ${
            dragActive ? "border-primary bg-amber-50/50" : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[#666]">
            <ImageIcon className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm text-[#666]">
              <span className="font-semibold text-primary">Click to upload</span> or drag and drop
              images
            </p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              Supports multiple images (SVG, PNG, JPG, MP4)
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) handleAddFiles(e.target.files);
            }}
          />
        </div>

        {/* Thumbnail Preview Grid */}
        {totalMediaCount > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-[#666] mb-2">
              Attached Media ({totalMediaCount}):
            </p>
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
              {/* Existing Media items */}
              {existingMedia.map((m) => (
                <div key={m.id} className="group relative h-20 w-full overflow-hidden rounded-lg border bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.file_url} alt="Attachment" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveExistingMedia(m.id);
                    }}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow hover:bg-red-700"
                    title="Remove image"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {/* Newly added File items */}
              {files.map((file, idx) => {
                const objectUrl = URL.createObjectURL(file);
                return (
                  <div key={idx} className="group relative h-20 w-full overflow-hidden rounded-lg border bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={objectUrl} alt={file.name} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveNewFile(idx);
                      }}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow hover:bg-red-700"
                      title="Remove image"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleClose}
            className="w-full rounded-full border border-[#E5E7EB] py-3 text-sm font-semibold text-[#666] hover:bg-gray-50 sm:flex-1"
          >
            {isEdit ? "Cancel" : "Discard"}
          </button>
          <button
            type="button"
            onClick={handleFormSubmitAttempt}
            disabled={saving}
            className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-[#1A1A1A] hover:bg-[#e6ac00] disabled:opacity-50 sm:flex-1"
          >
            {saving
              ? "Saving..."
              : entry?.status === "rejected"
              ? "Resubmit Log"
              : isEdit
              ? "Save Changes"
              : "Save & Submit Log"}
          </button>
        </div>
      </Modal>

      {/* Submission Confirmation Prompt Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <AlertTriangleIcon className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-xl font-bold text-[#1A1A1A]">Confirm Submission</h3>
            <p className="mt-2 text-sm text-[#666]">
              Are you sure you want to submit this log entry? Please review your observations and attached media ({totalMediaCount} file{totalMediaCount === 1 ? "" : "s"}) before finalizing.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="w-1/2 rounded-full border border-gray-300 py-2.5 text-sm font-semibold text-[#333] hover:bg-gray-50"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={executeSave}
                disabled={saving}
                className="w-1/2 rounded-full bg-primary py-2.5 text-sm font-semibold text-[#1A1A1A] hover:bg-[#e6ac00] disabled:opacity-50"
              >
                {saving ? "Submitting..." : "Yes, Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
