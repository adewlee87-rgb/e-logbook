-- Y'ello Log initial schema: enums, tables, signup trigger, RLS policies

-- ============================================================
-- Enums
-- ============================================================
create type user_role as enum ('student', 'supervisor', 'itf_official', 'admin');
create type entry_type as enum ('daily', 'weekly', 'monthly');
create type entry_status as enum ('draft', 'submitted', 'approved', 'rejected');

-- ============================================================
-- Tables
-- ============================================================

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  role user_role not null default 'student',
  school text,
  department text,
  level text,
  place_of_work text,
  passport_photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table logbook_entries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles (id) on delete cascade,
  type entry_type not null default 'daily',
  title text not null,
  date date not null default current_date,
  objective text,
  observations text,
  status entry_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table entry_media (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references logbook_entries (id) on delete cascade,
  file_url text not null,
  file_type text not null,
  created_at timestamptz not null default now()
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references logbook_entries (id) on delete cascade,
  reviewer_id uuid not null references profiles (id) on delete cascade,
  reviewer_role user_role not null,
  comment text,
  reviewed_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table supervisors_students (
  supervisor_id uuid not null references profiles (id) on delete cascade,
  student_id uuid not null references profiles (id) on delete cascade,
  primary key (supervisor_id, student_id)
);

-- ============================================================
-- Auto-create profile row on signup
-- ============================================================
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name, last_name, email, role, school)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    new.email,
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'student'),
    new.raw_user_meta_data ->> 'school'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table profiles enable row level security;
alter table logbook_entries enable row level security;
alter table entry_media enable row level security;
alter table reviews enable row level security;
alter table notifications enable row level security;
alter table supervisors_students enable row level security;

-- Helper: current user's role, read from profiles
create function public.current_role()
returns user_role as $$
  select role from public.profiles where id = auth.uid();
$$ language sql stable security definer set search_path = public;

-- ---------- profiles ----------
create policy "profiles_select_own" on profiles
  for select using (id = auth.uid());

create policy "profiles_select_mapped_student" on profiles
  for select using (
    exists (
      select 1 from supervisors_students ss
      where ss.student_id = profiles.id and ss.supervisor_id = auth.uid()
    )
  );

create policy "profiles_update_own" on profiles
  for update using (id = auth.uid());

create policy "profiles_admin_all" on profiles
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- ---------- logbook_entries ----------
create policy "entries_student_select_own" on logbook_entries
  for select using (student_id = auth.uid());

create policy "entries_student_insert_own" on logbook_entries
  for insert with check (student_id = auth.uid());

create policy "entries_student_update_own" on logbook_entries
  for update using (student_id = auth.uid());

create policy "entries_supervisor_select_mapped" on logbook_entries
  for select using (
    exists (
      select 1 from supervisors_students ss
      where ss.student_id = logbook_entries.student_id and ss.supervisor_id = auth.uid()
    )
  );

create policy "entries_itf_select_approved" on logbook_entries
  for select using (
    public.current_role() = 'itf_official' and status = 'approved'
  );

create policy "entries_admin_all" on logbook_entries
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- ---------- entry_media ----------
create policy "media_student_select_own" on entry_media
  for select using (
    exists (
      select 1 from logbook_entries e
      where e.id = entry_media.entry_id and e.student_id = auth.uid()
    )
  );

create policy "media_student_insert_own" on entry_media
  for insert with check (
    exists (
      select 1 from logbook_entries e
      where e.id = entry_media.entry_id and e.student_id = auth.uid()
    )
  );

create policy "media_student_update_own" on entry_media
  for update using (
    exists (
      select 1 from logbook_entries e
      where e.id = entry_media.entry_id and e.student_id = auth.uid()
    )
  );

create policy "media_supervisor_select_mapped" on entry_media
  for select using (
    exists (
      select 1 from logbook_entries e
      join supervisors_students ss on ss.student_id = e.student_id
      where e.id = entry_media.entry_id and ss.supervisor_id = auth.uid()
    )
  );

create policy "media_itf_select_approved" on entry_media
  for select using (
    public.current_role() = 'itf_official'
    and exists (
      select 1 from logbook_entries e
      where e.id = entry_media.entry_id and e.status = 'approved'
    )
  );

create policy "media_admin_all" on entry_media
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- ---------- reviews ----------
create policy "reviews_student_select_own_entries" on reviews
  for select using (
    exists (
      select 1 from logbook_entries e
      where e.id = reviews.entry_id and e.student_id = auth.uid()
    )
  );

create policy "reviews_supervisor_select" on reviews
  for select using (
    exists (
      select 1 from logbook_entries e
      join supervisors_students ss on ss.student_id = e.student_id
      where e.id = reviews.entry_id and ss.supervisor_id = auth.uid()
    )
  );

create policy "reviews_supervisor_insert" on reviews
  for insert with check (
    reviewer_id = auth.uid()
    and public.current_role() = 'supervisor'
    and exists (
      select 1 from logbook_entries e
      join supervisors_students ss on ss.student_id = e.student_id
      where e.id = reviews.entry_id and ss.supervisor_id = auth.uid()
    )
  );

create policy "reviews_itf_select_approved" on reviews
  for select using (
    public.current_role() = 'itf_official'
    and exists (
      select 1 from logbook_entries e
      where e.id = reviews.entry_id and e.status = 'approved'
    )
  );

create policy "reviews_itf_insert_approved" on reviews
  for insert with check (
    reviewer_id = auth.uid()
    and public.current_role() = 'itf_official'
    and exists (
      select 1 from logbook_entries e
      where e.id = reviews.entry_id and e.status = 'approved'
    )
  );

create policy "reviews_admin_all" on reviews
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- ---------- notifications ----------
create policy "notifications_select_own" on notifications
  for select using (user_id = auth.uid());

create policy "notifications_update_own" on notifications
  for update using (user_id = auth.uid());

create policy "notifications_admin_all" on notifications
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- ---------- supervisors_students ----------
create policy "supervisors_students_select_own" on supervisors_students
  for select using (supervisor_id = auth.uid() or student_id = auth.uid());

create policy "supervisors_students_admin_all" on supervisors_students
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');
