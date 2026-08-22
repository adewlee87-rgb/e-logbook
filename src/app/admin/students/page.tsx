import { getAdminStudentsData } from "@/lib/admin-students-data";
import { AdminStudentsView } from "@/components/admin/AdminStudentsView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminStudentsPage() {
  const data = await getAdminStudentsData();

  return (
    <AdminStudentsView
      adminName={data.adminName}
      adminEmail={data.adminEmail}
      totalCount={data.totalCount}
      students={data.students}
    />
  );
}
