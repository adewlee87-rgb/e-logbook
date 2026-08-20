"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ReportCard, type ReportEntry } from "@/components/dashboard/ReportCard";
import { LogFormModal } from "@/components/dashboard/LogFormModal";
import { ArrowLeftIcon, EditIcon, LockIcon, SearchIcon } from "@/components/ui/icons";
import type { EntryStatus } from "@/components/dashboard/StatusBadge";

const EDIT_WINDOW_MS = 5 * 60 * 60 * 1000;

const STATUS_OPTIONS: { label: string; value: EntryStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Submitted", value: "submitted" },
  { label: "Completed", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function downloadEntry(entry: ReportEntry) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(
    entry.title
  )}</title></head><body style="font-family: sans-serif; max-width: 640px; margin: 40px auto;"><h1>${escapeHtml(
    entry.title
  )}</h1><p style="white-space: pre-wrap;">${escapeHtml(entry.body)}</p></body></html>`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${entry.title.trim().toLowerCase().replace(/\s+/g, "-")}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

import { ProgressSummaryHeader } from "@/components/dashboard/ProgressSummaryHeader";

export function ReportView({ entries }: { entries: ReportEntry[] }) {
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("entry"));
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [statusFilter, setStatusFilter] = useState<EntryStatus | "all">("all");
  const [editing, setEditing] = useState<ReportEntry | null>(null);

  // Resolve editability on the client only, so the server render (which has no
  // stable "now") can't cause a hydration mismatch on the Edit / lock affordance.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);

  const isEditable = (entry: ReportEntry) =>
    entry.status === "rejected" ||
    entry.status === "draft" ||
    (now !== null && now < new Date(entry.createdAt).getTime() + EDIT_WINDOW_MS);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const matchesQuery =
        !query ||
        e.title.toLowerCase().includes(query.toLowerCase()) ||
        e.body.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "all" || e.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [entries, query, statusFilter]);

  const selected = entries.find((e) => e.id === selectedId) ?? null;

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">View Your Reports</h1>
        <p className="mt-1 text-sm text-[#666]">Review and manage your logs here</p>
      </div>

      <div className="mt-6">
        <ProgressSummaryHeader entries={entries} />
      </div>

      {!selected && (
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Segmented Filter Toggle Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto rounded-full border border-[#E5E7EB] bg-white p-1.5 shadow-sm">
            {STATUS_OPTIONS.map((opt) => {
              const active = statusFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatusFilter(opt.value)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-all ${
                    active
                      ? "bg-[#FFC107] text-[#1A1A1A] shadow"
                      : "text-[#666] hover:bg-gray-100 hover:text-[#1A1A1A]"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:max-w-xs">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
              <SearchIcon className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reports..."
              className="w-full rounded-full border border-[#E5E7EB] bg-white py-2 pl-11 pr-4 text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-2 focus:border-black focus:outline-none"
            />
          </div>
        </div>
      )}

      <div className={`mt-6 ${selected ? "flex flex-col gap-8 lg:flex-row" : ""}`}>
        <div className={selected ? "flex shrink-0 flex-col gap-4 lg:w-[380px]" : ""}>
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-10 text-center text-sm text-[#666]">
              No reports yet. Create your first log to see it here.
            </div>
          ) : (
            <div className={selected ? "flex flex-col gap-4" : "grid grid-cols-1 gap-5 md:grid-cols-2"}>
              {filtered.map((entry) => (
                <ReportCard
                  key={entry.id}
                  entry={entry}
                  compact={!!selected}
                  onOpen={() => setSelectedId(entry.id)}
                  onDownload={() => downloadEntry(entry)}
                  onEdit={now === null ? undefined : () => setEditing(entry)}
                  canEdit={isEditable(entry)}
                />
              ))}
            </div>
          )}
        </div>

        {selected && (
          <div className="flex-1 rounded-2xl border border-[#E5E7EB] bg-white p-8">
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => setSelectedId(null)}
                className="flex items-center gap-2 text-sm font-medium text-[#1A1A1A] hover:underline"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Back
              </button>

              {now !== null &&
                (isEditable(selected) ? (
                  <button
                    onClick={() => setEditing(selected)}
                    className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                      selected.status === "rejected"
                        ? "border border-[#DC2626] bg-red-50 text-[#DC2626] hover:bg-red-100"
                        : "border border-[#E5E7EB] text-[#1A1A1A] hover:bg-gray-50"
                    }`}
                  >
                    <EditIcon className="h-4 w-4" />
                    {selected.status === "rejected" ? "Edit & Resubmit" : "Edit"}
                  </button>
                ) : (
                  <span
                    title="Logs can only be edited within 5 hours of creation."
                    className="inline-flex items-center gap-1.5 text-xs text-[#9CA3AF]"
                  >
                    <LockIcon className="h-3.5 w-3.5" />
                    Editing closed
                  </span>
                ))}
            </div>

            <h2 className="mt-6 text-2xl font-bold text-[#1A1A1A]">{selected.title}</h2>
            <p className="mt-4 whitespace-pre-wrap text-[#333]">{selected.body}</p>

            {selected.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.imageUrl}
                alt=""
                className="mt-6 w-full rounded-xl object-cover"
              />
            )}
          </div>
        )}
      </div>

      <LogFormModal
        key={editing?.id ?? "none"}
        open={!!editing}
        onClose={() => setEditing(null)}
        mode="edit"
        entry={
          editing
            ? { id: editing.id, title: editing.title, body: editing.body, status: editing.status }
            : undefined
        }
      />
    </div>
  );
}
