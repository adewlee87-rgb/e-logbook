"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ReportCard, type ReportEntry } from "@/components/dashboard/ReportCard";
import { LogFormModal } from "@/components/dashboard/LogFormModal";
import { ArrowLeftIcon, EditIcon, LockIcon, SearchIcon, AlertTriangleIcon, BadgeCheckIcon, ClockIcon, DownloadIcon, ReportIcon } from "@/components/ui/icons";
import type { EntryStatus } from "@/components/dashboard/StatusBadge";

const EDIT_WINDOW_MS = 5 * 60 * 60 * 1000;

const STATUS_OPTIONS: { label: string; value: EntryStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Submitted", value: "submitted" },
  { label: "Completed", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

import { downloadSingleEntryPDF } from "@/lib/pdf-export";
import { ProgressSummaryHeader } from "@/components/dashboard/ProgressSummaryHeader";
import { formatDate, formatDateTime as formatTimestamp } from "@/lib/supervisor";

function downloadEntry(entry: ReportEntry) {
  downloadSingleEntryPDF(entry);
}

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
            entries.length === 0 ? (
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-12 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FEF3D6] text-primary">
                  <ReportIcon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-base font-bold text-[#1A1A1A]">No reports yet</h3>
                <p className="mt-1 text-sm text-[#666]">
                  Create your first log entry to see it listed here.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-12 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-[#9CA3AF]">
                  <SearchIcon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-base font-bold text-[#1A1A1A]">No logs found</h3>
                <p className="mt-1.5 text-sm text-[#666]">
                  {query ? (
                    <>No logs match your search for <span className="font-semibold text-[#1A1A1A]">&ldquo;{query}&rdquo;</span>.</>
                  ) : (
                    <>No logs match the selected status filter.</>
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setStatusFilter("all");
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-xs font-bold text-[#1A1A1A] hover:bg-gray-50 shadow-sm transition-all"
                >
                  Clear Search &amp; Filters
                </button>
              </div>
            )
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
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={() => setSelectedId(null)}
                className="flex items-center gap-2 text-sm font-medium text-[#1A1A1A] hover:underline"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Back
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => downloadEntry(selected)}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-[#1A1A1A] hover:bg-[#e6ac00] shadow-sm transition-all"
                >
                  <DownloadIcon className="h-4 w-4" />
                  Download PDF
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
            </div>

            <h2 className="mt-6 text-2xl font-bold text-[#1A1A1A]">{selected.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-[#666]">
              <span>Submitted: <strong className="font-semibold text-[#1A1A1A]">{formatTimestamp(selected.createdAt)}</strong></span>
              {selected.date && <span>Log Date: <strong className="font-semibold text-[#1A1A1A]">{formatDate(selected.date)}</strong></span>}
            </div>
            <p className="mt-4 whitespace-pre-wrap text-[#333]">{selected.body}</p>

            {selected.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.imageUrl}
                alt=""
                className="mt-6 w-full rounded-xl object-cover"
              />
            )}

            {/* SUPERVISOR REVIEW & FEEDBACK PANEL */}
            {selected.status !== "draft" && (
              <div
                className={`mt-8 rounded-2xl border p-6 transition-all ${
                  selected.status === "approved"
                    ? "border-green-200 bg-green-50/50"
                    : selected.status === "rejected"
                    ? "border-red-200 bg-red-50/60"
                    : "border-amber-200 bg-amber-50/40"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${
                        selected.status === "approved"
                          ? "bg-[#16A34A]"
                          : selected.status === "rejected"
                          ? "bg-[#DC2626]"
                          : "bg-[#F59E0B]"
                      }`}
                    >
                      {selected.status === "approved" ? (
                        <BadgeCheckIcon className="h-6 w-6" />
                      ) : selected.status === "rejected" ? (
                        <AlertTriangleIcon className="h-6 w-6" />
                      ) : (
                        <ClockIcon className="h-6 w-6" />
                      )}
                    </span>
                    <div>
                      <h4
                        className={`text-base font-extrabold ${
                          selected.status === "approved"
                            ? "text-[#15803D]"
                            : selected.status === "rejected"
                            ? "text-[#B91C1C]"
                            : "text-[#B45309]"
                        }`}
                      >
                        {selected.status === "approved"
                          ? "Approved & Stamped by Supervisor"
                          : selected.status === "rejected"
                          ? "Returned by Supervisor for Revision"
                          : "Awaiting Supervisor Review"}
                      </h4>
                      <p className="text-xs text-[#666]">
                        {selected.review?.reviewedAt
                          ? `Reviewed on ${new Date(selected.review.reviewedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}`
                          : selected.status === "submitted"
                          ? "Your log entry has been submitted and is currently pending review by your supervisor."
                          : ""}
                      </p>
                    </div>
                  </div>

                  {selected.status === "rejected" && (
                    <button
                      onClick={() => setEditing(selected)}
                      className="inline-flex items-center gap-2 rounded-full bg-[#DC2626] px-5 py-2.5 text-xs font-bold text-white shadow transition-all hover:bg-[#B91C1C]"
                    >
                      <EditIcon className="h-4 w-4" />
                      Edit &amp; Resubmit Log
                    </button>
                  )}
                </div>

                {selected.review?.comment ? (
                  <div
                    className={`mt-4 rounded-xl border p-4 shadow-sm ${
                      selected.status === "approved"
                        ? "border-green-300 bg-white/90 text-green-950"
                        : selected.status === "rejected"
                        ? "border-red-300 bg-white/90 text-red-950"
                        : "border-gray-200 bg-white text-[#1A1A1A]"
                    }`}
                  >
                    <span
                      className={`text-xs font-extrabold uppercase tracking-wider ${
                        selected.status === "approved"
                          ? "text-green-700"
                          : selected.status === "rejected"
                          ? "text-red-700"
                          : "text-[#666]"
                      }`}
                    >
                      Supervisor Comment &amp; Feedback:
                    </span>
                    <p
                      className={`mt-1.5 text-sm font-semibold italic leading-relaxed ${
                        selected.status === "approved"
                          ? "text-green-900"
                          : selected.status === "rejected"
                          ? "text-red-900"
                          : "text-[#1A1A1A]"
                      }`}
                    >
                      &ldquo;{selected.review.comment}&rdquo;
                    </p>
                  </div>
                ) : (
                  (selected.status === "approved" || selected.status === "rejected") && (
                    <p className="mt-3 text-xs italic text-[#666]">
                      (No written comments attached by supervisor for this review.)
                    </p>
                  )
                )}
              </div>
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
            ? {
                id: editing.id,
                title: editing.title,
                body: editing.body,
                status: editing.status,
                reviewComment: editing.review?.comment,
              }
            : undefined
        }
      />
    </div>
  );
}
