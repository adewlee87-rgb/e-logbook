import { createClient } from "@/lib/supabase/server";
import { fullName, initials } from "@/lib/supervisor";

export interface SupervisorRowData {
  id: string;
  initials: string;
  avatarBg: string;
  avatarTextColor: string;
  name: string;
  email: string;
  department: string;
  assignedStudentsCount: number;
  completedLogsCount: string | number;
  status: "Active" | "Inactive";
  createdAt: string;
}

export interface StudentOption {
  id: string;
  name: string;
  email: string;
  department: string;
  currentSupervisorId: string | null;
}

export interface AdminSupervisorsData {
  adminName: string;
  adminEmail: string;
  totalCount: number;
  supervisors: SupervisorRowData[];
  unassignedStudents: StudentOption[];
}

const AVATAR_PALETTES = [
  { bg: "bg-[#A7F3D0]", text: "text-[#047857]" }, // Green
  { bg: "bg-[#A5F3FC]", text: "text-[#0891B2]" }, // Cyan
  { bg: "bg-[#BFDBFE]", text: "text-[#1D4ED8]" }, // Blue
  { bg: "bg-[#DDD6FE]", text: "text-[#6D28D9]" }, // Purple
  { bg: "bg-[#FEF3C7]", text: "text-[#D97706]" }, // Amber
  { bg: "bg-[#FCE7F3]", text: "text-[#BE185D]" }, // Pink
];

export async function getAdminSupervisorsData(): Promise<AdminSupervisorsData> {
  const supabase = await createClient();

  // 1. Admin Profile
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let adminName = "Admin User";
  let adminEmail = user?.email || "admin@elogbook.app";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("id", user.id)
      .single();

    if (profile) {
      const name = fullName(profile);
      if (name) adminName = name;
      if (profile.email) adminEmail = profile.email;
    }
  }

  // 2. Fetch all supervisor profiles
  const { data: supervisorProfiles } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email, department, created_at")
    .eq("role", "supervisor")
    .order("created_at", { ascending: false });

  const totalCount = supervisorProfiles ? supervisorProfiles.length : 0;

  // 3. Fetch supervisors_students mappings
  const { data: mappings } = await supabase
    .from("supervisors_students")
    .select("supervisor_id, student_id");

  const supervisorStudentCounts = new Map<string, number>();
  const supervisorStudentIdsMap = new Map<string, string[]>();

  if (mappings) {
    for (const m of mappings) {
      const cnt = supervisorStudentCounts.get(m.supervisor_id) || 0;
      supervisorStudentCounts.set(m.supervisor_id, cnt + 1);

      const list = supervisorStudentIdsMap.get(m.supervisor_id) || [];
      list.push(m.student_id);
      supervisorStudentIdsMap.set(m.supervisor_id, list);
    }
  }

  // 4. Fetch completed logs per supervisor
  const { data: approvedLogs } = await supabase
    .from("logbook_entries")
    .select("student_id")
    .eq("status", "approved");

  const approvedStudentCounts = new Map<string, number>();
  if (approvedLogs) {
    for (const log of approvedLogs) {
      const cnt = approvedStudentCounts.get(log.student_id) || 0;
      approvedStudentCounts.set(log.student_id, cnt + 1);
    }
  }

  const supervisors: SupervisorRowData[] = (supervisorProfiles || []).map((sup, index) => {
    const sName = fullName(sup) || sup.email || "Supervisor";
    const sInitials = initials(sName);
    const palette = AVATAR_PALETTES[index % AVATAR_PALETTES.length];

    const assignedCount = supervisorStudentCounts.get(sup.id) || 0;
    const assignedStudentIds = supervisorStudentIdsMap.get(sup.id) || [];

    let completedCount = 0;
    for (const stId of assignedStudentIds) {
      completedCount += approvedStudentCounts.get(stId) || 0;
    }

    return {
      id: sup.id,
      initials: sInitials,
      avatarBg: palette.bg,
      avatarTextColor: palette.text,
      name: sName,
      email: sup.email,
      department: sup.department || "Engineering",
      assignedStudentsCount: assignedCount,
      completedLogsCount: completedCount > 0 ? completedCount : "-",
      status: "Active",
      createdAt: sup.created_at,
    };
  });

  // 5. Fetch all students for the "Assign Supervisor" modal select
  const { data: studentProfiles } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email, department")
    .eq("role", "student")
    .order("created_at", { ascending: false });

  const mappingStudentToSup = new Map((mappings || []).map((m) => [m.student_id, m.supervisor_id]));

  const unassignedStudents: StudentOption[] = (studentProfiles || []).map((s) => ({
    id: s.id,
    name: fullName(s) || s.email || "Student",
    email: s.email,
    department: s.department || "General SIWES",
    currentSupervisorId: mappingStudentToSup.get(s.id) || null,
  }));

  return {
    adminName,
    adminEmail,
    totalCount,
    supervisors,
    unassignedStudents,
  };
}
