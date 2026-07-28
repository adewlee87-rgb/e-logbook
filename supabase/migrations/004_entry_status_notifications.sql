-- Notify a student when their log entry is "stamped" (approved or rejected)

create function public.notify_entry_status_change()
returns trigger as $$
begin
  if new.status is distinct from old.status and new.status in ('approved', 'rejected') then
    insert into public.notifications (user_id, message)
    values (
      new.student_id,
      case
        when new.status = 'approved' then 'Your log "' || new.title || '" was approved.'
        else 'Your log "' || new.title || '" was rejected.'
      end
    );
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_entry_status_stamped
  after update on logbook_entries
  for each row execute procedure public.notify_entry_status_change();
