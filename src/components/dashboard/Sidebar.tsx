"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  DashboardIcon,
  ReportIcon,
  ProfileIcon,
  SettingsIcon,
  LogoutIcon,
  CloseIcon,
} from "@/components/ui/icons";

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
}

export function Sidebar({
  items = defaultNavItems,
  open = false,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 shrink-0 -translate-x-full flex-col justify-between border-r border-gray-100 bg-white px-6 py-8 transition-transform duration-200 ease-in-out md:sticky md:top-0 md:translate-x-0 ${
        open ? "translate-x-0" : ""
      }`}
    >
      <div>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-[#1A1A1A]">Y'ello Log</div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="text-[#666] md:hidden"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-10 flex flex-col gap-1.5">
          {items.map((item) => {
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
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-[#666] transition-colors hover:bg-gray-50 disabled:opacity-50"
      >
        <LogoutIcon className="h-5 w-5" />
        {loggingOut ? "Logging out..." : "Logout"}
      </button>
    </aside>
  );
}
