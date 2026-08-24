-- =========================================================
-- สคริปต์แก้ไขและสร้างบัญชีครูแบบสมบูรณ์ 100% (Clean & Fix)
-- คัดลอกไปวางใน Supabase SQL Editor แล้วกด Run
-- =========================================================

-- 1. ล้างข้อมูลบัญชีที่อาจค้างหรือไม่สมบูรณ์ออกก่อน
delete from auth.identities where identity_data->>'email' = 'counselor@teacher.heartful.school';
delete from auth.users where email = 'counselor@teacher.heartful.school';

-- 2. สร้างบัญชีครูใหม่พร้อม auth.identities ที่สมบูรณ์
do $$
declare
  new_teacher_id uuid := gen_random_uuid();
  teacher_user text := 'counselor';
  teacher_email text := 'counselor@teacher.heartful.school';
  teacher_pass text := 'Counselor@2026';
  teacher_name text := 'ครูแนะแนว (ผู้ดูแลระบบ)';
begin
  -- สร้างใน auth.users
  insert into auth.users (
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
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) values (
    new_teacher_id,
    '00000000-0000-0000-0000-000000000000',
    teacher_email,
    crypt(teacher_pass, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    json_build_object('full_name', teacher_name, 'room', 'ห้องแนะแนว', 'role', 'teacher'),
    now(),
    now(),
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    ''
  );

  -- สร้างใน auth.identities (จำเป็นสำหรับ Supabase GoTrue Auth)
  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    gen_random_uuid(),
    new_teacher_id,
    json_build_object('sub', new_teacher_id::text, 'email', teacher_email, 'email_verified', true),
    'email',
    new_teacher_id::text,
    now(),
    now(),
    now()
  );

  -- สร้างใน public.profiles
  insert into public.profiles (
    id,
    full_name,
    room,
    role
  ) values (
    new_teacher_id,
    teacher_name,
    'ห้องแนะแนว',
    'teacher'
  )
  on conflict (id) do update set
    role = 'teacher',
    full_name = teacher_name;

end $$;
