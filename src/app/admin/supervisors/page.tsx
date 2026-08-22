import { getAdminSupervisorsData } from "@/lib/admin-supervisors-data";
import { AdminSupervisorsView } from "@/components/admin/AdminSupervisorsView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminSupervisorsPage() {
  const data = await getAdminSupervisorsData();

  return (
    <AdminSupervisorsView
      adminName={data.adminName}
      adminEmail={data.adminEmail}
      totalCount={data.totalCount}
      supervisors={data.supervisors}
      unassignedStudents={data.unassignedStudents}
    />
  );
}
