-- One ID One Connect — Supabase schema
-- Run in Supabase Dashboard → SQL Editor

-- ── Students ──────────────────────────────────────
create table public.students (
  id text primary key,                          -- e.g. "USA-JHS-2026-0104"
  name text not null,
  grade_section text not null,
  parent_name text not null,
  parent_contact text not null,
  adviser_name text not null,
  consent_verified boolean default false,
  absence_count integer default 0,
  avatar_initials text default '',
  created_at timestamptz default now()
);

-- ── Activities (events) ──────────────────────────
create table public.activities (
  id text primary key,                          -- e.g. "act-science-fair"
  title text not null,
  category text check (category in (
    'Academic','Co-Curricular','Campus Announcement','Assembly'
  )) not null,
  date text not null,
  time text not null,
  venue text not null,
  deadline text not null,
  requires_registration boolean default false,
  status text check (status in ('Open','Ongoing','Completed')) default 'Open',
  description text default '',
  capacity integer default 0
);

-- ── Attendance logs ─────────────────────────────
create table public.attendance_logs (
  id text primary key,
  student_id text references public.students(id) on delete cascade,
  activity_id text references public.activities(id) on delete cascade,
  registered_at timestamptz,
  checked_in_at timestamptz,
  verification_method text check (verification_method in ('Dynamic QR','Manual ID Fallback')),
  geofence_status text check (geofence_status in ('Campus Verified','Off-Campus Blocked'))
);

-- ── Notifications ────────────────────────────────
create table public.notifications (
  id text primary key,
  student_id text references public.students(id) on delete cascade,
  recipient_role text check (recipient_role in ('Student','Parent','Adviser')) not null,
  channel text check (channel in ('In-App','Push','SMS')) not null,
  type text check (type in (
    'Event Alert','Registration Confirmed',
    'Attendance Check-In','Early-Warning Absence'
  )) not null,
  title text not null,
  message text not null,
  timestamp timestamptz default now(),
  read boolean default false
);

-- ── QR tokens (short-lived) ──────────────────────
create table public.qr_tokens (
  id uuid default gen_random_uuid() primary key,
  student_id text references public.students(id) on delete cascade,
  token text not null unique,
  issued_at bigint not null,                     -- Date.now() ms
  expires_at bigint not null                      -- Date.now() + TTL ms
);

-- Indexes for fast lookups
create index idx_attendance_student_activity
  on public.attendance_logs(student_id, activity_id);
create index idx_notifications_student
  on public.notifications(student_id);
create index idx_qr_tokens_token
  on public.qr_tokens(token);
create index idx_qr_tokens_expires
  on public.qr_tokens(expires_at);

-- Enable Row Level Security (RLS)
alter table public.students enable row level security;
alter table public.activities enable row level security;
alter table public.attendance_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.qr_tokens enable row level security;

-- Allow anon reads for demo / prototype
-- Tighten later when auth is added
create policy "Allow anon read" on public.students for select using (true);
create policy "Allow anon read" on public.activities for select using (true);
create policy "Allow anon read" on public.attendance_logs for select using (true);
create policy "Allow anon read" on public.notifications for select using (true);
create policy "Allow anon read" on public.qr_tokens for select using (true);

create policy "Allow anon insert" on public.students for insert with check (true);
create policy "Allow anon insert" on public.activities for insert with check (true);
create policy "Allow anon insert" on public.attendance_logs for insert with check (true);
create policy "Allow anon insert" on public.notifications for insert with check (true);
create policy "Allow anon insert" on public.qr_tokens for insert with check (true);

create policy "Allow anon update" on public.students for update using (true) with check (true);
create policy "Allow anon update" on public.activities for update using (true) with check (true);
create policy "Allow anon update" on public.attendance_logs for update using (true) with check (true);
create policy "Allow anon update" on public.notifications for update using (true) with check (true);

create policy "Allow anon delete" on public.qr_tokens for delete using (true);
