// Pure helpers shared across the e-logbook application

export function fullName(p: { first_name?: string | null; last_name?: string | null } | null | undefined): string {
  if (!p) return "";
  return `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim();
}

export function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

// Derive a stable display ID from the profile UUID for the UI
export function shortStudentId(uuid: string): string {
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    hash = (hash * 31 + uuid.charCodeAt(i)) & 0xffffffff;
  }
  const digits = (Math.abs(hash) % 9000) + 1000;
  return `STU-${digits}`;
}

/**
 * Safely parses any ISO timestamp or YYYY-MM-DD date string
 * avoiding timezone off-by-one day shifts.
 */
export function parseSafeDate(isoOrDateStr: string | Date | null | undefined): Date | null {
  if (!isoOrDateStr) return null;
  if (isoOrDateStr instanceof Date) return isNaN(isoOrDateStr.getTime()) ? null : isoOrDateStr;

  const str = String(isoOrDateStr).trim();
  if (!str) return null;

  // Match YYYY-MM-DD format (no time specified)
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
  if (dateOnlyMatch) {
    const [, y, m, d] = dateOnlyMatch;
    // Set to local noon to avoid any timezone/DST day boundary shifts
    return new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
  }

  // Handle SQL / Postgres timestamp string format: "YYYY-MM-DD HH:MM:SS" or "YYYY-MM-DD HH:MM:SS.ms" (space instead of T)
  let normalizedStr = str;
  if (str.includes(" ") && !str.includes("T")) {
    normalizedStr = str.replace(" ", "T");
  }

  const parsed = new Date(normalizedStr);
  if (isNaN(parsed.getTime())) return null;
  return parsed;
}

/**
 * Formats a date accurately (e.g. "Aug 22, 2026")
 */
export function formatDate(isoOrDateStr: string | Date | null | undefined): string {
  const d = parseSafeDate(isoOrDateStr);
  if (!d) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Formats a date with full month name (e.g. "August 22, 2026")
 */
export function formatDateLong(isoOrDateStr: string | Date | null | undefined): string {
  const d = parseSafeDate(isoOrDateStr);
  if (!d) return "—";
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Formats date and time accurately (e.g. "Aug 22, 2026 • 2:30 PM")
 */
export function formatDateTime(isoOrDateStr: string | Date | null | undefined): string {
  const d = parseSafeDate(isoOrDateStr);
  if (!d) return "—";
  const datePart = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${datePart} • ${timePart}`;
}

/**
 * Formats time portion accurately (e.g. "2:30 PM")
 */
export function formatTime(isoOrDateStr: string | Date | null | undefined): string {
  const d = parseSafeDate(isoOrDateStr);
  if (!d) return "—";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/**
 * Relative time calculation with safeguards against clock drift & negative offsets.
 */
export function relativeTime(isoOrDateStr: string | Date | null | undefined): string {
  const d = parseSafeDate(isoOrDateStr);
  if (!d) return "—";

  const diffMs = Date.now() - d.getTime();

  // If timestamp is in the future or within 45 seconds (handling minor clock skews)
  if (diffMs < 45000) return "just now";

  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;

  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;

  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

export function isInternshipActive(start: string | null, end: string | null): boolean {
  if (!start || !end) return false;
  const s = parseSafeDate(start);
  const e = parseSafeDate(end);
  if (!s || !e) return false;
  const today = new Date();
  return today >= s && today <= e;
}

// Progress through the internship window as a 0–100 percentage of elapsed time
export function internshipProgress(start: string | null, end: string | null): number {
  if (!start || !end) return 0;
  const s = parseSafeDate(start);
  const e = parseSafeDate(end);
  if (!s || !e) return 0;
  const sTime = s.getTime();
  const eTime = e.getTime();
  const now = Date.now();
  if (eTime <= sTime) return 0;
  const pct = Math.round(((now - sTime) / (eTime - sTime)) * 100);
  return Math.max(0, Math.min(100, pct));
}
