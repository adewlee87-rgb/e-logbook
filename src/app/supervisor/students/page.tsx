import { getSupervisorContext } from "@/lib/supervisor-data";
import { SupervisorShell } from "@/components/supervisor/SupervisorShell";
import { StudentsGrid, type StudentVM } from "@/components/supervisor/StudentsGrid";
import { fullName, shortStudentId, relativeTime } from "@/lib/supervisor";
import { FilterIcon, DownloadIcon } from "@/components/ui/icons";

// A full SIWES cycle is roughly 24 weekly logs — used as the progress target.
const LOG_TARGET = 24;
const ACTIVE_WINDOW_MS = 60 * 24 * 60 * 60 * 1000;

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
        .select("id, first_name, last_name, passport_photo_url, place_of_work")
        .in("id", studentIds)
    : { data: [] };
  const profiles = profilesRaw ?? [];

  // All entries for those students (for progress + last-active aggregation)
  const { data: entriesRaw } = studentIds.length
    ? await supabase
        .from("logbook_entries")
        .select("student_id, status, created_at")
        .in("student_id", studentIds)
    : { data: [] };
  const entries = entriesRaw ?? [];

  // Aggregate per student
  const agg = new Map<string, { total: number; latest: string | null }>();
  for (const e of entries) {
    const sid = e.student_id as string;
    const cur = agg.get(sid) ?? { total: 0, latest: null };
    cur.total += 1;
    const created = e.created_at as string | null;
    if (created && (!cur.latest || created > cur.latest)) cur.latest = created;
    agg.set(sid, cur);
  }

  const now = Date.now();
  let students: StudentVM[] = profiles.map((p) => {
    const a = agg.get(p.id) ?? { total: 0, latest: null };
    const progress = Math.min(100, Math.round((a.total / LOG_TARGET) * 100));
    const active = !a.latest || now - new Date(a.latest).getTime() <= ACTIVE_WINDOW_MS;
    return {
      id: p.id,
      name: fullName(p) || "Student",
      studentId: shortStudentId(p.id),
      avatarUrl: p.passport_photo_url ?? null,
      active,
      progress,
      lastActive: a.latest ? relativeTime(a.latest) : "No logs yet",
      placeOfWork: p.place_of_work ?? null,
    };
  });

  // Optional name/ID search coming from the top bar or Quick Search
  const q = searchParams.q?.trim().toLowerCase();
  if (q) {
    students = students.filter(
      (s) => s.name.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q)
    );
  }
  students.sort((a, b) => a.name.localeCompare(b.name));

  const activeCount = students.filter((s) => s.active).length;

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
                You have <span className="font-semibold text-[#1A1A1A]">{activeCount}</span> active student
                {activeCount === 1 ? "" : "s"} under your supervision.
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-medium text-[#1A1A1A] hover:bg-gray-50">
            <FilterIcon className="h-4 w-4" />
            Filters
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-[#1A1A1A] hover:bg-[#e6ac00]">
            <DownloadIcon className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      <div className="mt-6">
        {q && students.length === 0 ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-16 text-center">
            <p className="text-sm text-[#666]">
              No students match &ldquo;{searchParams.q}&rdquo;.
            </p>
          </div>
        ) : (
          <StudentsGrid students={students} />
        )}
      </div>
    </SupervisorShell>
  );
}
