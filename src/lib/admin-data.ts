import { createClient } from "@/lib/supabase/server";
import { relativeTime, fullName, initials, parseSafeDate } from "@/lib/supervisor";

export interface ActivityItemData {
  id: string;
  iconBg: string;
  iconColor: string;
  icon: "user-plus" | "users" | "document" | "check-circle" | "alert-triangle";
  text: string;
  time: string;
  timestamp: string;
}

export interface AdminSupervisorOverview {
  id: string;
  avatarBg: string;
  avatarTextColor: string;
  initials: string;
  name: string;
  department: string;
  assignedStudents: number;
  completed: string | number;
  status: "Active" | "Inactive";
}

export interface AdminDashboardData {
  adminName: string;
  adminEmail: string;
  stats: {
    totalStudents: number;
    totalSupervisors: number;
    assignedStudents: number;
    unassignedStudents: number;
    submissions: number;
    completedLogs: number;
    inactiveStudents: number;
  };
  activities: ActivityItemData[];
  supervisors: AdminSupervisorOverview[];
}

// Color palettes for supervisor initials avatars
const AVATAR_PALETTES = [
  { bg: "bg-[#A7F3D0]", text: "text-[#047857]" }, // Green
  { bg: "bg-[#A5F3FC]", text: "text-[#0891B2]" }, // Cyan
  { bg: "bg-[#FEF3C7]", text: "text-[#D97706]" }, // Amber
  { bg: "bg-[#E0E7FF]", text: "text-[#4338CA]" }, // Indigo
  { bg: "bg-[#FCE7F3]", text: "text-[#BE185D]" }, // Pink
];

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = await createClient();

  // 1. Authenticated User / Admin Profile
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

  // 2. Real Metric Queries from DB
  // Total Students (profiles with role = 'student')
  const { count: studentCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "student");

  const totalStudents = studentCount ?? 0;

  // Total Supervisors (profiles with role = 'supervisor')
  const { count: supervisorCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "supervisor");

  const totalSupervisors = supervisorCount ?? 0;

  // Assigned Students (count distinct student_ids in supervisors_students)
  const { data: assignmentRows } = await supabase
    .from("supervisors_students")
    .select("student_id, supervisor_id");

  const assignedStudentIds = new Set(
    (assignmentRows || []).map((r) => r.student_id)
  );
  const assignedStudents = assignedStudentIds.size;
  const unassignedStudents = Math.max(0, totalStudents - assignedStudents);

  // Submissions (status in 'submitted', 'approved', 'rejected')
  const { count: submissionsCount } = await supabase
    .from("logbook_entries")
    .select("id", { count: "exact", head: true })
    .in("status", ["submitted", "approved", "rejected"]);

  const submissions = submissionsCount ?? 0;

  // Completed Logs (status = 'approved')
  const { count: approvedCount } = await supabase
    .from("logbook_entries")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved");

  const completedLogs = approvedCount ?? 0;

  // Inactive Students (students with 0 submitted/approved logbook entries)
  const { data: activeEntryRows } = await supabase
    .from("logbook_entries")
    .select("student_id")
    .in("status", ["submitted", "approved"]);

  const activeStudentIds = new Set((activeEntryRows || []).map((e) => e.student_id));
  
  // Count how many students exist in profiles who have NO submitted/approved entries
  const { data: allStudentProfiles } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "student");

  let inactiveStudents = 0;
  if (allStudentProfiles) {
    inactiveStudents = allStudentProfiles.filter((s) => !activeStudentIds.has(s.id)).length;
  }

  // 3. Real Recent Activities from Database
  interface EventLog {
    id: string;
    iconBg: string;
    iconColor: string;
    icon: "user-plus" | "users" | "document" | "check-circle" | "alert-triangle";
    text: string;
    timestamp: string;
  }

  const events: EventLog[] = [];

  // A) Recent Signups
  const { data: recentProfiles } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role, created_at, email")
    .order("created_at", { ascending: false })
    .limit(10);

  if (recentProfiles) {
    for (const p of recentProfiles) {
      if (!p.created_at) continue;
      const name = fullName(p) || p.email || "New User";
      events.push({
        id: `signup-${p.id}`,
        iconBg: "bg-[#DCFCE7]",
        iconColor: "text-[#16A34A]",
        icon: "users",
        text: `${name} signed up as ${p.role}`,
        timestamp: p.created_at,
      });
    }
  }

  // B) Recent Supervisor Review Actions (approvals / returns)
  const { data: recentReviews } = await supabase
    .from("reviews")
    .select("id, reviewer_id, entry_id, reviewed_at")
    .order("reviewed_at", { ascending: false })
    .limit(10);

  if (recentReviews && recentReviews.length > 0) {
    const reviewerIds = Array.from(new Set(recentReviews.map((r) => r.reviewer_id)));
    const entryIds = Array.from(new Set(recentReviews.map((r) => r.entry_id)));

    const [{ data: revProfiles }, { data: revEntries }] = await Promise.all([
      supabase.from("profiles").select("id, first_name, last_name").in("id", reviewerIds),
      supabase.from("logbook_entries").select("id, title, status").in("id", entryIds),
    ]);

    const reviewerMap = new Map((revProfiles || []).map((p) => [p.id, fullName(p)]));
    const entryMap = new Map((revEntries || []).map((e) => [e.id, e]));

    for (const r of recentReviews) {
      if (!r.reviewed_at) continue;
      const supName = reviewerMap.get(r.reviewer_id) || "Supervisor";
      const entry = entryMap.get(r.entry_id);
      const title = entry?.title || "Logbook Entry";
      const isApproved = entry?.status === "approved";

      events.push({
        id: `review-${r.id}`,
        iconBg: isApproved ? "bg-[#DCFCE7]" : "bg-[#FEE2E2]",
        iconColor: isApproved ? "text-[#16A34A]" : "text-[#DC2626]",
        icon: isApproved ? "check-circle" : "alert-triangle",
        text: `${supName} ${isApproved ? "approved" : "returned for revision"} report "${title}"`,
        timestamp: r.reviewed_at,
      });
    }
  }

  // C) Recent Logbook Entries (submitting / updating)
  const { data: recentEntries } = await supabase
    .from("logbook_entries")
    .select("id, student_id, title, status, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(10);

  if (recentEntries && recentEntries.length > 0) {
    const sIds = Array.from(new Set(recentEntries.map((e) => e.student_id)));
    const { data: entryStudentProfiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", sIds);

    const sNameMap = new Map((entryStudentProfiles || []).map((sp) => [sp.id, fullName(sp)]));

    for (const entry of recentEntries) {
      const timestamp = entry.updated_at || entry.created_at;
      if (!timestamp) continue;
      const studentName = sNameMap.get(entry.student_id) || "Student";
      events.push({
        id: `entry-${entry.id}`,
        iconBg: "bg-[#FEF3C7]",
        iconColor: "text-[#D97706]",
        icon: "document",
        text: `${studentName} ${entry.status === "submitted" ? "submitted report" : entry.status === "approved" ? "had report approved" : "created report"} "${entry.title || "Logbook Entry"}"`,
        timestamp,
      });
    }
  }

  // D) Recent Notifications
  const { data: recentNotifications } = await supabase
    .from("notifications")
    .select("id, message, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  if (recentNotifications) {
    for (const n of recentNotifications) {
      if (!n.created_at) continue;
      events.push({
        id: `notif-${n.id}`,
        iconBg: "bg-[#CCFBF1]",
        iconColor: "text-[#0D9488]",
        icon: "user-plus",
        text: n.message,
        timestamp: n.created_at,
      });
    }
  }

  // Deduplicate and sort all events chronologically descending
  const uniqueEventsMap = new Map<string, EventLog>();
  for (const ev of events) {
    if (!uniqueEventsMap.has(ev.id)) {
      uniqueEventsMap.set(ev.id, ev);
    }
  }

  const sortedEvents = Array.from(uniqueEventsMap.values()).sort((a, b) => {
    const timeA = parseSafeDate(a.timestamp)?.getTime() ?? 0;
    const timeB = parseSafeDate(b.timestamp)?.getTime() ?? 0;
    return timeB - timeA;
  });

  const activities: ActivityItemData[] = sortedEvents.slice(0, 15).map((e) => ({
    id: e.id,
    iconBg: e.iconBg,
    iconColor: e.iconColor,
    icon: e.icon,
    text: e.text,
    time: relativeTime(e.timestamp),
    timestamp: e.timestamp,
  }));

  // 4. Real Supervisors Overview Table Query
  const { data: dbSupervisors } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, department, created_at")
    .eq("role", "supervisor")
    .order("created_at", { ascending: false });

  const supervisors: AdminSupervisorOverview[] = [];

  if (dbSupervisors && dbSupervisors.length > 0) {
    for (let i = 0; i < dbSupervisors.length; i++) {
      const sup = dbSupervisors[i];
      const sName = fullName(sup) || "Supervisor";
      const sInitials = initials(sName);
      const palette = AVATAR_PALETTES[i % AVATAR_PALETTES.length];

      // Assigned Students count for this supervisor
      const { count: assignedCount } = await supabase
        .from("supervisors_students")
        .select("student_id", { count: "exact", head: true })
        .eq("supervisor_id", sup.id);

      // Fetch assigned student IDs to query completed (approved) logs
      const { data: supStudentRows } = await supabase
        .from("supervisors_students")
        .select("student_id")
        .eq("supervisor_id", sup.id);

      let completedLogsCount: string | number = "-";
      if (supStudentRows && supStudentRows.length > 0) {
        const studentIds = supStudentRows.map((r) => r.student_id);
        const { count: approvedLogs } = await supabase
          .from("logbook_entries")
          .select("id", { count: "exact", head: true })
          .in("student_id", studentIds)
          .eq("status", "approved");

        completedLogsCount = approvedLogs !== null && approvedLogs > 0 ? approvedLogs : "-";
      }

      supervisors.push({
        id: sup.id,
        avatarBg: palette.bg,
        avatarTextColor: palette.text,
        initials: sInitials,
        name: sName,
        department: sup.department || "General SIWES",
        assignedStudents: assignedCount ?? 0,
        completed: completedLogsCount,
        status: "Active",
      });
    }
  }

  return {
    adminName,
    adminEmail,
    stats: {
      totalStudents,
      totalSupervisors,
      assignedStudents,
      unassignedStudents,
      submissions,
      completedLogs,
      inactiveStudents,
    },
    activities,
    supervisors,
  };
}
