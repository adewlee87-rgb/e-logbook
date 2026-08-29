-- Migration 012: Add SIWES Completion & Offboarding columns to profiles table

alter table public.profiles
  add column if not exists siwes_status text not null default 'active',
  add column if not exists siwes_completed_at timestamp with time zone;

-- Index for quick filtering on supervisor/admin dashboards
create index if not exists idx_profiles_siwes_status on public.profiles(siwes_status);
