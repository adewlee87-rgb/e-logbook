"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addSupervisorAction(formData: {
  email: string;
  department?: string;
}) {
  const supabase = await createClient();

  const email = formData.email.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { success: false, error: "Please enter a valid email address." };
  }

  // Derive first & last name from email prefix if not explicitly specified
  const namePart = email.split("@")[0];
  const parts = namePart.split(/[._-]/);
  const firstName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : "Supervisor";
  const lastName = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : "";

  const department = formData.department || "Engineering";

  // Call RPC function to create auth.users entry and profile simultaneously (satisfying FK constraint)
  const { error: rpcErr } = await supabase.rpc("create_supervisor_user", {
    p_email: email,
    p_first_name: firstName,
    p_last_name: lastName,
    p_department: department,
  });

  if (rpcErr) {
    // Fallback: If RPC function fails or is missing, check existing profile or update
    const { data: existing } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("email", email)
      .single();

    if (existing) {
      if (existing.role === "supervisor") {
        return { success: false, error: "A supervisor with this email already exists." };
      }
      // Promote existing user role to supervisor
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ role: "supervisor", department })
        .eq("id", existing.id);

      if (updateErr) {
        return { success: false, error: updateErr.message };
      }
    } else {
      return { success: false, error: rpcErr.message };
    }
  }

  // Log notification activity for real-time feed
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.from("notifications").insert({
      user_id: user.id,
      message: `New supervisor ${firstName} ${lastName}`.trim() + ` (${email}) was added to system`,
      is_read: false,
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/supervisors");
  return { success: true };
}

export async function assignSupervisorAction(formData: {
  studentId: string;
  supervisorId: string;
}) {
  const supabase = await createClient();

  const { studentId, supervisorId } = formData;
  if (!studentId || !supervisorId) {
    return { success: false, error: "Please select both a student and a supervisor." };
  }

  // Delete existing mapping for this student if any
  await supabase
    .from("supervisors_students")
    .delete()
    .eq("student_id", studentId);

  // Insert new mapping
  const { error: insertErr } = await supabase
    .from("supervisors_students")
    .insert({
      student_id: studentId,
      supervisor_id: supervisorId,
    });

  if (insertErr) {
    return { success: false, error: insertErr.message };
  }

  // Fetch names for notification activity feed
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .in("id", [studentId, supervisorId]);

  const pMap = new Map((profiles || []).map((p) => [p.id, `${p.first_name || ""} ${p.last_name || ""}`.trim()]));
  const sName = pMap.get(studentId) || "Student";
  const supName = pMap.get(supervisorId) || "Supervisor";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.from("notifications").insert({
      user_id: user.id,
      message: `${sName} was assigned to ${supName}`,
      is_read: false,
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/students");
  revalidatePath("/admin/supervisors");
  revalidatePath("/admin/assignments");

  return { success: true };
}

export async function updateStudentDepartmentAction(formData: {
  studentId: string;
  department: string;
}) {
  const supabase = await createClient();

  const { studentId, department } = formData;
  if (!studentId) {
    return { success: false, error: "Invalid student ID." };
  }

  const dept = department.trim();
  if (!dept) {
    return { success: false, error: "Please enter a valid department name." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ department: dept })
    .eq("id", studentId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/students");
  revalidatePath("/admin/assignments");
  revalidatePath("/admin/supervisors");

  return { success: true };
}
