"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { SearchIcon, FilterIcon, UsersIcon, ChevronRightIcon, PrinterIcon } from "@/components/ui/icons";
import { SearchSuggestionsPopover } from "@/components/ui/SearchSuggestionsPopover";
import type { StudentRowData } from "@/lib/admin-students-data";
import { downloadSummaryReportPDF } from "@/lib/pdf-export";
import { updateStudentDepartmentAction } from "@/app/admin/actions";

interface AdminStudentsViewProps {
  adminName?: string;
  adminEmail?: string;
  totalCount?: number;
  activeCount?: number;
  completedCount?: number;
  students?: StudentRowData[];
}

export type FilterOption =
  | "All"
  | "Oldest"
  | "Newest"
  | "Most Active"
  | "Least Active"
  | "Inactive";

export function AdminStudentsView({
  adminName = "Admin User",
  adminEmail = "admin@elogbook.app",
  totalCount = 0,
  activeCount: propActiveCount,
  completedCount: propCompletedCount,
  students = [],
}: AdminStudentsViewProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">("all");
  const [activeFilter, setActiveFilter] = useState<FilterOption>("All");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const filterRef = useRef<HTMLDivElement>(null);

  // Department edit modal states
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [selectedStudentForDept, setSelectedStudentForDept] = useState<StudentRowData | null>(null);
  const [deptInputValue, setDeptInputValue] = useState("");
  const [deptSaving, setDeptSaving] = useState(false);
  const [deptError, setDeptError] = useState("");

  const handleSaveDepartmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForDept || !deptInputValue.trim()) return;

    setDeptSaving(true);
    setDeptError("");

    const res = await updateStudentDepartmentAction({
      studentId: selectedStudentForDept.id,
      department: deptInputValue.trim(),
    });

    setDeptSaving(false);
    if (res.success) {
      setDeptModalOpen(false);
      setSelectedStudentForDept(null);
      startTransition(() => {
        router.refresh();
      });
    } else {
      setDeptError(res.error || "Failed to update department.");
    }
  };

  // Close filter dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Supabase Real-Time Listener
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("admin-students-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          startTransition(() => {
            router.refresh();
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "supervisors_students" },
        () => {
          startTransition(() => {
            router.refresh();
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "logbook_entries" },
        () => {
          startTransition(() => {
            router.refresh();
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const handleManualRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const calculatedActiveCount = propActiveCount ?? students.filter((s) => s.siwesStatus !== "completed").length;
  const calculatedCompletedCount = propCompletedCount ?? students.filter((s) => s.siwesStatus === "completed").length;

  // Search & Tab Filter Processing
  let filteredStudents = students.filter((s) => {
    if (activeTab === "active" && s.siwesStatus === "completed") return false;
    if (activeTab === "completed" && s.siwesStatus !== "completed") return false;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q) ||
      s.supervisorName.toLowerCase().includes(q)
    );
  });

  // Apply Sort Filter Options
  if (activeFilter === "Inactive") {
    filteredStudents = filteredStudents.filter((s) => s.status === "Inactive");
  } else if (activeFilter === "Oldest") {
    filteredStudents = [...filteredStudents].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  } else if (activeFilter === "Newest") {
    filteredStudents = [...filteredStudents].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } else if (activeFilter === "Most Active") {
    filteredStudents = [...filteredStudents].sort(
      (a, b) => b.entriesCount - a.entriesCount
    );
  } else if (activeFilter === "Least Active") {
    filteredStudents = [...filteredStudents].sort(
      (a, b) => a.entriesCount - b.entriesCount
    );
  }

  const filterOptions: FilterOption[] = [
    "All",
    "Oldest",
    "Newest",
    "Most Active",
    "Least Active",
    "Inactive",
  ];

  const handleBulkPrintStudent = (st: StudentRowData) => {
    const logs = st.logEntries || [];
    const approvedLogs = logs.filter((l) => l.status === "approved");
    const logsToPrint = approvedLogs.length > 0 ? approvedLogs : logs;
    downloadSummaryReportPDF(
      logsToPrint,
      `Completed SIWES Logbook — ${st.name}`,
      st.name
    );
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Sidebar */}
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-col md:pl-64">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
          {/* Header */}
          <AdminHeader
            adminName={adminName}
            adminEmail={adminEmail}
            onMenuToggle={() => setSidebarOpen(true)}
            onRefresh={handleManualRefresh}
            isRefreshing={isPending}
          />

          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
            <Link href="/admin" className="hover:text-gray-900 transition-colors">
              Admin Dashboard
            </Link>
            <ChevronRightIcon className="h-3.5 w-3.5 text-gray-400" />
            <span className="font-semibold text-[#111827]">Students</span>
          </div>

          {/* Page Header */}
          <div className="mt-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">
                Students Record Directory
              </h1>
              <p className="mt-1 text-sm text-[#6B7280]">
                Tracking {totalCount.toLocaleString()} total students ({calculatedActiveCount} active, {calculatedCompletedCount} completed)
              </p>
            </div>

            {/* Top Level Category Tabs */}
            <div className="inline-flex rounded-xl bg-gray-200/70 p-1 self-start sm:self-auto">
              <button
                onClick={() => setActiveTab("all")}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                  activeTab === "all"
                    ? "bg-white text-[#111827] shadow-sm"
                    : "text-[#4B5563] hover:text-[#111827]"
                }`}
              >
                <span>All Students</span>
                <span className="rounded-full bg-gray-300 px-2 py-0.5 text-[10px] font-extrabold text-gray-800">
                  {totalCount}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("active")}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                  activeTab === "active"
                    ? "bg-white text-[#111827] shadow-sm"
                    : "text-[#4B5563] hover:text-[#111827]"
                }`}
              >
                <span>Active</span>
                <span className="rounded-full bg-[#FFC107] px-2 py-0.5 text-[10px] font-extrabold text-[#111827]">
                  {calculatedActiveCount}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("completed")}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                  activeTab === "completed"
                    ? "bg-white text-[#111827] shadow-sm"
                    : "text-[#4B5563] hover:text-[#111827]"
                }`}
              >
                <span>Completed Record</span>
                <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                  {calculatedCompletedCount}
                </span>
              </button>
            </div>
          </div>

          {/* Search Bar & Filter Controls Row */}
          <div className="mb-6 flex flex-wrap items-center gap-4">
            {/* Search Input Box */}
            <div className="relative flex-1 min-w-[260px] max-w-md">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <SearchIcon className="h-4 w-4 text-[#9CA3AF]" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-[#111827] placeholder-[#9CA3AF] shadow-xs outline-none transition-all focus:border-[#EAB308] focus:ring-2 focus:ring-[#EAB308]/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-semibold text-gray-400 hover:text-gray-600"
                >
                  Clear
                </button>
              )}

              <SearchSuggestionsPopover
                isOpen={!!searchQuery.trim()}
                onClose={() => {}}
                query={searchQuery}
                categoryLabel="Student Suggestions"
                suggestions={filteredStudents.slice(0, 5).map((s) => ({
                  id: s.id,
                  title: s.name,
                  subtitle: `${s.email} • ${s.department}`,
                  badge: {
                    text: s.status,
                    variant: s.status === "Active" ? "success" : s.status === "Completed" ? "success" : "danger",
                  },
                  onClick: () => setSearchQuery(s.name),
                }))}
              />
            </div>

            {/* Filter Dropdown Toggle & Overlay Menu */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-xs transition-colors ${
                  filterMenuOpen || activeFilter !== "All"
                    ? "border-[#EAB308] bg-[#FEF9E6] text-[#111827] font-semibold"
                    : "border-gray-200 bg-white text-[#4B5563] hover:bg-gray-50"
                }`}
              >
                <span>Filter</span>
                <FilterIcon className="h-4 w-4" />
              </button>

              {/* Filter Popover Overlay Menu */}
              {filterMenuOpen && (
                <div className="absolute left-0 mt-2 z-50 w-44 rounded-xl bg-[#1E1E1E] p-3 text-white shadow-xl ring-1 ring-black/10">
                  <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-[#FACC15]">
                    Filter by:
                  </div>
                  <div className="mt-1 flex flex-col gap-1">
                    {filterOptions.map((opt) => {
                      const isSelected = activeFilter === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => {
                            setActiveFilter(opt);
                            setFilterMenuOpen(false);
                          }}
                          className={`w-full rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                            isSelected
                              ? "bg-[#333333] text-white font-semibold"
                              : "text-gray-300 hover:bg-[#2A2A2A] hover:text-white"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Students Table Section */}
          <div className="flex flex-col rounded-2xl border border-gray-100/80 bg-white p-6 shadow-xs">
            <div className="overflow-x-auto rounded-xl border border-gray-100 bg-[#F9FAFB]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#E5E7EB]/60 border-b border-gray-200/80">
                    <th className="px-6 py-3.5 text-xs font-semibold text-[#4B5563]">
                      Student
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-[#4B5563]">
                      Department
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-[#4B5563]">
                      Supervisor
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-[#4B5563]">
                      {activeTab === "completed" ? "Completed Date" : "Last Activity"}
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-[#4B5563]">
                      Status
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-[#4B5563] text-right">
                      Actions / Export
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                            <UsersIcon className="h-6 w-6" />
                          </div>
                          <span className="mt-3 text-sm font-semibold text-[#111827]">
                            No students found
                          </span>
                          <span className="mt-1 text-xs text-[#6B7280]">
                            {searchQuery
                              ? `No results matching "${searchQuery}". Try clearing search.`
                              : activeTab === "completed"
                              ? "No completed internship records yet."
                              : "No students registered in the database yet."}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-gray-50/80 transition-colors"
                      >
                        {/* Student Name & Avatar */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${row.avatarBg} ${row.avatarTextColor}`}
                            >
                              {row.initials}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-[#111827]">
                                {row.name}
                              </span>
                              <span className="text-xs text-gray-400">
                                {row.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Department - Interactive Edit Trigger */}
                        <td className="px-6 py-4 text-sm font-medium text-[#4B5563]">
                          <div
                            className="inline-flex items-center gap-2 group cursor-pointer"
                            onClick={() => {
                              setSelectedStudentForDept(row);
                              setDeptInputValue(row.department === "General SIWES" ? "" : row.department);
                              setDeptModalOpen(true);
                            }}
                            title="Click to assign or update department"
                          >
                            <span className={row.department === "General SIWES" ? "italic text-gray-400" : "text-[#4B5563]"}>
                              {row.department}
                            </span>
                            <button
                              type="button"
                              className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                              title="Edit Department"
                            >
                              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                          </div>
                        </td>

                        {/* Supervisor */}
                        <td className="px-6 py-4 text-sm font-medium text-[#111827]">
                          <span
                            className={
                              row.supervisorName === "Unassigned"
                                ? "text-amber-600 font-semibold"
                                : "text-[#111827]"
                            }
                          >
                            {row.supervisorName}
                          </span>
                        </td>

                        {/* Last Activity / Completed Date */}
                        <td className="px-6 py-4 text-sm font-medium text-[#4B5563]">
                          {row.siwesStatus === "completed" ? (
                            <div className="flex flex-col">
                              <span className="font-bold text-emerald-700">
                                {row.siwesCompletedAt
                                  ? new Date(row.siwesCompletedAt).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })
                                  : "Completed"}
                              </span>
                              {row.endDate && (
                                <span className="text-[11px] text-gray-400">
                                  End: {row.endDate}
                                </span>
                              )}
                            </div>
                          ) : (
                            row.lastActivity
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="px-6 py-4">
                          {row.siwesStatus === "completed" || row.status === "Completed" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 whitespace-nowrap border border-emerald-300">
                              🎓 SIWES Completed
                            </span>
                          ) : row.status === "Active" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-semibold text-[#15803D] whitespace-nowrap">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEE2E2] px-3 py-1 text-xs font-semibold text-[#DC2626] whitespace-nowrap">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* Action / Export */}
                        <td className="px-6 py-4 text-right">
                          {row.siwesStatus === "completed" ? (
                            <button
                              onClick={() => handleBulkPrintStudent(row)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-xs"
                              title="Export student's approved logbook entries PDF"
                            >
                              <PrinterIcon className="h-3.5 w-3.5" />
                              Bulk Print PDF
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 font-medium">
                              {row.approvedCount} Approved Logs
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Department Modal */}
      {deptModalOpen && selectedStudentForDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto my-auto rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
            <button
              onClick={() => {
                setDeptModalOpen(false);
                setSelectedStudentForDept(null);
              }}
              className="absolute right-5 top-5 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-xl font-bold text-[#111827]">Assign / Update Department</h2>
            <p className="mt-1 text-xs text-[#6B7280]">
              Set department for <span className="font-semibold text-gray-900">{selectedStudentForDept.name}</span>
            </p>

            {deptError && (
              <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-600 font-medium">
                {deptError}
              </div>
            )}

            <form onSubmit={handleSaveDepartmentSubmit} className="mt-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                  Department / Course of Study
                </label>
                <input
                  type="text"
                  value={deptInputValue}
                  onChange={(e) => setDeptInputValue(e.target.value)}
                  placeholder="e.g. Computer Science, Electrical Engineering..."
                  className="w-full rounded-xl border border-gray-200 bg-[#F9FAFB] px-4 py-3 text-sm font-medium text-[#111827] outline-none focus:border-[#FFC107]"
                  autoFocus
                />
              </div>

              {/* Quick Suggestion Chips */}
              <div>
                <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Quick Suggestions:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Computer Science",
                    "Electrical Engineering",
                    "Mechanical Engineering",
                    "Software Engineering",
                    "Information Technology",
                    "Cybersecurity",
                    "Civil Engineering",
                    "Mass Communication",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setDeptInputValue(suggestion)}
                      className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-[#FEF9E6] hover:border-[#FFC107] transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDeptModalOpen(false);
                    setSelectedStudentForDept(null);
                  }}
                  className="rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-[#374151] hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!deptInputValue.trim() || deptSaving}
                  className={`rounded-xl py-3 text-sm font-bold transition-colors ${
                    deptInputValue.trim()
                      ? "bg-[#FFC107] text-[#111827] hover:bg-[#e5ac00]"
                      : "bg-[#9CA3AF] text-white cursor-not-allowed"
                  }`}
                >
                  {deptSaving ? "Saving..." : "Save Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
