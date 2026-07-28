"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { CloseIcon, ImageIcon, PlusIcon } from "@/components/ui/icons";

const ACCEPTED_TYPES = "image/svg+xml,image/png,image/jpeg,video/mp4";

export function AddNewLogButton() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setTitle("");
    setDetails("");
    setFile(null);
    setError(null);
  }

  function handleDiscard() {
    reset();
    setOpen(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
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

    const { data: entry, error: insertError } = await supabase
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

    if (insertError || !entry) {
      setError(insertError?.message ?? "Could not save this log. Please try again.");
      setSaving(false);
      return;
    }

    if (file) {
      const path = `${user.id}/${entry.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("entry-media")
        .upload(path, file);

      if (!uploadError) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("entry-media").getPublicUrl(path);

        await supabase.from("entry_media").insert({
          entry_id: entry.id,
          file_url: publicUrl,
          file_type: file.type,
        });
      }
    }

    setSaving(false);
    reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-[#1A1A1A] hover:bg-[#e6ac00] sm:justify-start"
      >
        <PlusIcon className="h-4 w-4" />
        Add New Log
      </button>

      <Modal open={open} onClose={handleDiscard}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#1A1A1A]">Add New Log</h2>
            <p className="mt-1 text-sm text-[#666]">Document your internship progress here</p>
          </div>
          <button onClick={handleDiscard} aria-label="Close" className="text-[#1A1A1A]">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

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
            onClick={handleDiscard}
            className="w-full rounded-full border border-[#E5E7EB] py-3 text-sm font-semibold text-[#666] hover:bg-gray-50 sm:flex-1"
          >
            Discard
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
    </>
  );
}
