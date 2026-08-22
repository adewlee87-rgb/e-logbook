import { getAdminDashboardData } from "@/lib/admin-data";
import { AdminDashboardView } from "@/components/admin/AdminDashboardView";

export const dynamic = "force-dynamic";
export const revalidate = 0; // Dynamic server rendering for live DB queries

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();

  return (
    <AdminDashboardView
      adminName={data.adminName}
      adminEmail={data.adminEmail}
      stats={data.stats}
      activities={data.activities}
      supervisorsList={data.supervisors}
    />
  );
}
