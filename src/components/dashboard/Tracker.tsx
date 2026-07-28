const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_COLUMNS = 53;
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "April", "May", "June",
  "July", "August", "Sept", "Oct", "Nov", "Dec",
];
const ROW_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""];

type DayState = "active" | "inactive" | "upcoming";

interface DayCell {
  date: Date;
  state: DayState;
}

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

  for (let col = 0; col < WEEK_COLUMNS; col++) {
    const week: DayCell[] = [];
    for (let row = 0; row < 7; row++) {
      const date = new Date(gridStart.getTime() + (col * 7 + row) * DAY_MS);
      let state: DayState = "upcoming";
      if (date >= rangeStart && date <= rangeEnd && date <= today) {
        state = activeSet.has(toKey(date)) ? "active" : "inactive";
      }
      week.push({ date, state });
    }
    columns.push(week);
  }

  const stateColor: Record<DayState, string> = {
    active: "bg-primary",
    inactive: "bg-[#FCE9AE]",
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
                  title={toKey(cell.date)}
                  className={`h-3 w-3 rounded-sm ${stateColor[cell.state]}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-[#666]">Monitor your active status</p>
        <div className="flex items-center gap-4 text-xs text-[#666]">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-primary" /> Active
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-[#FCE9AE]" /> Inactive
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-[#EEEFF1]" /> Upcoming
          </span>
        </div>
      </div>
    </div>
  );
}
