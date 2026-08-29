"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Banner } from "@/components/ui/Banner";
import { StudentAvatar } from "@/components/supervisor/StudentAvatar";
import { downloadSummaryReportPDF, type PDFReportEntry } from "@/lib/pdf-export";
import {
  PlusIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  BadgeCheckIcon,
  ClockIcon,
  PrinterIcon,
} from "@/components/ui/icons";

export interface StudentVM {
  id: string;
  name: string;
  studentId: string;
  avatarUrl: string | null;
  active: boolean;
  siwesStatus: "active" | "completed";
  siwesCompletedAt?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  department?: string | null;
  totalLogs?: number;
  approvedLogs?: number;
  progress: number;
  lastActive: string;
  placeOfWork: string | null;
  entries?: PDFReportEntry[];
}

const PAGE_SIZE = 6;

interface StudentsGridProps {
  activeStudents: StudentVM[];
  completedStudents: StudentVM[];
  searchQuery?: string;
  students?: StudentVM[]; // fallback for backwards compatibility
}

export function StudentsGrid({
  activeStudents = [],
  completedStudents = [],
  searchQuery = "",
  students: fallbackStudents,
}: StudentsGridProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  const [page, setPage] = useState(1);
  const [assignOpen, setAssignOpen] = useState(false);

  const displayList =
    fallbackStudents && fallbackStudents.length > 0
      ? fallbackStudents
      : activeTab === "active"
      ? activeStudents
      : completedStudents;

  const totalPages = Math.max(1, Math.ceil(displayList.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * PAGE_SIZE;
  const visible = displayList.slice(start, start + PAGE_SIZE);
  const rangeStart = displayList.length === 0 ? 0 : start + 1;
  const rangeEnd = Math.min(start + PAGE_SIZE, displayList.length);

  const isFullCapacity = activeStudents.length >= 5;

  return (
    <>
      {/* Tab Switcher & Capacity Banner */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-xl bg-gray-200/70 p-1">
          <button
            onClick={() => {
              setActiveTab("active");
              setPage(1);
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "active"
                ? "bg-white text-[#111827] shadow-sm"
                : "text-[#4B5563] hover:text-[#111827]"
            }`}
          >
            <span>Active Students</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                activeTab === "active" ? "bg-[#FFC107] text-[#111827]" : "bg-gray-300 text-gray-700"
              }`}
            >
              {activeStudents.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("completed");
              setPage(1);
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "completed"
                ? "bg-white text-[#111827] shadow-sm"
                : "text-[#4B5563] hover:text-[#111827]"
            }`}
          >
            <span>Completed Students</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                activeTab === "completed" ? "bg-emerald-500 text-white" : "bg-gray-300 text-gray-700"
              }`}
            >
              {completedStudents.length}
            </span>
          </button>
        </div>

        {/* Capacity Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Supervision Workload:</span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              isFullCapacity
                ? "bg-amber-100 text-amber-800 border border-amber-300"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isFullCapacity ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
              }`}
            />
            {activeStudents.length}/5 Max Active Capacity
          </span>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <BadgeCheckIcon className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-base font-bold text-[#1A1A1A]">
            {activeTab === "active"
              ? "No active students assigned"
              : "No completed students yet"}
          </h3>
          <p className="mt-1 text-xs text-[#666]">
            {searchQuery
              ? `No student matches "${searchQuery}".`
              : activeTab === "active"
              ? "Click 'Assign Student' to add a student to your supervision."
              : "Students will appear here automatically when their internship end date arrives."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((s) => (
            <StudentCard key={s.id} student={s} />
          ))}

          {/* Assign new student card (only in Active tab) */}
          {activeTab === "active" && (
            <button
              onClick={() => setAssignOpen(true)}
              className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#D1D5DB] bg-white/50 p-6 text-center transition-colors hover:border-primary hover:bg-primary/5"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FEF3D6] text-[#1A1A1A]">
                <PlusIcon className="h-6 w-6" />
              </span>
              <span className="text-sm font-semibold text-[#1A1A1A]">Assign Student</span>
              <span className="text-xs text-[#9CA3AF]">Add a student to your supervision list</span>
            </button>
          )}
        </div>
      )}

      {/* Footer + pagination */}
      <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm text-[#666]">
          Showing <span className="font-semibold text-[#1A1A1A]">{rangeStart}</span>–
          <span className="font-semibold text-[#1A1A1A]">{rangeEnd}</span> of{" "}
          <span className="font-semibold text-[#1A1A1A]">{displayList.length}</span> students
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={current === 1}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#4B5563] disabled:opacity-40 enabled:hover:bg-gray-50"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`h-9 min-w-9 rounded-lg px-3 text-sm font-medium ${
                  n === current
                    ? "bg-primary text-[#1A1A1A]"
                    : "border border-[#E5E7EB] bg-white text-[#4B5563] hover:bg-gray-50"
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={current === totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#4B5563] disabled:opacity-40 enabled:hover:bg-gray-50"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <AssignStudentModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        onAssigned={() => {
          setAssignOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}

function StudentCard({ student }: { student: StudentVM }) {
  const isCompleted = student.siwesStatus === "completed";

  const handleBulkPrint = () => {
    const approvedEntries = (student.entries || []).filter(
      (e) => e.status === "approved"
    );
    const logsToPrint = approvedEntries.length > 0 ? approvedEntries : student.entries || [];
    downloadSummaryReportPDF(
      logsToPrint,
      `Official SIWES Logbook Summary — ${student.name}`,
      student.name
    );
  };

  return (
    <div
      className={`flex flex-col rounded-2xl border p-5 shadow-sm transition-all ${
        isCompleted
          ? "border-emerald-200 bg-gradient-to-b from-emerald-50/40 via-white to-white"
          : "border-[#E5E7EB] bg-white"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <StudentAvatar name={student.name} url={student.avatarUrl} size={48} />
          <div className="min-w-0">
            <p className="truncate font-bold text-[#1A1A1A]">{student.name}</p>
            <p className="text-xs text-[#9CA3AF]">ID: {student.studentId}</p>
          </div>
        </div>

        {isCompleted ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-800">
            🎓 Completed
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#15803D]">
            <BadgeCheckIcon className="h-3.5 w-3.5" />
            Active
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-1 text-xs text-gray-600">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-500">Placement:</span>
          <span className="font-bold text-[#111827] truncate max-w-[170px]">
            {student.placeOfWork || "MTN Nigeria Office"}
          </span>
        </div>

        {isCompleted ? (
          <div className="flex items-center justify-between mt-1">
            <span className="font-medium text-gray-500">Completed Date:</span>
            <span className="font-bold text-emerald-700">
              {student.siwesCompletedAt
                ? new Date(student.siwesCompletedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Offboarded"}
            </span>
          </div>
        ) : (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#666]">Progress</span>
              <span className="font-semibold text-[#1A1A1A]">{student.progress}%</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${student.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-[#9CA3AF]">
        <div className="flex items-center gap-1.5">
          <ClockIcon className="h-3.5 w-3.5" />
          {isCompleted ? "Program Finished" : `Last active: ${student.lastActive}`}
        </div>
        {student.approvedLogs !== undefined && (
          <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
            {student.approvedLogs} Approved Logs
          </span>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Link
          href={`/supervisor/history?student=${student.id}`}
          className="inline-flex items-center justify-center rounded-xl border border-[#E5E7EB] bg-white py-2.5 text-xs font-bold text-[#1A1A1A] transition-colors hover:bg-gray-50"
        >
          View Logs
        </Link>

        {isCompleted ? (
          <button
            onClick={handleBulkPrint}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors"
          >
            <PrinterIcon className="h-3.5 w-3.5" />
            Bulk Print PDF
          </button>
        ) : (
          <Link
            href={`/supervisor/history?student=${student.id}`}
            className="inline-flex items-center justify-center rounded-xl bg-[#FFC107] py-2.5 text-xs font-bold text-[#111827] shadow-xs hover:bg-[#e5ac00] transition-colors"
          >
            Review Logs
          </Link>
        )}
      </div>
    </div>
  );
}

function AssignStudentModal({
  open,
  onClose,
  onAssigned,
}: {
  open: boolean;
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!email.trim()) {
      setError("Please enter the student's email address.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("assign_student_by_email", {
      p_email: email.trim(),
    });
    setLoading(false);

    if (rpcError) {
      setError(rpcError.message || "Could not assign this student.");
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    setSuccess(`${row?.student_name || "Student"} has been assigned to you.`);
    setEmail("");
    setTimeout(onAssigned, 900);
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="max-w-md">
        <h2 className="text-xl font-bold text-[#1A1A1A]">Assign a Student</h2>
        <p className="mt-1 text-sm text-[#666]">
          Enter the student&apos;s registered email address to add them to your supervision list (Max 5 active students per supervisor).
        </p>

        {error && (
          <div className="mt-4">
            <Banner type="error" message={error} />
          </div>
        )}
        {success && (
          <div className="mt-4">
            <Banner type="success" message={success} />
          </div>
        )}

        <form onSubmit={handleAssign} className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#1A1A1A]">Student Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              autoFocus
              className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-2 focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-[#E5E7EB] bg-white py-3 text-sm font-semibold text-[#1A1A1A] transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <div className="flex-1">
              <Button type="submit" loading={loading}>
                Assign Student
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
