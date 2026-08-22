"use client";

import {
  UsersIcon,
  SupervisorBadgeIcon,
  ExclamationAlertIcon,
} from "@/components/ui/icons";

interface StatCardsProps {
  totalStudents?: number;
  totalSupervisors?: number;
  assignedStudents?: number;
  unassignedStudents?: number;
}

export function StatCards({
  totalStudents = 0,
  totalSupervisors = 0,
  assignedStudents = 0,
  unassignedStudents = 0,
}: StatCardsProps) {
  const cards = [
    {
      id: "total-students",
      label: "Total Students",
      value: totalStudents,
      iconBg: "bg-[#F3F4F6]",
      iconColor: "text-[#6B7280]",
      icon: UsersIcon,
    },
    {
      id: "total-supervisors",
      label: "Total Supervisors",
      value: totalSupervisors,
      iconBg: "bg-[#F3F4F6]",
      iconColor: "text-[#6B7280]",
      icon: SupervisorBadgeIcon,
    },
    {
      id: "assigned-students",
      label: "Assigned Students",
      value: assignedStudents,
      iconBg: "bg-[#F3F4F6]",
      iconColor: "text-[#6B7280]",
      icon: UsersIcon,
    },
    {
      id: "unassigned-students",
      label: "Unassigned Students",
      value: unassignedStudents,
      iconBg: "bg-[#FEF3C7]",
      iconColor: "text-[#D97706]",
      icon: ExclamationAlertIcon,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="flex flex-col justify-between rounded-2xl border border-gray-100/80 bg-white p-6 shadow-xs transition-shadow hover:shadow-md"
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.iconBg}`}>
              <Icon className={`h-5 w-5 ${card.iconColor}`} />
            </div>
            <div className="mt-5">
              <div className="text-3xl font-bold text-[#111827] tracking-tight">
                {card.value.toLocaleString()}
              </div>
              <div className="mt-1 text-sm font-medium text-[#6B7280]">
                {card.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
