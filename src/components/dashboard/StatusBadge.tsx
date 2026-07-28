export type EntryStatus = "draft" | "submitted" | "approved" | "rejected";

const STATUS_CONFIG: Record<EntryStatus, { label: string; bg: string; text: string }> = {
  draft: { label: "Draft", bg: "#F3F4F6", text: "#6B7280" },
  submitted: { label: "Submitted", bg: "#DBEAFE", text: "#2563EB" },
  approved: { label: "Completed", bg: "#DCFCE7", text: "#16A34A" },
  rejected: { label: "Rejected", bg: "#FEE2E2", text: "#DC2626" },
};

export function StatusBadge({ status }: { status: EntryStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      {config.label}
    </span>
  );
}
