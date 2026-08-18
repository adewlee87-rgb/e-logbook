"use client";

import { ReactNode, useState } from "react";
import { Sidebar, type SidebarNavItem } from "@/components/dashboard/Sidebar";
import { MenuIcon } from "@/components/ui/icons";

interface DashboardShellProps {
  children: ReactNode;
  navItems?: SidebarNavItem[];
}

export function DashboardShell({ children, navItems }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F7F7F8]">
      <Sidebar
        items={navItems}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <div className="flex items-center gap-4 border-b border-gray-100 bg-white px-4 py-3 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="text-[#1A1A1A]"
          >
            <MenuIcon className="h-6 w-6" />
          </button>
          <span className="text-lg font-bold text-[#1A1A1A]">Y&apos;ello Log</span>
        </div>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
