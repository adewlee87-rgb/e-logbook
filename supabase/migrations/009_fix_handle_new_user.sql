-- Migration: 009_fix_handle_new_user.sql
-- Handles auto-linking pre-created admin profiles when a new user signs up in Auth

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  existing_id uuid;
BEGIN
  -- Check if a profile with the same email already exists (e.g. pre-created by Admin)
  SELECT id INTO existing_id FROM public.profiles WHERE lower(email) = lower(new.email) LIMIT 1;

  IF existing_id IS NOT NULL THEN
    IF existing_id != new.id THEN
      -- Re-link supervisors_students mappings if any exist
      UPDATE public.supervisors_students SET supervisor_id = new.id WHERE supervisor_id = existing_id;
      UPDATE public.supervisors_students SET student_id = new.id WHERE student_id = existing_id;

      -- Update the profile id to match auth.users id
      UPDATE public.profiles
      SET 
        id = new.id,
        first_name = CASE WHEN first_name IS NULL OR first_name = '' OR first_name = 'Supervisor'
                          THEN COALESCE(NULLIF(new.raw_user_meta_data ->> 'first_name', ''), first_name)
                          ELSE first_name END,
        last_name = CASE WHEN last_name IS NULL OR last_name = ''
                         THEN COALESCE(NULLIF(new.raw_user_meta_data ->> 'last_name', ''), last_name)
                         ELSE last_name END,
        school = COALESCE(new.raw_user_meta_data ->> 'school', school)
      WHERE id = existing_id;
    END IF;
  ELSE
    INSERT INTO public.profiles (id, first_name, last_name, email, role, school)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data ->> 'first_name', ''),
      COALESCE(new.raw_user_meta_data ->> 'last_name', ''),
      new.email,
      COALESCE((new.raw_user_meta_data ->> 'role')::public.user_role, 'student'::public.user_role),
      new.raw_user_meta_data ->> 'school'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
