"use client";

import Link from "next/link";
import { ChevronRightIcon, SupervisorBadgeIcon } from "@/components/ui/icons";

export interface SupervisorOverviewRow {
  id: string;
  avatarBg: string;
  avatarTextColor: string;
  initials: string;
  name: string;
  department: string;
  assignedStudents: number;
  completed: string | number;
  status: "Active" | "Inactive";
}

interface SupervisorOverviewTableProps {
  supervisors?: SupervisorOverviewRow[];
}

export function SupervisorOverviewTable({
  supervisors = [],
}: SupervisorOverviewTableProps) {
  return (
    <div className="mt-6 flex flex-col rounded-2xl border border-gray-100/80 bg-white p-6 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-5">
        <h2 className="text-xl font-bold text-[#111827]">Supervisor Overview</h2>
        <Link
          href="/admin/supervisors"
          className="flex items-center gap-1 text-sm font-semibold text-[#111827] hover:underline"
        >
          <span>View all</span>
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      </div>

      {/* Table Container */}
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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {supervisors.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                      <SupervisorBadgeIcon className="h-5 w-5" />
                    </div>
                    <span className="mt-2 text-sm font-medium text-[#111827]">No supervisors registered yet</span>
                    <span className="mt-0.5 text-xs text-[#6B7280]">
                      Supervisors added to the system will be listed here with their assigned students count and status.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              supervisors.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/80 transition-colors">
                  {/* Supervisor Name + Avatar */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${row.avatarBg} ${row.avatarTextColor}`}
                      >
                        {row.initials}
                      </div>
                      <span className="text-sm font-bold text-[#111827]">
                        {row.name}
                      </span>
                    </div>
                  </td>

                  {/* Department */}
                  <td className="px-6 py-4 text-sm font-medium text-[#4B5563]">
                    {row.department}
                  </td>

                  {/* Assigned Students */}
                  <td className="px-6 py-4 text-sm font-medium text-[#111827]">
                    {row.assignedStudents}
                  </td>

                  {/* Completed */}
                  <td className="px-6 py-4 text-sm font-medium text-[#111827]">
                    {row.completed}
                  </td>

                  {/* Status Badge */}
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-semibold text-[#15803D]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
