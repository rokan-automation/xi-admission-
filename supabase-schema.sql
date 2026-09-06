-- Supabase SQL editor এ গিয়ে পুরো ফাইলটি রান করুন
-- (আগে টেবিল বানানো থাকলে আগে DROP TABLE IF EXISTS applications; চালিয়ে নতুন করে বানান)

create extension if not exists "pgcrypto";

drop table if exists applications;

create table applications (
  id uuid primary key default gen_random_uuid(),
  application_id text unique not null,

  full_name_bn text not null,
  full_name_en text not null,
  father_name_bn text not null,
  father_name_en text not null,
  mother_name_bn text not null,
  mother_name_en text not null,

  date_of_birth date not null,
  gender text not null check (gender in ('male','female','others')),
  religion text,
  blood_group text check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),

  mobile text not null check (mobile ~ '^[0-9]{11}$'),
  email text,

  present_village text not null,
  present_post_office text not null,
  present_thana text not null,
  present_district text not null,

  permanent_village text not null,
  permanent_post_office text not null,
  permanent_thana text not null,
  permanent_district text not null,

  ssc_roll text not null,
  ssc_reg text not null,
  ssc_board text not null,
  passing_year text not null,
  gpa text not null,

  group_name text not null check (group_name in ('science','commerce','arts')),
  photo_url text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create index idx_applications_application_id on applications(application_id);
create index idx_applications_status on applications(status);

alter table applications enable row level security;
