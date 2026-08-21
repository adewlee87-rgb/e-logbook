import { DownloadIcon, EditIcon, LockIcon, ReportIcon } from "@/components/ui/icons";
import type { EntryStatus } from "@/components/dashboard/StatusBadge";

export interface ReportReview {
  id: string;
  comment: string | null;
  reviewedAt: string;
  reviewerRole: string;
}

export interface ReportEntry {
  id: string;
  title: string;
  body: string;
  date: string;
  createdAt: string;
  imageUrl: string | null;
  status: EntryStatus;
  review?: ReportReview | null;
}

function formatTimestamp(iso: string) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function truncate(text: string, length: number) {
  return text.length > length ? `${text.slice(0, length).trim()}...` : text;
}

interface ReportCardProps {
  entry: ReportEntry;
  onOpen: () => void;
  onDownload: () => void;
  onEdit?: () => void;
  canEdit?: boolean;
  compact?: boolean;
}

export function ReportCard({
  entry,
  onOpen,
  onDownload,
  onEdit,
  canEdit,
  compact = false,
}: ReportCardProps) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FEF3D6] text-primary">
          <ReportIcon className="h-5 w-5" />
        </span>
        <span className="text-xs font-medium text-[#666]">{formatTimestamp(entry.createdAt || entry.date)}</span>
      </div>

      <h4 className="mt-4 text-lg font-bold text-[#1A1A1A]">{entry.title}</h4>
      <p className="mt-2 text-sm text-[#666]">
        {truncate(entry.body, compact ? 80 : 120)}{" "}
        <button onClick={onOpen} className="font-semibold text-[#1A1A1A] hover:underline">
          Read more
        </button>
      </p>

      {/* SUPERVISOR FEEDBACK CALLOUT ON CARD */}
      {entry.review?.comment && (
        <div
          className={`mt-4 rounded-xl border p-3 text-xs leading-relaxed ${
            entry.status === "approved"
              ? "border-green-200 bg-green-50/70 text-green-900"
              : entry.status === "rejected"
              ? "border-red-200 bg-red-50/80 text-red-900"
              : "border-gray-200 bg-gray-50 text-[#374151]"
          }`}
        >
          <span className="font-bold">Supervisor Comment: </span>
          <span className="italic">&ldquo;{truncate(entry.review.comment, 100)}&rdquo;</span>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          onClick={onDownload}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-[#1A1A1A] hover:bg-[#e6ac00]"
        >
          <DownloadIcon className="h-4 w-4" />
          Download
        </button>

        {onEdit &&
          (canEdit ? (
            <button
              onClick={onEdit}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                entry.status === "rejected"
                  ? "border border-[#DC2626] bg-red-50 text-[#DC2626] hover:bg-red-100"
                  : "border border-[#E5E7EB] text-[#1A1A1A] hover:bg-gray-50"
              }`}
            >
              <EditIcon className="h-4 w-4" />
              {entry.status === "rejected" ? "Edit & Resubmit" : "Edit"}
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
  );
}
