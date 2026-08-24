"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BellIcon, MenuIcon, LogoutIcon } from "@/components/ui/icons";
import { NotificationsBell } from "@/components/dashboard/NotificationsBell";
import { LogoutConfirmModal } from "@/components/ui/LogoutConfirmModal";

interface AdminHeaderProps {
  adminName?: string;
  adminEmail?: string;
  adminUserId?: string;
  onMenuToggle?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function AdminHeader({
  adminName = "Admin User",
  adminEmail = "admin@elogbook.app",
  adminUserId,
  onMenuToggle,
  onRefresh,
  isRefreshing = false,
}: AdminHeaderProps) {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(adminUserId);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUserId) {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          setCurrentUserId(data.user.id);
        }
      });
    }
  }, [currentUserId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initial = adminName ? adminName.charAt(0).toUpperCase() : "A";

  return (
    <>
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

          {/* Real-time Notification Bell */}
          {currentUserId ? (
            <NotificationsBell userId={currentUserId} />
          ) : (
            <button
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-600 shadow-xs transition-colors hover:bg-gray-50 hover:text-gray-900"
              aria-label="Notifications"
            >
              <BellIcon className="h-5 w-5 text-[#4B5563]" />
            </button>
          )}

          {/* User Profile Dropdown Badge */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-3 rounded-full p-1 transition-colors hover:bg-gray-100 focus:outline-none"
              aria-label="Admin user menu"
              aria-expanded={menuOpen}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00C49F] text-base font-bold text-white shadow-xs">
                {initial}
              </div>
              <div className="hidden flex-col sm:flex text-left pr-1">
                <span className="text-sm font-bold text-[#111827] leading-tight">
                  {adminName}
                </span>
                <span className="text-xs text-[#6B7280]">
                  {adminEmail}
                </span>
              </div>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-2 shadow-xl border border-gray-100 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-gray-100 mb-1">
                  <p className="text-sm font-bold text-[#111827] truncate">{adminName}</p>
                  <p className="text-xs text-[#6B7280] truncate">{adminEmail}</p>
                </div>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setShowLogoutModal(true);
                  }}
                  disabled={loggingOut}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <LogoutIcon className="h-4 w-4 text-red-600" />
                  <span>{loggingOut ? "Logging out..." : "Logout"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </>
  );
}
