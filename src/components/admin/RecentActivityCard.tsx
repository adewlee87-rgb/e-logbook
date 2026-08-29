"use client";

import { useState } from "react";
import {
  UserPlusIcon,
  UsersIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
} from "@/components/ui/icons";
import { relativeTime, formatDateTime } from "@/lib/supervisor";
import type { ActivityItemData } from "@/lib/admin-data";

interface RecentActivityCardProps {
  activities?: ActivityItemData[];
}

export function RecentActivityCard({
  activities = [],
}: RecentActivityCardProps) {
  const [currentPage, setCurrentPage] = useState(0);

  const itemsPerPage = 3;
  const totalPages = Math.max(1, Math.ceil(activities.length / itemsPerPage));

  const startIndex = currentPage * itemsPerPage;
  const currentItems = activities.slice(startIndex, startIndex + itemsPerPage);

  const handlePrev = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNext = () => {
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : prev));
  };

  const renderIcon = (iconType: string, className: string) => {
    if (iconType === "user-plus") return <UserPlusIcon className={className} />;
    if (iconType === "users") return <UsersIcon className={className} />;
    if (iconType === "check-circle") return <CheckCircleIcon className={className} />;
    if (iconType === "alert-triangle") return <AlertTriangleIcon className={className} />;
    return <DocumentTextIcon className={className} />;
  };

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-gray-100/80 bg-white p-6 shadow-xs">
      <div>
        {/* Header & Pagination */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">Recent Activity</h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              keep up with the latest information
            </p>
          </div>

          {activities.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#6B7280]">
              <button
                onClick={handlePrev}
                disabled={currentPage === 0}
                aria-label="Previous page"
                className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <span>
                {currentPage + 1}/{totalPages} Pages
              </span>
              <button
                onClick={handleNext}
                disabled={currentPage === totalPages - 1}
                aria-label="Next page"
                className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Activity Items List */}
        <div className="mt-6 flex flex-col gap-5">
          {currentItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <ClockIcon className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-medium text-[#111827]">No activity recorded yet</p>
              <p className="mt-1 text-xs text-[#6B7280]">
                User signups, student assignments, and logbook reports will appear here in real time.
              </p>
            </div>
          ) : (
            currentItems.map((item) => {
              const displayRel = item.timestamp ? relativeTime(item.timestamp) : item.time || "Recently";
              const exactFormatted = item.timestamp ? formatDateTime(item.timestamp) : "";

              return (
                <div key={item.id} className="flex items-start gap-4">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${item.iconBg}`}
                  >
                    {renderIcon(item.icon, `h-5 w-5 ${item.iconColor}`)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-[#111827] leading-snug">
                      {item.text}
                    </span>
                    <span
                      className="text-xs text-[#9CA3AF] mt-0.5 font-medium"
                      title={exactFormatted || undefined}
                    >
                      {displayRel}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
