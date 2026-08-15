import type { EntryStatus } from "@/components/dashboard/StatusBadge";

export type EntryType = "daily" | "weekly" | "monthly";

/* ------------------------------------------------------------------ */
/*  Review status badge — supervisor wording                           */
/*  submitted -> Pending Review, approved -> Approved, rejected ->      */
/*  Returned. (Student side calls approved "Completed"; supervisors     */
/*  think in review terms.)                                             */
/* ------------------------------------------------------------------ */

const REVIEW_STATUS: Record<EntryStatus, { label: string; bg: string; text: string; dot: string }> = {
  draft: { label: "Draft", bg: "#F3F4F6", text: "#6B7280", dot: "#9CA3AF" },
  submitted: { label: "Pending Review", bg: "#FEF3C7", text: "#B45309", dot: "#F59E0B" },
  approved: { label: "Approved", bg: "#DCFCE7", text: "#16A34A", dot: "#16A34A" },
  rejected: { label: "Returned", bg: "#FEE2E2", text: "#DC2626", dot: "#DC2626" },
};

export function ReviewStatusBadge({
  status,
  withDot = false,
}: {
  status: EntryStatus;
  withDot?: boolean;
}) {
  const c = REVIEW_STATUS[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {withDot && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c.dot }} />}
      {c.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Entry type badge                                                    */
/* ------------------------------------------------------------------ */

const ENTRY_TYPE: Record<EntryType, { label: string; upper: string; bg: string; text: string }> = {
  daily: { label: "Daily Log", upper: "DAILY LOG", bg: "#DCFCE7", text: "#16A34A" },
  weekly: { label: "Weekly Log", upper: "WEEKLY LOG", bg: "#DBEAFE", text: "#2563EB" },
  monthly: { label: "Monthly Log", upper: "MONTHLY LOG", bg: "#FEF3C7", text: "#B45309" },
};

export function EntryTypeBadge({
  type,
  uppercase = false,
}: {
  type: EntryType;
  uppercase?: boolean;
}) {
  const c = ENTRY_TYPE[type] ?? ENTRY_TYPE.daily;
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 font-semibold ${
        uppercase ? "text-[11px] leading-tight tracking-wide" : "text-xs"
      }`}
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {uppercase ? c.upper : c.label}
    </span>
  );
}
