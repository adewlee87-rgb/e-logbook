import { createClient } from "@/lib/supabase/server";
import { relativeTime, fullName, initials } from "@/lib/supervisor";
import { checkAndAutoOffboardAllEligible } from "@/app/actions/offboarding";
import type { PDFReportEntry } from "@/lib/pdf-export";

export interface StudentRowData {
  id: string;
  initials: string;
  avatarBg: string;
  avatarTextColor: string;
  name: string;
  email: string;
  department: string;
  placeOfWork: string;
  supervisorName: string;
  lastActivity: string;
  lastActivityTimestamp: string;
  status: "Active" | "Inactive" | "Completed";
  siwesStatus: "active" | "completed";
  siwesCompletedAt?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  entriesCount: number;
  approvedCount: number;
  createdAt: string;
  logEntries?: PDFReportEntry[];
}

export interface AdminStudentsData {
  adminName: string;
  adminEmail: string;
  totalCount: number;
  activeCount: number;
  completedCount: number;
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

  // Run auto-offboarding check for any student whose internship end date has passed
  await checkAndAutoOffboardAllEligible();

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
    .select("id, first_name, last_name, email, department, place_of_work, internship_start_date, internship_end_date, siwes_status, siwes_completed_at, created_at")
    .eq("role", "student")
    .order("created_at", { ascending: false });

  const totalCount = studentProfiles ? studentProfiles.length : 0;

  if (!studentProfiles || studentProfiles.length === 0) {
    return {
      adminName,
      adminEmail,
      totalCount: 0,
      activeCount: 0,
      completedCount: 0,
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

  // 4. Fetch last activity, entries & approved count for each student
  const { data: logEntries } = await supabase
    .from("logbook_entries")
    .select("id, student_id, title, body, status, date, created_at, updated_at, reviews(id, comment, reviewed_at)")
    .in("student_id", studentIds)
    .order("created_at", { ascending: false });

  const lastActivityMap = new Map<string, { timestamp: string; count: number; approved: number; logs: PDFReportEntry[] }>();

  if (logEntries) {
    for (const entry of logEntries) {
      const existing = lastActivityMap.get(entry.student_id) || {
        timestamp: entry.updated_at || entry.created_at,
        count: 0,
        approved: 0,
        logs: [] as PDFReportEntry[],
      };
      existing.count += 1;
      if (entry.status === "approved") existing.approved += 1;
      const entryTime = entry.updated_at || entry.created_at;
      if (new Date(entryTime).getTime() > new Date(existing.timestamp).getTime()) {
        existing.timestamp = entryTime;
      }

      const rawRev = (entry.reviews ?? []) as unknown as { comment: string | null; reviewed_at: string }[];
      const firstRev = rawRev[0] ?? null;

      existing.logs.push({
        id: entry.id,
        title: entry.title || "Logbook Entry",
        body: entry.body || "",
        date: entry.date,
        createdAt: entry.created_at,
        status: entry.status,
        review: firstRev ? { comment: firstRev.comment, reviewedAt: firstRev.reviewed_at } : null,
      });

      lastActivityMap.set(entry.student_id, existing);
    }
  }

  // 5. Construct student rows
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const nowMs = Date.now();
  let activeCount = 0;
  let completedCount = 0;

  const students: StudentRowData[] = studentProfiles.map((s, index) => {
    const sName = fullName(s) || s.email || "Student";
    const sInitials = initials(sName);
    const palette = AVATAR_PALETTES[index % AVATAR_PALETTES.length];

    const supervisorName = studentToSupervisorMap.get(s.id) || "Unassigned";

    const activityData = lastActivityMap.get(s.id);
    const lastTimestamp = activityData?.timestamp || s.created_at;
    const entriesCount = activityData?.count || 0;
    const approvedCount = activityData?.approved || 0;

    const diffMs = nowMs - new Date(lastTimestamp).getTime();
    const isCompleted = s.siwes_status === "completed";
    const isActive = isCompleted ? false : diffMs <= thirtyDaysMs;

    if (isCompleted) {
      completedCount++;
    } else {
      activeCount++;
    }

    return {
      id: s.id,
      initials: sInitials,
      avatarBg: palette.bg,
      avatarTextColor: palette.text,
      name: sName,
      email: s.email,
      department: s.department || "General SIWES",
      placeOfWork: s.place_of_work || "N/A",
      supervisorName,
      lastActivity: relativeTime(lastTimestamp),
      lastActivityTimestamp: lastTimestamp,
      status: isCompleted ? "Completed" : isActive ? "Active" : "Inactive",
      siwesStatus: isCompleted ? "completed" : "active",
      siwesCompletedAt: s.siwes_completed_at || null,
      startDate: s.internship_start_date || null,
      endDate: s.internship_end_date || null,
      entriesCount,
      approvedCount,
      createdAt: s.created_at,
      logEntries: activityData?.logs || [],
    };
  });

  return {
    adminName,
    adminEmail,
    totalCount,
    activeCount,
    completedCount,
    students,
  };
}
