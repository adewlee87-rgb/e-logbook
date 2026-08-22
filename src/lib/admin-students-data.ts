import { createClient } from "@/lib/supabase/server";
import { relativeTime, fullName, initials } from "@/lib/supervisor";

export interface StudentRowData {
  id: string;
  initials: string;
  avatarBg: string;
  avatarTextColor: string;
  name: string;
  email: string;
  department: string;
  supervisorName: string;
  lastActivity: string;
  lastActivityTimestamp: string;
  status: "Active" | "Inactive";
  entriesCount: number;
  createdAt: string;
}

export interface AdminStudentsData {
  adminName: string;
  adminEmail: string;
  totalCount: number;
  students: StudentRowData[];
}

const AVATAR_PALETTES = [
  { bg: "bg-[#A7F3D0]", text: "text-[#047857]" }, // Green (e.g. AO)
  { bg: "bg-[#A5F3FC]", text: "text-[#0891B2]" }, // Cyan (e.g. TG)
  { bg: "bg-[#BFDBFE]", text: "text-[#1D4ED8]" }, // Blue (e.g. CS)
  { bg: "bg-[#DDD6FE]", text: "text-[#6D28D9]" }, // Purple (e.g. AA)
  { bg: "bg-[#FEF3C7]", text: "text-[#D97706]" }, // Amber
  { bg: "bg-[#FCE7F3]", text: "text-[#BE185D]" }, // Pink
];

export async function getAdminStudentsData(): Promise<AdminStudentsData> {
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

  // 2. Fetch all student profiles
  const { data: studentProfiles } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email, department, created_at")
    .eq("role", "student")
    .order("created_at", { ascending: false });

  const totalCount = studentProfiles ? studentProfiles.length : 0;

  if (!studentProfiles || studentProfiles.length === 0) {
    return {
      adminName,
      adminEmail,
      totalCount: 0,
      students: [],
    };
  }

  // 3. Fetch supervisor mappings
  const studentIds = studentProfiles.map((s) => s.id);
  const { data: mappings } = await supabase
    .from("supervisors_students")
    .select("student_id, supervisor_id")
    .in("student_id", studentIds);

  const supervisorIds = Array.from(
    new Set((mappings || []).map((m) => m.supervisor_id))
  );

  const { data: supervisorProfiles } = supervisorIds.length > 0
    ? await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", supervisorIds)
    : { data: [] };

  const supervisorNameMap = new Map(
    (supervisorProfiles || []).map((s) => [s.id, fullName(s) || "Supervisor"])
  );

  const studentToSupervisorMap = new Map(
    (mappings || []).map((m) => [m.student_id, supervisorNameMap.get(m.supervisor_id) || "Unassigned"])
  );

  // 4. Fetch last activity & entries count for each student
  const { data: logEntries } = await supabase
    .from("logbook_entries")
    .select("student_id, created_at, updated_at")
    .in("student_id", studentIds)
    .order("created_at", { ascending: false });

  const lastActivityMap = new Map<string, { timestamp: string; count: number }>();

  if (logEntries) {
    for (const entry of logEntries) {
      const existing = lastActivityMap.get(entry.student_id);
      const entryTime = entry.updated_at || entry.created_at;
      if (!existing) {
        lastActivityMap.set(entry.student_id, {
          timestamp: entryTime,
          count: 1,
        });
      } else {
        existing.count += 1;
        if (new Date(entryTime).getTime() > new Date(existing.timestamp).getTime()) {
          existing.timestamp = entryTime;
        }
      }
    }
  }

  // 5. Construct student rows
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const nowMs = Date.now();

  const students: StudentRowData[] = studentProfiles.map((s, index) => {
    const sName = fullName(s) || s.email || "Student";
    const sInitials = initials(sName);
    const palette = AVATAR_PALETTES[index % AVATAR_PALETTES.length];

    const supervisorName = studentToSupervisorMap.get(s.id) || "Unassigned";

    const activityData = lastActivityMap.get(s.id);
    const lastTimestamp = activityData?.timestamp || s.created_at;
    const entriesCount = activityData?.count || 0;

    const diffMs = nowMs - new Date(lastTimestamp).getTime();
    const isActive = diffMs <= thirtyDaysMs;

    return {
      id: s.id,
      initials: sInitials,
      avatarBg: palette.bg,
      avatarTextColor: palette.text,
      name: sName,
      email: s.email,
      department: s.department || "General SIWES",
      supervisorName,
      lastActivity: relativeTime(lastTimestamp),
      lastActivityTimestamp: lastTimestamp,
      status: isActive ? "Active" : "Inactive",
      entriesCount,
      createdAt: s.created_at,
    };
  });

  return {
    adminName,
    adminEmail,
    totalCount,
    students,
  };
}
