-- Profile extras for Profile/Settings screens: username + notification prefs,
-- plus a storage bucket for profile photo uploads.

alter table profiles
  add column username text,
  add column push_notifications_enabled boolean not null default true,
  add column email_summaries_enabled boolean not null default false;

-- ============================================================
-- Avatars storage bucket
-- ============================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_owner_update" on storage.objects
  for update using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- entry-media storage bucket (named in CLAUDE.md, never created)
-- Path convention: entry-media/{student_id}/{entry_id}/{filename}
-- ============================================================
insert into storage.buckets (id, name, public)
values ('entry-media', 'entry-media', true)
on conflict (id) do nothing;

create policy "entry_media_public_read" on storage.objects
  for select using (bucket_id = 'entry-media');

create policy "entry_media_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'entry-media' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "entry_media_owner_update" on storage.objects
  for update using (
    bucket_id = 'entry-media' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "entry_media_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'entry-media' and (storage.foldername(name))[1] = auth.uid()::text
  );
