import Link from "next/link";
import { StatusBadge, type EntryStatus } from "@/components/dashboard/StatusBadge";
import { DownloadIcon, EditIcon } from "@/components/ui/icons";

export interface RecentActivityRow {
  id: string;
  date: string;
  description: string;
  status: EntryStatus;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function RecentActivityTable({ rows }: { rows: RecentActivityRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-10 text-center text-sm text-[#666]">
        No log entries yet. Create your first log to see it here.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="border-b border-[#E5E7EB] text-sm font-semibold text-[#1A1A1A]">
              <th className="px-6 py-4 text-center font-semibold">Date</th>
              <th className="px-6 py-4 text-center font-semibold">Description</th>
              <th className="px-6 py-4 text-center font-semibold">Status</th>
              <th className="px-6 py-4 text-center font-semibold">View</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id} className={i > 0 ? "border-t border-[#E5E7EB]" : ""}>
                <td className="whitespace-nowrap px-6 py-5 text-center text-sm text-[#1A1A1A]">
                  {formatDate(row.date)}
                </td>
                <td className="px-6 py-5 text-center text-sm text-[#1A1A1A]">
                  {row.description}
                </td>
                <td className="px-6 py-5 text-center">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-6 py-5 text-center">
                  {row.status === "approved" ? (
                    <Link
                      href={`/student/report?entry=${row.id}`}
                      className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-[#E5E7EB] px-4 py-2 text-xs font-semibold text-[#1A1A1A] hover:bg-gray-50"
                    >
                      <DownloadIcon className="h-4 w-4" />
                      Download Report
                    </Link>
                  ) : (
                    <Link
                      href={`/student/report?entry=${row.id}`}
                      className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-[#E5E7EB] px-4 py-2 text-xs font-semibold text-[#1A1A1A] hover:bg-gray-50"
                    >
                      <EditIcon className="h-4 w-4" />
                      Edit
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
