import { getSupervisorContext } from "@/lib/supervisor-data";
import { SupervisorShell } from "@/components/supervisor/SupervisorShell";
import { StudentsGrid, type StudentVM } from "@/components/supervisor/StudentsGrid";
import { fullName, shortStudentId, relativeTime } from "@/lib/supervisor";
import { ExportPdfButton } from "@/components/ui/ExportPdfButton";
import type { PDFReportEntry } from "@/lib/pdf-export";

// A full SIWES cycle is roughly 24 weekly logs — used as the progress target.
const LOG_TARGET = 24;

export default async function MyStudentsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const ctx = await getSupervisorContext();
  if (!ctx) return null;
  const { supabase, user, studentIds, shell } = ctx;

  // Profiles for every mapped student
  const { data: profilesRaw } = studentIds.length
    ? await supabase
        .from("profiles")
        .select("id, first_name, last_name, passport_photo_url, place_of_work, department, internship_start_date, internship_end_date, siwes_status, siwes_completed_at")
        .in("id", studentIds)
    : { data: [] };
  const profiles = profilesRaw ?? [];

  // All entries for those students (for progress + last-active aggregation)
  const { data: entriesRaw } = studentIds.length
    ? await supabase
        .from("logbook_entries")
        .select("id, student_id, status, title, body, date, created_at, reviews(id, comment, reviewed_at)")
        .in("student_id", studentIds)
    : { data: [] };
  const entries = entriesRaw ?? [];

  // Aggregate per student
  const agg = new Map<string, { total: number; approved: number; latest: string | null; logs: PDFReportEntry[] }>();
  for (const e of entries) {
    const sid = e.student_id as string;
    const cur = agg.get(sid) ?? { total: 0, approved: 0, latest: null, logs: [] };
    cur.total += 1;
    if (e.status === "approved") cur.approved += 1;
    const created = e.created_at as string | null;
    if (created && (!cur.latest || created > cur.latest)) cur.latest = created;

    const rawRev = (e.reviews ?? []) as unknown as { comment: string | null; reviewed_at: string }[];
    const firstRev = rawRev[0] ?? null;

    cur.logs.push({
      id: e.id,
      title: e.title || "Logbook Entry",
      body: e.body || "",
      date: e.date,
      createdAt: e.created_at,
      status: e.status,
      review: firstRev ? { comment: firstRev.comment, reviewedAt: firstRev.reviewed_at } : null,
    });

    agg.set(sid, cur);
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  const allStudentsVM: StudentVM[] = [];

  for (const p of profiles) {
    let sStatus = (p.siwes_status as "active" | "completed") || "active";
    if (sStatus !== "completed" && p.internship_end_date && todayStr >= p.internship_end_date) {
      const { checkAndAutoOffboardStudent } = await import("@/app/actions/offboarding");
      const autoDone = await checkAndAutoOffboardStudent(p.id);
      if (autoDone) sStatus = "completed";
    }

    const a = agg.get(p.id) ?? { total: 0, approved: 0, latest: null, logs: [] };
    const progress = sStatus === "completed" ? 100 : Math.min(100, Math.round((a.total / LOG_TARGET) * 100));
    const isCompleted = sStatus === "completed";

    allStudentsVM.push({
      id: p.id,
      name: fullName(p) || "Student",
      studentId: shortStudentId(p.id),
      avatarUrl: p.passport_photo_url ?? null,
      active: !isCompleted,
      siwesStatus: sStatus,
      siwesCompletedAt: p.siwes_completed_at ?? null,
      startDate: p.internship_start_date ?? null,
      endDate: p.internship_end_date ?? null,
      department: p.department ?? "General SIWES",
      totalLogs: a.total,
      approvedLogs: a.approved,
      progress,
      lastActive: a.latest ? relativeTime(a.latest) : "No logs yet",
      placeOfWork: p.place_of_work ?? null,
      entries: a.logs,
    });
  }

  // Optional name/ID search coming from the top bar or Quick Search
  const q = searchParams.q?.trim().toLowerCase();
  let filtered = allStudentsVM;
  if (q) {
    filtered = filtered.filter(
      (s) => s.name.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q)
    );
  }
  filtered.sort((a, b) => a.name.localeCompare(b.name));

  const activeStudents = filtered.filter((s) => s.siwesStatus !== "completed");
  const completedStudents = filtered.filter((s) => s.siwesStatus === "completed");

  const pdfEntries: PDFReportEntry[] = filtered.map((s) => ({
    id: s.id,
    title: `${s.name} (${s.studentId}) — SIWES Student Summary`,
    body: `Place of Work: ${s.placeOfWork || "N/A"}. Progress: ${s.progress}%. Status: ${s.siwesStatus.toUpperCase()}`,
    date: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    status: s.siwesStatus === "completed" ? "approved" : "submitted",
  }));

  return (
    <SupervisorShell userId={user.id} user={shell}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] sm:text-3xl">My Students</h1>
          <p className="mt-1 text-sm text-[#666]">
            {q ? (
              <>
                Showing results for <span className="font-semibold text-[#1A1A1A]">&ldquo;{searchParams.q}&rdquo;</span>
              </>
            ) : (
              <>
                Workload: <span className="font-bold text-[#1A1A1A]">{activeStudents.length}/5 Active</span>
                {" • "}
                Relieved/Completed: <span className="font-bold text-emerald-600">{completedStudents.length}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportPdfButton
            entries={pdfEntries}
            title="Supervised Students Roster Report"
            label="Export Roster PDF"
          />
        </div>
      </div>

      <div className="mt-6">
        <StudentsGrid
          activeStudents={activeStudents}
          completedStudents={completedStudents}
          searchQuery={q}
        />
      </div>
    </SupervisorShell>
  );
}
