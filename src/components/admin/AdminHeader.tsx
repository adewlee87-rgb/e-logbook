"use client";

import { BellIcon, MenuIcon } from "@/components/ui/icons";

interface AdminHeaderProps {
  adminName?: string;
  adminEmail?: string;
  onMenuToggle?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function AdminHeader({
  adminName = "Admin User",
  adminEmail = "admin@elogbook.app",
  onMenuToggle,
  onRefresh,
  isRefreshing = false,
}: AdminHeaderProps) {
  const initial = adminName ? adminName.charAt(0).toUpperCase() : "A";

  return (
    <header className="flex w-full items-center justify-between py-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
          aria-label="Open navigation menu"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#6B7280]">
            Admin Dashboard
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Manual Sync / Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="hidden items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 sm:flex disabled:opacity-50"
            title="Refresh Realtime Database Stats"
          >
            <svg
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-amber-500" : "text-gray-500"}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21.5 2v6h-6M2.5 22v-6h6" />
              <path d="M2 11.5a10 10 0 0 1 18.8-4.3L21.5 8M22 12.5a10 10 0 0 1-18.8 4.2L2.5 16" />
            </svg>
            <span>{isRefreshing ? "Syncing..." : "Sync DB"}</span>
          </button>
        )}

        {/* Notification Bell */}
        <button
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-600 shadow-xs transition-colors hover:bg-gray-50 hover:text-gray-900"
          aria-label="Notifications"
        >
          <BellIcon className="h-5 w-5 text-[#4B5563]" />
        </button>

        {/* User Profile Badge */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00C49F] text-base font-bold text-white shadow-xs">
            {initial}
          </div>
          <div className="hidden flex-col sm:flex">
            <span className="text-sm font-bold text-[#111827] leading-tight">
              {adminName}
            </span>
            <span className="text-xs text-[#6B7280]">
              {adminEmail}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
