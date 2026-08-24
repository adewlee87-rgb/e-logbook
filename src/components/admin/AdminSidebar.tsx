"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  DashboardIcon,
  UsersIcon,
  SupervisorBadgeIcon,
  AssignmentsIcon,
  LogoutIcon,
  CloseIcon,
} from "@/components/ui/icons";
import { LogoutConfirmModal } from "@/components/ui/LogoutConfirmModal";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: (props: { className?: string }) => React.ReactElement;
}

const adminNavItems: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: DashboardIcon },
  { label: "Students", href: "/admin/students", icon: UsersIcon },
  { label: "Supervisors", href: "/admin/supervisors", icon: SupervisorBadgeIcon },
  { label: "Assignments", href: "/admin/assignments", icon: AssignmentsIcon },
];

interface AdminSidebarProps {
  open?: boolean;
  onClose?: () => void;
  assignmentsCount?: number;
}

export function AdminSidebar({ open = false, onClose, assignmentsCount }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [badgeVal, setBadgeVal] = useState<number | null>(assignmentsCount ?? null);

  useEffect(() => {
    if (assignmentsCount !== undefined) {
      setBadgeVal(assignmentsCount);
      return;
    }

    const supabase = createClient();

    async function loadLiveCount() {
      // 1. Get total students count
      const { count: studentCount } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "student");

      // 2. Get assigned students
      const { data: mappings } = await supabase
        .from("supervisors_students")
        .select("student_id");

      const assignedSet = new Set((mappings || []).map((m) => m.student_id));
      const total = studentCount ?? 0;
      const unassigned = Math.max(0, total - assignedSet.size);

      setBadgeVal(unassigned);
    }

    loadLiveCount();

    // Subscribe to realtime updates on supervisors_students & profiles
    const channel = supabase
      .channel("admin-sidebar-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "supervisors_students" },
        () => loadLiveCount()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => loadLiveCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [assignmentsCount]);

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 shrink-0 -translate-x-full flex-col justify-between border-r border-gray-100 bg-white px-6 py-8 transition-transform duration-200 ease-in-out md:translate-x-0 ${
        open ? "translate-x-0" : ""
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#111827]">
              Y&apos;ello Log
            </span>
          </Link>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="text-gray-500 hover:text-gray-700 md:hidden"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="mt-10 flex flex-col gap-2">
          {adminNavItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`relative flex items-center gap-3.5 rounded-xl px-4 py-3.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#FEF9E6] text-[#111827] font-semibold"
                    : "text-[#6B7280] hover:bg-gray-50 hover:text-[#111827]"
                }`}
              >
                {isActive && (
                  <span className="absolute -left-6 top-0 h-full w-1.5 rounded-r-full bg-[#EAB308]" />
                )}
                <Icon className={`h-5 w-5 ${isActive ? "text-[#111827]" : "text-[#6B7280]"}`} />
                <span className="flex-1">{item.label}</span>
                {item.label === "Assignments" && badgeVal !== null && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#111827] px-1.5 text-[11px] font-bold text-white">
                    {badgeVal}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout button */}
      <div className="flex flex-col pt-4">
        <button
          onClick={() => setShowLogoutModal(true)}
          disabled={loggingOut}
          className="flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium text-[#6B7280] transition-colors hover:bg-gray-50 hover:text-[#111827] disabled:opacity-50"
        >
          <LogoutIcon className="h-5 w-5 text-[#6B7280]" />
          <span>{loggingOut ? "Logging out..." : "Logout"}</span>
        </button>
      </div>

      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </aside>
  );
}
