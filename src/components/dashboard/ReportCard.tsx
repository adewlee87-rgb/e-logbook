import { DownloadIcon, ReportIcon } from "@/components/ui/icons";
import type { EntryStatus } from "@/components/dashboard/StatusBadge";

export interface ReportEntry {
  id: string;
  title: string;
  body: string;
  date: string;
  createdAt: string;
  imageUrl: string | null;
  status: EntryStatus;
}

function formatRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}hrs ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function truncate(text: string, length: number) {
  return text.length > length ? `${text.slice(0, length).trim()}...` : text;
}

interface ReportCardProps {
  entry: ReportEntry;
  onOpen: () => void;
  onDownload: () => void;
  compact?: boolean;
}

export function ReportCard({ entry, onOpen, onDownload, compact = false }: ReportCardProps) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
      <div className="flex items-start justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FEF3D6] text-primary">
          <ReportIcon className="h-5 w-5" />
        </span>
        <span className="text-xs text-[#9CA3AF]">{formatRelativeTime(entry.createdAt)}</span>
      </div>

      <h4 className="mt-4 text-lg font-bold text-[#1A1A1A]">{entry.title}</h4>
      <p className="mt-2 text-sm text-[#666]">
        {truncate(entry.body, compact ? 80 : 120)}{" "}
        <button onClick={onOpen} className="font-semibold text-[#1A1A1A] hover:underline">
          Read more
        </button>
      </p>

      <button
        onClick={onDownload}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-[#1A1A1A] hover:bg-[#e6ac00]"
      >
        <DownloadIcon className="h-4 w-4" />
        Download
      </button>
    </div>
  );
}
