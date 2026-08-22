-- Migration: 010_create_supervisor_user_rpc.sql
-- Function to safely create a supervisor user in auth.users, auth.identities, and public.profiles

CREATE OR REPLACE FUNCTION public.create_supervisor_user(
  p_email text,
  p_first_name text,
  p_last_name text,
  p_department text DEFAULT 'Engineering'
)
RETURNS uuid AS $$
DECLARE
  v_user_id uuid;
  v_instance_id uuid := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- Normalize email
  p_email := lower(trim(p_email));

  -- Get active instance_id from existing auth.users if available
  SELECT instance_id INTO v_instance_id FROM auth.users WHERE instance_id IS NOT NULL LIMIT 1;
  IF v_instance_id IS NULL THEN
    v_instance_id := '00000000-0000-0000-0000-000000000000';
  END IF;

  -- 1. Check if user already exists in auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = p_email LIMIT 1;

  -- 2. If not in auth.users, check if a profile already has this email
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM public.profiles WHERE lower(email) = p_email LIMIT 1;
  END IF;

  -- 3. If no user exists, insert into auth.users and auth.identities so foreign key constraint profiles_id_fkey is satisfied
  -- and Supabase Auth Dashboard UI recognizes the identity properly.
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud,
      is_super_admin
    ) VALUES (
      v_user_id,
      v_instance_id,
      p_email,
      crypt(gen_random_uuid()::text, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('first_name', p_first_name, 'last_name', p_last_name, 'role', 'supervisor', 'department', p_department),
      now(),
      now(),
      'authenticated',
      'authenticated',
      false
    );

    -- Insert corresponding identity record so Supabase Dashboard UI can load/delete the user seamlessly
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at,
      provider_id
    ) VALUES (
      v_user_id,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', p_email),
      'email',
      now(),
      now(),
      now(),
      p_email
    ) ON CONFLICT DO NOTHING;
  END IF;

  -- 4. Insert or update public.profiles
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    email,
    role,
    department
  ) VALUES (
    v_user_id,
    p_first_name,
    p_last_name,
    p_email,
    'supervisor'::public.user_role,
    COALESCE(NULLIF(p_department, ''), 'Engineering')
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'supervisor'::public.user_role,
    department = COALESCE(NULLIF(EXCLUDED.department, ''), public.profiles.department),
    first_name = CASE WHEN public.profiles.first_name IS NULL OR public.profiles.first_name = '' THEN EXCLUDED.first_name ELSE public.profiles.first_name END,
    last_name = CASE WHEN public.profiles.last_name IS NULL OR public.profiles.last_name = '' THEN EXCLUDED.last_name ELSE public.profiles.last_name END;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;

-- Function to safely delete a supervisor user
CREATE OR REPLACE FUNCTION public.delete_supervisor_user(p_supervisor_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Unassign any assigned students first
  DELETE FROM public.supervisors_students WHERE supervisor_id = p_supervisor_id;

  -- Delete from profiles
  DELETE FROM public.profiles WHERE id = p_supervisor_id;

  -- Delete auth identities & auth user
  DELETE FROM auth.identities WHERE user_id = p_supervisor_id;
  DELETE FROM auth.users WHERE id = p_supervisor_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;
