"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ReportCard, type ReportEntry } from "@/components/dashboard/ReportCard";
import { ArrowLeftIcon, FilterIcon, SearchIcon } from "@/components/ui/icons";
import type { EntryStatus } from "@/components/dashboard/StatusBadge";

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

export function ReportView({ entries }: { entries: ReportEntry[] }) {
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("entry"));
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [statusFilter, setStatusFilter] = useState<EntryStatus | "all">("all");
  const [filterOpen, setFilterOpen] = useState(false);

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

      {!selected && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="relative w-full sm:max-w-xs">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
              <SearchIcon className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="w-full rounded-full border border-[#E5E7EB] bg-white py-2.5 pl-11 pr-4 text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-2 focus:border-black focus:outline-none"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-5 py-2.5 text-sm font-medium text-[#1A1A1A] hover:bg-gray-50 sm:w-auto"
            >
              Filter
              <FilterIcon className="h-4 w-4" />
            </button>
            {filterOpen && (
              <div className="absolute right-0 z-10 mt-2 w-40 rounded-lg border border-[#E5E7EB] bg-white p-1 shadow-lg">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setStatusFilter(opt.value);
                      setFilterOpen(false);
                    }}
                    className={`block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                      statusFilter === opt.value ? "font-semibold text-[#1A1A1A]" : "text-[#666]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
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
                />
              ))}
            </div>
          )}
        </div>

        {selected && (
          <div className="flex-1 rounded-2xl border border-[#E5E7EB] bg-white p-8">
            <button
              onClick={() => setSelectedId(null)}
              className="flex items-center gap-2 text-sm font-medium text-[#1A1A1A] hover:underline"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back
            </button>

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
    </div>
  );
}
