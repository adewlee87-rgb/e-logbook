"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { StatCards } from "./StatCards";
import { LogbookSummaryCard } from "./LogbookSummaryCard";
import { RecentActivityCard } from "./RecentActivityCard";
import { SupervisorOverviewTable } from "./SupervisorOverviewTable";
import type { ActivityItemData, AdminSupervisorOverview } from "@/lib/admin-data";

interface AdminDashboardViewProps {
  adminName?: string;
  adminEmail?: string;
  stats?: {
    totalStudents?: number;
    totalSupervisors?: number;
    assignedStudents?: number;
    unassignedStudents?: number;
    submissions?: number;
    completedLogs?: number;
    inactiveStudents?: number;
  };
  activities?: ActivityItemData[];
  supervisorsList?: AdminSupervisorOverview[];
}

export function AdminDashboardView({
  adminName = "Admin User",
  adminEmail = "admin@elogbook.app",
  stats,
  activities = [],
  supervisorsList = [],
}: AdminDashboardViewProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Set up Supabase Realtime Subscriptions for live updates when student signs up or assignment is made
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("admin-realtime-overview")
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
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

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Sidebar Navigation */}
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

          {/* Main Section */}
          <main className="mt-2">
            {/* Title & Subtitle */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">
                Overview
              </h1>
              <p className="mt-1 text-sm text-[#6B7280]">
                Here&apos;s what&apos;s happening across your digital logbook system
              </p>
            </div>

            {/* 4 Stat Cards - 100% real database metrics */}
            <StatCards
              totalStudents={stats?.totalStudents ?? 0}
              totalSupervisors={stats?.totalSupervisors ?? 0}
              assignedStudents={stats?.assignedStudents ?? 0}
              unassignedStudents={stats?.unassignedStudents ?? 0}
            />

            {/* Middle Row (2 Columns: Logbook Summary & Recent Activity) */}
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <LogbookSummaryCard
                submissions={stats?.submissions ?? 0}
                completedLogs={stats?.completedLogs ?? 0}
                inactiveStudents={stats?.inactiveStudents ?? 0}
                totalStudents={stats?.totalStudents ?? 0}
              />
              <RecentActivityCard activities={activities} />
            </div>

            {/* Bottom Section: Supervisor Overview Table */}
            <SupervisorOverviewTable
              supervisors={supervisorsList}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
