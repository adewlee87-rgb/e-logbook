const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_COLUMNS = 53;
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "April", "May", "June",
  "July", "August", "Sept", "Oct", "Nov", "Dec",
];
const ROW_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""];

type DayState = "logged" | "pending" | "missed" | "upcoming";

interface DayCell {
  date: Date;
  state: DayState;
}

const STATE_LABEL: Record<DayState, string> = {
  logged: "Logged",
  pending: "Pending",
  missed: "Missed",
  upcoming: "Upcoming",
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function mondayOfWeek(date: Date) {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function toKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

interface TrackerProps {
  startDate: string | null;
  endDate: string | null;
  activeDates: string[];
}

export function Tracker({ startDate, endDate, activeDates }: TrackerProps) {
  const today = startOfDay(new Date());
  const rangeStart = startDate ? startOfDay(new Date(startDate)) : today;
  const rangeEnd = endDate ? startOfDay(new Date(endDate)) : new Date(rangeStart.getTime() + 168 * DAY_MS);
  const activeSet = new Set(activeDates.map((d) => toKey(startOfDay(new Date(d)))));

  const gridStart = mondayOfWeek(rangeStart);
  const columns: DayCell[][] = [];

  const todayKey = toKey(today);

  // SIWES runs Mon–Fri. Flip this to `false` if your programme expects logs
  // on weekends too — weekends will then count as "missed" like any other day.
  const EXCLUDE_WEEKENDS = true;

  for (let col = 0; col < WEEK_COLUMNS; col++) {
    const week: DayCell[] = [];
    for (let row = 0; row < 7; row++) {
      const date = new Date(gridStart.getTime() + (col * 7 + row) * DAY_MS);
      const dow = date.getDay(); // 0 = Sun, 6 = Sat
      const isWeekend = dow === 0 || dow === 6;
      let state: DayState = "upcoming";
      if (date >= rangeStart && date <= rangeEnd && date <= today) {
        if (activeSet.has(toKey(date))) {
          // A log was submitted for this day.
          state = "logged";
        } else if (EXCLUDE_WEEKENDS && isWeekend) {
          // Not a working day — leave it neutral rather than flag it missed.
          state = "upcoming";
        } else if (toKey(date) === todayKey) {
          // It's a working day, it's today, and no log yet — still pending.
          state = "pending";
        } else {
          // A past working day with no submission — missed.
          state = "missed";
        }
      }
      week.push({ date, state });
    }
    columns.push(week);
  }

  const stateColor: Record<DayState, string> = {
    logged: "bg-[#16A34A]",
    pending: "bg-primary",
    missed: "bg-[#F87171]",
    upcoming: "bg-[#EEEFF1]",
  };

  let lastMonth = -1;
  const monthMarkers = columns.map((week) => {
    const month = week[0].date.getMonth();
    if (month !== lastMonth) {
      lastMonth = month;
      return MONTH_LABELS[month];
    }
    return null;
  });

  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
      <div className="overflow-x-auto">
        <div className="inline-flex min-w-full gap-[3px] pl-8">
          <div className="flex flex-col justify-between gap-[3px] pr-2 pt-6 text-xs text-[#666]">
            {ROW_LABELS.map((label, i) => (
              <div key={i} className="flex h-3 items-center">
                {label}
              </div>
            ))}
          </div>
          {columns.map((week, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-[3px]">
              <div className="h-6 text-xs text-[#666]">{monthMarkers[colIndex] ?? ""}</div>
              {week.map((cell, rowIndex) => (
                <div
                  key={rowIndex}
                  title={`${toKey(cell.date)} — ${STATE_LABEL[cell.state]}`}
                  className={`h-3 w-3 rounded-sm ${stateColor[cell.state]}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-[#666]">Monitor your active status</p>
        <div className="flex flex-wrap items-center gap-4 text-xs text-[#666]">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-[#16A34A]" /> Logged
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-primary" /> Pending
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-[#F87171]" /> Missed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-[#EEEFF1]" /> Upcoming
          </span>
        </div>
      </div>
    </div>
  );
}
