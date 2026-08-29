"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface SiwesCompletionSummary {
  studentName: string;
  studentEmail: string;
  department: string;
  placeOfWork: string;
  supervisorName: string;
  startDate: string | null;
  endDate: string | null;
  totalLogs: number;
  approvedLogs: number;
  completedAt: string;
}

export async function completeSiwesAction(studentId: string): Promise<{
  success: boolean;
  error?: string;
  summary?: SiwesCompletionSummary;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || (user.id !== studentId && user.user_metadata?.role !== "admin")) {
    return { success: false, error: "Unauthorized operation." };
  }

  // 1. Fetch Student Profile
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("first_name, last_name, email, department, place_of_work, internship_start_date, internship_end_date")
    .eq("id", studentId)
    .single();

  if (profileErr || !profile) {
    return { success: false, error: "Student profile not found." };
  }

  const studentName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Student";
  const studentEmail = profile.email || user.email || "";

  // 2. Fetch Log Entries summary
  const { data: entries } = await supabase
    .from("logbook_entries")
    .select("id, status")
    .eq("student_id", studentId);

  const totalLogs = entries?.length || 0;
  const approvedLogs = entries?.filter((e) => e.status === "approved").length || 0;

  // 3. Fetch Assigned Supervisor
  const { data: mapping } = await supabase
    .from("supervisors_students")
    .select("supervisor_id, profiles!supervisors_students_supervisor_id_fkey(first_name, last_name)")
    .eq("student_id", studentId)
    .single();

  let supervisorName = "Assigned Supervisor";
  if (mapping && mapping.profiles) {
    const sup = mapping.profiles as unknown as { first_name?: string; last_name?: string };
    supervisorName = `${sup.first_name || ""} ${sup.last_name || ""}`.trim() || "Supervisor";
  }

  const nowIso = new Date().toISOString();

  // 4. Update Profile to 'completed'
  const { error: updateErr } = await supabase
    .from("profiles")
    .update({
      siwes_status: "completed",
      siwes_completed_at: nowIso,
    })
    .eq("id", studentId);

  if (updateErr) {
    return { success: false, error: updateErr.message || "Failed to update SIWES completion status." };
  }

  // 5. Dispatch Notification to Supervisor
  if (mapping?.supervisor_id) {
    await supabase.from("notifications").insert({
      user_id: mapping.supervisor_id,
      message: `🎉 ${studentName} has successfully completed their SIWES program! (${approvedLogs} approved logs).`,
      is_read: false,
    });
  }

  // 6. Dispatch Notification to Admins
  const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin");

  if (admins && admins.length > 0) {
    const adminNotifs = admins.map((a) => ({
      user_id: a.id,
      message: `🎓 Student ${studentName} (${profile.department || "General SIWES"}) completed SIWES offboarding.`,
      is_read: false,
    }));
    await supabase.from("notifications").insert(adminNotifs);
  }

  // 7. Dispatch Confirmation Notification to Student
  await supabase.from("notifications").insert({
    user_id: studentId,
    message: `🎓 Congratulations ${studentName}! You have officially completed your SIWES program. Your final logbook portfolio is ready for download.`,
    is_read: false,
  });

  revalidatePath("/student");
  revalidatePath("/supervisor");
  revalidatePath("/admin");

  return {
    success: true,
    summary: {
      studentName,
      studentEmail,
      department: profile.department || "General SIWES",
      placeOfWork: profile.place_of_work || "N/A",
      supervisorName,
      startDate: profile.internship_start_date,
      endDate: profile.internship_end_date,
      totalLogs,
      approvedLogs,
      completedAt: nowIso,
    },
  };
}

/**
 * Checks if a specific student has reached their internship_end_date and auto-offboards them if needed.
 */
export async function checkAndAutoOffboardStudent(studentId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("internship_start_date, internship_end_date, siwes_status")
    .eq("id", studentId)
    .single();

  if (!profile || !profile.internship_end_date) {
    return false;
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const endDateStr = profile.internship_end_date;

  // If current date has NOT reached the end date, student CANNOT be completed!
  if (todayStr < endDateStr) {
    if (profile.siwes_status === "completed") {
      await supabase
        .from("profiles")
        .update({ siwes_status: "active", siwes_completed_at: null })
        .eq("id", studentId);
    }
    return false;
  }

  if (profile.siwes_status === "completed") {
    return true;
  }

  // End date is reached/passed and status is active -> execute auto-offboarding
  const res = await completeSiwesActionInternal(studentId);
  return res.success;
}

/**
 * Internal function to execute offboarding without strict auth session check when triggered automatically.
 */
export async function completeSiwesActionInternal(studentId: string): Promise<{
  success: boolean;
  error?: string;
  summary?: SiwesCompletionSummary;
}> {
  const supabase = await createClient();

  // 1. Fetch Student Profile
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("first_name, last_name, email, department, place_of_work, internship_start_date, internship_end_date, siwes_status")
    .eq("id", studentId)
    .single();

  if (profileErr || !profile) {
    return { success: false, error: "Student profile not found." };
  }

  if (profile.siwes_status === "completed") {
    return { success: true };
  }

  const studentName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Student";
  const studentEmail = profile.email || "";

  // 2. Fetch Log Entries summary
  const { data: entries } = await supabase
    .from("logbook_entries")
    .select("id, status")
    .eq("student_id", studentId);

  const totalLogs = entries?.length || 0;
  const approvedLogs = entries?.filter((e) => e.status === "approved").length || 0;

  // 3. Fetch Assigned Supervisor
  const { data: mapping } = await supabase
    .from("supervisors_students")
    .select("supervisor_id, profiles!supervisors_students_supervisor_id_fkey(first_name, last_name)")
    .eq("student_id", studentId)
    .single();

  let supervisorName = "Assigned Supervisor";
  if (mapping && mapping.profiles) {
    const sup = mapping.profiles as unknown as { first_name?: string; last_name?: string };
    supervisorName = `${sup.first_name || ""} ${sup.last_name || ""}`.trim() || "Supervisor";
  }

  const nowIso = new Date().toISOString();

  // 4. Update Profile to 'completed'
  const { error: updateErr } = await supabase
    .from("profiles")
    .update({
      siwes_status: "completed",
      siwes_completed_at: nowIso,
    })
    .eq("id", studentId);

  if (updateErr) {
    return { success: false, error: updateErr.message || "Failed to update SIWES completion status." };
  }

  // 5. Dispatch Notification to Supervisor
  if (mapping?.supervisor_id) {
    await supabase.from("notifications").insert({
      user_id: mapping.supervisor_id,
      message: `🎉 Internship End Date (${profile.internship_end_date || "Today"}) reached for ${studentName}! Student has been automatically offboarded (${approvedLogs} approved logs).`,
      is_read: false,
    });
  }

  // 6. Dispatch Notification to Admins
  const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin");

  if (admins && admins.length > 0) {
    const adminNotifs = admins.map((a) => ({
      user_id: a.id,
      message: `🎓 Student ${studentName} (${profile.department || "General SIWES"}) reached internship end date (${profile.internship_end_date || "Today"}) and was automatically offboarded.`,
      is_read: false,
    }));
    await supabase.from("notifications").insert(adminNotifs);
  }

  // 7. Dispatch Confirmation Notification to Student
  await supabase.from("notifications").insert({
    user_id: studentId,
    message: `🎓 Congratulations ${studentName}! Your internship end date (${profile.internship_end_date || "Today"}) has arrived and your SIWES program is now completed. Your final logbook portfolio is ready to print.`,
    is_read: false,
  });

  revalidatePath("/student");
  revalidatePath("/supervisor");
  revalidatePath("/admin");

  return {
    success: true,
    summary: {
      studentName,
      studentEmail,
      department: profile.department || "General SIWES",
      placeOfWork: profile.place_of_work || "N/A",
      supervisorName,
      startDate: profile.internship_start_date,
      endDate: profile.internship_end_date,
      totalLogs,
      approvedLogs,
      completedAt: nowIso,
    },
  };
}

/**
 * Checks and auto-offboards all students whose internship end dates have arrived.
 */
export async function checkAndAutoOffboardAllEligible(): Promise<number> {
  const supabase = await createClient();

  const todayStr = new Date().toISOString().slice(0, 10);

  const { data: eligibleProfiles } = await supabase
    .from("profiles")
    .select("id, internship_end_date")
    .eq("role", "student")
    .neq("siwes_status", "completed")
    .not("internship_end_date", "is", null);

  if (!eligibleProfiles || eligibleProfiles.length === 0) {
    return 0;
  }

  let count = 0;
  for (const p of eligibleProfiles) {
    if (p.internship_end_date && todayStr >= p.internship_end_date) {
      const res = await completeSiwesActionInternal(p.id);
      if (res.success) count++;
    }
  }

  return count;
}

