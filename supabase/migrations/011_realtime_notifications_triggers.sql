-- Migration 011: Automated Realtime Notifications Triggers for Logbook Submissions & Reviews

-- Function to notify supervisor when a student submits a logbook entry
create or replace function public.notify_supervisor_on_entry_submission()
returns trigger as $$
declare
  v_supervisor_id uuid;
  v_student_name text;
begin
  -- Check if entry was just submitted or updated to submitted status
  if (TG_OP = 'INSERT' and new.status = 'submitted') or (TG_OP = 'UPDATE' and new.status = 'submitted' and old.status <> 'submitted') then
    -- Get student full name
    select coalesce(first_name || ' ' || last_name, 'A student')
    into v_student_name
    from public.profiles
    where id = new.student_id;

    -- Find assigned supervisor for this student
    select supervisor_id into v_supervisor_id
    from public.supervisors_students
    where student_id = new.student_id
    limit 1;

    -- If supervisor exists, insert real-time notification
    if v_supervisor_id is not null then
      insert into public.notifications (user_id, message, is_read)
      values (
        v_supervisor_id,
        v_student_name || ' submitted a new logbook entry: "' || coalesce(new.title, 'Weekly Log') || '"',
        false
      );
    end if;

    -- Also notify all admins about the new log submission activity
    insert into public.notifications (user_id, message, is_read)
    select p.id, v_student_name || ' submitted log entry: "' || coalesce(new.title, 'Weekly Log') || '"', false
    from public.profiles p
    where p.role = 'admin';
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Drop trigger if exists and recreate
drop trigger if exists on_logbook_entry_submitted on public.logbook_entries;
create trigger on_logbook_entry_submitted
  after insert or update on public.logbook_entries
  for each row execute procedure public.notify_supervisor_on_entry_submission();

-- Also ensure notifications table has publication for Supabase Realtime
begin;
  -- Enable realtime on notifications table if not already active
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
end;
