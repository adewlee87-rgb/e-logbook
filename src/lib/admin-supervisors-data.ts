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
  activeStudentsCount: number;
  completedStudentsCount: number;
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
  siwesStatus?: "active" | "completed";
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

  // 4. Fetch all student profiles to check siwes_status
  const { data: studentProfiles } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email, department, siwes_status")
    .eq("role", "student")
    .order("created_at", { ascending: false });

  const studentStatusMap = new Map<string, string>();
  if (studentProfiles) {
    for (const st of studentProfiles) {
      studentStatusMap.set(st.id, st.siwes_status || "active");
    }
  }

  const supervisorStudentIdsMap = new Map<string, string[]>();
  const supervisorActiveCounts = new Map<string, number>();
  const supervisorCompletedCounts = new Map<string, number>();

  if (mappings) {
    for (const m of mappings) {
      const list = supervisorStudentIdsMap.get(m.supervisor_id) || [];
      list.push(m.student_id);
      supervisorStudentIdsMap.set(m.supervisor_id, list);

      const stStatus = studentStatusMap.get(m.student_id);
      if (stStatus === "completed") {
        const cCnt = supervisorCompletedCounts.get(m.supervisor_id) || 0;
        supervisorCompletedCounts.set(m.supervisor_id, cCnt + 1);
      } else {
        const aCnt = supervisorActiveCounts.get(m.supervisor_id) || 0;
        supervisorActiveCounts.set(m.supervisor_id, aCnt + 1);
      }
    }
  }

  // 5. Fetch completed logs per supervisor
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

    const assignedStudentIds = supervisorStudentIdsMap.get(sup.id) || [];
    const activeCount = supervisorActiveCounts.get(sup.id) || 0;
    const completedStudentsCount = supervisorCompletedCounts.get(sup.id) || 0;

    let completedLogsCount = 0;
    for (const stId of assignedStudentIds) {
      completedLogsCount += approvedStudentCounts.get(stId) || 0;
    }

    return {
      id: sup.id,
      initials: sInitials,
      avatarBg: palette.bg,
      avatarTextColor: palette.text,
      name: sName,
      email: sup.email,
      department: sup.department || "Engineering",
      assignedStudentsCount: assignedStudentIds.length,
      activeStudentsCount: activeCount,
      completedStudentsCount,
      completedLogsCount: completedLogsCount > 0 ? completedLogsCount : "-",
      status: "Active",
      createdAt: sup.created_at,
    };
  });

  const mappingStudentToSup = new Map((mappings || []).map((m) => [m.student_id, m.supervisor_id]));

  const unassignedStudents: StudentOption[] = (studentProfiles || []).map((s) => ({
    id: s.id,
    name: fullName(s) || s.email || "Student",
    email: s.email,
    department: s.department || "General SIWES",
    currentSupervisorId: mappingStudentToSup.get(s.id) || null,
    siwesStatus: (s.siwes_status as "active" | "completed") || "active",
  }));

  return {
    adminName,
    adminEmail,
    totalCount,
    supervisors,
    unassignedStudents,
  };
}
