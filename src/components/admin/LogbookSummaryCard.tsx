"use client";

interface LogbookSummaryCardProps {
  submissions?: number;
  completedLogs?: number;
  inactiveStudents?: number;
  totalStudents?: number;
}

export function LogbookSummaryCard({
  submissions = 0,
  completedLogs = 0,
  inactiveStudents = 0,
  totalStudents = 0,
}: LogbookSummaryCardProps) {
  // Calculated percentages relative to real total students / submissions
  const baseTotal = totalStudents > 0 ? totalStudents : 1;
  const subBase = submissions > 0 ? submissions : 1;

  const submissionsPct = Math.min(Math.round((submissions / baseTotal) * 100), 100);
  const completedPct = Math.min(Math.round((completedLogs / subBase) * 100), 100);
  const inactivePct = Math.min(Math.round((inactiveStudents / baseTotal) * 100), 100);

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-gray-100/80 bg-white p-6 shadow-xs">
      <div>
        <h2 className="text-xl font-bold text-[#111827]">Logbook Summary</h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          Manage and track your latest logbook report
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-6">
        {/* Row 1: Logbook Submissions */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-[#374151]">Logbook Submissions</span>
            <span className="font-bold text-[#111827]">{submissions.toLocaleString()}</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#FACC15] transition-all duration-500"
              style={{ width: `${submissionsPct}%` }}
            />
          </div>
        </div>

        {/* Row 2: Completed Logs */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-[#374151]">Completed Logs</span>
            <span className="font-bold text-[#111827]">{completedLogs.toLocaleString()}</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#22C55E] transition-all duration-500"
              style={{ width: `${completedPct}%` }}
            />
          </div>
        </div>

        {/* Row 3: Inactive Students */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-[#374151]">Inactive Students</span>
            <span className="font-bold text-[#111827]">{inactiveStudents.toLocaleString()}</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#EF4444] transition-all duration-500"
              style={{ width: `${inactivePct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
