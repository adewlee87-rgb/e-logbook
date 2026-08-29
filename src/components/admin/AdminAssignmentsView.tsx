"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { SearchIcon, FilterIcon, ChevronRightIcon } from "@/components/ui/icons";
import { SearchSuggestionsPopover } from "@/components/ui/SearchSuggestionsPopover";
import { assignSupervisorAction, updateStudentDepartmentAction } from "@/app/admin/actions";
import type { SupervisorRowData, StudentOption } from "@/lib/admin-supervisors-data";

interface AdminAssignmentsViewProps {
  adminName?: string;
  adminEmail?: string;
  supervisors?: SupervisorRowData[];
  students?: StudentOption[];
}

type FilterOption = "All" | "Assigned" | "Needs Assignment";

const AVATAR_PALETTES = [
  { bg: "bg-[#A7F3D0]/70", text: "text-[#047857]" }, // Mint
  { bg: "bg-[#A5F3FC]/70", text: "text-[#0891B2]" }, // Cyan
  { bg: "bg-[#CFFAFE]", text: "text-[#0284C7]" },    // Light Blue
  { bg: "bg-[#A5F3FC]", text: "text-[#0D9488]" },    // Teal
  { bg: "bg-[#BFDBFE]", text: "text-[#1D4ED8]" },    // Blue
  { bg: "bg-[#DDD6FE]", text: "text-[#6D28D9]" },    // Purple
  { bg: "bg-[#FEF3C7]", text: "text-[#D97706]" },    // Amber
];

function getInitials(name: string): string {
  if (!name) return "ST";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function AdminAssignmentsView({
  adminName = "Admin User",
  adminEmail = "superadmin@gmail.com",
  supervisors = [],
  students = [],
}: AdminAssignmentsViewProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterOption>("All");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const filterRef = useRef<HTMLDivElement>(null);

  // Assign supervisor modal states
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState("");

  // Department edit modal states
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [selectedStudentForDept, setSelectedStudentForDept] = useState<StudentOption | null>(null);
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

  // Close filter popover on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Supabase Realtime Listener
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("admin-assignments-realtime")
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
        { event: "*", schema: "public", table: "profiles" },
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

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedSupervisorId) return;

    setAssignLoading(true);
    setAssignError("");

    const res = await assignSupervisorAction({
      studentId: selectedStudentId,
      supervisorId: selectedSupervisorId,
    });

    setAssignLoading(false);
    if (res.success) {
      setAssignModalOpen(false);
      setSelectedSupervisorId("");
      startTransition(() => {
        router.refresh();
      });
    } else {
      setAssignError(res.error || "Failed to assign supervisor.");
    }
  };

  // Supervisor lookup map
  const supMap = new Map(supervisors.map((sup) => [sup.id, sup]));

  // Filter students logic
  let filteredStudents = students.filter((st) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const sup = st.currentSupervisorId ? supMap.get(st.currentSupervisorId) : null;
    return (
      st.name.toLowerCase().includes(q) ||
      st.email.toLowerCase().includes(q) ||
      st.department.toLowerCase().includes(q) ||
      (sup && sup.name.toLowerCase().includes(q))
    );
  });

  if (activeFilter === "Assigned") {
    filteredStudents = filteredStudents.filter((st) => st.currentSupervisorId !== null);
  } else if (activeFilter === "Needs Assignment") {
    filteredStudents = filteredStudents.filter((st) => st.currentSupervisorId === null);
  }

  // Count unassigned students for alert banner
  const unassignedCount = students.filter((st) => !st.currentSupervisorId).length;

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Sidebar */}
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} assignmentsCount={unassignedCount} />

      {/* Main Content Area */}
      <div className="flex flex-col md:pl-64">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
          {/* Top Header */}
          <AdminHeader
            adminName={adminName}
            adminEmail={adminEmail}
            onMenuToggle={() => setSidebarOpen(true)}
            onRefresh={handleManualRefresh}
            isRefreshing={isPending}
          />

          {/* Breadcrumbs matching Design */}
          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
            <Link href="/admin" className="hover:text-gray-900 transition-colors">
              Admin Dashboard
            </Link>
            <ChevronRightIcon className="h-3.5 w-3.5 text-gray-400" />
            <Link href="/admin/students" className="hover:text-gray-900 transition-colors">
              Students
            </Link>
            <ChevronRightIcon className="h-3.5 w-3.5 text-gray-400" />
            <Link href="/admin/supervisors" className="hover:text-gray-900 transition-colors">
              Supervisors
            </Link>
            <ChevronRightIcon className="h-3.5 w-3.5 text-gray-400" />
            <span className="font-semibold text-[#111827]">Assignments</span>
          </div>

          {/* Page Title & Subtitle */}
          <div className="mt-4 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">
              Student - Supervisor Assignment
            </h1>
            <p className="mt-1 text-sm text-[#6B7280]">
              Pair student with supervisor and manage existing assignments
            </p>
          </div>

          {/* Warning / Notification Banner matching Design */}
          <div className="mb-6 flex items-center gap-3.5 rounded-2xl border border-[#FDE68A] bg-[#FEF9E6] px-5 py-4 text-[#92400E] shadow-2xs">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#F59E0B] text-xs font-black text-[#D97706]">
              !
            </div>
            <p className="text-sm font-medium text-[#78350F]">
              <span className="font-bold">
                {unassignedCount} {unassignedCount === 1 ? "student is" : "students are"} not yet assigned to a supervisor.
              </span>{" "}
              Use the assign button to pair them.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <SearchIcon className="h-4 w-4 text-[#9CA3AF]" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-[#111827] placeholder-[#9CA3AF] shadow-2xs outline-none transition-all focus:border-[#EAB308] focus:ring-2 focus:ring-[#EAB308]/20"
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
                categoryLabel="Assignment Suggestions"
                suggestions={filteredStudents.slice(0, 5).map((st) => ({
                  id: st.id,
                  title: st.name,
                  subtitle: `${st.email} • ${st.department}`,
                  badge: {
                    text: st.currentSupervisorId ? "Assigned" : "Needs Assignment",
                    variant: st.currentSupervisorId ? "success" : "warning",
                  },
                  onClick: () => setSearchQuery(st.name),
                }))}
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-2xs transition-colors ${
                  filterMenuOpen || activeFilter !== "All"
                    ? "border-[#EAB308] bg-[#FEF9E6] text-[#111827] font-semibold"
                    : "border-gray-200 bg-white text-[#4B5563] hover:bg-gray-50"
                }`}
              >
                <span>Filter</span>
                <FilterIcon className="h-4 w-4" />
              </button>

              {filterMenuOpen && (
                <div className="absolute left-0 mt-2 z-50 w-44 rounded-xl bg-[#1E1E1E] p-3 text-white shadow-xl ring-1 ring-black/10">
                  <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-[#FACC15]">
                    Filter by:
                  </div>
                  <div className="mt-1 flex flex-col gap-1">
                    {(["All", "Assigned", "Needs Assignment"] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setActiveFilter(opt);
                          setFilterMenuOpen(false);
                        }}
                        className={`w-full rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                          activeFilter === opt
                            ? "bg-[#333333] text-white font-semibold"
                            : "text-gray-300 hover:bg-[#2A2A2A] hover:text-white"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Assignments Table Section matching Design */}
          <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-2xs">
            <div className="overflow-x-auto rounded-xl border border-gray-100 bg-[#F9FAFB]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#E5E7EB]/60 border-b border-gray-200/80">
                    <th className="px-6 py-3.5 text-xs font-semibold text-[#4B5563]">Student</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-[#4B5563]">Department</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-[#4B5563]">Current Supervisor</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-[#4B5563]">Status</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-[#4B5563]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                        No student assignments found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((st, idx) => {
                      const sup = st.currentSupervisorId ? supMap.get(st.currentSupervisorId) : null;
                      const isAssigned = !!sup;
                      const initials = getInitials(st.name);
                      const palette = AVATAR_PALETTES[idx % AVATAR_PALETTES.length];

                      return (
                        <tr key={st.id} className="hover:bg-gray-50/80 transition-colors">
                          {/* Student Column */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${palette.bg} ${palette.text}`}
                              >
                                {initials}
                              </div>
                              <span className="text-sm font-bold text-[#111827]">
                                {st.name}
                              </span>
                            </div>
                          </td>

                          {/* Department Column */}
                          <td className="px-6 py-4 text-sm font-medium text-[#4B5563]">
                            <div
                              className="inline-flex items-center gap-2 group cursor-pointer"
                              onClick={() => {
                                setSelectedStudentForDept(st);
                                setDeptInputValue(st.department === "General SIWES" ? "" : st.department);
                                setDeptModalOpen(true);
                              }}
                              title="Click to assign or update department"
                            >
                              <span className={st.department === "General SIWES" ? "italic text-gray-400" : "text-[#4B5563]"}>
                                {st.department}
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

                          {/* Current Supervisor Column */}
                          <td className="px-6 py-4 text-sm font-medium text-[#111827]">
                            {sup ? sup.name : <span className="text-[#4B5563]">-</span>}
                          </td>

                          {/* Status Badge */}
                          <td className="px-6 py-4">
                            {isAssigned ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-semibold text-[#15803D] whitespace-nowrap">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
                                Assigned
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF3C7] px-3 py-1 text-xs font-semibold text-[#D97706] whitespace-nowrap">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />
                                Needs Assignment
                              </span>
                            )}
                          </td>

                          {/* Action Button */}
                          <td className="px-6 py-4">
                            {isAssigned ? (
                              <button
                                onClick={() => {
                                  setSelectedStudentId(st.id);
                                  setSelectedSupervisorId(sup.id);
                                  setAssignModalOpen(true);
                                }}
                                className="rounded-lg border border-gray-300 bg-white px-5 py-1.5 text-xs font-semibold text-[#374151] hover:bg-gray-50 transition-colors shadow-2xs"
                              >
                                Change
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedStudentId(st.id);
                                  setSelectedSupervisorId(supervisors[0]?.id || "");
                                  setAssignModalOpen(true);
                                }}
                                className="rounded-lg bg-[#FFC107] px-6 py-1.5 text-xs font-bold text-[#111827] hover:bg-[#e5ac00] transition-colors shadow-2xs"
                              >
                                Assign
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Supervisor Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto my-auto rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
            {/* Close Button X */}
            <button
              onClick={() => setAssignModalOpen(false)}
              className="absolute right-5 top-5 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-xl font-bold text-[#111827]">Assign Supervisor</h2>

            {assignError && (
              <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-600 font-medium">
                {assignError}
              </div>
            )}

            <form onSubmit={handleAssignSubmit} className="mt-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                  Student Name
                </label>
                <input
                  type="text"
                  readOnly
                  value={selectedStudent?.name || ""}
                  className="w-full rounded-xl border border-gray-200 bg-[#F9FAFB] px-4 py-3 text-sm font-medium text-[#111827] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                  Email
                </label>
                <input
                  type="text"
                  readOnly
                  value={selectedStudent?.email || ""}
                  className="w-full rounded-xl border border-gray-200 bg-[#F9FAFB] px-4 py-3 text-sm font-medium text-[#111827] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-2">
                  Select Supervisor
                </label>
                <div className="flex flex-col gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {supervisors.length === 0 ? (
                    <div className="py-4 text-center text-xs text-gray-500">
                      No supervisors available in system. Add a supervisor first.
                    </div>
                  ) : (
                    supervisors.map((sup) => {
                      const isSelected = selectedSupervisorId === sup.id;
                      return (
                        <div
                          key={sup.id}
                          onClick={() => setSelectedSupervisorId(sup.id)}
                          className={`flex items-center justify-between rounded-xl border px-4 py-3 cursor-pointer transition-all ${
                            isSelected
                              ? "border-[#EAB308] bg-[#FEF9E6] shadow-2xs"
                              : "border-gray-100 bg-[#F9FAFB] hover:border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-[#111827]">
                              {sup.name}
                            </span>
                            <span className="text-xs text-[#6B7280]">
                              {sup.department}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#6B7280]">
                              {sup.assignedStudentsCount} students
                            </span>
                            {isSelected && (
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#111827] text-white">
                                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-[#374151] hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedSupervisorId || assignLoading}
                  className={`rounded-xl py-3 text-sm font-bold transition-colors ${
                    selectedSupervisorId
                      ? "bg-[#FFC107] text-[#111827] hover:bg-[#e5ac00]"
                      : "bg-[#9CA3AF] text-white cursor-not-allowed"
                  }`}
                >
                  {assignLoading ? "Assigning..." : "Assign Supervisor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
