-- schema.sql - SQL Schema สำหรับ Supabase
-- ======================================
-- HEARTFUL — SQL Schema (Supabase)
-- วางใน Supabase SQL Editor แล้วกด Run
-- ==================================

-- 1) Profiles (ต่อจาก auth.users)
create table if not exists profiles (
  id              uuid references auth.users on delete cascade primary key,
  full_name       text not null,
  room            text not null,           -- "ม.4/2"
  student_number  int,                     -- เลขที่ในห้อง
  role            text not null default 'student' check (role in ('student','teacher')),
  total_points    int not null default 0,
  streak          int not null default 0,
  last_diary_date date,
  created_at      timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name, room, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'room', ''),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();


-- 2) Diary entries
create table if not exists diary_entries (
  id                    uuid default gen_random_uuid() primary key,
  user_id               uuid references profiles(id) on delete cascade not null,
  date                  date not null default current_date,

  -- Body
  sleep_level           int check (sleep_level between 1 and 5),
  sleep_pts             int default 0,
  steps_level           int check (steps_level between 1 and 4),
  steps_pts             int default 0,
  ate_vegetables        boolean default false,
  reduced_sugar         boolean default false,
  drank_water           boolean default false,
  body_pts              int default 0,

  -- Mind
  observed_emotions     boolean default false,
  limited_social_media  boolean default false,
  meditated             boolean default false,
  gratitude_text        text default '',
  mind_pts              int default 0,

  -- Social
  time_with_loved       boolean default false,
  helped_others         boolean default false,
  tidied_space          boolean default false,
  expressed_opinion     boolean default false,
  social_pts            int default 0,

  -- Summary
  total_pts             int default 0,
  is_complete           boolean default false,
  created_at            timestamptz default now(),

  unique (user_id, date)  -- บันทึกได้ 1 ครั้ง/วัน
);


-- 3) Row Level Security
alter table profiles      enable row level security;
alter table diary_entries enable row level security;

-- Profiles: นักเรียนเห็นเฉพาะตัวเอง / ครูเห็นทั้งหมด
create policy "students see own profile" on profiles
  for select using (
    auth.uid() = id
    or exists (
      select 1 from profiles p where p.id = auth.uid() and p.role = 'teacher'
    )
  );

create policy "users update own profile" on profiles
  for update using (auth.uid() = id);

-- Diary: นักเรียนเห็น/แก้ไขเฉพาะของตัวเอง / ครูอ่านได้ทั้งหมด
create policy "students manage own entries" on diary_entries
  for all using (auth.uid() = user_id);

create policy "teachers read all entries" on diary_entries
  for select using (
    exists (
      select 1 from profiles p where p.id = auth.uid() and p.role = 'teacher'
    )
  );


-- 4) Useful views for teacher dashboard
create or replace view daily_room_summary as
select
  p.room,
  de.date,
  count(distinct p.id)                                  as total_students,
  count(distinct de.user_id)                            as entries_count,
  count(distinct case when de.is_complete then de.user_id end) as complete_count,
  round(avg(de.total_pts), 1)                          as avg_pts,
  round(avg(de.sleep_level), 1)                        as avg_sleep
from profiles p
left join diary_entries de on de.user_id = p.id and de.date = current_date
where p.role = 'student'
group by p.room, de.date
order by p.room;

-- นักเรียนที่ต้องดูแล (ไม่บันทึก 3+ วัน)
create or replace view at_risk_students as
select
  p.id,
  p.full_name,
  p.room,
  p.student_number,
  count(de.id) as entries_last_7_days,
  max(de.date) as last_entry_date,
  current_date - max(de.date) as days_since_last_entry
from profiles p
left join diary_entries de on de.user_id = p.id
  and de.date >= current_date - interval '7 days'
where p.role = 'student'
group by p.id, p.full_name, p.room, p.student_number
having max(de.date) < current_date - interval '3 days'
   or max(de.date) is null
order by days_since_last_entry desc nulls first;

-- ======================================
-- MIGRATION: เพิ่ม column ใหม่สำหรับ
-- sugar, veggie, water แบบ detailed
-- ======================================
alter table diary_entries
  add column if not exists veggie_meals   int default 0,
  add column if not exists sugar_level    int default 50,
  add column if not exists sugar_pts      int default 0,
  add column if not exists water_glasses  int default 0,
  add column if not exists water_pts      int default 0;