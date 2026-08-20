-- Migration: 008_remove_itf_role.sql
-- Copy and paste this script into your Supabase SQL Editor to update your remote database

-- 1. Drop ITF RLS policies
DROP POLICY IF EXISTS "entries_itf_select_approved" ON logbook_entries;
DROP POLICY IF EXISTS "media_itf_select_approved" ON entry_media;
DROP POLICY IF EXISTS "reviews_itf_select_approved" ON reviews;
DROP POLICY IF EXISTS "reviews_itf_insert_approved" ON reviews;

-- 2. Update any existing rows with 'itf_official' role
UPDATE public.profiles SET role = 'student' WHERE role::text = 'itf_official';
UPDATE public.reviews SET reviewer_role = 'supervisor' WHERE reviewer_role::text = 'itf_official';

-- 3. Drop policies that depend on current_role() function
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
DROP POLICY IF EXISTS "entries_admin_all" ON logbook_entries;
DROP POLICY IF EXISTS "media_admin_all" ON entry_media;
DROP POLICY IF EXISTS "reviews_supervisor_insert" ON reviews;
DROP POLICY IF EXISTS "reviews_admin_all" ON reviews;
DROP POLICY IF EXISTS "notifications_admin_all" ON notifications;
DROP POLICY IF EXISTS "supervisors_students_admin_all" ON supervisors_students;

-- 4. Drop current_role() function and trigger
DROP FUNCTION IF EXISTS public.current_role();
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 5. Alter columns using user_role to text
ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE public.profiles ALTER COLUMN role TYPE text USING role::text;
ALTER TABLE public.reviews ALTER COLUMN reviewer_role TYPE text USING reviewer_role::text;

-- 6. Recreate user_role enum without 'itf_official'
DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM ('student', 'supervisor', 'admin');

-- 7. Restore columns to new user_role enum
ALTER TABLE public.profiles 
  ALTER COLUMN role TYPE public.user_role USING role::public.user_role,
  ALTER COLUMN role SET DEFAULT 'student'::public.user_role;

ALTER TABLE public.reviews 
  ALTER COLUMN reviewer_role TYPE public.user_role USING reviewer_role::public.user_role;

-- 8. Recreate current_role() function
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 9. Recreate handle_new_user() trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, role, school)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'last_name', ''),
    new.email,
    COALESCE((new.raw_user_meta_data ->> 'role')::public.user_role, 'student'::public.user_role),
    new.raw_user_meta_data ->> 'school'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 10. Recreate RLS policies
CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL USING (public.current_role() = 'admin')
  WITH CHECK (public.current_role() = 'admin');

CREATE POLICY "entries_admin_all" ON logbook_entries
  FOR ALL USING (public.current_role() = 'admin')
  WITH CHECK (public.current_role() = 'admin');

CREATE POLICY "media_admin_all" ON entry_media
  FOR ALL USING (public.current_role() = 'admin')
  WITH CHECK (public.current_role() = 'admin');

CREATE POLICY "reviews_supervisor_insert" ON reviews
  FOR INSERT WITH CHECK (
    reviewer_id = auth.uid()
    AND public.current_role() = 'supervisor'
    AND EXISTS (
      SELECT 1 FROM logbook_entries e
      JOIN supervisors_students ss ON ss.student_id = e.student_id
      WHERE e.id = reviews.entry_id AND ss.supervisor_id = auth.uid()
    )
  );

CREATE POLICY "reviews_admin_all" ON reviews
  FOR ALL USING (public.current_role() = 'admin')
  WITH CHECK (public.current_role() = 'admin');

CREATE POLICY "notifications_admin_all" ON notifications
  FOR ALL USING (public.current_role() = 'admin')
  WITH CHECK (public.current_role() = 'admin');

CREATE POLICY "supervisors_students_admin_all" ON supervisors_students
  FOR ALL USING (public.current_role() = 'admin')
  WITH CHECK (public.current_role() = 'admin');
