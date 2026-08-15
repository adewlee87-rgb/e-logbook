-- e-log entry rules: one log per day + 5-hour edit window
-- Authoritative enforcement at the database level. The UI mirrors these rules
-- for good UX, but this migration is what actually guarantees them.

-- ============================================================
-- 1. One log per student per calendar day
-- ============================================================
-- NOTE: if any student already has two entries with the same `date`, this
-- index will fail to create. Clear duplicates first, e.g.:
--   delete from logbook_entries a using logbook_entries b
--   where a.student_id = b.student_id and a.date = b.date and a.ctid < b.ctid;
create unique index if not exists logbook_entries_one_per_day
  on logbook_entries (student_id, date);

-- ============================================================
-- 2. Students may only edit their own entry within 5 hours of creating it
-- ============================================================
-- Guarded on `auth.uid() = old.student_id`, so it ONLY restricts a student
-- editing their own row. Supervisor/admin updates, the status-change flow, and
-- SQL-editor / service-role writes (where auth.uid() is null) are unaffected.
create function public.enforce_entry_edit_window()
returns trigger as $$
begin
  if auth.uid() = old.student_id
     and now() - old.created_at > interval '5 hours' then
    raise exception 'This log can no longer be edited — the 5-hour window has closed.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_entry_edit_window
  before update on logbook_entries
  for each row execute procedure public.enforce_entry_edit_window();
