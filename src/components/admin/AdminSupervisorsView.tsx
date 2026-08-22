"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import {
  SearchIcon,
  FilterIcon,
  SupervisorBadgeIcon,
  ChevronRightIcon,
  PlusIcon,
} from "@/components/ui/icons";
import type { SupervisorRowData, StudentOption } from "@/lib/admin-supervisors-data";
import { addSupervisorAction, assignSupervisorAction, deleteSupervisorAction } from "@/app/admin/actions";
import type { FilterOption } from "./AdminStudentsView";

interface AdminSupervisorsViewProps {
  adminName?: string;
  adminEmail?: string;
  totalCount?: number;
  supervisors?: SupervisorRowData[];
  unassignedStudents?: StudentOption[];
}

export function AdminSupervisorsView({
  adminName = "Admin User",
  adminEmail = "admin@elogbook.app",
  totalCount = 0,
  supervisors = [],
  unassignedStudents = [],
}: AdminSupervisorsViewProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterOption>("All");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const filterRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addDept, setAddDept] = useState("Frontend Development");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    unassignedStudents[0]?.id || ""
  );
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState("");

  // Delete supervisor modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [supervisorToDelete, setSupervisorToDelete] = useState<SupervisorRowData | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDeleteSupervisorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supervisorToDelete) return;

    setDeleteLoading(true);
    setDeleteError("");

    const res = await deleteSupervisorAction(supervisorToDelete.id);
    setDeleteLoading(false);

    if (res.success) {
      setDeleteModalOpen(false);
      setSupervisorToDelete(null);
      startTransition(() => {
        router.refresh();
      });
    } else {
      setDeleteError(res.error || "Failed to remove supervisor.");
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

  // Supabase Realtime Listener
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("admin-supervisors-realtime")
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

  // Add Supervisor Handler
  const handleAddSupervisorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addEmail) return;
    setAddLoading(true);
    setAddError("");

    const res = await addSupervisorAction({
      email: addEmail,
      department: addDept,
    });

    setAddLoading(false);
    if (res.success) {
      setAddEmail("");
      setAddModalOpen(false);
      startTransition(() => {
        router.refresh();
      });
    } else {
      setAddError(res.error || "Failed to add supervisor.");
    }
  };

  // Assign Supervisor Handler
  const handleAssignSupervisorSubmit = async (e: React.FormEvent) => {
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

  // Search & Filter Processing
  let filteredSupervisors = supervisors.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q)
    );
  });

  if (activeFilter === "Inactive") {
    filteredSupervisors = filteredSupervisors.filter((s) => s.status === "Inactive");
  } else if (activeFilter === "Oldest") {
    filteredSupervisors = [...filteredSupervisors].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  } else if (activeFilter === "Newest") {
    filteredSupervisors = [...filteredSupervisors].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } else if (activeFilter === "Most Active") {
    filteredSupervisors = [...filteredSupervisors].sort(
      (a, b) => b.assignedStudentsCount - a.assignedStudentsCount
    );
  } else if (activeFilter === "Least Active") {
    filteredSupervisors = [...filteredSupervisors].sort(
      (a, b) => a.assignedStudentsCount - b.assignedStudentsCount
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

  const selectedStudent = unassignedStudents.find((st) => st.id === selectedStudentId) || unassignedStudents[0] || {
    id: "sample-1",
    name: "Samuel Olaniyan",
    email: "samuelobanijesu@gmail.com",
    department: "General SIWES",
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

          {/* Breadcrumb Navigation matching Image 1 & 2 */}
          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
            <Link href="/admin" className="hover:text-gray-900 transition-colors">
              Admin Dashboard
            </Link>
            <ChevronRightIcon className="h-3.5 w-3.5 text-gray-400" />
            <Link href="/admin/students" className="hover:text-gray-900 transition-colors">
              Students
            </Link>
            <ChevronRightIcon className="h-3.5 w-3.5 text-gray-400" />
            <span className="font-semibold text-[#111827]">Supervisors</span>
          </div>

          {/* Page Header */}
          <div className="mt-4 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">
              Supervisors
            </h1>
            <p className="mt-1 text-sm text-[#6B7280]">
              {totalCount.toLocaleString()} Registered Supervisors
            </p>
          </div>

          {/* Controls Bar */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 flex-1">
              {/* Search Box */}
              <div className="relative flex-1 min-w-[260px] max-w-md">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <SearchIcon className="h-4 w-4 text-[#9CA3AF]" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search supervisor..."
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
              </div>

              {/* Filter Button & Overlay Menu */}
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

                {/* Filter Popover matching Image 2 */}
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

            {/* + Add Supervisor Button matching Image 1 */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAssignModalOpen(true)}
                className="hidden sm:flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-xs hover:bg-gray-50"
              >
                Assign Student
              </button>
              <button
                onClick={() => setAddModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-[#FFC107] px-5 py-2.5 text-sm font-bold text-[#111827] shadow-sm hover:bg-[#e5ac00] transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add Supervisor</span>
              </button>
            </div>
          </div>

          {/* Supervisors Table Section */}
          <div className="flex flex-col rounded-2xl border border-gray-100/80 bg-white p-6 shadow-xs">
            <div className="overflow-x-auto rounded-xl border border-gray-100 bg-[#F9FAFB]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#E5E7EB]/60 border-b border-gray-200/80">
                    <th className="px-6 py-3.5 text-xs font-semibold text-[#4B5563]">
                      Supervisor
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-[#4B5563]">
                      Department
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-[#4B5563]">
                      Assigned Students
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-[#4B5563]">
                      Completed
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-[#4B5563]">
                      Status
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-[#4B5563] text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredSupervisors.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                            <SupervisorBadgeIcon className="h-6 w-6" />
                          </div>
                          <span className="mt-3 text-sm font-semibold text-[#111827]">
                            No supervisors found
                          </span>
                          <span className="mt-1 text-xs text-[#6B7280]">
                            {searchQuery
                              ? `No supervisors match "${searchQuery}".`
                              : "Click '+ Add Supervisor' to invite your first supervisor."}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredSupervisors.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedSupervisorId(row.id);
                          setAssignModalOpen(true);
                        }}
                      >
                        {/* Supervisor Name + Initials Avatar */}
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

                        {/* Department */}
                        <td className="px-6 py-4 text-sm font-medium text-[#4B5563]">
                          {row.department}
                        </td>

                        {/* Assigned Students */}
                        <td className="px-6 py-4 text-sm font-medium text-[#111827]">
                          {row.assignedStudentsCount}
                        </td>

                        {/* Completed */}
                        <td className="px-6 py-4 text-sm font-medium text-[#111827]">
                          {row.completedLogsCount}
                        </td>

                        {/* Status Badge */}
                        <td className="px-6 py-4">
                          {row.status === "Active" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-semibold text-[#15803D]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
                              • Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEE2E2] px-3 py-1 text-xs font-semibold text-[#DC2626]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
                              • Inactive
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSupervisorToDelete(row);
                              setDeleteModalOpen(true);
                            }}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Remove supervisor"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                            </svg>
                          </button>
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

      {/* MODAL 1: Add Supervisor (Matching Image 3) */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button X */}
            <button
              onClick={() => setAddModalOpen(false)}
              className="absolute right-5 top-5 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Title & Description */}
            <h2 className="text-xl font-bold text-[#111827]">Add Supervisor</h2>
            <p className="mt-1 text-xs text-[#6B7280]">
              Invite a new supervisor to the system
            </p>

            {addError && (
              <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-600 font-medium">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddSupervisorSubmit} className="mt-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="ex: ajayicrowder@mtn.com"
                  className="w-full rounded-xl border border-gray-200 bg-[#F9FAFB] px-4 py-3 text-sm text-[#111827] placeholder-[#9CA3AF] outline-none transition-all focus:border-[#EAB308] focus:bg-white focus:ring-2 focus:ring-[#EAB308]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1.5">
                  Department
                </label>
                <input
                  type="text"
                  value={addDept}
                  onChange={(e) => setAddDept(e.target.value)}
                  placeholder="e.g. Frontend Development"
                  className="w-full rounded-xl border border-gray-200 bg-[#F9FAFB] px-4 py-3 text-sm text-[#111827] placeholder-[#9CA3AF] outline-none transition-all focus:border-[#EAB308] focus:bg-white focus:ring-2 focus:ring-[#EAB308]/20"
                />
              </div>

              {/* Action Buttons */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-[#374151] hover:bg-gray-50"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="rounded-xl bg-[#FFC107] py-3 text-sm font-bold text-[#111827] hover:bg-[#e5ac00] disabled:opacity-50"
                >
                  {addLoading ? "Inviting..." : "Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Assign Supervisor (Matching Image 4 & 5) */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button X */}
            <button
              onClick={() => setAssignModalOpen(false)}
              className="absolute right-5 top-5 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Header */}
            <h2 className="text-xl font-bold text-[#111827]">Assign Supervisor</h2>

            {assignError && (
              <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-600 font-medium">
                {assignError}
              </div>
            )}

            <form onSubmit={handleAssignSupervisorSubmit} className="mt-5 flex flex-col gap-4">
              {/* Select Student or Display Student */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                  Student Name
                </label>
                {unassignedStudents.length > 1 ? (
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-[#F9FAFB] px-4 py-3 text-sm font-medium text-[#111827] outline-none"
                  >
                    {unassignedStudents.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.email})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    readOnly
                    value={selectedStudent.name}
                    className="w-full rounded-xl border border-gray-200 bg-[#F9FAFB] px-4 py-3 text-sm font-medium text-[#111827] outline-none"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                  Email
                </label>
                <input
                  type="text"
                  readOnly
                  value={selectedStudent.email}
                  className="w-full rounded-xl border border-gray-200 bg-[#F9FAFB] px-4 py-3 text-sm font-medium text-[#111827] outline-none"
                />
              </div>

              {/* Select Supervisor list matching Image 4 & 5 */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-2">
                  Select Supervisor
                </label>
                <div className="flex flex-col gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {supervisors.length === 0 ? (
                    <div className="py-4 text-center text-xs text-gray-500">
                      No supervisors registered yet. Add a supervisor first.
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
                              ? "border-[#EAB308] bg-[#FEF9E6] shadow-xs"
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

              {/* Action Buttons matching Image 4 & 5 */}
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

      {/* Delete Supervisor Confirmation Modal */}
      {deleteModalOpen && supervisorToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setDeleteModalOpen(false);
                setSupervisorToDelete(null);
              }}
              className="absolute right-5 top-5 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 mb-4">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-[#111827]">Remove Supervisor</h2>
            <p className="mt-2 text-sm text-[#6B7280]">
              Are you sure you want to remove <span className="font-semibold text-gray-900">{supervisorToDelete.name}</span> ({supervisorToDelete.email}) from the platform?
            </p>

            {deleteError && (
              <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-600 font-medium">
                {deleteError}
              </div>
            )}

            <form onSubmit={handleDeleteSupervisorSubmit} className="mt-6 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setSupervisorToDelete(null);
                  }}
                  className="rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-[#374151] hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteLoading}
                  className="rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleteLoading ? "Removing..." : "Remove"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
