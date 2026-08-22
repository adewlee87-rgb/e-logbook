import { getAdminSupervisorsData } from "@/lib/admin-supervisors-data";
import { AdminAssignmentsView } from "@/components/admin/AdminAssignmentsView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminAssignmentsPage() {
  const data = await getAdminSupervisorsData();

  return (
    <AdminAssignmentsView
      adminName={data.adminName}
      adminEmail={data.adminEmail}
      supervisors={data.supervisors}
      students={data.unassignedStudents}
    />
  );
}
