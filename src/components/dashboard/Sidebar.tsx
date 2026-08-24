"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  DashboardIcon,
  ReportIcon,
  ProfileIcon,
  SettingsIcon,
  LogoutIcon,
  CloseIcon,
} from "@/components/ui/icons";

import { LogoutConfirmModal } from "@/components/ui/LogoutConfirmModal";

export interface SidebarNavItem {
  label: string;
  href: string;
  icon: (props: { className?: string }) => React.ReactElement;
}

const defaultNavItems: SidebarNavItem[] = [
  { label: "Dashboard", href: "/student", icon: DashboardIcon },
  { label: "Report", href: "/student/report", icon: ReportIcon },
  { label: "Profile", href: "/student/profile", icon: ProfileIcon },
  { label: "Settings", href: "/student/settings", icon: SettingsIcon },
];

interface SidebarProps {
  items?: SidebarNavItem[];
  open?: boolean;
  onClose?: () => void;
  profileIncomplete?: boolean;
}

export function Sidebar({
  items = defaultNavItems,
  open = false,
  onClose,
  profileIncomplete: propIncomplete,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isIncomplete, setIsIncomplete] = useState<boolean>(
    propIncomplete ?? false,
  );

  useEffect(() => {
    if (propIncomplete !== undefined) {
      setIsIncomplete(propIncomplete);
      return;
    }

    async function checkProfileStatus() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("internship_start_date, internship_end_date")
        .eq("id", user.id)
        .single();

      if (!data?.internship_start_date || !data?.internship_end_date) {
        setIsIncomplete(true);
      } else {
        setIsIncomplete(false);
      }
    }

    checkProfileStatus();
  }, [propIncomplete, pathname]);

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const mainItems = items.filter(
    (item) =>
      item.href !== "/student/settings" &&
      item.label.toLowerCase() !== "settings",
  );
  const settingsItem = items.find(
    (item) =>
      item.href === "/student/settings" ||
      item.label.toLowerCase() === "settings",
  );

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 shrink-0 -translate-x-full flex-col justify-between border-r border-gray-100 bg-white px-6 py-8 transition-transform duration-200 ease-in-out md:static md:translate-x-0 md:z-auto ${
        open ? "translate-x-0" : ""
      }`}
    >
      <div>
        <div className="flex items-center justify-between">
          <Link href="/student" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-base font-extrabold text-[#1A1A1A]">
              Y
            </span>
            <span className="text-xl font-bold text-[#1A1A1A]">
              Y&apos;ello Log
            </span>
          </Link>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="text-[#666] md:hidden"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-10 flex flex-col gap-1.5">
          {mainItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`relative flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#FEF3D6] text-[#1A1A1A]"
                    : "text-[#666] hover:bg-gray-50"
                }`}
              >
                {isActive && (
                  <span className="absolute -left-6 top-0 h-full w-1.5 rounded-r-full bg-primary" />
                )}
                <Icon className="h-5 w-5" />
                <span className="flex-1">{item.label}</span>
                {item.href === "/student/profile" && isIncomplete && (
                  <span className="inline-flex items-center gap-1 border border-[#FCD34D] bg-[#FEF3D6] px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-[#B45309] animate-pulse rounded-full">
                    <span className="inline-block animate-bounce">←</span>{" "}
                    Complete profile
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-1.5 border-t border-gray-100 pt-4">
        {settingsItem &&
          (() => {
            const isActive = pathname === settingsItem.href;
            const Icon = settingsItem.icon;
            return (
              <Link
                key={settingsItem.href}
                href={settingsItem.href}
                onClick={onClose}
                className={`relative flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#FEF3D6] text-[#1A1A1A]"
                    : "text-[#666] hover:bg-gray-50"
                }`}
              >
                {isActive && (
                  <span className="absolute -left-6 top-0 h-full w-1.5 rounded-r-full bg-primary" />
                )}
                <Icon className="h-5 w-5" />
                <span className="flex-1">{settingsItem.label}</span>
              </Link>
            );
          })()}

        <button
          onClick={() => setShowLogoutModal(true)}
          disabled={loggingOut}
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-[#666] transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          <LogoutIcon className="h-5 w-5" />
          {loggingOut ? "Logging out..." : "Logout"}
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
