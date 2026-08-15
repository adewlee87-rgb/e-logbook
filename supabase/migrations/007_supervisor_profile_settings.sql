-- Supervisor Account Settings needs a professional bio and a third
-- notification preference ("System Updates"). Existing rows keep sensible
-- defaults; both columns are nullable/defaulted so nothing breaks.

alter table public.profiles
  add column if not exists bio text,
  add column if not exists system_updates_enabled boolean not null default true;
