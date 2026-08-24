-- schema.sql - SQL Schema สำหรับ Supabase (Production Ready)
-- =========================================================
-- HEARTFUL — School Diary Database & Authentication Schema
-- วางใน Supabase SQL Editor แล้วกด Run
-- =========================================================

-- 1) ตาราง Profiles (ผูกตรงกับ auth.users ของ Supabase Auth)
create table if not exists profiles (
  id              uuid references auth.users(id) on delete cascade primary key,
  student_id      text unique,             -- รหัสนักเรียน เช่น "12345"
  full_name       text not null,
  room            text not null,           -- ชั้นเรียน เช่น "ม.4/2"
  student_number  int,                     -- เลขที่ในห้อง
  role            text not null check (role in ('student', 'teacher')) default 'student',
  total_points    int not null default 0,
  streak          int not null default 0,
  last_diary_date date,
  created_at      timestamptz default now()
);

-- Index สำหรับค้นหาได้อย่างรวดเร็ว
create index if not exists idx_profiles_role on profiles(role);
create index if not exists idx_profiles_room on profiles(room);
create index if not exists idx_profiles_student_id on profiles(student_id);

-- 2) ฟังก์ชันตรวจสอบสิทธิ์ครู (Security Definer เพื่อป้องกัน Infinite Recursion ใน RLS)
create or replace function is_teacher()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'teacher'
  );
$$;

-- 3) Auto-create profile on signup ผ่าน Supabase Auth Trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    student_id,
    full_name,
    room,
    student_number,
    role
  )
  values (
    new.id,
    nullif(coalesce(new.raw_user_meta_data->>'student_id', new.raw_user_meta_data->>'studentId', ''), ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'fullName', ''),
    coalesce(new.raw_user_meta_data->>'room', new.raw_user_meta_data->>'classroom', ''),
    nullif(coalesce(new.raw_user_meta_data->>'student_number', new.raw_user_meta_data->>'studentNumber', new.raw_user_meta_data->>'number', ''), '')::int,
    coalesce(new.raw_user_meta_data->>'role', 'student')
  )
  on conflict (id) do update set
    student_id = coalesce(excluded.student_id, profiles.student_id),
    full_name = coalesce(nullif(excluded.full_name, ''), profiles.full_name),
    room = coalesce(nullif(excluded.room, ''), profiles.room),
    student_number = coalesce(excluded.student_number, profiles.student_number),
    role = coalesce(excluded.role, profiles.role);

  return new;
exception
  when others then
    -- ป้องกันไม่ให้ Auth SignUp ล้มเหลวหากมี error ใน trigger
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ให้สิทธิ์การใช้งานแก่ Auth และ Client Roles
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, anon, authenticated, service_role;
grant all on all routines in schema public to postgres, anon, authenticated, service_role;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role;


-- 4) ตาราง Diary entries (บันทึกไดอารี่ประจำวัน)
create table if not exists diary_entries (
  id                    uuid default gen_random_uuid() primary key,
  user_id               uuid references profiles(id) on delete cascade not null,
  date                  date not null default (current_date at time zone 'Asia/Bangkok')::date,

  -- หมวด 1: กาย (Body)
  mood                  text,                  -- อารมณ์ประจำวัน เช่น happy, calm, proud, sad
  sleep_level           int check (sleep_level between 1 and 5),
  sleep_pts             int default 0,
  steps_level           int check (steps_level between 1 and 4),
  steps_pts             int default 0,
  ate_vegetables        boolean default false,
  veggie_meals          int default 0,
  reduced_sugar         boolean default false,
  sugar_level           int default 50,
  sugar_pts             int default 0,
  drank_water           boolean default false,
  water_glasses         int default 0,
  water_pts             int default 0,
  body_pts              int default 0,

  -- หมวด 2: ใจ (Mind)
  concerns              text[] default '{}',   -- รายการเรื่องกังวลใจ
  observed_emotions     boolean default false,
  limited_social_media  boolean default false,
  meditated             boolean default false,
  gratitude_text        text default '',
  mind_pts              int default 0,

  -- หมวด 3: สังคม / ความสัมพันธ์ (Social / Heart)
  need_counselor        boolean default false, -- ต้องการพูดคุยกับครูแนะแนว
  time_with_loved       boolean default false,
  helped_others         boolean default false,
  tidied_space          boolean default false,
  expressed_opinion     boolean default false,
  social_pts            int default 0,

  -- สรุปรวม
  total_pts             int default 0,
  is_complete           boolean default false,
  created_at            timestamptz default now(),

  unique (user_id, date)  -- นักเรียนบันทึกได้ 1 ครั้งต่อวัน
);

-- Migration สำหรับ Table ที่มีอยู่แล้ว (Safe Alter)
alter table diary_entries add column if not exists mood text;
alter table diary_entries add column if not exists concerns text[] default '{}';
alter table diary_entries add column if not exists need_counselor boolean default false;

create index if not exists idx_diary_entries_user_date on diary_entries(user_id, date);
create index if not exists idx_diary_entries_date on diary_entries(date);


-- 5) ตาราง Jar notes (โหลความรู้สึก & ระบายใจ)
create table if not exists jar_notes (
  id                    uuid default gen_random_uuid() primary key,
  user_id               uuid references profiles(id) on delete cascade not null,
  content               text not null,
  mood                  text,
  created_at            timestamptz default now()
);

create index if not exists idx_jar_notes_user_id on jar_notes(user_id);
create index if not exists idx_jar_notes_created_at on jar_notes(created_at desc);


-- 6) Row Level Security (RLS) อย่างเข้มงวด
alter table profiles enable row level security;
alter table diary_entries enable row level security;
alter table jar_notes enable row level security;

-- PROFILES Policies:
-- นักเรียนเห็นและแก้ไขเฉพาะ Profile ของตนเอง / ครูเห็นและดูแลได้ทุกคน
drop policy if exists "profiles_select_policy" on profiles;
create policy "profiles_select_policy" on profiles
  for select using (
    auth.uid() = id or is_teacher()
  );

drop policy if exists "profiles_update_policy" on profiles;
create policy "profiles_update_policy" on profiles
  for update using (
    auth.uid() = id or is_teacher()
  );

drop policy if exists "profiles_insert_policy" on profiles;
create policy "profiles_insert_policy" on profiles
  for insert with check (
    auth.uid() = id or is_teacher()
  );

-- DIARY ENTRIES Policies:
-- นักเรียนจัดการไดอารี่ตนเองได้ 100% / ครูอ่านไดอารี่นักเรียนทุกคนได้เพื่อสถิติ
drop policy if exists "diary_select_policy" on diary_entries;
create policy "diary_select_policy" on diary_entries
  for select using (
    auth.uid() = user_id or is_teacher()
  );

drop policy if exists "diary_insert_policy" on diary_entries;
create policy "diary_insert_policy" on diary_entries
  for insert with check (
    auth.uid() = user_id
  );

drop policy if exists "diary_update_policy" on diary_entries;
create policy "diary_update_policy" on diary_entries
  for update using (
    auth.uid() = user_id
  );

-- JAR NOTES Policies:
-- นักเรียนเห็นและจัดการโหลข้อความของตนเองได้ 100% / ครูดูได้เพื่อดูแลสภาพจิตใจ
drop policy if exists "jar_select_policy" on jar_notes;
create policy "jar_select_policy" on jar_notes
  for select using (
    auth.uid() = user_id or is_teacher()
  );

drop policy if exists "jar_insert_policy" on jar_notes;
create policy "jar_insert_policy" on jar_notes
  for insert with check (
    auth.uid() = user_id
  );

drop policy if exists "jar_delete_policy" on jar_notes;
create policy "jar_delete_policy" on jar_notes
  for delete using (
    auth.uid() = user_id
  );


-- 7) Views สำหรับ Teacher Dashboard
create or replace view daily_room_summary as
select
  p.room,
  de.date,
  count(distinct p.id)                                         as total_students,
  count(distinct de.user_id)                                   as entries_count,
  count(distinct case when de.is_complete then de.user_id end) as complete_count,
  round(avg(de.total_pts), 1)                                  as avg_pts,
  round(avg(de.sleep_level), 1)                                as avg_sleep
from profiles p
left join diary_entries de on de.user_id = p.id and de.date = (current_date at time zone 'Asia/Bangkok')::date
where p.role = 'student'
group by p.room, de.date
order by p.room;

-- นักเรียนที่ต้องดูแล (ไม่บันทึก 3+ วันติดต่อกัน อิงตามเวลาไทย)
create or replace view at_risk_students as
select
  p.id,
  p.student_id,
  p.full_name,
  p.room,
  p.student_number,
  p.streak,
  p.last_diary_date,
  count(de.id) as entries_last_7_days,
  max(de.date) as last_entry_date,
  ((current_date at time zone 'Asia/Bangkok')::date - coalesce(p.last_diary_date, max(de.date))) as days_since_last_entry
from profiles p
left join diary_entries de on de.user_id = p.id
  and de.date >= ((current_date at time zone 'Asia/Bangkok')::date - interval '7 days')
where p.role = 'student'
group by p.id, p.student_id, p.full_name, p.room, p.student_number, p.streak, p.last_diary_date
having ((current_date at time zone 'Asia/Bangkok')::date - coalesce(p.last_diary_date, max(de.date))) >= 3
   or (p.last_diary_date is null and max(de.date) is null)
order by days_since_last_entry desc nulls first;

-- ให้สิทธิ์การใช้งาน Table & Sequence ทั้งหมดแก่ Authenticated/Anon
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, anon, authenticated, service_role;
grant all on all routines in schema public to postgres, anon, authenticated, service_role;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role;