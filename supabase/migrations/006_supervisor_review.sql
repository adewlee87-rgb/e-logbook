-- Supervisor review actions + student assignment
-- Everything the supervisor portal needs that the base RLS didn't yet grant.

-- ============================================================
-- 1. Supervisors may update (approve / reject) entries of the
--    students mapped to them.
-- ============================================================
-- The base schema only lets students update their own entries, so approve /
-- reject from the supervisor side silently no-ops. This adds the missing
-- policy. The `enforce_entry_edit_window` trigger only fires when
-- auth.uid() = old.student_id, so supervisor updates are never blocked, and
-- `notify_entry_status_change` still fires to notify the student.
create policy "entries_supervisor_update_mapped" on logbook_entries
  for update using (
    exists (
      select 1 from supervisors_students ss
      where ss.student_id = logbook_entries.student_id and ss.supervisor_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from supervisors_students ss
      where ss.student_id = logbook_entries.student_id and ss.supervisor_id = auth.uid()
    )
  );

-- ============================================================
-- 2. Assign a student to the current supervisor by email.
-- ============================================================
-- The supervisors_students table is admin-only for writes, and a supervisor
-- can't read an un-mapped student's profile to look them up. This SECURITY
-- DEFINER function encapsulates the whole flow safely: it verifies the caller
-- is a supervisor, finds the student by email, and inserts the mapping owned
-- by the caller. Returns the new student's id + display name for the UI.
create or replace function public.assign_student_by_email(p_email text)
returns table (student_id uuid, student_name text)
as $$
declare
  v_id uuid;
  v_name text;
begin
  if public.current_role() <> 'supervisor' then
    raise exception 'Only supervisors can assign students.';
  end if;

  select id, trim(coalesce(first_name, '') || ' ' || coalesce(last_name, ''))
    into v_id, v_name
  from public.profiles
  where lower(email) = lower(trim(p_email)) and role = 'student'
  limit 1;

  if v_id is null then
    raise exception 'No student found with that email address.';
  end if;

  insert into public.supervisors_students (supervisor_id, student_id)
  values (auth.uid(), v_id)
  on conflict do nothing;

  return query select v_id, v_name;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.assign_student_by_email(text) to authenticated;
